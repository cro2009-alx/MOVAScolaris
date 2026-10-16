alter table public.schools
  add column if not exists is_demo boolean not null default false;

update public.schools s
set is_demo = true
where exists (
  select 1
  from public.profiles p
  join public.user_roles r on r.user_id = p.id
  where p.school_id = s.id
    and lower(p.email) = 'fondateur@demo-ecole.com'
    and r.role = 'founder'
);