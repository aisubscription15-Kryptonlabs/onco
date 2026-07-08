alter table public.doctors
  add column if not exists auth_user_id uuid;

create index if not exists doctors_auth_user_id_idx
on public.doctors(auth_user_id);

drop policy if exists "Clinic members can view immunizations" on public.immunizations;
create policy "Clinic members can view immunizations"
on public.immunizations
for select
using (
  exists (
    select 1
    from public.doctors d
    where (d.auth_user_id = auth.uid() or d.id = auth.uid())
      and d.clinic_id = immunizations.clinic_id
  )
);

drop policy if exists "Clinic members can create immunizations" on public.immunizations;
create policy "Clinic members can create immunizations"
on public.immunizations
for insert
with check (
  exists (
    select 1
    from public.doctors current_member
    join public.patients p
      on p.id = immunizations.patient_id
     and p.clinic_id = current_member.clinic_id
    where (current_member.auth_user_id = auth.uid() or current_member.id = auth.uid())
      and current_member.clinic_id = immunizations.clinic_id
      and (
        immunizations.visit_id is null
        or exists (
          select 1
          from public.visits v
          where v.id = immunizations.visit_id
            and v.patient_id = immunizations.patient_id
            and v.clinic_id = immunizations.clinic_id
        )
      )
      and (
        immunizations.created_by is null
        or immunizations.created_by = current_member.id
        or immunizations.created_by = auth.uid()
      )
      and (
        immunizations.updated_by is null
        or immunizations.updated_by = current_member.id
        or immunizations.updated_by = auth.uid()
      )
      and (
        immunizations.created_role is null
        or immunizations.created_role = current_member.role
      )
  )
);

drop policy if exists "Clinic members can update immunizations" on public.immunizations;
create policy "Clinic members can update immunizations"
on public.immunizations
for update
using (
  exists (
    select 1
    from public.doctors d
    where (d.auth_user_id = auth.uid() or d.id = auth.uid())
      and d.clinic_id = immunizations.clinic_id
  )
)
with check (
  exists (
    select 1
    from public.doctors current_member
    join public.patients p
      on p.id = immunizations.patient_id
     and p.clinic_id = current_member.clinic_id
    where (current_member.auth_user_id = auth.uid() or current_member.id = auth.uid())
      and current_member.clinic_id = immunizations.clinic_id
      and (
        immunizations.visit_id is null
        or exists (
          select 1
          from public.visits v
          where v.id = immunizations.visit_id
            and v.patient_id = immunizations.patient_id
            and v.clinic_id = immunizations.clinic_id
        )
      )
      and (
        immunizations.updated_by is null
        or immunizations.updated_by = current_member.id
        or immunizations.updated_by = auth.uid()
      )
  )
);

drop policy if exists "Clinic members can delete immunizations" on public.immunizations;
create policy "Clinic members can delete immunizations"
on public.immunizations
for delete
using (
  exists (
    select 1
    from public.doctors d
    where (d.auth_user_id = auth.uid() or d.id = auth.uid())
      and d.clinic_id = immunizations.clinic_id
  )
);

notify pgrst, 'reload schema';
