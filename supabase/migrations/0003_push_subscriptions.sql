create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

-- 본인 구독만 읽기/쓰기 허용 (서비스 롤은 전체 접근)
create policy "push_subscriptions: own read"
  on public.push_subscriptions for select
  to authenticated
  using (user_id = auth.uid());
