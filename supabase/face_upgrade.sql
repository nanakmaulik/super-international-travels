-- Run ONCE in existing WorkPulse Supabase project's SQL Editor. No destructive operations.
create table if not exists public.face_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  embedding jsonb not null check (jsonb_typeof(embedding)='array' and jsonb_array_length(embedding)=128),
  model_version text not null default 'opencv-sface-v1',
  created_at timestamptz not null default now()
);
create index if not exists face_templates_org_idx on public.face_templates(organization_id, employee_id);
alter table public.face_templates enable row level security;
revoke all on public.face_templates from anon, authenticated;
-- Server only: workpulse API uses Supabase service role after checking admin membership or kiosk token.
