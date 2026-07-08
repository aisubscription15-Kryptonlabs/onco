create table if not exists public.visit_audio_segments (
  id uuid primary key default extensions.gen_random_uuid(),
  visit_id uuid not null references public.visits(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  segment_index integer not null,
  audio_url text not null,
  mime_type text,
  duration_seconds numeric(10, 2),
  started_at timestamptz,
  ended_at timestamptz,
  status text not null default 'saved' check (status in ('saved', 'merged', 'failed')),
  created_at timestamptz not null default now(),
  unique (visit_id, segment_index)
);

create index if not exists visit_audio_segments_visit_idx
  on public.visit_audio_segments (visit_id, segment_index);

create index if not exists visit_audio_segments_clinic_doctor_idx
  on public.visit_audio_segments (clinic_id, doctor_id, created_at desc);

alter table public.visit_audio_segments enable row level security;

drop policy if exists "Clinic members can view visit audio segments" on public.visit_audio_segments;
create policy "Clinic members can view visit audio segments"
on public.visit_audio_segments for select
using (
  exists (
    select 1 from public.doctors d
    where (d.auth_user_id = auth.uid() or d.id = auth.uid())
      and d.clinic_id = visit_audio_segments.clinic_id
  )
);

drop policy if exists "Clinic members can create visit audio segments" on public.visit_audio_segments;
create policy "Clinic members can create visit audio segments"
on public.visit_audio_segments for insert
with check (
  exists (
    select 1 from public.doctors d
    where (d.auth_user_id = auth.uid() or d.id = auth.uid())
      and d.clinic_id = visit_audio_segments.clinic_id
  )
);

drop policy if exists "Clinic members can update visit audio segments" on public.visit_audio_segments;
create policy "Clinic members can update visit audio segments"
on public.visit_audio_segments for update
using (
  exists (
    select 1 from public.doctors d
    where (d.auth_user_id = auth.uid() or d.id = auth.uid())
      and d.clinic_id = visit_audio_segments.clinic_id
  )
)
with check (
  exists (
    select 1 from public.doctors d
    where (d.auth_user_id = auth.uid() or d.id = auth.uid())
      and d.clinic_id = visit_audio_segments.clinic_id
  )
);
