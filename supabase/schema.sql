-- SAU SOLUTIONS marketplace schema for Supabase.
-- Safe to rerun: creates missing objects and refreshes named RLS policies.
-- Review and run manually in the Supabase SQL editor; this project does not execute it.
-- For the existing live project, use migrations/001_marketplace_backend.sql instead.
-- Do not apply this reference schema and the migration to the same project.

create extension if not exists pgcrypto;

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
  checkout_attempt_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders add column if not exists checkout_attempt_id uuid;
do $$
declare
  duplicate_attempt_groups bigint;
  named_index regclass;
begin
  if not exists (
    select 1 from pg_attribute
    where attrelid = 'public.orders'::regclass
      and attname = 'checkout_attempt_id'
      and atttypid = 'uuid'::regtype
      and not attisdropped
  ) then
    raise exception 'public.orders.checkout_attempt_id must be uuid.';
  end if;

  select count(*) into duplicate_attempt_groups
  from (
    select checkout_attempt_id
    from public.orders
    where checkout_attempt_id is not null
    group by checkout_attempt_id
    having count(*) > 1
  ) duplicate_attempts;
  if duplicate_attempt_groups > 0 then
    raise exception 'Duplicate non-null checkout attempt IDs exist on public.orders.';
  end if;

  named_index := to_regclass('public.orders_checkout_attempt_id_uidx');
  if named_index is not null and not exists (
    select 1
    from pg_index i
    join pg_class index_table on index_table.oid = i.indexrelid
    join pg_am access_method on access_method.oid = index_table.relam
    where i.indexrelid = named_index
      and i.indrelid = 'public.orders'::regclass
      and i.indisunique
      and i.indisvalid
      and i.indisready
      and i.indnkeyatts = 1
      and i.indnatts = 1
      and i.indpred is null
      and i.indexprs is null
      and access_method.amname = 'btree'
      and i.indclass[0] = (
        select opc.oid
        from pg_opclass opc
        where opc.opcmethod = access_method.oid
          and opc.opcintype = 'uuid'::regtype
          and opc.opcdefault
      )
      and i.indcollation[0] = 0
      and i.indoption[0] = 0
      and pg_get_indexdef(i.indexrelid, 1, true) = 'checkout_attempt_id'
  ) then
    raise exception 'Index public.orders_checkout_attempt_id_uidx has an unexpected definition.';
  end if;

  if named_index is null and not exists (
    select 1
    from pg_index i
    join pg_class index_table on index_table.oid = i.indexrelid
    join pg_am access_method on access_method.oid = index_table.relam
    where i.indrelid = 'public.orders'::regclass
      and i.indisunique
      and i.indisvalid
      and i.indisready
      and i.indnkeyatts = 1
      and i.indnatts = 1
      and i.indpred is null
      and i.indexprs is null
      and access_method.amname = 'btree'
      and i.indclass[0] = (
        select opc.oid
        from pg_opclass opc
        where opc.opcmethod = access_method.oid
          and opc.opcintype = 'uuid'::regtype
          and opc.opcdefault
      )
      and i.indcollation[0] = 0
      and i.indoption[0] = 0
      and pg_get_indexdef(i.indexrelid, 1, true) = 'checkout_attempt_id'
  ) then
    execute 'create unique index orders_checkout_attempt_id_uidx on public.orders using btree (checkout_attempt_id)';
  end if;
end
$$;

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

-- Existing installations may have been created from the earlier reference schema.
alter table public.categories add column if not exists updated_at timestamptz not null default now();
alter table public.addresses add column if not exists updated_at timestamptz not null default now();
alter table public.cart_items add column if not exists updated_at timestamptz not null default now();
alter table public.partner_profiles add column if not exists updated_at timestamptz not null default now();
alter table public.partner_profiles add column if not exists partner_type text;
alter table public.partner_profiles add column if not exists services_offered text;
alter table public.partner_profiles add column if not exists experience text;
alter table public.partner_profiles add column if not exists address text;
alter table public.partner_profiles add column if not exists postal_code text;

-- Preserve existing singular-cart data while the application moves to carts.
do $$
declare
  expected_column_count integer;
  invalid_legacy_cart boolean;
  invalid_target_carts boolean;
  duplicate_owner boolean;
  conflicting_owner boolean;
  orphan_item boolean;
  legacy_fk record;
begin
  if to_regclass('public.cart') is not null then
    select count(*) into expected_column_count
    from information_schema.columns
    where table_schema = 'public' and table_name = 'cart'
      and column_name in ('id', 'user_id', 'created_at', 'updated_at');
    if expected_column_count <> 4 then
      raise exception 'Legacy public.cart has an unexpected shape. Inspect its columns before migrating.';
    end if;

    execute 'select exists (select 1 from public.cart where id is null or user_id is null)'
      into invalid_legacy_cart;
    if invalid_legacy_cart then
      raise exception 'Legacy public.cart contains rows without an ID or owner. Resolve them explicitly before migration.';
    end if;

    execute 'select exists (select 1 from public.cart group by id having count(*) > 1)'
      into invalid_legacy_cart;
    if invalid_legacy_cart then
      raise exception 'Legacy public.cart contains duplicate IDs. Resolve them explicitly before migration.';
    end if;

    execute 'select exists (select 1 from public.cart group by user_id having count(*) > 1)'
      into duplicate_owner;
    if duplicate_owner then
      raise exception 'Legacy public.cart has multiple carts for one owner. Resolve them explicitly before migration.';
    end if;

    execute 'select exists (
      select 1 from public.carts group by user_id having user_id is null or count(*) > 1
    )' into invalid_target_carts;
    if invalid_target_carts then
      raise exception 'public.carts contains a missing or duplicated owner. Reconcile it before copying legacy carts.';
    end if;

    execute 'select exists (
      select 1 from public.carts group by id having id is null or count(*) > 1
    )' into invalid_target_carts;
    if invalid_target_carts then
      raise exception 'public.carts contains a missing or duplicated ID. Reconcile it before copying legacy carts.';
    end if;

    execute 'select exists (
      select 1 from public.cart old_cart
      join public.carts new_cart on new_cart.user_id = old_cart.user_id
      where new_cart.id <> old_cart.id
    )' into conflicting_owner;
    if conflicting_owner then
      raise exception 'A user already has a different public.carts ID than public.cart. Reconcile it before migration.';
    end if;

    execute 'select exists (
      select 1 from public.cart old_cart
      join public.carts new_cart on new_cart.id = old_cart.id
      where new_cart.user_id <> old_cart.user_id
    )' into conflicting_owner;
    if conflicting_owner then
      raise exception 'A legacy cart ID is already assigned to another user. Reconcile it before migration.';
    end if;

    execute 'insert into public.carts (id, user_id, created_at, updated_at)
      select id, user_id, coalesce(created_at, now()), coalesce(updated_at, now())
      from public.cart on conflict (user_id) do nothing';

    if to_regclass('public.cart_items') is not null then
      if exists (
        select 1 from pg_constraint con
        where con.conrelid = 'public.cart_items'::regclass
          and con.contype = 'f'
          and con.confrelid = to_regclass('public.cart')
          and (
            array_length(con.conkey, 1) <> 1
            or not exists (
              select 1 from pg_attribute child_att
              where child_att.attrelid = con.conrelid
                and child_att.attnum = con.conkey[1]
                and child_att.attname = 'cart_id'
            )
          )
      ) then
        raise exception 'public.cart_items has a legacy foreign key other than cart_id -> public.cart. Inspect it before migration.';
      end if;

      execute 'select exists (
        select 1 from public.cart_items ci
        left join public.carts c on c.id = ci.cart_id
        where c.id is null
      )' into orphan_item;
      if orphan_item then
        raise exception 'public.cart_items contains orphaned cart IDs. Reconcile them before changing its foreign key.';
      end if;

      for legacy_fk in
        select con.conname from pg_constraint con
        where con.conrelid = 'public.cart_items'::regclass
          and con.contype = 'f'
          and con.confrelid = to_regclass('public.cart')
          and array_length(con.conkey, 1) = 1
          and exists (
            select 1 from pg_attribute child_att
            where child_att.attrelid = con.conrelid
              and child_att.attnum = con.conkey[1]
              and child_att.attname = 'cart_id'
          )
      loop
        execute format('alter table public.cart_items drop constraint %I', legacy_fk.conname);
      end loop;
    end if;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint con
    join pg_attribute child_att on child_att.attrelid = con.conrelid and child_att.attnum = con.conkey[1]
    join pg_attribute parent_att on parent_att.attrelid = con.confrelid and parent_att.attnum = con.confkey[1]
    where con.contype = 'f'
      and con.conrelid = 'public.cart_items'::regclass
      and con.confrelid = 'public.carts'::regclass
      and array_length(con.conkey, 1) = 1
      and array_length(con.confkey, 1) = 1
      and child_att.attname = 'cart_id'
      and parent_att.attname = 'id'
  ) then
    alter table public.cart_items add constraint cart_items_cart_id_carts_fkey
      foreign key (cart_id) references public.carts(id) on delete cascade not valid;
  end if;
end
$$;

alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check check (status in (
  'PENDING', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'SERVICE_STARTED',
  'COMPLETED', 'REJECTED', 'CANCELLED', 'CONFIRMED', 'IN_PROGRESS'
));
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (status in (
  'PENDING', 'CONFIRMED', 'PREPARING', 'PROCESSING',
  'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
));
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check check (payment_status in ('PENDING', 'PAID', 'FAILED', 'REFUNDED'));

do $$
begin
  if exists (select 1 from public.carts where user_id is null)
     or exists (select 1 from public.carts group by user_id having count(*) > 1) then
    raise exception 'public.carts must contain exactly one non-null user_id per cart. Reconcile existing cart rows first.';
  end if;
end
$$;

create unique index if not exists idx_carts_user_id_unique on public.carts(user_id);
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
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_partner_profiles_user on public.partner_profiles(user_id);
create unique index if not exists idx_reviews_customer_service_unique on public.reviews(customer_id, service_id) where service_id is not null;
create unique index if not exists idx_reviews_customer_partner_unique on public.reviews(customer_id, partner_id) where partner_id is not null and service_id is null;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.services enable row level security;
alter table public.products enable row level security;
alter table public.addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.bookings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.partner_profiles enable row level security;

drop policy if exists "Public read active categories" on public.categories;
create policy "Public read active categories" on public.categories for select to anon, authenticated using (is_active);
drop policy if exists "Public read active services" on public.services;
create policy "Public read active services" on public.services for select to anon, authenticated using (is_active);
drop policy if exists "Public read active products" on public.products;
create policy "Public read active products" on public.products for select to anon, authenticated using (is_active);

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = user_id and role in ('customer', 'partner'));
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id and role in ('customer', 'partner'));

drop policy if exists "Users can manage own addresses" on public.addresses;
create policy "Users can manage own addresses" on public.addresses for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can manage own carts" on public.carts;
create policy "Users can manage own carts" on public.carts for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can manage own cart items" on public.cart_items;
create policy "Users can manage own cart items" on public.cart_items for all to authenticated
using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()))
with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));

drop policy if exists "Customers and assigned partners can read bookings" on public.bookings;
create policy "Customers and assigned partners can read bookings" on public.bookings for select to authenticated
using (auth.uid() = customer_id or auth.uid() = partner_id);
drop policy if exists "Customers can create own bookings" on public.bookings;
drop policy if exists "Assigned partners can update booking status" on public.bookings;

drop policy if exists "Customers can read own orders" on public.orders;
create policy "Customers can read own orders" on public.orders for select to authenticated using (auth.uid() = customer_id);
drop policy if exists "Customers can create own orders" on public.orders;
drop policy if exists "Customers can create own order items" on public.order_items;
drop policy if exists "Customers can read own order items" on public.order_items;
create policy "Customers can read own order items" on public.order_items for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()));

drop policy if exists "Users can manage own partner profile" on public.partner_profiles;
create policy "Users can manage own partner profile" on public.partner_profiles for all to authenticated
using (auth.uid() = user_id and exists (
  select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'partner'
)) with check (auth.uid() = user_id and exists (
  select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'partner'
));
drop policy if exists "Users can create own reviews" on public.reviews;
create policy "Users can create own reviews" on public.reviews for insert to authenticated with check (
  auth.uid() = customer_id and (
    (service_id is not null and exists (
      select 1 from public.bookings b
      where b.customer_id = auth.uid() and b.service_id = reviews.service_id and b.status = 'COMPLETED'
    ))
    or (partner_id is not null and exists (
      select 1 from public.bookings b
      where b.customer_id = auth.uid() and b.partner_id = reviews.partner_id and b.status = 'COMPLETED'
    ))
  )
);
drop policy if exists "Users can read own reviews" on public.reviews;
create policy "Users can read own reviews" on public.reviews for select to authenticated using (auth.uid() = customer_id);
drop policy if exists "Users can manage own notifications" on public.notifications;
create policy "Users can manage own notifications" on public.notifications for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_categories on public.categories;
create trigger set_updated_at_categories before update on public.categories
for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_services on public.services;
create trigger set_updated_at_services before update on public.services
for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_products on public.products;
create trigger set_updated_at_products before update on public.products
for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_addresses on public.addresses;
create trigger set_updated_at_addresses before update on public.addresses
for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_carts on public.carts;
create trigger set_updated_at_carts before update on public.carts
for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_cart_items on public.cart_items;
create trigger set_updated_at_cart_items before update on public.cart_items
for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_bookings on public.bookings;
create trigger set_updated_at_bookings before update on public.bookings
for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_orders on public.orders;
create trigger set_updated_at_orders before update on public.orders
for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_partner_profiles on public.partner_profiles;
create trigger set_updated_at_partner_profiles before update on public.partner_profiles
for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_role text;
begin
  profile_role := case when new.raw_user_meta_data ->> 'role' = 'partner' then 'partner' else 'customer' end;
  insert into public.profiles (id, user_id, full_name, email, role)
  values (
    new.id,
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    coalesce(new.email, ''),
    profile_role
  )
  on conflict (user_id) do update set email = excluded.email;
  return new;
end;
$$;

revoke all on function public.create_profile_for_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.create_profile_for_new_user();

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
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if not exists (
    select 1 from public.addresses a
    where a.id = p_address_id and a.user_id = auth.uid()
  ) then
    raise exception 'Choose one of your saved addresses.';
  end if;

  select s.price into service_price
  from public.services s
  where s.id = p_service_id and s.is_active = true;

  if service_price is null then
    raise exception 'This service is not available.';
  end if;

  insert into public.bookings (customer_id, service_id, address_id, booking_date, booking_time, status, total_amount, notes)
  values (auth.uid(), p_service_id, p_address_id, p_booking_date, p_booking_time, 'PENDING', service_price, p_notes)
  returning id into new_booking_id;

  insert into public.notifications (user_id, title, message, type)
  values (auth.uid(), 'Booking received', 'Your service booking request has been received.', 'booking');

  return new_booking_id;
end;
$$;

revoke all on function public.create_booking(uuid, uuid, date, text, text) from public;
grant execute on function public.create_booking(uuid, uuid, date, text, text) to authenticated;

do $$
declare
  existing_function oid := to_regprocedure('public.get_available_partner_bookings()');
  existing_result text;
begin
  if existing_function is not null then
    select regexp_replace(pg_get_function_result(existing_function), '[[:space:]]+', '', 'g')
      into existing_result;
    if existing_result <> 'TABLE(iduuid,service_nametext,service_slugtext,category_slugtext,booking_datedate,booking_timetext,total_amountnumeric,statustext)' then
      raise exception 'public.get_available_partner_bookings() has an incompatible return contract. Review dependent objects and migrate it manually before rerunning.';
    end if;
  end if;
end
$$;

create or replace function public.get_available_partner_bookings()
returns table (
  id uuid,
  service_name text,
  service_slug text,
  category_slug text,
  booking_date date,
  booking_time text,
  total_amount numeric,
  status text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.profiles p
    join public.partner_profiles pp on pp.user_id = p.user_id
    where p.user_id = auth.uid() and p.role = 'partner'
  ) then
    raise exception 'A partner account is required.';
  end if;

  return query
  select b.id, s.name, s.slug, c.slug, b.booking_date, b.booking_time, b.total_amount, b.status
  from public.bookings b
  join public.services s on s.id = b.service_id
  left join public.categories c on c.id = s.category_id
  where b.status = 'PENDING' and b.partner_id is null
  order by b.created_at;
end;
$$;

revoke all on function public.get_available_partner_bookings() from public;
grant execute on function public.get_available_partner_bookings() to authenticated;

create or replace function public.get_partner_bookings()
returns table (
  id uuid,
  service_name text,
  service_slug text,
  category_slug text,
  booking_date date,
  booking_time text,
  total_amount numeric,
  status text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.profiles p
    join public.partner_profiles pp on pp.user_id = p.user_id
    where p.user_id = auth.uid() and p.role = 'partner'
  ) then
    raise exception 'A partner account is required.';
  end if;

  return query
  select b.id, s.name, s.slug, c.slug, b.booking_date, b.booking_time, b.total_amount, b.status
  from public.bookings b
  join public.services s on s.id = b.service_id
  left join public.categories c on c.id = s.category_id
  where (b.status = 'PENDING' and b.partner_id is null)
     or b.partner_id = auth.uid()
  order by b.booking_date, b.booking_time;
end;
$$;

revoke all on function public.get_partner_bookings() from public;
grant execute on function public.get_partner_bookings() to authenticated;

create or replace function public.update_partner_booking_status(p_booking_id uuid, p_status text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_status text;
  existing_partner_id uuid;
  affected_rows integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if not exists (
    select 1
    from public.profiles p
    join public.partner_profiles pp on pp.user_id = p.user_id
    where p.user_id = auth.uid() and p.role = 'partner'
  ) then
    raise exception 'A partner account is required.';
  end if;

  if p_status is null then
    raise exception 'A booking status is required.';
  end if;

  select b.status, b.partner_id into existing_status, existing_partner_id
  from public.bookings b
  where b.id = p_booking_id
  for update;

  if existing_status is null then
    raise exception 'This booking is no longer available.';
  end if;

  if existing_status = 'PENDING' then
    if existing_partner_id is not null and existing_partner_id <> auth.uid() then
      raise exception 'This booking belongs to another partner.';
    end if;
    if p_status not in ('ACCEPTED', 'REJECTED') then
      raise exception 'That booking status change is not allowed.';
    end if;

    if p_status = 'ACCEPTED' then
      update public.bookings
      set status = 'ACCEPTED', partner_id = auth.uid()
      where id = p_booking_id and status = 'PENDING'
        and (partner_id is null or partner_id = auth.uid());
    else
      update public.bookings
      set status = 'REJECTED'
      where id = p_booking_id and status = 'PENDING'
        and (partner_id is null or partner_id = auth.uid());
    end if;
  else
    if existing_partner_id is distinct from auth.uid() then
      raise exception 'This booking belongs to another partner.';
    end if;
    if not (
      (existing_status = 'ACCEPTED' and p_status in ('ON_THE_WAY', 'CANCELLED'))
      or (existing_status = 'ON_THE_WAY' and p_status in ('ARRIVED', 'CANCELLED'))
      or (existing_status = 'ARRIVED' and p_status in ('SERVICE_STARTED', 'CANCELLED'))
      or (existing_status = 'SERVICE_STARTED' and p_status = 'COMPLETED')
    ) then
      raise exception 'That booking status change is not allowed.';
    end if;

    update public.bookings
    set status = p_status
    where id = p_booking_id and status = existing_status and partner_id = auth.uid();
  end if;

  get diagnostics affected_rows = row_count;
  if affected_rows = 0 then
    raise exception 'This booking was accepted by another partner or is no longer available.';
  end if;

  return p_booking_id;
end;
$$;

revoke all on function public.update_partner_booking_status(uuid, text) from public;
grant execute on function public.update_partner_booking_status(uuid, text) to authenticated;

create or replace function public.create_order_from_cart(p_address_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'Checkout attempt ID is required. Update the client before creating an order.';
end;
$$;

create or replace function public.create_order_from_cart(
  p_address_id uuid,
  p_checkout_attempt_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  owned_cart_id uuid;
  new_order_id uuid;
  existing_customer_id uuid;
  order_total numeric(10, 2);
  item_count integer;
  valid_item_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;
  if p_checkout_attempt_id is null then
    raise exception 'A checkout attempt ID is required.';
  end if;

  select o.id, o.customer_id
  into new_order_id, existing_customer_id
  from public.orders o
  where o.checkout_attempt_id = p_checkout_attempt_id
  for update;
  if found then
    if existing_customer_id <> auth.uid() then
      raise exception 'This checkout attempt belongs to another customer.';
    end if;
    return new_order_id;
  end if;

  if not exists (
    select 1 from public.addresses a
    where a.id = p_address_id and a.user_id = auth.uid()
  ) then
    raise exception 'Choose one of your saved addresses.';
  end if;

  select c.id into owned_cart_id
  from public.carts c
  where c.user_id = auth.uid()
  for update;

  if owned_cart_id is null then
    raise exception 'Your cart is empty.';
  end if;

  perform 1 from public.cart_items ci
  where ci.cart_id = owned_cart_id
  for update;

  perform 1
  from public.products p
  join public.cart_items ci on ci.product_id = p.id
  where ci.cart_id = owned_cart_id
  for update of p;

  select count(*)::integer, count(p.id)::integer, coalesce(sum(p.price * ci.quantity), 0)
  into item_count, valid_item_count, order_total
  from public.cart_items ci
  left join public.products p on p.id = ci.product_id and p.is_active = true and p.stock >= ci.quantity
  where ci.cart_id = owned_cart_id;

  if item_count = 0 then
    raise exception 'Your cart is empty.';
  end if;
  if item_count <> valid_item_count then
    raise exception 'One or more items are no longer available in the requested quantity.';
  end if;

  insert into public.orders (
    customer_id, address_id, status, total_amount, payment_status, checkout_attempt_id
  )
  values (auth.uid(), p_address_id, 'PENDING', order_total, 'PENDING', p_checkout_attempt_id)
  on conflict (checkout_attempt_id) do nothing
  returning id into new_order_id;

  if new_order_id is null then
    select o.id, o.customer_id
    into new_order_id, existing_customer_id
    from public.orders o
    where o.checkout_attempt_id = p_checkout_attempt_id
    for update;
    if not found then
      raise exception 'The existing checkout attempt could not be resumed. Retry with the same attempt ID.';
    end if;
    if existing_customer_id <> auth.uid() then
      raise exception 'This checkout attempt belongs to another customer.';
    end if;
    return new_order_id;
  end if;

  insert into public.order_items (order_id, product_id, quantity, price)
  select new_order_id, ci.product_id, ci.quantity, p.price
  from public.cart_items ci
  join public.products p on p.id = ci.product_id
  where ci.cart_id = owned_cart_id;

  insert into public.notifications (user_id, title, message, type)
  values (auth.uid(), 'Order received', 'Your order has been received.', 'order');

  return new_order_id;
end;
$$;

revoke all on function public.create_order_from_cart(uuid) from public;
revoke all on function public.create_order_from_cart(uuid) from anon, authenticated;
revoke all on function public.create_order_from_cart(uuid, uuid) from public, anon;
grant execute on function public.create_order_from_cart(uuid, uuid) to authenticated;

create or replace function public.notify_booking_status_change()
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

revoke all on function public.notify_booking_status_change() from public;

drop trigger if exists booking_status_notification on public.bookings;
create trigger booking_status_notification after update of status on public.bookings
for each row execute function public.notify_booking_status_change();

create or replace function public.notify_order_status_change()
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

revoke all on function public.notify_order_status_change() from public;

drop trigger if exists order_status_notification on public.orders;
create trigger order_status_notification after update of status on public.orders
for each row execute function public.notify_order_status_change();

insert into storage.buckets (id, name, public)
values ('partner-avatars', 'partner-avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public read partner avatars" on storage.objects;
create policy "Public read partner avatars" on storage.objects for select to anon, authenticated
using (bucket_id = 'partner-avatars');
drop policy if exists "Users upload own partner avatar" on storage.objects;
create policy "Users upload own partner avatar" on storage.objects for insert to authenticated
with check (bucket_id = 'partner-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users update own partner avatar" on storage.objects;
create policy "Users update own partner avatar" on storage.objects for update to authenticated
using (bucket_id = 'partner-avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'partner-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users delete own partner avatar" on storage.objects;
create policy "Users delete own partner avatar" on storage.objects for delete to authenticated
using (bucket_id = 'partner-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

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
