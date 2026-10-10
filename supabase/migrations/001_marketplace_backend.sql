-- SAU marketplace database provisioning.
-- Apply manually in Supabase SQL Editor after reviewing the preflight notes below.
-- This migration creates/extends objects; it does not drop tables or truncate data.
-- It deliberately does not seed catalog or user records.
-- It replaces named RLS policies and, only after its guarded copy, replaces
-- cart_items' legacy FK to public.cart with an FK to public.carts.

begin;

create extension if not exists pgcrypto;

-- Create missing marketplace tables while leaving existing tables and rows in place.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'partner', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text not null default '',
  image_url text,
  price numeric(10, 2) not null check (price >= 0),
  duration text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text not null default '',
  image_url text,
  price numeric(10, 2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  full_name text not null,
  phone text not null,
  address_line text not null,
  city text not null,
  state text,
  postal_code text not null,
  latitude double precision,
  longitude double precision,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(user_id) on delete cascade,
  business_name text not null,
  partner_type text,
  services_offered text,
  experience text,
  address text,
  postal_code text,
  phone text,
  profile_image text,
  service_area text,
  latitude double precision,
  longitude double precision,
  availability text,
  rating numeric(2, 1) check (rating between 0 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  price numeric(10, 2) not null check (price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_id)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(user_id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  partner_id uuid references public.partner_profiles(user_id) on delete set null,
  address_id uuid references public.addresses(id) on delete set null,
  booking_date date not null,
  booking_time text not null,
  status text not null default 'PENDING' check (status in (
    'PENDING', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'SERVICE_STARTED',
    'COMPLETED', 'REJECTED', 'CANCELLED', 'CONFIRMED', 'IN_PROGRESS'
  )),
  total_amount numeric(10, 2) check (total_amount >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(user_id) on delete cascade,
  address_id uuid references public.addresses(id) on delete set null,
  status text not null default 'PENDING' check (status in (
    'PENDING', 'CONFIRMED', 'PREPARING', 'PROCESSING',
    'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
  )),
  total_amount numeric(10, 2) not null default 0 check (total_amount >= 0),
  payment_status text not null default 'PENDING' check (payment_status in ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  price numeric(10, 2) not null check (price >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(user_id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  partner_id uuid references public.partner_profiles(user_id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (service_id is not null or partner_id is not null)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Fail closed if an existing table's columns do not match application expectations.
-- This avoids silently guessing at or overwriting a pre-existing schema.
do $$
declare
  missing_columns text;
begin
  select string_agg(required.table_name || '.' || required.column_name, ', ' order by required.table_name, required.column_name)
  into missing_columns
  from (values
    ('profiles', 'id'), ('profiles', 'user_id'), ('profiles', 'full_name'), ('profiles', 'email'), ('profiles', 'phone'), ('profiles', 'avatar_url'), ('profiles', 'role'), ('profiles', 'created_at'), ('profiles', 'updated_at'),
    ('categories', 'id'), ('categories', 'name'), ('categories', 'slug'), ('categories', 'description'), ('categories', 'image_url'), ('categories', 'is_active'),
    ('services', 'id'), ('services', 'category_id'), ('services', 'name'), ('services', 'slug'), ('services', 'description'), ('services', 'image_url'), ('services', 'price'), ('services', 'duration'), ('services', 'is_active'),
    ('products', 'id'), ('products', 'category_id'), ('products', 'name'), ('products', 'slug'), ('products', 'description'), ('products', 'image_url'), ('products', 'price'), ('products', 'stock'), ('products', 'is_active'),
    ('addresses', 'id'), ('addresses', 'user_id'), ('addresses', 'full_name'), ('addresses', 'phone'), ('addresses', 'address_line'), ('addresses', 'city'), ('addresses', 'state'), ('addresses', 'postal_code'), ('addresses', 'latitude'), ('addresses', 'longitude'), ('addresses', 'is_default'),
    ('carts', 'id'), ('carts', 'user_id'), ('carts', 'created_at'), ('carts', 'updated_at'),
    ('partner_profiles', 'id'), ('partner_profiles', 'user_id'), ('partner_profiles', 'business_name'), ('partner_profiles', 'partner_type'), ('partner_profiles', 'services_offered'), ('partner_profiles', 'experience'), ('partner_profiles', 'address'), ('partner_profiles', 'postal_code'), ('partner_profiles', 'phone'), ('partner_profiles', 'profile_image'), ('partner_profiles', 'service_area'), ('partner_profiles', 'latitude'), ('partner_profiles', 'longitude'), ('partner_profiles', 'availability'),
    ('cart_items', 'id'), ('cart_items', 'cart_id'), ('cart_items', 'product_id'), ('cart_items', 'quantity'), ('cart_items', 'price'), ('cart_items', 'created_at'),
    ('bookings', 'id'), ('bookings', 'customer_id'), ('bookings', 'service_id'), ('bookings', 'partner_id'), ('bookings', 'address_id'), ('bookings', 'booking_date'), ('bookings', 'booking_time'), ('bookings', 'status'), ('bookings', 'total_amount'), ('bookings', 'created_at'), ('bookings', 'notes'),
    ('orders', 'id'), ('orders', 'customer_id'), ('orders', 'address_id'), ('orders', 'status'), ('orders', 'total_amount'), ('orders', 'payment_status'), ('orders', 'created_at'),
    ('order_items', 'id'), ('order_items', 'order_id'), ('order_items', 'product_id'), ('order_items', 'quantity'), ('order_items', 'price'), ('order_items', 'created_at'),
    ('reviews', 'id'), ('reviews', 'customer_id'), ('reviews', 'service_id'), ('reviews', 'partner_id'), ('reviews', 'rating'), ('reviews', 'comment'), ('reviews', 'created_at'),
    ('notifications', 'id'), ('notifications', 'user_id'), ('notifications', 'title'), ('notifications', 'message'), ('notifications', 'type'), ('notifications', 'is_read'), ('notifications', 'created_at')
  ) as required(table_name, column_name)
  left join information_schema.columns actual
    on actual.table_schema = 'public'
   and actual.table_name = required.table_name
   and actual.column_name = required.column_name
  where actual.column_name is null;

  if missing_columns is not null then
    raise exception 'Marketplace migration stopped: existing tables are missing expected columns: %. Inspect and reconcile these tables manually; no data was deleted.', missing_columns;
  end if;
end
$$;

-- Legacy cart handling:
-- The frontend now exclusively uses public.carts. The legacy public.cart table
-- is retained. If its old schema is compatible, copy cart headers using the
-- existing IDs so cart_items can retain their cart_id references. Abort on
-- duplicate owners or orphan items rather than losing or guessing at data.
do $$
declare
  expected_column_count integer;
  duplicate_owner boolean;
  conflicting_owner boolean;
  orphan_item boolean;
  legacy_fk record;
begin
  if to_regclass('public.cart') is null then
    raise notice 'Legacy public.cart table not found; no legacy cart data to migrate.';
    return;
  end if;

  select count(*) into expected_column_count
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'cart'
    and column_name in ('id', 'user_id', 'created_at', 'updated_at');
  if expected_column_count <> 4 then
    raise exception 'Legacy public.cart has an unexpected shape. Expected id, user_id, created_at, updated_at; inspect its columns and revise this copy step before applying.';
  end if;

  execute 'select exists (select 1 from public.cart group by user_id having count(*) > 1)'
    into duplicate_owner;
  if duplicate_owner then
    raise exception 'Legacy public.cart has multiple rows for one user. Resolve/merge those carts explicitly before migration; no legacy rows were copied.';
  end if;

  execute 'select exists (
    select 1 from public.cart old_cart
    join public.carts new_cart on new_cart.user_id = old_cart.user_id
    where new_cart.id <> old_cart.id
  )' into conflicting_owner;
  if conflicting_owner then
    raise exception 'A user already has a different public.carts ID than public.cart. Review and merge cart items manually before migration.';
  end if;
  execute 'select exists (
    select 1 from public.cart old_cart
    join public.carts new_cart on new_cart.id = old_cart.id
    where new_cart.user_id <> old_cart.user_id
  )' into conflicting_owner;
  if conflicting_owner then
    raise exception 'A legacy cart ID is already assigned to another user in public.carts. Review manually before migration.';
  end if;

  execute 'insert into public.carts (id, user_id, created_at, updated_at)
    select id, user_id, coalesce(created_at, now()), coalesce(updated_at, now())
    from public.cart
    on conflict (user_id) do nothing';

  if to_regclass('public.cart_items') is not null then
    execute 'select exists (
      select 1 from public.cart_items ci
      left join public.carts c on c.id = ci.cart_id
      where c.id is null
    )' into orphan_item;
    if orphan_item then
      raise exception 'public.cart_items contains cart_id values with no matching public.carts row. Review before changing its foreign key.';
    end if;

    for legacy_fk in
      select conname
      from pg_constraint
      where conrelid = 'public.cart_items'::regclass
        and contype = 'f'
        and confrelid = to_regclass('public.cart')
    loop
      execute format('alter table public.cart_items drop constraint %I', legacy_fk.conname);
    end loop;
  end if;
end
$$;

-- Add missing references without rejecting pre-existing rows. New writes are
-- checked immediately; administrators can validate these constraints after
-- reviewing any legacy orphan rows.
do $$
declare
  relation record;
begin
  for relation in
    select * from (values
      ('profiles', 'id', 'auth', 'users', 'id', 'profiles_id_auth_users_fkey', 'cascade'),
      ('profiles', 'user_id', 'auth', 'users', 'id', 'profiles_user_id_auth_users_fkey', 'cascade'),
      ('services', 'category_id', 'public', 'categories', 'id', 'services_category_id_categories_fkey', 'set null'),
      ('products', 'category_id', 'public', 'categories', 'id', 'products_category_id_categories_fkey', 'set null'),
      ('addresses', 'user_id', 'public', 'profiles', 'user_id', 'addresses_user_id_profiles_fkey', 'cascade'),
      ('carts', 'user_id', 'public', 'profiles', 'user_id', 'carts_user_id_profiles_fkey', 'cascade'),
      ('cart_items', 'cart_id', 'public', 'carts', 'id', 'cart_items_cart_id_carts_fkey', 'cascade'),
      ('cart_items', 'product_id', 'public', 'products', 'id', 'cart_items_product_id_products_fkey', 'restrict'),
      ('partner_profiles', 'user_id', 'public', 'profiles', 'user_id', 'partner_profiles_user_id_profiles_fkey', 'cascade'),
      ('bookings', 'customer_id', 'public', 'profiles', 'user_id', 'bookings_customer_id_profiles_fkey', 'cascade'),
      ('bookings', 'service_id', 'public', 'services', 'id', 'bookings_service_id_services_fkey', 'restrict'),
      ('bookings', 'partner_id', 'public', 'partner_profiles', 'user_id', 'bookings_partner_id_partner_profiles_fkey', 'set null'),
      ('bookings', 'address_id', 'public', 'addresses', 'id', 'bookings_address_id_addresses_fkey', 'set null'),
      ('orders', 'customer_id', 'public', 'profiles', 'user_id', 'orders_customer_id_profiles_fkey', 'cascade'),
      ('orders', 'address_id', 'public', 'addresses', 'id', 'orders_address_id_addresses_fkey', 'set null'),
      ('order_items', 'order_id', 'public', 'orders', 'id', 'order_items_order_id_orders_fkey', 'cascade'),
      ('order_items', 'product_id', 'public', 'products', 'id', 'order_items_product_id_products_fkey', 'restrict'),
      ('reviews', 'customer_id', 'public', 'profiles', 'user_id', 'reviews_customer_id_profiles_fkey', 'cascade'),
      ('reviews', 'service_id', 'public', 'services', 'id', 'reviews_service_id_services_fkey', 'set null'),
      ('reviews', 'partner_id', 'public', 'partner_profiles', 'user_id', 'reviews_partner_id_partner_profiles_fkey', 'set null'),
      ('notifications', 'user_id', 'public', 'profiles', 'user_id', 'notifications_user_id_profiles_fkey', 'cascade')
    ) as refs(child_table, child_column, parent_schema, parent_table, parent_column, constraint_name, delete_action)
  loop
    if not exists (
      select 1
      from pg_constraint con
      join pg_attribute child_att
        on child_att.attrelid = con.conrelid
       and child_att.attnum = con.conkey[1]
      join pg_attribute parent_att
        on parent_att.attrelid = con.confrelid
       and parent_att.attnum = con.confkey[1]
      where con.contype = 'f'
        and con.conrelid = to_regclass(format('public.%I', relation.child_table))
        and con.confrelid = to_regclass(format('%I.%I', relation.parent_schema, relation.parent_table))
        and array_length(con.conkey, 1) = 1
        and array_length(con.confkey, 1) = 1
        and child_att.attname = relation.child_column
        and parent_att.attname = relation.parent_column
    ) then
      execute format(
        'alter table public.%I add constraint %I foreign key (%I) references %I.%I (%I) on delete %s not valid',
        relation.child_table,
        relation.constraint_name,
        relation.child_column,
        relation.parent_schema,
        relation.parent_table,
        relation.parent_column,
        relation.delete_action
      );
    end if;
  end loop;
end
$$;

create index if not exists idx_profiles_user_id on public.profiles(user_id);
create index if not exists idx_categories_active on public.categories(is_active);
create index if not exists idx_services_category on public.services(category_id);
create index if not exists idx_services_active on public.services(is_active);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_active on public.products(is_active);
create index if not exists idx_addresses_user_id on public.addresses(user_id);
create index if not exists idx_carts_user_id on public.carts(user_id);
create index if not exists idx_cart_items_cart_id on public.cart_items(cart_id);
create index if not exists idx_bookings_customer on public.bookings(customer_id);
create index if not exists idx_bookings_partner on public.bookings(partner_id);
create index if not exists idx_orders_customer on public.orders(customer_id);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_reviews_customer on public.reviews(customer_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_partner_profiles_user on public.partner_profiles(user_id);
do $$
begin
  if exists (
    select 1
    from public.cart_items
    group by cart_id, product_id
    having count(*) > 1
  ) then
    raise exception 'Duplicate cart_items rows exist for the same cart_id/product_id. Review and merge them explicitly, then rerun the migration.';
  end if;
end
$$;
create unique index if not exists idx_cart_items_cart_product_unique on public.cart_items(cart_id, product_id);

-- Security-definer role helpers avoid recursive profiles RLS checks.
create or replace function public.sau_current_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.user_id = (select auth.uid()) limit 1
$$;

create or replace function public.sau_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.sau_current_role() = 'admin', false)
$$;

revoke all on function public.sau_current_role() from public;
revoke all on function public.sau_is_admin() from public;
grant execute on function public.sau_current_role() to authenticated;
grant execute on function public.sau_is_admin() to authenticated;

create or replace function public.sau_create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_role text;
begin
  new_role := case when new.raw_user_meta_data ->> 'role' = 'partner' then 'partner' else 'customer' end;
  insert into public.profiles (id, user_id, full_name, email, role)
  values (
    new.id,
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.email, ''),
    new_role
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.sau_create_profile_for_new_user() from public;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.services enable row level security;
alter table public.products enable row level security;
alter table public.addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.partner_profiles enable row level security;
alter table public.bookings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;

-- Retire policy names from the earlier reference schema, then install scoped rules.
drop policy if exists "Public read active categories" on public.categories;
drop policy if exists "Public read active services" on public.services;
drop policy if exists "Public read active products" on public.products;
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can manage own addresses" on public.addresses;
drop policy if exists "Users can manage own carts" on public.carts;
drop policy if exists "Users can manage own cart items" on public.cart_items;
drop policy if exists "Customers and assigned partners can read bookings" on public.bookings;
drop policy if exists "Customers can read own orders" on public.orders;
drop policy if exists "Customers can read own order items" on public.order_items;
drop policy if exists "Users can manage own partner profile" on public.partner_profiles;
drop policy if exists "Users can create own reviews" on public.reviews;
drop policy if exists "Users can read own reviews" on public.reviews;
drop policy if exists "Users can manage own notifications" on public.notifications;

drop policy if exists "sau_public_read_active_categories" on public.categories;
drop policy if exists "sau_admin_manage_categories" on public.categories;
drop policy if exists "sau_public_read_active_services" on public.services;
drop policy if exists "sau_admin_manage_services" on public.services;
drop policy if exists "sau_public_read_active_products" on public.products;
drop policy if exists "sau_admin_manage_products" on public.products;
drop policy if exists "sau_read_own_or_admin_profiles" on public.profiles;
drop policy if exists "sau_insert_own_profile" on public.profiles;
drop policy if exists "sau_update_own_profile_without_role_change" on public.profiles;
drop policy if exists "sau_admin_manage_profiles" on public.profiles;
drop policy if exists "sau_manage_own_addresses" on public.addresses;
drop policy if exists "sau_manage_own_carts" on public.carts;
drop policy if exists "sau_manage_own_cart_items" on public.cart_items;
drop policy if exists "sau_manage_own_partner_profile" on public.partner_profiles;
drop policy if exists "sau_admin_manage_partner_profiles" on public.partner_profiles;
drop policy if exists "sau_read_own_or_assigned_bookings" on public.bookings;
drop policy if exists "sau_admin_manage_bookings" on public.bookings;
drop policy if exists "sau_read_own_or_admin_orders" on public.orders;
drop policy if exists "sau_admin_manage_orders" on public.orders;
drop policy if exists "sau_read_own_order_items" on public.order_items;
drop policy if exists "sau_admin_manage_order_items" on public.order_items;
drop policy if exists "sau_read_own_or_relevant_reviews" on public.reviews;
drop policy if exists "sau_create_review_after_completed_booking" on public.reviews;
drop policy if exists "sau_admin_manage_reviews" on public.reviews;
drop policy if exists "sau_manage_own_notifications" on public.notifications;
drop policy if exists "sau_boundary_public_categories" on public.categories;
drop policy if exists "sau_boundary_authenticated_categories" on public.categories;
drop policy if exists "sau_boundary_catalog_insert_categories" on public.categories;
drop policy if exists "sau_boundary_catalog_update_categories" on public.categories;
drop policy if exists "sau_boundary_catalog_delete_categories" on public.categories;
drop policy if exists "sau_boundary_public_services" on public.services;
drop policy if exists "sau_boundary_authenticated_services" on public.services;
drop policy if exists "sau_boundary_catalog_insert_services" on public.services;
drop policy if exists "sau_boundary_catalog_update_services" on public.services;
drop policy if exists "sau_boundary_catalog_delete_services" on public.services;
drop policy if exists "sau_boundary_public_products" on public.products;
drop policy if exists "sau_boundary_authenticated_products" on public.products;
drop policy if exists "sau_boundary_catalog_insert_products" on public.products;
drop policy if exists "sau_boundary_catalog_update_products" on public.products;
drop policy if exists "sau_boundary_catalog_delete_products" on public.products;
drop policy if exists "sau_boundary_profiles" on public.profiles;
drop policy if exists "sau_boundary_profile_inserts" on public.profiles;
drop policy if exists "sau_boundary_profile_updates" on public.profiles;
drop policy if exists "sau_boundary_addresses" on public.addresses;
drop policy if exists "sau_boundary_carts" on public.carts;
drop policy if exists "sau_boundary_cart_items" on public.cart_items;
drop policy if exists "sau_boundary_partner_profiles" on public.partner_profiles;
drop policy if exists "sau_boundary_bookings_select" on public.bookings;
drop policy if exists "sau_boundary_bookings_insert" on public.bookings;
drop policy if exists "sau_boundary_bookings_update" on public.bookings;
drop policy if exists "sau_boundary_bookings_delete" on public.bookings;
drop policy if exists "sau_boundary_orders_select" on public.orders;
drop policy if exists "sau_boundary_orders_insert" on public.orders;
drop policy if exists "sau_boundary_orders_update" on public.orders;
drop policy if exists "sau_boundary_orders_delete" on public.orders;
drop policy if exists "sau_boundary_order_items_select" on public.order_items;
drop policy if exists "sau_boundary_order_items_insert" on public.order_items;
drop policy if exists "sau_boundary_order_items_update" on public.order_items;
drop policy if exists "sau_boundary_order_items_delete" on public.order_items;
drop policy if exists "sau_boundary_reviews_select" on public.reviews;
drop policy if exists "sau_boundary_reviews_insert" on public.reviews;
drop policy if exists "sau_boundary_reviews_mutations" on public.reviews;
drop policy if exists "sau_boundary_reviews_delete" on public.reviews;
drop policy if exists "sau_boundary_notifications" on public.notifications;

create policy "sau_public_read_active_categories" on public.categories
  for select to anon, authenticated using (is_active);
create policy "sau_admin_manage_categories" on public.categories
  for all to authenticated using ((select public.sau_is_admin())) with check ((select public.sau_is_admin()));
create policy "sau_public_read_active_services" on public.services
  for select to anon, authenticated using (is_active);
create policy "sau_admin_manage_services" on public.services
  for all to authenticated using ((select public.sau_is_admin())) with check ((select public.sau_is_admin()));
create policy "sau_public_read_active_products" on public.products
  for select to anon, authenticated using (is_active);
create policy "sau_admin_manage_products" on public.products
  for all to authenticated using ((select public.sau_is_admin())) with check ((select public.sau_is_admin()));

create policy "sau_boundary_public_categories" on public.categories as restrictive
  for select to anon using (is_active);
create policy "sau_boundary_authenticated_categories" on public.categories as restrictive
  for select to authenticated using (is_active or (select public.sau_is_admin()));
create policy "sau_boundary_catalog_insert_categories" on public.categories as restrictive
  for insert to authenticated with check ((select public.sau_is_admin()));
create policy "sau_boundary_catalog_update_categories" on public.categories as restrictive
  for update to authenticated using ((select public.sau_is_admin())) with check ((select public.sau_is_admin()));
create policy "sau_boundary_catalog_delete_categories" on public.categories as restrictive
  for delete to authenticated using ((select public.sau_is_admin()));
create policy "sau_boundary_public_services" on public.services as restrictive
  for select to anon using (is_active);
create policy "sau_boundary_authenticated_services" on public.services as restrictive
  for select to authenticated using (is_active or (select public.sau_is_admin()));
create policy "sau_boundary_catalog_insert_services" on public.services as restrictive
  for insert to authenticated with check ((select public.sau_is_admin()));
create policy "sau_boundary_catalog_update_services" on public.services as restrictive
  for update to authenticated using ((select public.sau_is_admin())) with check ((select public.sau_is_admin()));
create policy "sau_boundary_catalog_delete_services" on public.services as restrictive
  for delete to authenticated using ((select public.sau_is_admin()));
create policy "sau_boundary_public_products" on public.products as restrictive
  for select to anon using (is_active);
create policy "sau_boundary_authenticated_products" on public.products as restrictive
  for select to authenticated using (is_active or (select public.sau_is_admin()));
create policy "sau_boundary_catalog_insert_products" on public.products as restrictive
  for insert to authenticated with check ((select public.sau_is_admin()));
create policy "sau_boundary_catalog_update_products" on public.products as restrictive
  for update to authenticated using ((select public.sau_is_admin())) with check ((select public.sau_is_admin()));
create policy "sau_boundary_catalog_delete_products" on public.products as restrictive
  for delete to authenticated using ((select public.sau_is_admin()));

create policy "sau_read_own_or_admin_profiles" on public.profiles
  for select to authenticated using (user_id = (select auth.uid()) or (select public.sau_is_admin()));
create policy "sau_insert_own_profile" on public.profiles
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and role in ('customer', 'partner')
  );
create policy "sau_update_own_profile_without_role_change" on public.profiles
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and role = (select public.sau_current_role()));
create policy "sau_admin_manage_profiles" on public.profiles
  for all to authenticated using ((select public.sau_is_admin())) with check ((select public.sau_is_admin()));
create policy "sau_boundary_profiles" on public.profiles as restrictive
  for select to authenticated using (user_id = (select auth.uid()) or (select public.sau_is_admin()));
create policy "sau_boundary_profile_inserts" on public.profiles as restrictive
  for insert to authenticated with check (
    (user_id = (select auth.uid()) and role in ('customer', 'partner'))
    or (select public.sau_is_admin())
  );
create policy "sau_boundary_profile_updates" on public.profiles as restrictive
  for update to authenticated using (user_id = (select auth.uid()) or (select public.sau_is_admin()))
  with check (
    ((user_id = (select auth.uid())) and role = (select public.sau_current_role()))
    or (select public.sau_is_admin())
  );

create policy "sau_manage_own_addresses" on public.addresses
  for all to authenticated using (user_id = (select auth.uid()) or (select public.sau_is_admin()))
  with check (user_id = (select auth.uid()) or (select public.sau_is_admin()));
create policy "sau_manage_own_carts" on public.carts
  for all to authenticated using (user_id = (select auth.uid()) or (select public.sau_is_admin()))
  with check (user_id = (select auth.uid()) or (select public.sau_is_admin()));
create policy "sau_manage_own_cart_items" on public.cart_items
  for all to authenticated using (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()))
    or (select public.sau_is_admin())
  ) with check (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()))
    or (select public.sau_is_admin())
  );
create policy "sau_manage_own_partner_profile" on public.partner_profiles
  for all to authenticated using (
    user_id = (select auth.uid()) and (select public.sau_current_role()) = 'partner'
  ) with check (
    user_id = (select auth.uid()) and (select public.sau_current_role()) = 'partner'
  );
create policy "sau_admin_manage_partner_profiles" on public.partner_profiles
  for all to authenticated using ((select public.sau_is_admin())) with check ((select public.sau_is_admin()));

create policy "sau_read_own_or_assigned_bookings" on public.bookings
  for select to authenticated using (
    customer_id = (select auth.uid())
    or partner_id = (select auth.uid())
    or (select public.sau_is_admin())
  );
create policy "sau_admin_manage_bookings" on public.bookings
  for all to authenticated using ((select public.sau_is_admin())) with check ((select public.sau_is_admin()));
create policy "sau_read_own_or_admin_orders" on public.orders
  for select to authenticated using (customer_id = (select auth.uid()) or (select public.sau_is_admin()));
create policy "sau_admin_manage_orders" on public.orders
  for all to authenticated using ((select public.sau_is_admin())) with check ((select public.sau_is_admin()));
create policy "sau_read_own_order_items" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.customer_id = (select auth.uid()))
    or (select public.sau_is_admin())
  );
create policy "sau_admin_manage_order_items" on public.order_items
  for all to authenticated using ((select public.sau_is_admin())) with check ((select public.sau_is_admin()));

create policy "sau_read_own_or_relevant_reviews" on public.reviews
  for select to authenticated using (
    customer_id = (select auth.uid())
    or exists (
      select 1 from public.bookings b
      where b.partner_id = (select auth.uid())
        and b.status = 'COMPLETED'
        and ((reviews.service_id is not null and b.service_id = reviews.service_id)
          or (reviews.partner_id is not null and b.partner_id = reviews.partner_id))
    )
    or (select public.sau_is_admin())
  );
create policy "sau_create_review_after_completed_booking" on public.reviews
  for insert to authenticated with check (
    customer_id = (select auth.uid())
    and (
      (service_id is not null and exists (
        select 1 from public.bookings b
        where b.customer_id = (select auth.uid())
          and b.service_id = reviews.service_id
          and b.status = 'COMPLETED'
      ))
      or (partner_id is not null and exists (
        select 1 from public.bookings b
        where b.customer_id = (select auth.uid())
          and b.partner_id = reviews.partner_id
          and b.status = 'COMPLETED'
      ))
    )
  );
create policy "sau_admin_manage_reviews" on public.reviews
  for all to authenticated using ((select public.sau_is_admin())) with check ((select public.sau_is_admin()));
create policy "sau_manage_own_notifications" on public.notifications
  for all to authenticated using (user_id = (select auth.uid()) or (select public.sau_is_admin()))
  with check (user_id = (select auth.uid()) or (select public.sau_is_admin()));

create policy "sau_boundary_addresses" on public.addresses as restrictive
  for all to authenticated using (user_id = (select auth.uid()) or (select public.sau_is_admin()))
  with check (user_id = (select auth.uid()) or (select public.sau_is_admin()));
create policy "sau_boundary_carts" on public.carts as restrictive
  for all to authenticated using (user_id = (select auth.uid()) or (select public.sau_is_admin()))
  with check (user_id = (select auth.uid()) or (select public.sau_is_admin()));
create policy "sau_boundary_cart_items" on public.cart_items as restrictive
  for all to authenticated using (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()))
    or (select public.sau_is_admin())
  ) with check (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()))
    or (select public.sau_is_admin())
  );
create policy "sau_boundary_partner_profiles" on public.partner_profiles as restrictive
  for all to authenticated using (
    (user_id = (select auth.uid()) and (select public.sau_current_role()) = 'partner')
    or (select public.sau_is_admin())
  ) with check (
    (user_id = (select auth.uid()) and (select public.sau_current_role()) = 'partner')
    or (select public.sau_is_admin())
  );
create policy "sau_boundary_bookings_select" on public.bookings as restrictive
  for select to authenticated using (
    customer_id = (select auth.uid()) or partner_id = (select auth.uid()) or (select public.sau_is_admin())
  );
create policy "sau_boundary_bookings_insert" on public.bookings as restrictive
  for insert to authenticated with check (
    (
      customer_id = (select auth.uid())
      and partner_id is null
      and exists (select 1 from public.addresses a where a.id = address_id and a.user_id = (select auth.uid()))
    )
    or (select public.sau_is_admin())
  );
create policy "sau_boundary_bookings_update" on public.bookings as restrictive
  for update to authenticated using (partner_id = (select auth.uid()) or (select public.sau_is_admin()))
  with check (partner_id = (select auth.uid()) or (select public.sau_is_admin()));
create policy "sau_boundary_bookings_delete" on public.bookings as restrictive
  for delete to authenticated using ((select public.sau_is_admin()));
create policy "sau_boundary_orders_select" on public.orders as restrictive
  for select to authenticated using (customer_id = (select auth.uid()) or (select public.sau_is_admin()));
create policy "sau_boundary_orders_insert" on public.orders as restrictive
  for insert to authenticated with check ((select public.sau_is_admin()));
create policy "sau_boundary_orders_update" on public.orders as restrictive
  for update to authenticated using ((select public.sau_is_admin())) with check ((select public.sau_is_admin()));
create policy "sau_boundary_orders_delete" on public.orders as restrictive
  for delete to authenticated using ((select public.sau_is_admin()));
create policy "sau_boundary_order_items_select" on public.order_items as restrictive
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.customer_id = (select auth.uid()))
    or (select public.sau_is_admin())
  );
create policy "sau_boundary_order_items_insert" on public.order_items as restrictive
  for insert to authenticated with check ((select public.sau_is_admin()));
create policy "sau_boundary_order_items_update" on public.order_items as restrictive
  for update to authenticated using ((select public.sau_is_admin())) with check ((select public.sau_is_admin()));
create policy "sau_boundary_order_items_delete" on public.order_items as restrictive
  for delete to authenticated using ((select public.sau_is_admin()));
create policy "sau_boundary_reviews_select" on public.reviews as restrictive
  for select to authenticated using (
    customer_id = (select auth.uid())
    or exists (
      select 1 from public.bookings b
      where b.partner_id = (select auth.uid()) and b.status = 'COMPLETED'
        and ((reviews.service_id is not null and b.service_id = reviews.service_id)
          or (reviews.partner_id is not null and b.partner_id = reviews.partner_id))
    )
    or (select public.sau_is_admin())
  );
create policy "sau_boundary_reviews_insert" on public.reviews as restrictive
  for insert to authenticated with check (
    (customer_id = (select auth.uid()) and (
      (service_id is not null and exists (
        select 1 from public.bookings b where b.customer_id = (select auth.uid())
          and b.service_id = reviews.service_id and b.status = 'COMPLETED'
      ))
      or (partner_id is not null and exists (
        select 1 from public.bookings b where b.customer_id = (select auth.uid())
          and b.partner_id = reviews.partner_id and b.status = 'COMPLETED'
      ))
    )) or (select public.sau_is_admin())
  );
create policy "sau_boundary_reviews_mutations" on public.reviews as restrictive
  for update to authenticated using (customer_id = (select auth.uid()) or (select public.sau_is_admin()))
  with check (customer_id = (select auth.uid()) or (select public.sau_is_admin()));
create policy "sau_boundary_reviews_delete" on public.reviews as restrictive
  for delete to authenticated using ((select public.sau_is_admin()));
create policy "sau_boundary_notifications" on public.notifications as restrictive
  for all to authenticated using (user_id = (select auth.uid()) or (select public.sau_is_admin()))
  with check (user_id = (select auth.uid()) or (select public.sau_is_admin()));

do $$
begin
  if to_regclass('public.cart') is not null then
    execute 'drop policy if exists "sau_boundary_legacy_cart" on public.cart';
    execute 'drop policy if exists "Legacy cart owner access" on public.cart';
    alter table public.cart enable row level security;
    execute 'create policy "Legacy cart owner access" on public.cart
      for all to authenticated using (user_id = (select auth.uid()) or (select public.sau_is_admin()))
      with check (user_id = (select auth.uid()) or (select public.sau_is_admin()))';
    execute 'create policy "sau_boundary_legacy_cart" on public.cart as restrictive
      for all to authenticated using (user_id = (select auth.uid()) or (select public.sau_is_admin()))
      with check (user_id = (select auth.uid()) or (select public.sau_is_admin()))';
    revoke all on public.cart from anon;
    grant select, insert, update, delete on public.cart to authenticated;
  end if;
end
$$;

grant select on public.categories, public.services, public.products to anon, authenticated;
revoke all on public.profiles, public.addresses, public.carts, public.cart_items, public.partner_profiles,
  public.bookings, public.orders, public.order_items, public.reviews, public.notifications from anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.addresses, public.carts, public.cart_items,
  public.partner_profiles, public.notifications to authenticated;
grant select on public.bookings, public.orders, public.order_items, public.reviews to authenticated;
grant insert on public.reviews to authenticated;
grant select, insert, update, delete on public.categories, public.services, public.products,
  public.bookings, public.orders, public.order_items, public.reviews to authenticated;

-- Transactional booking/order operations used by the existing frontend.
create or replace function public.create_booking(
  p_service_id uuid,
  p_address_id uuid,
  p_booking_date date,
  p_booking_time text,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_booking_id uuid;
  service_price numeric(10, 2);
begin
  if auth.uid() is null then raise exception 'Authentication is required.'; end if;
  if not exists (select 1 from public.addresses a where a.id = p_address_id and a.user_id = auth.uid()) then
    raise exception 'Choose one of your saved addresses.';
  end if;
  select s.price into service_price from public.services s where s.id = p_service_id and s.is_active;
  if service_price is null then raise exception 'This service is not available.'; end if;

  insert into public.bookings (customer_id, service_id, address_id, booking_date, booking_time, status, total_amount, notes)
  values (auth.uid(), p_service_id, p_address_id, p_booking_date, p_booking_time, 'PENDING', service_price, p_notes)
  returning id into new_booking_id;
  insert into public.notifications (user_id, title, message, type)
  values (auth.uid(), 'Booking received', 'Your service booking request has been received.', 'booking');
  return new_booking_id;
end;
$$;

create or replace function public.get_partner_bookings()
returns table (
  id uuid, service_name text, service_slug text, category_slug text,
  booking_date date, booking_time text, total_amount numeric, status text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'partner') then
    raise exception 'A partner account is required.';
  end if;
  return query
  select b.id, s.name, s.slug, c.slug, b.booking_date, b.booking_time, b.total_amount, b.status
  from public.bookings b
  join public.services s on s.id = b.service_id
  left join public.categories c on c.id = s.category_id
  where (b.status = 'PENDING' and b.partner_id is null) or b.partner_id = auth.uid()
  order by b.booking_date, b.booking_time;
end;
$$;

create or replace function public.update_partner_booking_status(p_booking_id uuid, p_status text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_status text;
  affected_rows integer;
begin
  if not exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'partner') then
    raise exception 'A partner account is required.';
  end if;
  select b.status into existing_status from public.bookings b where b.id = p_booking_id for update;
  if existing_status is null then raise exception 'This booking is no longer available.'; end if;

  if existing_status = 'PENDING' and p_status in ('ACCEPTED', 'REJECTED') then
    update public.bookings
    set status = p_status, partner_id = case when p_status = 'ACCEPTED' then auth.uid() else null end
    where id = p_booking_id and partner_id is null;
  else
    if not (
      (existing_status = 'ACCEPTED' and p_status in ('ON_THE_WAY', 'CANCELLED'))
      or (existing_status = 'ON_THE_WAY' and p_status in ('ARRIVED', 'CANCELLED'))
      or (existing_status = 'ARRIVED' and p_status in ('SERVICE_STARTED', 'CANCELLED'))
      or (existing_status = 'SERVICE_STARTED' and p_status = 'COMPLETED')
    ) then raise exception 'That booking status change is not allowed.'; end if;
    update public.bookings set status = p_status where id = p_booking_id and partner_id = auth.uid();
  end if;
  get diagnostics affected_rows = row_count;
  if affected_rows = 0 then raise exception 'This booking was accepted by another partner or is no longer available.'; end if;
  return p_booking_id;
end;
$$;

create or replace function public.create_order_from_cart(p_address_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  owned_cart_id uuid;
  new_order_id uuid;
  order_total numeric(10, 2);
  item_count integer;
  valid_item_count integer;
begin
  if auth.uid() is null then raise exception 'Authentication is required.'; end if;
  if not exists (select 1 from public.addresses a where a.id = p_address_id and a.user_id = auth.uid()) then
    raise exception 'Choose one of your saved addresses.';
  end if;
  select c.id into owned_cart_id from public.carts c where c.user_id = auth.uid() for update;
  if owned_cart_id is null then raise exception 'Your cart is empty.'; end if;
  perform 1 from public.cart_items ci where ci.cart_id = owned_cart_id for update;
  perform 1
  from public.products p join public.cart_items ci on ci.product_id = p.id
  where ci.cart_id = owned_cart_id
  for update of p;
  select count(*)::integer, count(p.id)::integer, coalesce(sum(p.price * ci.quantity), 0)
  into item_count, valid_item_count, order_total
  from public.cart_items ci
  left join public.products p on p.id = ci.product_id and p.is_active and p.stock >= ci.quantity
  where ci.cart_id = owned_cart_id;
  if item_count = 0 then raise exception 'Your cart is empty.'; end if;
  if item_count <> valid_item_count then raise exception 'One or more items are no longer available in the requested quantity.'; end if;

  insert into public.orders (customer_id, address_id, status, total_amount, payment_status)
  values (auth.uid(), p_address_id, 'PENDING', order_total, 'PENDING')
  returning id into new_order_id;
  insert into public.order_items (order_id, product_id, quantity, price)
  select new_order_id, ci.product_id, ci.quantity, p.price
  from public.cart_items ci join public.products p on p.id = ci.product_id
  where ci.cart_id = owned_cart_id;
  update public.products p set stock = p.stock - ci.quantity
  from public.cart_items ci where ci.cart_id = owned_cart_id and p.id = ci.product_id;
  delete from public.cart_items where cart_id = owned_cart_id;
  insert into public.notifications (user_id, title, message, type)
  values (auth.uid(), 'Order received', 'Your order has been received.', 'order');
  return new_order_id;
end;
$$;

revoke all on function public.create_booking(uuid, uuid, date, text, text) from public;
revoke all on function public.get_partner_bookings() from public;
revoke all on function public.update_partner_booking_status(uuid, text) from public;
revoke all on function public.create_order_from_cart(uuid) from public;
grant execute on function public.create_booking(uuid, uuid, date, text, text) to authenticated;
grant execute on function public.get_partner_bookings() to authenticated;
grant execute on function public.update_partner_booking_status(uuid, text) to authenticated;
grant execute on function public.create_order_from_cart(uuid) to authenticated;

create or replace function public.sau_notify_booking_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.notifications (user_id, title, message, type)
    values (new.customer_id, 'Booking update', 'Your booking status is now ' || replace(lower(new.status), '_', ' ') || '.', 'booking');
  end if;
  return new;
end;
$$;

create or replace function public.sau_notify_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.notifications (user_id, title, message, type)
    values (new.customer_id, 'Order update', 'Your order status is now ' || replace(lower(new.status), '_', ' ') || '.', 'order');
  end if;
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'sau_auth_user_profile' and tgrelid = 'auth.users'::regclass and not tgisinternal) then
    create trigger sau_auth_user_profile after insert on auth.users
      for each row execute function public.sau_create_profile_for_new_user();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'sau_booking_status_notification' and tgrelid = 'public.bookings'::regclass and not tgisinternal) then
    create trigger sau_booking_status_notification after update of status on public.bookings
      for each row execute function public.sau_notify_booking_status_change();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'sau_order_status_notification' and tgrelid = 'public.orders'::regclass and not tgisinternal) then
    create trigger sau_order_status_notification after update of status on public.orders
      for each row execute function public.sau_notify_order_status_change();
  end if;
end
$$;

-- Provision the avatar bucket only if absent; preserve existing bucket settings.
insert into storage.buckets (id, name, public)
values ('partner-avatars', 'partner-avatars', true)
on conflict (id) do nothing;

drop policy if exists "Public read partner avatars" on storage.objects;
drop policy if exists "Users upload own partner avatar" on storage.objects;
drop policy if exists "Users update own partner avatar" on storage.objects;
drop policy if exists "Users delete own partner avatar" on storage.objects;
drop policy if exists "sau_boundary_partner_avatar_insert" on storage.objects;
drop policy if exists "sau_boundary_partner_avatar_update" on storage.objects;
drop policy if exists "sau_boundary_partner_avatar_delete" on storage.objects;
create policy "Public read partner avatars" on storage.objects
  for select to anon, authenticated using (bucket_id = 'partner-avatars');
create policy "Users upload own partner avatar" on storage.objects
  for insert to authenticated with check (bucket_id = 'partner-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users update own partner avatar" on storage.objects
  for update to authenticated
  using (bucket_id = 'partner-avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'partner-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete own partner avatar" on storage.objects
  for delete to authenticated using (bucket_id = 'partner-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "sau_boundary_partner_avatar_insert" on storage.objects as restrictive
  for insert to authenticated with check (
    bucket_id <> 'partner-avatars' or (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "sau_boundary_partner_avatar_update" on storage.objects as restrictive
  for update to authenticated
  using (bucket_id <> 'partner-avatars' or (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id <> 'partner-avatars' or (storage.foldername(name))[1] = auth.uid()::text);
create policy "sau_boundary_partner_avatar_delete" on storage.objects as restrictive
  for delete to authenticated using (
    bucket_id <> 'partner-avatars' or (storage.foldername(name))[1] = auth.uid()::text
  );

-- Realtime is optional on installations without the standard publication.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bookings') then
      alter publication supabase_realtime add table public.bookings;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders') then
      alter publication supabase_realtime add table public.orders;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
      alter publication supabase_realtime add table public.notifications;
    end if;
  end if;
end
$$;

commit;
