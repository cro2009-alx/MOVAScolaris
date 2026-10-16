alter table public.profiles
  add column if not exists session_period text not null default '2026-2027',
  add column if not exists structure_number integer;

alter table public.classes
  add column if not exists secretary_id uuid,
  add column if not exists level_name text not null default '';

alter table public.students
  add column if not exists secretary_id uuid;

alter table public.payments
  add column if not exists secretary_id uuid,
  add column if not exists tranche_due date,
  add column if not exists cancelled_by uuid,
  add column if not exists cancelled_at timestamptz;

with first_secretary as (
  select distinct on (p.school_id) p.school_id, p.id
  from public.profiles p
  join public.user_roles r on r.user_id = p.id and r.role = 'secretary'
  order by p.school_id, p.created_at, p.id
)
update public.classes c
set secretary_id = fs.id
from first_secretary fs
where c.school_id = fs.school_id and c.secretary_id is null;

with first_secretary as (
  select distinct on (p.school_id) p.school_id, p.id
  from public.profiles p
  join public.user_roles r on r.user_id = p.id and r.role = 'secretary'
  order by p.school_id, p.created_at, p.id
)
update public.students s
set secretary_id = fs.id
from first_secretary fs
where s.school_id = fs.school_id and s.secretary_id is null;

update public.payments pay
set secretary_id = coalesce(
  s.secretary_id,
  (select p.id from public.profiles p join public.user_roles r on r.user_id = p.id and r.role = 'secretary'
   where p.school_id = pay.school_id order by p.created_at, p.id limit 1),
  (select p.id from public.profiles p where p.id = pay.created_by and p.school_id = pay.school_id)
)
from public.students s
where pay.student_id = s.id and pay.school_id = s.school_id and pay.secretary_id is null;

update public.classes set level_name = name where level_name = '';
with numbered_secretaries as (
  select p.id, row_number() over (partition by p.school_id order by p.created_at, p.id)::integer as structure_number
  from public.profiles p
  join public.user_roles r on r.user_id = p.id and r.role = 'secretary'
)
update public.profiles p
set structure_number = n.structure_number
from numbered_secretaries n
where p.id = n.id and p.structure_number is null;
alter table public.classes alter column secretary_id set default auth.uid();
alter table public.students alter column secretary_id set default auth.uid();
alter table public.payments alter column secretary_id set default auth.uid();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'classes_secretary_id_fkey') then
    alter table public.classes add constraint classes_secretary_id_fkey
      foreign key (secretary_id) references public.profiles(id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'students_secretary_id_fkey') then
    alter table public.students add constraint students_secretary_id_fkey
      foreign key (secretary_id) references public.profiles(id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'payments_secretary_id_fkey') then
    alter table public.payments add constraint payments_secretary_id_fkey
      foreign key (secretary_id) references public.profiles(id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'payments_cancelled_by_fkey') then
    alter table public.payments add constraint payments_cancelled_by_fkey
      foreign key (cancelled_by) references public.profiles(id) on delete set null;
  end if;
end;
$$;

create unique index if not exists classes_school_secretary_name_idx
  on public.classes (school_id, secretary_id, name);

create index if not exists classes_secretary_idx on public.classes (school_id, secretary_id, level_name, name);
create index if not exists students_secretary_idx on public.students (school_id, secretary_id, class_id);
create index if not exists payments_secretary_idx on public.payments (school_id, secretary_id, created_at desc);
create unique index if not exists profiles_school_structure_number_idx
  on public.profiles (school_id, structure_number) where structure_number is not null;

create policy profiles_secretary_own_scope on public.profiles
  as restrictive for select to authenticated
  using (school_id = public.my_school_id() and (public.is_founder() or id = auth.uid()));

create policy roles_secretary_own_scope on public.user_roles
  as restrictive for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = user_roles.user_id
        and p.school_id = public.my_school_id()
        and (public.is_founder() or p.id = auth.uid())
    )
  );

create policy classes_secretary_structure_scope on public.classes
  as restrictive for all to authenticated
  using (school_id = public.my_school_id() and (public.is_founder() or (public.is_secretary() and secretary_id = auth.uid())))
  with check (school_id = public.my_school_id() and public.is_secretary() and secretary_id = auth.uid());

create policy students_secretary_structure_scope on public.students
  as restrictive for all to authenticated
  using (school_id = public.my_school_id() and (public.is_founder() or (public.is_secretary() and secretary_id = auth.uid())))
  with check (
    school_id = public.my_school_id()
    and public.is_secretary()
    and secretary_id = auth.uid()
    and exists (
      select 1 from public.classes c
      where c.id = class_id and c.school_id = public.students.school_id and c.secretary_id = auth.uid()
    )
  );

create policy payments_secretary_structure_scope on public.payments
  as restrictive for all to authenticated
  using (school_id = public.my_school_id() and (public.is_founder() or (public.is_secretary() and secretary_id = auth.uid())))
  with check (
    school_id = public.my_school_id()
    and public.is_secretary()
    and secretary_id = auth.uid()
    and exists (
      select 1 from public.students s
      where s.id = student_id and s.school_id = public.payments.school_id and s.secretary_id = auth.uid()
    )
  );

create policy payments_secretary_edit on public.payments
  for update to authenticated
  using (school_id = public.my_school_id() and public.is_secretary() and secretary_id = auth.uid())
  with check (school_id = public.my_school_id() and public.is_secretary() and secretary_id = auth.uid());

create policy activity_log_founder_or_author_scope on public.activity_log
  as restrictive for select to authenticated
  using (school_id = public.my_school_id() and (public.is_founder() or author_id = auth.uid()));

create or replace function public.guard_payment_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'void' then
    raise exception 'Un paiement annulé ne peut plus être modifié';
  end if;
  if (new.id, new.school_id, new.secretary_id, new.student_id, new.receipt_number, new.created_by, new.created_at)
     is distinct from
     (old.id, old.school_id, old.secretary_id, old.student_id, old.receipt_number, old.created_by, old.created_at) then
    raise exception 'Le reçu, l’élève, l’école et l’auteur sont immuables';
  end if;
  if new.status not in ('valid', 'void') then
    raise exception 'Statut de paiement invalide';
  end if;
  if new.status = 'void' then
    if length(trim(coalesce(new.void_reason, ''))) = 0 then
      raise exception 'Le motif d’annulation est obligatoire';
    end if;
    if (new.amount, new.mode, new.period, new.note, new.tranche_due)
       is distinct from (old.amount, old.mode, old.period, old.note, old.tranche_due) then
      raise exception 'L’annulation ne peut pas modifier le paiement';
    end if;
    new.cancelled_by := auth.uid();
    new.cancelled_at := now();
  elsif (new.void_reason, new.cancelled_by, new.cancelled_at)
        is distinct from (old.void_reason, old.cancelled_by, old.cancelled_at) then
    raise exception 'Les informations d’annulation sont réservées à l’annulation';
  end if;
  return new;
end;
$$;

create or replace function public.protect_payment_history()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if current_setting('app.purge_secretary_id', true) = old.secretary_id::text then
      return old;
    end if;
    raise exception 'Un paiement ne peut jamais être supprimé';
  end if;
  return new;
end;
$$;

create trigger payments_guard_update
before update on public.payments
for each row execute function public.guard_payment_update();

create or replace function public.write_activity_log()
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
    return new;
  elsif tg_table_name = 'students' then
    v_school_id := new.school_id;
    v_action := case when tg_op = 'INSERT' then 'Élève ajouté' else 'Élève modifié' end;
    v_details := jsonb_build_object('student_id', new.id, 'matricule', new.matricule, 'secretary_id', new.secretary_id);
  elsif tg_table_name = 'profiles' then
    v_school_id := new.school_id;
    v_action := case when tg_op = 'INSERT' then 'Membre ajouté' else 'Accès membre modifié' end;
    v_details := jsonb_build_object('profile_id', new.id, 'full_name', new.full_name, 'active', new.active, 'session_period', new.session_period);
  else
    return new;
  end if;

  insert into public.activity_log (school_id, action, details, author_id)
  values (v_school_id, v_action, v_details, auth.uid());
  return new;
end;
$$;

create or replace function public.log_payment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action text;
  v_details jsonb;
begin
  if tg_op = 'INSERT' then
    v_action := 'Paiement enregistré';
    v_details := jsonb_build_object('payment_id', new.id, 'receipt', new.receipt_number, 'student_id', new.student_id, 'amount', new.amount, 'tranche', new.period, 'tranche_due', new.tranche_due, 'secretary_id', new.secretary_id);
  elsif new.status = 'void' and old.status <> 'void' then
    v_action := 'Paiement annulé';
    v_details := jsonb_build_object('payment_id', new.id, 'receipt', new.receipt_number, 'student_id', new.student_id, 'amount', new.amount, 'reason', new.void_reason, 'secretary_id', new.secretary_id);
  elsif (new.amount, new.period, new.mode, new.tranche_due, new.note)
        is distinct from (old.amount, old.period, old.mode, old.tranche_due, old.note) then
    v_action := 'Paiement modifié';
    v_details := jsonb_build_object('payment_id', new.id, 'receipt', new.receipt_number, 'student_id', new.student_id,
      'ancienne_tranche', old.period, 'nouvelle_tranche', new.period, 'ancien_montant', old.amount,
      'nouveau_montant', new.amount, 'ancienne_echeance', old.tranche_due, 'nouvelle_echeance', new.tranche_due,
      'secretary_id', new.secretary_id);
  else
    return new;
  end if;

  insert into public.activity_log (school_id, action, details, author_id)
  values (new.school_id, v_action, v_details, auth.uid());
  return new;
end;
$$;

create trigger payments_log_activity
after insert or update on public.payments
for each row execute function public.log_payment();

create or replace function public.set_secretary_active(_user_id uuid, _active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_founder() then raise exception 'Accès réservé au fondateur'; end if;
  update public.profiles p set active = _active
  where p.id = _user_id and p.school_id = public.my_school_id()
    and exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'secretary');
  if not found then raise exception 'Compte secrétaire introuvable dans cet établissement'; end if;
  insert into public.activity_log (school_id, action, details, author_id)
  values (public.my_school_id(), case when _active then 'Compte secrétaire réactivé' else 'Compte secrétaire désactivé' end,
    jsonb_build_object('profile_id', _user_id, 'active', _active), auth.uid());
end;
$$;

create or replace function public.delete_secretary_access(_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_school_id uuid;
  v_email text;
  v_name text;
  v_structure_number integer;
begin
  if not public.is_founder() then raise exception 'Accès réservé au fondateur'; end if;
  select p.school_id, p.email, p.full_name, p.structure_number into v_school_id, v_email, v_name, v_structure_number
  from public.profiles p join public.user_roles r on r.user_id = p.id and r.role = 'secretary'
  where p.id = _user_id and p.school_id = public.my_school_id();
  if v_school_id is null then raise exception 'Compte secrétaire introuvable dans cet établissement'; end if;

  delete from public.reports r
  where r.school_id = v_school_id and (r.author_id = _user_id or r.treated_by = _user_id or r.student_id in (
    select s.id from public.students s where s.school_id = v_school_id and s.secretary_id = _user_id
  ));
  perform set_config('app.purge_secretary_id', _user_id::text, true);
  delete from public.payments p
  where p.school_id = v_school_id
    and (p.secretary_id = _user_id or p.created_by = _user_id or p.student_id in (
      select s.id from public.students s where s.school_id = v_school_id and s.secretary_id = _user_id
    ));
  delete from public.students s where s.school_id = v_school_id and s.secretary_id = _user_id;
  delete from public.classes c where c.school_id = v_school_id and c.secretary_id = _user_id;
  delete from public.activity_log l where l.school_id = v_school_id and l.author_id = _user_id;
  delete from public.user_roles r where r.user_id = _user_id;
  delete from public.profiles p where p.id = _user_id and p.school_id = v_school_id;
  insert into public.activity_log (school_id, action, details, author_id)
  values (v_school_id, 'Accès supprimé', jsonb_build_object('profile_id', _user_id, 'full_name', v_name, 'email', v_email, 'structure_number', v_structure_number), auth.uid());
  return jsonb_build_object('id', _user_id, 'school_id', v_school_id, 'email', v_email, 'structure_number', v_structure_number);
end;
$$;

revoke all on function public.delete_secretary_access(uuid) from public, anon;
grant execute on function public.delete_secretary_access(uuid) to authenticated;
revoke all on function public.log_payment() from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'activity_log') then
    alter publication supabase_realtime add table public.activity_log;
  end if;
end;
$$;