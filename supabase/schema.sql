-- RUN ONCE IN SUPABASE SQL EDITOR. Do not disable RLS.
create extension if not exists pgcrypto;
create table if not exists public.organizations(id uuid primary key default gen_random_uuid(),name text not null,created_at timestamptz not null default now());
create table if not exists public.organization_members(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,role text not null check(role in ('owner','admin','manager')),unique(organization_id,user_id));
create table if not exists public.employees(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,employee_code text not null,name text not null,department text not null default 'General',salary_type text not null default 'monthly' check(salary_type in ('hourly','monthly')),salary_rate numeric(12,2) not null default 0 check(salary_rate>=0),shift_start time not null default '09:00',shift_end time not null default '18:00',standard_days integer not null default 26 check(standard_days between 1 and 31),overtime_multiplier numeric(4,2) not null default 1.5 check(overtime_multiplier>=1),overtime_enabled boolean not null default false,face_id text,active boolean not null default true,created_at timestamptz default now(),unique(organization_id,employee_code));
create table if not exists public.kiosks(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,name text not null,token_hash text not null unique,active boolean not null default true,created_at timestamptz default now());
create table if not exists public.attendance_events(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,employee_id uuid not null references public.employees(id) on delete cascade,kiosk_id uuid references public.kiosks(id),event_type text not null check(event_type in ('in','out')),happened_at timestamptz not null default now(),method text not null default 'face',similarity numeric(5,2),created_at timestamptz default now());
create index if not exists attendance_events_lookup_idx on public.attendance_events(employee_id,happened_at desc);
create table if not exists public.payroll_adjustments(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,employee_id uuid not null references public.employees(id) on delete cascade,month text not null check(month ~ '^[0-9]{4}-[0-9]{2}$'),amount numeric(12,2) not null,reason text not null,created_at timestamptz default now());
create table if not exists public.payroll_runs(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,month text not null,status text not null default 'draft' check(status in ('draft','approved')),approved_at timestamptz,approved_by uuid references auth.users(id),unique(organization_id,month));
create table if not exists public.payroll_lines(id uuid primary key default gen_random_uuid(),run_id uuid not null references public.payroll_runs(id) on delete cascade,employee_id uuid not null references public.employees(id),hours numeric(12,2) not null,base_pay numeric(12,2) not null,ot_pay numeric(12,2) not null,adjustment numeric(12,2) not null,total numeric(12,2) not null,unique(run_id,employee_id));
create table if not exists public.audit_logs(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,actor text not null,action text not null,detail jsonb not null default '{}',created_at timestamptz not null default now());
-- A security-definer function prevents recursion in membership RLS.
create or replace function public.my_org_ids() returns setof uuid language sql stable security definer set search_path='' as $$select organization_id from public.organization_members where user_id=(select auth.uid())$$;
revoke all on function public.my_org_ids() from public;
grant execute on function public.my_org_ids() to authenticated;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.employees enable row level security;
alter table public.kiosks enable row level security;
alter table public.attendance_events enable row level security;
alter table public.payroll_adjustments enable row level security;
alter table public.payroll_runs enable row level security;
alter table public.payroll_lines enable row level security;
alter table public.audit_logs enable row level security;
create policy "member read org" on public.organizations for select to authenticated using(id in(select public.my_org_ids()));
create policy "member read memberships" on public.organization_members for select to authenticated using(organization_id in(select public.my_org_ids()));
create policy "member read employees" on public.employees for select to authenticated using(organization_id in(select public.my_org_ids()));
create policy "member read events" on public.attendance_events for select to authenticated using(organization_id in(select public.my_org_ids()));
create policy "member read runs" on public.payroll_runs for select to authenticated using(organization_id in(select public.my_org_ids()));
create policy "member read lines" on public.payroll_lines for select to authenticated using(exists(select 1 from public.payroll_runs r where r.id=run_id and r.organization_id in(select public.my_org_ids())));
create policy "member read adjustments" on public.payroll_adjustments for select to authenticated using(organization_id in(select public.my_org_ids()));
create policy "member read kiosk names" on public.kiosks for select to authenticated using(organization_id in(select public.my_org_ids()));
create policy "member read logs" on public.audit_logs for select to authenticated using(organization_id in(select public.my_org_ids()));
-- First organization self-service onboarding: authenticated creates organization and joins as owner atomically.
create or replace function public.create_my_organization(org_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare new_org uuid;
begin
if auth.uid() is null then raise exception 'Not signed in';end if;
if length(trim(org_name))<2 then raise exception 'Organization name too short';end if;
if exists(select 1 from public.organization_members where user_id=auth.uid()) then raise exception 'Already in organization';end if;
insert into public.organizations(name) values(trim(org_name)) returning id into new_org;
insert into public.organization_members(organization_id,user_id,role) values(new_org,auth.uid(),'owner');
return new_org;
end $$;
revoke all on function public.create_my_organization(text) from public;
grant execute on function public.create_my_organization(text) to authenticated;
