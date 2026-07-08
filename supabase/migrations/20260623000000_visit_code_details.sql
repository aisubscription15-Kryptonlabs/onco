alter table public.visits
  add column if not exists icd_code_details jsonb,
  add column if not exists loinc_code_details jsonb;
