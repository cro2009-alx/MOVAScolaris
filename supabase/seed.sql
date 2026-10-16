do $$
declare
  v_school_id uuid;
  v_secretary_id uuid;
begin
  select p.school_id into v_school_id
  from public.profiles p
  join public.user_roles r on r.user_id = p.id
  where p.email = 'fondateur@demo-ecole.com' and r.role = 'founder'
  limit 1;

  select p.id into v_secretary_id
  from public.profiles p
  join public.user_roles r on r.user_id = p.id
  where p.school_id = v_school_id
    and p.email = 'secretaire@demo-ecole.com'
    and r.role = 'secretary'
  limit 1;

  if v_school_id is null or v_secretary_id is null then
    raise exception 'Créez d’abord le fondateur et son compte secrétaire de démonstration.';
  end if;

  update public.schools set is_demo = true where id = v_school_id;

  update public.schools
  set name = 'École Les Lauriers', address = 'Cocody, Abidjan', phone = '+225 07 00 00 00 00', default_school_year = '2026-2027'
  where id = v_school_id;

  insert into public.classes (school_id, name, registration_fee, tuition_fee, due_date)
  values
    (v_school_id, 'CP1', 25000, 125000, '2026-10-31'),
    (v_school_id, 'CE2', 25000, 150000, '2026-11-15'),
    (v_school_id, 'CM2', 30000, 180000, '2026-12-15')
  on conflict (school_id, name) do update
  set registration_fee = excluded.registration_fee,
      tuition_fee = excluded.tuition_fee,
      due_date = excluded.due_date;

  insert into public.students (
    school_id, matricule, last_name, first_names, sex, class_id, school_year,
    parent_name, parent_phone, discount, enrolled_at
  )
  select v_school_id, seed.matricule, seed.last_name, seed.first_names, seed.sex,
    c.id, '2026-2027', seed.parent_name, seed.parent_phone, seed.discount, '2026-09-02'
  from (values
    ('MAT-0001','Koné','Ibrahim','Garçon','CP1','Kouamé','+225 07 01 12 34 56',0),
    ('MAT-0002','Traoré','Mariam','Fille','CE2','Diallo','+225 07 02 12 34 57',0),
    ('MAT-0003','Yao','Kevin','Garçon','CM2','Yao','+225 07 03 12 34 58',0),
    ('MAT-0004','Bamba','Awa','Fille','CP1','Koffi','+225 07 04 12 34 59',10000),
    ('MAT-0005','Ouattara','Salif','Garçon','CE2','Kouamé','+225 07 05 12 34 50',0),
    ('MAT-0006','Diabaté','Aminata','Fille','CM2','Diallo','+225 07 06 12 34 51',0),
    ('MAT-0007','Coulibaly','Moussa','Garçon','CP1','Yao','+225 07 07 12 34 52',0),
    ('MAT-0008','N''Guessan','Grâce','Fille','CE2','Koffi','+225 07 08 12 34 53',10000),
    ('MAT-0009','Kouadio','Junior','Garçon','CM2','Kouamé','+225 07 09 12 34 54',0),
    ('MAT-0010','Sanogo','Fanta','Fille','CP1','Diallo','+225 07 00 12 34 55',0),
    ('MAT-0011','Touré','Adama','Garçon','CE2','Yao','+225 07 01 12 34 56',0),
    ('MAT-0012','Konan','Esther','Fille','CM2','Koffi','+225 07 02 12 34 57',0)
  ) as seed(matricule,last_name,first_names,sex,class_name,parent_name,parent_phone,discount)
  join public.classes c on c.school_id = v_school_id and c.name = seed.class_name
  on conflict (school_id, matricule) do update
  set last_name = excluded.last_name,
      first_names = excluded.first_names,
      sex = excluded.sex,
      class_id = excluded.class_id,
      school_year = excluded.school_year,
      parent_name = excluded.parent_name,
      parent_phone = excluded.parent_phone,
      discount = excluded.discount;

  insert into public.payments (school_id, student_id, amount, mode, period, created_by)
  select v_school_id, s.id, seed.amount, seed.mode::public.payment_mode, 'Scolarité 2026-2027', v_secretary_id
  from (values
    ('MAT-0001',150000,'especes'),
    ('MAT-0002',175000,'mobile_money'),
    ('MAT-0003',210000,'virement'),
    ('MAT-0005',175000,'especes'),
    ('MAT-0004',50000,'mobile_money'),
    ('MAT-0006',75000,'especes'),
    ('MAT-0008',50000,'cheque')
  ) as seed(matricule,amount,mode)
  join public.students s on s.school_id = v_school_id and s.matricule = seed.matricule
  where not exists (
    select 1 from public.payments p
    where p.school_id = v_school_id and p.student_id = s.id
      and p.amount = seed.amount and p.period = 'Scolarité 2026-2027' and p.status = 'valid'
  );

  insert into public.reports (school_id, student_id, message, author_id)
  select v_school_id, s.id, 'Le parent souhaite un échéancier pour le solde.', f.id
  from public.profiles f
  join public.students s on s.school_id = v_school_id and s.matricule = 'MAT-0006'
  where f.id = (select id from public.profiles where school_id = v_school_id and email = 'fondateur@demo-ecole.com')
    and not exists (select 1 from public.reports r where r.school_id = v_school_id and r.message = 'Le parent souhaite un échéancier pour le solde.');
end;
$$;