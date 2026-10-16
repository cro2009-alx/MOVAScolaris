create extension if not exists pgcrypto;

create type public.user_role as enum ('founder', 'secretary');
create type public.payment_mode as enum ('especes', 'mobile_money', 'virement', 'cheque');
create type public.payment_status as enum ('valid', 'void');
create type public.report_status as enum ('open', 'treated');

create sequence public.payment_receipt_seq start with 1001;

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  address text not null default '',
  phone text not null default '',
  default_school_year text not null default '2026-2027',
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  school_id uuid not null references public.schools(id) on delete restrict,
  full_name text not null,
  email text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  registration_fee integer not null default 0 check (registration_fee >= 0),
  tuition_fee integer not null default 0 check (tuition_fee >= 0),
  due_date date not null,
  created_at timestamptz not null default now(),
  unique (school_id, name),
  unique (school_id, id)
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  matricule text not null,
  last_name text not null,
  first_names text not null,
  sex text not null check (sex in ('Fille', 'Garçon')),
  class_id uuid not null,
  school_year text not null,
  parent_name text not null default '',
  parent_phone text not null default '',
  discount integer not null default 0 check (discount >= 0),
  status text not null default 'active' check (status in ('active', 'inactive')),
  enrolled_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, matricule),
  unique (school_id, id),
  foreign key (school_id, class_id) references public.classes(school_id, id) on delete restrict
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null,
  amount integer not null check (amount > 0),
  mode public.payment_mode not null,
  period text not null,
  note text not null default '',
  receipt_number text not null unique default ('REC-' || nextval('public.payment_receipt_seq')),
  status public.payment_status not null default 'valid',
  void_reason text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (school_id, student_id) references public.students(school_id, id) on delete restrict,
  check (status <> 'void' or length(trim(coalesce(void_reason, ''))) > 0)
);

create table public.activity_log (
  id bigint generated always as identity primary key,
  school_id uuid not null references public.schools(id) on delete cascade,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid,
  message text not null check (length(trim(message)) >= 6),
  status public.report_status not null default 'open',
  secretary_response text,
  author_id uuid not null references public.profiles(id) on delete restrict,
  treated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  treated_at timestamptz,
  foreign key (school_id, student_id) references public.students(school_id, id) on delete set null (student_id)
);

create index students_school_class_idx on public.students (school_id, class_id);
create index payments_school_created_idx on public.payments (school_id, created_at desc);
create index payments_student_status_idx on public.payments (student_id, status);
create index activity_log_school_created_idx on public.activity_log (school_id, created_at desc);
create index reports_school_status_idx on public.reports (school_id, status, created_at desc);

create function public.has_role(_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.profiles p on p.id = ur.user_id
    where ur.user_id = auth.uid()
      and ur.role = _role
      and p.active
  );
$$;

create function public.my_school_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.school_id
  from public.profiles p
  where p.id = auth.uid() and p.active
  limit 1;
$$;

create function public.is_secretary()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select public.has_role('secretary'); $$;

create function public.is_founder()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select public.has_role('founder'); $$;

create function public.create_school_for_founder()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_school_id uuid;
  v_school_name text := nullif(trim(new.raw_user_meta_data ->> 'school_name'), '');
  v_full_name text := nullif(trim(new.raw_user_meta_data ->> 'full_name'), '');
begin
  if v_school_name is null then
    return new;
  end if;
  if v_full_name is null then
    raise exception 'Le nom du fondateur est obligatoire';
  end if;

  insert into public.schools (name, address, phone)
  values (v_school_name, coalesce(new.raw_user_meta_data ->> 'school_address', ''), coalesce(new.raw_user_meta_data ->> 'school_phone', ''))
  returning id into v_school_id;

  insert into public.profiles (id, school_id, full_name, email)
  values (new.id, v_school_id, v_full_name, coalesce(new.email, ''));
  insert into public.user_roles (user_id, role) values (new.id, 'founder');
  return new;
end;
$$;

create trigger on_auth_user_created_school
after insert on auth.users
for each row execute function public.create_school_for_founder();

create function public.write_activity_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_school_id uuid;
  v_action text;
  v_details jsonb;
begin
  if tg_table_name = 'payments' then
    v_school_id := coalesce(new.school_id, old.school_id);
    if tg_op = 'INSERT' then
      v_action := 'Paiement enregistré';
      v_details := jsonb_build_object('payment_id', new.id, 'receipt', new.receipt_number, 'amount', new.amount, 'student_id', new.student_id);
    elsif new.status = 'void' and old.status <> 'void' then
      v_action := 'Paiement annulé';
      v_details := jsonb_build_object('payment_id', new.id, 'receipt', new.receipt_number, 'amount', new.amount, 'reason', new.void_reason, 'student_id', new.student_id);
    else
      return new;
    end if;
  elsif tg_table_name = 'students' then
    v_school_id := coalesce(new.school_id, old.school_id);
    v_action := case when tg_op = 'INSERT' then 'Élève ajouté' else 'Élève modifié' end;
    v_details := jsonb_build_object('student_id', coalesce(new.id, old.id), 'matricule', coalesce(new.matricule, old.matricule));
  elsif tg_table_name = 'profiles' then
    v_school_id := coalesce(new.school_id, old.school_id);
    v_action := case when tg_op = 'INSERT' then 'Membre ajouté' else 'Accès membre modifié' end;
    v_details := jsonb_build_object('profile_id', coalesce(new.id, old.id), 'full_name', coalesce(new.full_name, old.full_name), 'active', coalesce(new.active, old.active));
  else
    return coalesce(new, old);
  end if;

  insert into public.activity_log (school_id, action, details, author_id)
  values (v_school_id, v_action, v_details, auth.uid());
  return new;
end;
$$;

create trigger payments_activity_log
after insert or update on public.payments
for each row execute function public.write_activity_log();
create trigger students_activity_log
after insert or update on public.students
for each row execute function public.write_activity_log();
create function public.protect_payment_history()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Un paiement ne peut jamais être supprimé';
  end if;
  if old.status <> 'valid' or new.status <> 'void' then
    raise exception 'Un paiement existant ne peut être modifié que pour être annulé';
  end if;
  if (new.id, new.school_id, new.student_id, new.amount, new.mode, new.period, new.note, new.receipt_number, new.created_by, new.created_at)
     is distinct from
     (old.id, old.school_id, old.student_id, old.amount, old.mode, old.period, old.note, old.receipt_number, old.created_by, old.created_at) then
    raise exception 'Les informations d’un paiement sont immuables';
  end if;
  if length(trim(coalesce(new.void_reason, ''))) = 0 then
    raise exception 'Le motif d’annulation est obligatoire';
  end if;
  return new;
end;
$$;

create trigger payments_are_immutable
before update or delete on public.payments
for each row execute function public.protect_payment_history();

create function public.protect_report_updates()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.id, new.school_id, new.student_id, new.message, new.author_id, new.created_at)
     is distinct from
     (old.id, old.school_id, old.student_id, old.message, old.author_id, old.created_at) then
    raise exception 'Le signalement d’origine est immuable';
  end if;
  if old.status <> 'open' or new.status <> 'treated' then
    raise exception 'Un signalement ouvert peut uniquement être marqué traité';
  end if;
  new.treated_by := auth.uid();
  new.treated_at := now();
  return new;
end;
$$;

create trigger reports_treatment_only
before update on public.reports
for each row execute function public.protect_report_updates();

create function public.set_secretary_active(_user_id uuid, _active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_founder() then
    raise exception 'Accès réservé au fondateur';
  end if;
  update public.profiles p
  set active = _active
  where p.id = _user_id
    and p.school_id = public.my_school_id()
    and exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'secretary');
  if not found then
    raise exception 'Compte secrétaire introuvable dans cet établissement';
  end if;
  insert into public.activity_log (school_id, action, details, author_id)
  values (
    public.my_school_id(),
    case when _active then 'Compte secrétaire réactivé' else 'Compte secrétaire désactivé' end,
    jsonb_build_object('profile_id', _user_id, 'active', _active),
    auth.uid()
  );
end;
$$;

revoke all on function public.set_secretary_active(uuid, boolean) from public, anon;
grant execute on function public.set_secretary_active(uuid, boolean) to authenticated;
grant execute on function public.has_role(public.user_role) to authenticated;
grant execute on function public.my_school_id() to authenticated;
grant execute on function public.is_secretary() to authenticated;
grant execute on function public.is_founder() to authenticated;

alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.payments enable row level security;
alter table public.activity_log enable row level security;
alter table public.reports enable row level security;

create policy schools_read_same_school on public.schools
for select to authenticated using (id = public.my_school_id());
create policy schools_secretary_update on public.schools
for update to authenticated using (id = public.my_school_id() and public.is_secretary())
with check (id = public.my_school_id() and public.is_secretary());

create policy profiles_read_same_school on public.profiles
for select to authenticated using (school_id = public.my_school_id());
create policy roles_read_same_school on public.user_roles
for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = user_roles.user_id and p.school_id = public.my_school_id())
);

create policy classes_read_same_school on public.classes
for select to authenticated using (school_id = public.my_school_id());
create policy classes_secretary_insert on public.classes
for insert to authenticated with check (school_id = public.my_school_id() and public.is_secretary());
create policy classes_secretary_update on public.classes
for update to authenticated using (school_id = public.my_school_id() and public.is_secretary())
with check (school_id = public.my_school_id() and public.is_secretary());
create policy classes_secretary_delete on public.classes
for delete to authenticated using (school_id = public.my_school_id() and public.is_secretary());

create policy students_read_same_school on public.students
for select to authenticated using (school_id = public.my_school_id());
create policy students_secretary_insert on public.students
for insert to authenticated with check (school_id = public.my_school_id() and public.is_secretary());
create policy students_secretary_update on public.students
for update to authenticated using (school_id = public.my_school_id() and public.is_secretary())
with check (school_id = public.my_school_id() and public.is_secretary());
create policy students_secretary_delete on public.students
for delete to authenticated using (school_id = public.my_school_id() and public.is_secretary());

create policy payments_read_same_school on public.payments
for select to authenticated using (school_id = public.my_school_id());
create policy payments_secretary_insert on public.payments
for insert to authenticated with check (
  school_id = public.my_school_id() and public.is_secretary() and created_by = auth.uid()
);
create policy payments_secretary_void on public.payments
for update to authenticated using (school_id = public.my_school_id() and public.is_secretary())
with check (school_id = public.my_school_id() and public.is_secretary() and status = 'void');

create policy activity_log_read_same_school on public.activity_log
for select to authenticated using (school_id = public.my_school_id());

create policy reports_read_same_school on public.reports
for select to authenticated using (school_id = public.my_school_id());
create policy reports_founder_insert on public.reports
for insert to authenticated with check (
  school_id = public.my_school_id() and public.is_founder() and author_id = auth.uid()
);
create policy reports_secretary_treat on public.reports
for update to authenticated using (school_id = public.my_school_id() and public.is_secretary() and status = 'open')
with check (school_id = public.my_school_id() and public.is_secretary() and status = 'treated' and treated_by = auth.uid());

grant usage on schema public to authenticated;
grant select on public.schools, public.profiles, public.user_roles, public.classes, public.students,
  public.payments, public.activity_log, public.reports to authenticated;
grant update on public.schools to authenticated;
grant insert, update, delete on public.classes, public.students to authenticated;
grant insert, update on public.payments, public.reports to authenticated;
grant usage, select on sequence public.payment_receipt_seq to authenticated;
grant usage, select on sequence public.activity_log_id_seq to authenticated;

revoke all on function public.create_school_for_founder() from public, anon, authenticated;
revoke all on function public.write_activity_log() from public, anon, authenticated;
revoke all on function public.protect_payment_history() from public, anon, authenticated;
revoke all on function public.protect_report_updates() from public, anon, authenticated;

alter publication supabase_realtime add table public.payments;
alter publication supabase_realtime add table public.students;
alter publication supabase_realtime add table public.reports;
alter publication supabase_realtime add table public.classes;