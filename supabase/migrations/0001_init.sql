create extension if not exists pgcrypto;

create type public.app_role as enum ('USER', 'HOST', 'ADMIN');
create type public.room_status as enum ('OPEN', 'FULL', 'CLOSED', 'COMPLETED', 'CANCELLED');
create type public.application_status as enum ('APPLIED', 'CONFIRMED', 'WAITLIST', 'REJECTED', 'CANCELLED', 'ATTENDED', 'NOSHOW');
create type public.report_severity as enum ('NOTE', 'WARN', 'REVIEW');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;

$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  real_name text,
  instagram_id text unique,
  birth_date date,
  gender text,
  role public.app_role not null default 'USER',
  profile_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  intro text,
  notes text,
  starts_at timestamptz not null,
  apply_deadline timestamptz not null,
  place_name text not null,
  address text not null,
  latitude double precision,
  longitude double precision,
  capacity int not null default 8 check (capacity > 0 and capacity <= 8),
  status public.room_status not null default 'OPEN',
  host_id uuid not null references public.profiles(id) on delete restrict,
  host_name text not null,
  host_instagram_id text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_rooms_updated_at
before update on public.rooms
for each row execute function public.set_updated_at();

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.application_status not null default 'APPLIED',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id, user_id)
);

create trigger trg_applications_updated_at
before update on public.applications
for each row execute function public.set_updated_at();

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  overall_rating int not null check (overall_rating between 1 and 5),
  host_rating int check (host_rating between 1 and 5),
  place_rating int check (place_rating between 1 and 5),
  atmosphere_rating int check (atmosphere_rating between 1 and 5),
  issue_category text,
  comment text,
  created_at timestamptz not null default now(),
  unique (room_id, user_id)
);

create table if not exists public.participant_reports (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  reporter_user_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  severity public.report_severity not null default 'NOTE',
  category text not null,
  memo text,
  created_at timestamptz not null default now()
);

create or replace view public.host_stats as
select
  p.id as host_id,
  p.real_name,
  p.instagram_id,
  p.role,
  count(r.id) as rooms_created,
  count(r.id) filter (where r.status in ('OPEN', 'FULL', 'CLOSED', 'COMPLETED')) as active_or_done_rooms,
  coalesce(round(avg(f.host_rating)::numeric, 2), 0) as avg_host_rating
from public.profiles p
left join public.rooms r on r.host_id = p.id
left join public.feedback f on f.room_id = r.id
where p.role in ('HOST', 'ADMIN')
group by p.id, p.real_name, p.instagram_id, p.role;

create or replace view public.participant_stats as
select
  p.id as user_id,
  p.real_name,
  p.instagram_id,
  count(a.id) as total_applications,
  count(*) filter (where a.status = 'CONFIRMED') as total_confirmed,
  count(*) filter (where a.status = 'ATTENDED') as total_attended,
  count(*) filter (where a.status = 'NOSHOW') as total_noshow
from public.profiles p
left join public.applications a on a.user_id = p.id
group by p.id, p.real_name, p.instagram_id;
