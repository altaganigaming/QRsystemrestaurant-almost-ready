create table if not exists public.customer_messages (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  subject text,
  body text not null check (char_length(body) between 1 and 4000),
  kind text not null default 'message' check (kind in ('message', 'offer')),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists customer_messages_recipient_idx on public.customer_messages(recipient_id, created_at desc);
alter table public.customer_messages enable row level security;
drop policy if exists customer_messages_own_read on public.customer_messages;
create policy customer_messages_own_read on public.customer_messages for select using (auth.uid() = recipient_id);
grant select on public.customer_messages to authenticated;