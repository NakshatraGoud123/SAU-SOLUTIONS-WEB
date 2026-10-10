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
    'COMPLETED', 'REJECTED', 'CANCELLED'
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
begin
  if to_regclass('public.cart') is not null then
    execute 'insert into public.carts (id, user_id, created_at, updated_at)
      select id, user_id, created_at, updated_at from public.cart
      on conflict (user_id) do nothing';
  end if;
end
$$;

alter table public.cart_items drop constraint if exists cart_items_cart_id_fkey;
alter table public.cart_items add constraint cart_items_cart_id_fkey
  foreign key (cart_id) references public.carts(id) on delete cascade;

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
set search_path = public
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
set search_path = public
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

create or replace function public.get_available_partner_bookings()
returns table (
  id uuid,
  service_name text,
  service_slug text,
  category_slug text,
  booking_date date,
  booking_time text,
  total_amount numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'partner'
  ) then
    raise exception 'A partner account is required.';
  end if;

  return query
  select b.id, s.name, s.slug, c.slug, b.booking_date, b.booking_time, b.total_amount
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
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles p
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
set search_path = public
as $$
declare
  existing_status text;
  affected_rows integer;
begin
  if not exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'partner'
  ) then
    raise exception 'A partner account is required.';
  end if;

  select b.status into existing_status
  from public.bookings b
  where b.id = p_booking_id
  for update;

  if existing_status is null then
    raise exception 'This booking is no longer available.';
  end if;

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
    ) then
      raise exception 'That booking status change is not allowed.';
    end if;

    update public.bookings
    set status = p_status
    where id = p_booking_id and partner_id = auth.uid();
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
set search_path = public
as $$
declare
  owned_cart_id uuid;
  new_order_id uuid;
  order_total numeric(10, 2);
  item_count integer;
  valid_item_count integer;
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

  insert into public.orders (customer_id, address_id, status, total_amount, payment_status)
  values (auth.uid(), p_address_id, 'PENDING', order_total, 'PENDING')
  returning id into new_order_id;

  insert into public.order_items (order_id, product_id, quantity, price)
  select new_order_id, ci.product_id, ci.quantity, p.price
  from public.cart_items ci
  join public.products p on p.id = ci.product_id
  where ci.cart_id = owned_cart_id;

  update public.products p
  set stock = p.stock - ci.quantity
  from public.cart_items ci
  where ci.cart_id = owned_cart_id and p.id = ci.product_id;

  delete from public.cart_items where cart_id = owned_cart_id;

  insert into public.notifications (user_id, title, message, type)
  values (auth.uid(), 'Order received', 'Your order has been received.', 'order');

  return new_order_id;
end;
$$;

revoke all on function public.create_order_from_cart(uuid) from public;
grant execute on function public.create_order_from_cart(uuid) to authenticated;

create or replace function public.notify_booking_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into public.notifications (user_id, title, message, type)
    values (new.customer_id, 'Booking update', 'Your booking status is now ' || replace(lower(new.status), '_', ' ') || '.', 'booking');
  end if;
  return new;
end;
$$;

drop trigger if exists booking_status_notification on public.bookings;
create trigger booking_status_notification after update of status on public.bookings
for each row execute function public.notify_booking_status_change();

create or replace function public.notify_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into public.notifications (user_id, title, message, type)
    values (new.customer_id, 'Order update', 'Your order status is now ' || replace(lower(new.status), '_', ' ') || '.', 'order');
  end if;
  return new;
end;
$$;

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
