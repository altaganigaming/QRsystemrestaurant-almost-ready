alter table public.settings
  add column if not exists admin_order_notifications boolean not null default true;