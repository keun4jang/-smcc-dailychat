-- Row-Level Security policies for SMCC Daily Chat
-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.applications enable row level security;
alter table public.feedback enable row level security;
alter table public.participant_reports enable row level security;

-- -------------------------------------------------------
-- profiles
-- -------------------------------------------------------
-- Anyone authenticated can read profiles (for host display, etc.)
create policy "profiles: authenticated read"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can only update their own profile
create policy "profiles: own update"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Insert is handled via service role (admin client) only
-- -------------------------------------------------------
-- rooms
-- -------------------------------------------------------
-- Public read for OPEN rooms
create policy "rooms: public read open"
  on public.rooms for select
  to anon, authenticated
  using (status = 'OPEN');

-- Authenticated users can also read rooms they applied to (any status)
create policy "rooms: applicant read any status"
  on public.rooms for select
  to authenticated
  using (
    id in (
      select room_id from public.applications where user_id = auth.uid()
    )
  );

-- Hosts can read all their own rooms
create policy "rooms: host read own"
  on public.rooms for select
  to authenticated
  using (host_id = auth.uid());

-- Room mutations are handled via service role (admin client) only
-- -------------------------------------------------------
-- applications
-- -------------------------------------------------------
-- Users can read their own applications
create policy "applications: own read"
  on public.applications for select
  to authenticated
  using (user_id = auth.uid());

-- Hosts can read applications for their rooms
create policy "applications: host read own room"
  on public.applications for select
  to authenticated
  using (
    room_id in (
      select id from public.rooms where host_id = auth.uid()
    )
  );

-- Application mutations are handled via service role (admin client) only
-- -------------------------------------------------------
-- feedback
-- -------------------------------------------------------
-- Users can read their own feedback
create policy "feedback: own read"
  on public.feedback for select
  to authenticated
  using (user_id = auth.uid());

-- Feedback mutations are handled via service role (admin client) only
-- -------------------------------------------------------
-- participant_reports
-- -------------------------------------------------------
-- Reporters can read reports they submitted
create policy "reports: reporter read own"
  on public.participant_reports for select
  to authenticated
  using (reporter_user_id = auth.uid());

-- Note: All write operations in this app use the Supabase service role (admin)
-- client in server-only context, so service role bypasses RLS automatically.
-- RLS here protects against direct anon/authenticated API access.
