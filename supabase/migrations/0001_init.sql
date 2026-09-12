-- =============================================================
-- Restaurant Master System — initial schema, RLS, storage, realtime
-- One Supabase project = one restaurant (full isolation by design)
-- =============================================================
create extension if not exists "pgcrypto";

-- ---------- helpers ----------
create or replace function public.current_role() returns text
language sql stable as $$
  select coalesce((current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role'), '');
$$;

create or replace function public.is_admin() returns boolean
language sql stable as $$ select public.current_role() = 'admin'; $$;

create or replace function public.is_staff() returns boolean
language sql stable as $$ select public.current_role() in ('admin', 'kitchen'); $$;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('admin','kitchen','customer')),
  full_name text,
  phone text,
  address text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (new.id,
          coalesce(new.raw_app_meta_data ->> 'role', 'customer'),
          coalesce(new.raw_user_meta_data ->> 'full_name', ''),
          coalesce(new.raw_user_meta_data ->> 'phone', ''));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- settings (singleton row id=1) ----------
create table public.settings (
  id int primary key default 1 check (id = 1),
  restaurant_name text not null default 'My Restaurant',
  slug text not null default 'restaurant',
  logo_url text, favicon_url text, cover_bg_url text,
  address text, phone text, email text, whatsapp text,
  social jsonb not null default '{}'::jsonb,
  headings jsonb not null default '{}'::jsonb,
  buttons jsonb not null default '{}'::jsonb,
  labels jsonb not null default '{}'::jsonb,
  messages jsonb not null default '{}'::jsonb,
  content jsonb not null default '{}'::jsonb,
  theme_id text not null default 'classic',
  theme_colors jsonb,
  currency text not null default '₹',
  tax_percent numeric(6,2) not null default 0 check (tax_percent >= 0),
  service_charge_percent numeric(6,2) not null default 0 check (service_charge_percent >= 0),
  is_open boolean not null default true,
  service_status text not null default 'active' check (service_status in ('active','suspended')),
  delivery_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;
create trigger settings_updated before update on public.settings for each row execute function public.set_updated_at();

-- ---------- menu ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  description text, image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  description text, image_url text,
  price numeric(10,2) not null check (price >= 0),
  discount_price numeric(10,2) check (discount_price is null or (discount_price >= 0 and discount_price < price)),
  is_available boolean not null default true,
  eat_now_enabled boolean not null default true,
  pack_enabled boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index products_category_idx on public.products(category_id);

create table public.variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null, price_delta numeric(10,2) not null default 0
);
create table public.pack_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null, price_delta numeric(10,2) not null default 0
);
create table public.addons (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null, price numeric(10,2) not null default 0
);

-- ---------- gallery ----------
create table public.gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text not null, alt text, sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- tables & QR ----------
create table public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Za-z0-9_-]{2,24}$'),
  name text not null,
  is_active boolean not null default true,
  qr_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now()
);

-- ---------- orders ----------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity,
  table_id uuid references public.restaurant_tables(id) on delete set null,
  table_label text,
  customer_id uuid references public.profiles(id) on delete set null,
  guest_name text, guest_phone text,
  access_token uuid not null default gen_random_uuid(),
  type text not null check (type in ('dine_in','delivery')),
  status text not null default 'new' check (status in ('new','preparing','ready','completed','cancelled','closed')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid')),
  payment_method text check (payment_method is null or payment_method in ('upi','cash','card','online','other')),
  address_snapshot text,
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  service_charge numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  note text,
  estimated_prep_minutes int check (estimated_prep_minutes is null or estimated_prep_minutes between 1 and 240),
  placed_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_status_idx on public.orders(status);
create index orders_placed_idx on public.orders(placed_at desc);
create index orders_customer_idx on public.orders(customer_id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  variant_name text, pack_size text, mode text check (mode is null or mode in ('eat_now','pack')),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  base_price numeric(10,2) not null default 0,
  qty int not null check (qty between 1 and 100),
  total numeric(12,2) not null check (total >= 0),
  note text
);
create index order_items_order_idx on public.order_items(order_id);

create table public.order_item_addons (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  addon_name text not null, price numeric(10,2) not null default 0
);

create trigger orders_updated before update on public.orders for each row execute function public.set_updated_at();

-- Only staff (admin/kitchen) may modify orders via RLS; guests/customers never
-- write orders directly — placement goes through a server action that verifies
-- prices against the database with the service key. Financial columns are
-- additionally locked by trigger so no client role can tamper with totals.
create or replace function public.orders_lock_financials() returns trigger
language plpgsql as $$
begin
  if not public.is_staff() then
    raise exception 'Only staff can modify orders';
  end if;
  if public.current_role() = 'kitchen' then
    -- kitchen may ONLY move the workflow forward and set prep estimates
    if new.status not in ('preparing','ready','completed') then
      raise exception 'Kitchen cannot set status %', new.status;
    end if;
    if (old.status = 'completed' or old.status = 'closed' or old.status = 'cancelled') then
      raise exception 'Order already finished';
    end if;
    if new.subtotal <> old.subtotal or new.discount <> old.discount or new.tax <> old.tax
       or new.service_charge <> old.service_charge or new.grand_total <> old.grand_total
       or new.payment_status <> old.payment_status or new.type <> old.type
       or new.customer_id is distinct from old.customer_id then
      raise exception 'Kitchen cannot modify financial or identity fields';
    end if;
  end if;
  if new.status in ('completed','closed') and old.status not in ('completed','closed') then
    new.completed_at = now();
  end if;
  return new;
end; $$;

drop trigger if exists orders_guard on public.orders;
create trigger orders_guard before update on public.orders
  for each row execute function public.orders_lock_financials();

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.variants enable row level security;
alter table public.pack_sizes enable row level security;
alter table public.addons enable row level security;
alter table public.gallery enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_addons enable row level security;

-- profiles
create policy profiles_select_own on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy profiles_update_own on public.profiles for update using (auth.uid() = id or public.is_admin()) with check (auth.uid() = id or public.is_admin());

-- settings: readable by everyone (needed to render the site), writable by admin only
create policy settings_public_read on public.settings for select using (true);
create policy settings_admin_write on public.settings for update using (public.is_admin()) with check (public.is_admin());

-- menu read: public sees active/available only; admin full control
create policy categories_read on public.categories for select using (is_active or public.is_admin());
create policy categories_admin on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy products_read on public.products for select using (is_available or public.is_admin());
create policy products_admin on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy variants_read on public.variants for select using (true);
create policy variants_admin on public.variants for all using (public.is_admin()) with check (public.is_admin());
create policy packs_read on public.pack_sizes for select using (true);
create policy packs_admin on public.pack_sizes for all using (public.is_admin()) with check (public.is_admin());
create policy addons_read on public.addons for select using (true);
create policy addons_admin on public.addons for all using (public.is_admin()) with check (public.is_admin());

-- gallery: public read; admin write
create policy gallery_read on public.gallery for select using (true);
create policy gallery_admin on public.gallery for all using (public.is_admin()) with check (public.is_admin());

-- tables: staff read; admin write
create policy tables_staff_read on public.restaurant_tables for select using (public.is_staff());
create policy tables_admin on public.restaurant_tables for all using (public.is_admin()) with check (public.is_admin());

-- orders: staff see everything; customers see their own (guests use access-token-gated server reads)
create policy orders_staff_select on public.orders for select using (public.is_staff());
create policy orders_customer_select on public.orders for select using (auth.uid() = customer_id);
create policy orders_staff_update on public.orders for update using (public.is_staff()) with check (public.is_staff());
create policy order_items_staff_select on public.order_items for select using (public.is_staff() or exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()));
create policy order_item_addons_staff_select on public.order_item_addons for select using (public.is_staff() or exists (select 1 from public.order_items oi join public.orders o on o.id = oi.order_id where oi.id = order_item_id and o.customer_id = auth.uid()));

-- ---------- grants ----------
grant usage on schema public to anon, authenticated;
grant select on public.settings, public.categories, public.products, public.variants, public.pack_sizes, public.addons, public.gallery to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.settings, public.categories, public.products, public.variants, public.pack_sizes, public.addons, public.gallery, public.restaurant_tables, public.orders, public.order_items, public.order_item_addons to authenticated;
-- "grant all" is gated by the admin/staff RLS policies above; anon gets nothing writable.

-- ---------- storage ----------
insert into storage.buckets (id, name, public) values ('media', 'media', true)
on conflict (id) do nothing;

create policy media_public_read on storage.objects for select
  using (bucket_id = 'media');
create policy media_admin_insert on storage.objects for insert
  with check (bucket_id = 'media' and public.is_admin());
create policy media_admin_update on storage.objects for update
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());
create policy media_admin_delete on storage.objects for delete
  using (bucket_id = 'media' and public.is_admin());

-- ---------- realtime ----------
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
