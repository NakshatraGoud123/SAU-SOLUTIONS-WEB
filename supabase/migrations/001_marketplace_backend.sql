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
    raise exception 'public.orders.checkout_attempt_id must be uuid. Review the existing schema before migration.';
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
    raise exception 'Duplicate non-null checkout attempt IDs already exist on public.orders. Reconcile them manually before migration.';
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
    raise exception 'Index public.orders_checkout_attempt_id_uidx exists with an unexpected definition. Review it manually before migration.';
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

create temporary table sau_expected_booking_status (
  status text constraint sau_expected_booking_status_check check (status in (
    'PENDING', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'SERVICE_STARTED',
    'COMPLETED', 'REJECTED', 'CANCELLED', 'CONFIRMED', 'IN_PROGRESS'
  ))
) on commit drop;
create temporary table sau_expected_order_status (
  status text constraint sau_expected_order_status_check check (status in (
    'PENDING', 'CONFIRMED', 'PREPARING', 'PROCESSING',
    'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
  ))
) on commit drop;
create temporary table sau_expected_payment_status (
  payment_status text constraint sau_expected_payment_status_check check (
    payment_status in ('PENDING', 'PAID', 'FAILED', 'REFUNDED')
  )
) on commit drop;

do $$
declare
  relation_name text;
  column_name text;
  constraint_name text;
  expected_relation text;
  expected_constraint text;
  expected_definition text;
  actual_definition text;
  status_column_attnum smallint;
  status_column_not_null boolean;
  status_constraint_count integer;
  has_invalid_values boolean;
  relation_spec record;
begin
  for relation_spec in
    select * from (values
      ('bookings', 'status', 'bookings_status_check', 'sau_expected_booking_status', 'sau_expected_booking_status_check',
        '''PENDING'', ''ACCEPTED'', ''ON_THE_WAY'', ''ARRIVED'', ''SERVICE_STARTED'', ''COMPLETED'', ''REJECTED'', ''CANCELLED'', ''CONFIRMED'', ''IN_PROGRESS'''),
      ('orders', 'status', 'orders_status_check', 'sau_expected_order_status', 'sau_expected_order_status_check',
        '''PENDING'', ''CONFIRMED'', ''PREPARING'', ''PROCESSING'', ''OUT_FOR_DELIVERY'', ''DELIVERED'', ''CANCELLED'''),
      ('orders', 'payment_status', 'orders_payment_status_check', 'sau_expected_payment_status', 'sau_expected_payment_status_check',
        '''PENDING'', ''PAID'', ''FAILED'', ''REFUNDED''')
    ) as specs(table_name, column_name, constraint_name, expected_table, expected_check, allowed_values)
  loop
    relation_name := relation_spec.table_name;
    column_name := relation_spec.column_name;
    constraint_name := relation_spec.constraint_name;
    expected_relation := relation_spec.expected_table;
    expected_constraint := relation_spec.expected_check;

    if not exists (
      select 1 from information_schema.columns actual_column
      where actual_column.table_schema = 'public'
        and actual_column.table_name = relation_name
        and actual_column.column_name = relation_spec.column_name
    ) then
      raise exception 'Required status column public.%.% is missing.', relation_name, column_name;
    end if;

    select pg_get_constraintdef(con.oid, true) into expected_definition
    from pg_constraint con
    where con.conrelid = to_regclass(format('pg_temp.%I', expected_relation))
      and con.conname = expected_constraint
      and con.contype = 'c';
    if expected_definition is null then
      raise exception 'Could not construct expected status constraint for %.%.', relation_name, column_name;
    end if;

    execute format(
      'select exists (select 1 from public.%I where %I is null or %I not in (%s))',
      relation_name, column_name, column_name, relation_spec.allowed_values
    ) into has_invalid_values;
    if has_invalid_values then
      raise exception 'Existing public.%.% rows contain null or unsupported statuses. Reconcile them manually before migration.',
        relation_name, column_name;
    end if;

    select attnum into status_column_attnum
    from pg_attribute
    where attrelid = to_regclass(format('public.%I', relation_name))
      and attname = column_name and not attisdropped;
    select attnotnull into status_column_not_null
    from pg_attribute
    where attrelid = to_regclass(format('public.%I', relation_name))
      and attname = column_name and not attisdropped;
    if status_column_not_null is distinct from true then
      raise exception 'Required status column public.%.% is nullable. Make it NOT NULL after reconciling existing rows, then rerun.',
        relation_name, column_name;
    end if;

    select count(*) into status_constraint_count
    from pg_constraint con
    where con.conrelid = to_regclass(format('public.%I', relation_name))
      and con.contype = 'c'
      and status_column_attnum = any(con.conkey);

    if status_constraint_count > 1 then
      raise exception 'Multiple CHECK constraints reference public.%.%; inspect them manually before migration.',
        relation_name, column_name;
    elsif status_constraint_count = 1 then
      select pg_get_constraintdef(con.oid, true), con.conname
      into actual_definition, constraint_name
      from pg_constraint con
      where con.conrelid = to_regclass(format('public.%I', relation_name))
        and con.contype = 'c'
        and status_column_attnum = any(con.conkey);
      if actual_definition <> expected_definition then
        raise exception 'Existing CHECK constraint % on public.%.% does not exactly match the expected status set. Inspect manually.',
          constraint_name, relation_name, column_name;
      end if;
      if not exists (
        select 1 from pg_constraint con
        where con.conrelid = to_regclass(format('public.%I', relation_name))
          and con.conname = constraint_name and con.convalidated
      ) then
        execute format('alter table public.%I validate constraint %I', relation_name, constraint_name);
      end if;
    else
      if exists (
        select 1 from pg_constraint con
        where con.conrelid = to_regclass(format('public.%I', relation_name))
          and con.conname = relation_spec.constraint_name
      ) then
        raise exception 'Constraint name % on public.% is already used for a different purpose.',
          relation_spec.constraint_name, relation_name;
      end if;
      execute format(
        'alter table public.%I add constraint %I check (%I in (%s)) not valid',
        relation_name, relation_spec.constraint_name, column_name, relation_spec.allowed_values
      );
      execute format('alter table public.%I validate constraint %I', relation_name, relation_spec.constraint_name);
    end if;
  end loop;
end
$$;

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
    ('orders', 'id'), ('orders', 'customer_id'), ('orders', 'address_id'), ('orders', 'status'), ('orders', 'total_amount'), ('orders', 'payment_status'), ('orders', 'checkout_attempt_id'), ('orders', 'created_at'),
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

do $$
declare
  incompatible_columns text;
  nullable_cart_item_columns text;
begin
  select string_agg(
    format('%s.%s expected %s but found %s', expected.table_name, expected.column_name, expected.expected_type, actual.data_type),
    ', ' order by expected.table_name, expected.column_name
  )
  into incompatible_columns
  from (values
    ('carts', 'id', 'uuid'), ('carts', 'user_id', 'uuid'),
    ('products', 'id', 'uuid'), ('products', 'price', 'numeric'),
    ('products', 'stock', 'integer'), ('products', 'is_active', 'boolean'),
    ('cart_items', 'id', 'uuid'), ('cart_items', 'cart_id', 'uuid'),
    ('cart_items', 'product_id', 'uuid'), ('cart_items', 'quantity', 'integer'),
    ('cart_items', 'price', 'numeric')
  ) as expected(table_name, column_name, expected_type)
  join information_schema.columns actual
    on actual.table_schema = 'public'
   and actual.table_name = expected.table_name
   and actual.column_name = expected.column_name
  where actual.data_type <> expected.expected_type;

  if incompatible_columns is not null then
    raise exception 'Marketplace cart/product columns have incompatible types: %. Inspect and reconcile them before migration.',
      incompatible_columns;
  end if;

  select string_agg(table_name || '.' || column_name, ', ' order by table_name, column_name)
  into nullable_cart_item_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'cart_items'
    and column_name in ('cart_id', 'product_id', 'quantity', 'price')
    and is_nullable = 'YES';
  if nullable_cart_item_columns is not null then
    raise exception 'Required public.cart_items columns are nullable: %. Reconcile the schema before migration.',
      nullable_cart_item_columns;
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
  invalid_legacy_cart boolean;
  invalid_target_carts boolean;
  incompatible_legacy_columns boolean;
  duplicate_cart_items boolean;
  invalid_legacy_owner boolean;
  ambiguous_legacy_fk boolean;
  legacy_fk_count integer;
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

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'cart'
      and ((column_name in ('id', 'user_id') and data_type <> 'uuid')
        or (column_name in ('created_at', 'updated_at') and data_type <> 'timestamp with time zone'))
  ) into incompatible_legacy_columns;
  if incompatible_legacy_columns then
    raise exception 'Legacy public.cart has incompatible column types. Expected UUID IDs/owner and timestamptz timestamps; inspect manually.';
  end if;

  if to_regclass('public.cart_items') is null then
    raise exception 'public.cart_items is missing while legacy public.cart exists. Inspect the existing cart schema before migration.';
  end if;

  if exists (
    select 1
    from pg_constraint con
    where con.conrelid = 'public.cart_items'::regclass
      and con.contype = 'f'
      and exists (
        select 1
        from pg_attribute child_att
        where child_att.attrelid = con.conrelid
          and child_att.attname = 'cart_id'
          and child_att.attnum = any(con.conkey)
          and not child_att.attisdropped
      )
      and not (
        con.confdeltype = 'c'
        and con.confupdtype = 'a'
        and con.confmatchtype = 's'
        and not con.condeferrable
        and not con.condeferred
        and array_length(con.conkey, 1) = 1
        and array_length(con.confkey, 1) = 1
        and (
          (con.confrelid = to_regclass('public.cart')
            and exists (
              select 1 from pg_attribute parent_att
              where parent_att.attrelid = con.confrelid
                and parent_att.attnum = con.confkey[1]
                and parent_att.attname = 'id'
            ))
          or
          (con.confrelid = to_regclass('public.carts')
            and exists (
              select 1 from pg_attribute parent_att
              where parent_att.attrelid = con.confrelid
                and parent_att.attnum = con.confkey[1]
                and parent_att.attname = 'id'
            ))
        )
      )
  ) then
    raise exception 'public.cart_items has a cart_id foreign key outside the verified cart/cart_items relationship. Inspect it manually.';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cart_items'
      and column_name = 'cart_id' and data_type = 'uuid'
  ) then
    raise exception 'public.cart_items.cart_id is missing or is not UUID; inspect the existing table before migration.';
  end if;

  execute 'select exists (
    select 1 from public.cart
    where id is null or user_id is null
  )' into invalid_legacy_cart;
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
    raise exception 'Legacy public.cart has multiple rows for one user. Resolve/merge those carts explicitly before migration; no legacy rows were copied.';
  end if;

  execute 'select exists (
    select 1 from public.cart old_cart
    left join public.profiles p on p.user_id = old_cart.user_id
    where p.user_id is null
  )' into invalid_legacy_owner;
  if invalid_legacy_owner then
    raise exception 'Legacy public.cart contains an owner absent from public.profiles. Reconcile owners before migration.';
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

  execute 'select exists (
    select 1 from public.carts c
    left join public.profiles p on p.user_id = c.user_id
    where p.user_id is null
  )' into invalid_target_carts;
  if invalid_target_carts then
    raise exception 'Existing public.carts contains an owner absent from public.profiles. Reconcile owners before migration.';
  end if;

  execute 'select exists (
    select 1 from public.cart_items ci
    left join public.cart old_cart on old_cart.id = ci.cart_id
    left join public.carts new_cart on new_cart.id = ci.cart_id
    where old_cart.id is null and new_cart.id is null
  )' into orphan_item;
  if orphan_item then
    raise exception 'public.cart_items contains cart IDs absent from both public.cart and public.carts. Reconcile them before migration.';
  end if;

  execute 'select exists (
    select 1 from public.cart_items
    group by cart_id, product_id
    having count(*) > 1
  )' into duplicate_cart_items;
  if duplicate_cart_items then
    raise exception 'Duplicate public.cart_items rows exist for the same cart/product. Review and merge explicitly before migration.';
  end if;

  select count(*) into legacy_fk_count
  from pg_constraint con
  where con.conrelid = 'public.cart_items'::regclass
    and con.contype = 'f'
    and con.confrelid = to_regclass('public.cart');
  if legacy_fk_count > 1 then
    raise exception 'Multiple foreign keys from public.cart_items to public.cart make the legacy relationship ambiguous. Inspect manually.';
  end if;

  if exists (
    select 1
    from pg_constraint con
    where con.conrelid = 'public.cart_items'::regclass
      and con.contype = 'f'
      and con.confrelid = to_regclass('public.cart')
      and (
        array_length(con.conkey, 1) <> 1
        or array_length(con.confkey, 1) <> 1
        or con.confdeltype <> 'c'
        or not exists (
          select 1 from pg_attribute child_att
          where child_att.attrelid = con.conrelid
            and child_att.attnum = con.conkey[1]
            and child_att.attname = 'cart_id'
        )
        or not exists (
          select 1 from pg_attribute parent_att
          where parent_att.attrelid = con.confrelid
            and parent_att.attnum = con.confkey[1]
            and parent_att.attname = 'id'
        )
      )
  ) then
    raise exception 'public.cart_items has an FK to public.cart that is not exactly cart_id -> id ON DELETE CASCADE. Inspect manually.';
  end if;

  if exists (
    select 1
    from pg_constraint con
    join pg_attribute child_att
      on child_att.attrelid = con.conrelid and child_att.attnum = con.conkey[1]
    join pg_attribute parent_att
      on parent_att.attrelid = con.confrelid and parent_att.attnum = con.confkey[1]
    where con.conrelid = 'public.cart_items'::regclass
      and con.contype = 'f'
      and con.confrelid = 'public.carts'::regclass
      and array_length(con.conkey, 1) = 1
      and array_length(con.confkey, 1) = 1
      and child_att.attname = 'cart_id'
      and parent_att.attname = 'id'
      and (
        con.confdeltype <> 'c'
        or con.confupdtype <> 'a'
        or con.confmatchtype <> 's'
        or con.condeferrable
        or con.condeferred
      )
  ) then
    raise exception 'Existing public.cart_items.cart_id -> public.carts.id FK has a non-cascade delete action. Inspect manually.';
  end if;

  select count(*) into legacy_fk_count
  from pg_constraint con
  join pg_attribute child_att
    on child_att.attrelid = con.conrelid and child_att.attnum = con.conkey[1]
  join pg_attribute parent_att
    on parent_att.attrelid = con.confrelid and parent_att.attnum = con.confkey[1]
  where con.conrelid = 'public.cart_items'::regclass
    and con.contype = 'f'
    and con.confrelid = 'public.carts'::regclass
    and array_length(con.conkey, 1) = 1
    and array_length(con.confkey, 1) = 1
    and child_att.attname = 'cart_id'
    and parent_att.attname = 'id';
  if legacy_fk_count > 1 then
    raise exception 'Multiple verified cart_items.cart_id -> carts.id foreign keys exist. Inspect them manually.';
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
      select con.conname
      from pg_constraint con
      where con.conrelid = 'public.cart_items'::regclass
        and con.contype = 'f'
        and con.confrelid = to_regclass('public.cart')
        and array_length(con.conkey, 1) = 1
        and array_length(con.confkey, 1) = 1
        and con.confdeltype = 'c'
        and exists (
          select 1 from pg_attribute child_att
          where child_att.attrelid = con.conrelid
            and child_att.attnum = con.conkey[1]
            and child_att.attname = 'cart_id'
        )
        and exists (
          select 1 from pg_attribute parent_att
          where parent_att.attrelid = con.confrelid
            and parent_att.attnum = con.confkey[1]
            and parent_att.attname = 'id'
        )
    loop
      execute format('alter table public.cart_items drop constraint %I', legacy_fk.conname);
    end loop;
  end if;
end
$$;

-- These checks also run when no legacy public.cart table exists.
do $$
begin
  if exists (
    select 1
    from public.cart_items ci
    left join public.carts c on c.id = ci.cart_id
    where ci.cart_id is null or c.id is null
  ) then
    raise exception 'public.cart_items contains null or orphaned cart IDs. Reconcile them before changing cart foreign keys.';
  end if;
  if exists (
    select 1
    from public.cart_items ci
    left join public.products p on p.id = ci.product_id
    where ci.product_id is null or p.id is null
      or ci.quantity is null or ci.quantity <= 0
  ) then
    raise exception 'public.cart_items contains null/orphaned products or invalid quantities. Reconcile these rows before migration.';
  end if;
  if exists (
    select 1 from public.cart_items
    group by cart_id, product_id
    having count(*) > 1
  ) then
    raise exception 'Duplicate public.cart_items rows exist for one cart/product. Merge them explicitly before migration.';
  end if;
  if exists (
    select 1 from public.carts
    group by id having id is null or count(*) > 1
  ) or exists (
    select 1 from public.carts
    group by user_id having user_id is null or count(*) > 1
  ) then
    raise exception 'public.carts has null or duplicate IDs/owners. Reconcile the cart rows before migration.';
  end if;
end
$$;

-- Add missing references without rejecting pre-existing rows. New writes are
-- checked immediately; administrators can validate these constraints after
-- reviewing any legacy orphan rows.
do $$
declare
  relation record;
  expected_fk_count integer;
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
    if exists (
      select 1
      from pg_constraint con
      where con.contype = 'f'
        and con.conrelid = to_regclass(format('public.%I', relation.child_table))
        and con.conname = relation.constraint_name
        and not (
          con.confrelid = to_regclass(format('%I.%I', relation.parent_schema, relation.parent_table))
          and array_length(con.conkey, 1) = 1
          and array_length(con.confkey, 1) = 1
          and exists (
            select 1 from pg_attribute child_att
            where child_att.attrelid = con.conrelid
              and child_att.attnum = con.conkey[1]
              and child_att.attname = relation.child_column
          )
          and exists (
            select 1 from pg_attribute parent_att
            where parent_att.attrelid = con.confrelid
              and parent_att.attnum = con.confkey[1]
              and parent_att.attname = relation.parent_column
          )
        )
    ) then
      raise exception 'Constraint name % on public.% is already used for a different foreign key definition.',
        relation.constraint_name, relation.child_table;
    end if;

    if exists (
      select 1
      from pg_constraint con
      where con.contype = 'f'
        and con.conrelid = to_regclass(format('public.%I', relation.child_table))
        and exists (
          select 1 from pg_attribute child_att
          where child_att.attrelid = con.conrelid
            and child_att.attnum = any(con.conkey)
            and child_att.attname = relation.child_column
        )
        and not (
          con.confrelid = to_regclass(format('%I.%I', relation.parent_schema, relation.parent_table))
          and array_length(con.conkey, 1) = 1
          and array_length(con.confkey, 1) = 1
          and exists (
            select 1 from pg_attribute child_att
            where child_att.attrelid = con.conrelid
              and child_att.attnum = con.conkey[1]
              and child_att.attname = relation.child_column
          )
          and exists (
            select 1 from pg_attribute parent_att
            where parent_att.attrelid = con.confrelid
              and parent_att.attnum = con.confkey[1]
              and parent_att.attname = relation.parent_column
          )
        )
    ) then
      raise exception 'An unexpected foreign key uses public.%.%; inspect it before migration.',
        relation.child_table, relation.child_column;
    end if;

    if exists (
      select 1
      from pg_constraint con
      join pg_attribute child_att
        on child_att.attrelid = con.conrelid and child_att.attnum = con.conkey[1]
      join pg_attribute parent_att
        on parent_att.attrelid = con.confrelid and parent_att.attnum = con.confkey[1]
      where con.contype = 'f'
        and con.conrelid = to_regclass(format('public.%I', relation.child_table))
        and con.confrelid = to_regclass(format('%I.%I', relation.parent_schema, relation.parent_table))
        and array_length(con.conkey, 1) = 1
        and array_length(con.confkey, 1) = 1
        and child_att.attname = relation.child_column
        and parent_att.attname = relation.parent_column
        and (
          con.confdeltype <> case relation.delete_action
            when 'cascade' then 'c'
            when 'set null' then 'n'
            when 'restrict' then 'r'
            else 'a'
          end
          or con.confupdtype <> 'a'
          or con.confmatchtype <> 's'
          or con.condeferrable
          or con.condeferred
        )
    ) then
      raise exception 'Existing foreign key on public.%.% has a different delete action than expected; inspect it manually.',
        relation.child_table, relation.child_column;
    end if;

    select count(*) into expected_fk_count
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
      and parent_att.attname = relation.parent_column;
    if expected_fk_count > 1 then
      raise exception 'Multiple matching foreign keys exist on public.%.%; inspect them manually.',
        relation.child_table, relation.child_column;
    elsif expected_fk_count = 0 then
      if exists (
        select 1
        from pg_constraint con
        where con.conrelid = to_regclass(format('public.%I', relation.child_table))
          and con.conname = relation.constraint_name
      ) then
        raise exception 'Constraint name % on public.% is already used by a non-matching constraint.',
          relation.constraint_name, relation.child_table;
      end if;

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

do $$
declare
  carts_oid oid := to_regclass('public.carts');
  owner_attnum smallint;
  index_oid oid := to_regclass('public.idx_carts_user_id_unique');
  valid_index boolean;
  equivalent_unique_index boolean;
begin
  if carts_oid is null then
    raise exception 'public.carts is missing; cannot enforce one cart per owner.';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'carts'
      and column_name = 'user_id' and data_type = 'uuid'
  ) then
    raise exception 'public.carts.user_id is missing or is not UUID; reconcile the existing schema.';
  end if;

  select attnum into owner_attnum
  from pg_attribute
  where attrelid = carts_oid and attname = 'user_id' and not attisdropped;

  if exists (
    select 1 from public.carts where user_id is null
  ) or exists (
    select 1 from public.carts
    group by user_id
    having count(*) > 1
  ) then
    raise exception 'public.carts must contain exactly one non-null user_id per cart. Reconcile existing cart rows before migration.';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'carts'
      and column_name = 'user_id' and is_nullable = 'YES'
  ) then
    alter table public.carts alter column user_id set not null;
  end if;

  if index_oid is not null then
    select c.relkind = 'i'
       and i.indrelid = carts_oid
       and i.indisunique
       and i.indisvalid
       and i.indisready
       and i.indpred is null
       and i.indexprs is null
       and i.indnatts = 1
       and i.indnkeyatts = 1
       and i.indkey[0] = owner_attnum
    into valid_index
    from pg_class c
    left join pg_index i on i.indexrelid = c.oid
    where c.oid = index_oid;

    if coalesce(valid_index, false) is not true then
      raise exception 'public.idx_carts_user_id_unique exists but is not a valid, non-partial unique index on public.carts(user_id). Reconcile it manually.';
    end if;
  else
    select exists (
      select 1
      from pg_index i
      where i.indrelid = carts_oid
        and i.indisunique
        and i.indisvalid
        and i.indisready
        and i.indpred is null
        and i.indexprs is null
        and i.indnatts = 1
        and i.indnkeyatts = 1
        and i.indkey[0] = owner_attnum
    ) into equivalent_unique_index;
    if not equivalent_unique_index then
      create unique index idx_carts_user_id_unique on public.carts(user_id);
    end if;
  end if;
end
$$;

do $$
declare
  index_spec record;
  existing_index oid;
  target_table oid;
  target_column smallint;
  valid_index boolean;
begin
  for index_spec in
    select * from (values
      ('idx_categories_active', 'categories', 'is_active'),
      ('idx_services_category', 'services', 'category_id'),
      ('idx_services_active', 'services', 'is_active'),
      ('idx_products_category', 'products', 'category_id'),
      ('idx_products_active', 'products', 'is_active'),
      ('idx_addresses_user_id', 'addresses', 'user_id'),
      ('idx_bookings_customer', 'bookings', 'customer_id'),
      ('idx_bookings_partner', 'bookings', 'partner_id'),
      ('idx_orders_customer', 'orders', 'customer_id'),
      ('idx_order_items_order_id', 'order_items', 'order_id'),
      ('idx_reviews_customer', 'reviews', 'customer_id'),
      ('idx_notifications_user_id', 'notifications', 'user_id')
    ) as indexes(index_name, table_name, column_name)
  loop
    target_table := to_regclass(format('public.%I', index_spec.table_name));
    select attnum into target_column
    from pg_attribute
    where attrelid = target_table
      and attname = index_spec.column_name
      and not attisdropped;
    existing_index := to_regclass(format('public.%I', index_spec.index_name));

    if existing_index is not null then
      select c.relkind = 'i'
        and i.indrelid = target_table
        and am.amname = 'btree'
        and not i.indisunique
        and i.indisvalid
        and i.indisready
        and i.indpred is null
        and i.indexprs is null
        and i.indnatts = 1
        and i.indnkeyatts = 1
        and i.indkey[0] = target_column
      into valid_index
      from pg_class c
      left join pg_index i on i.indexrelid = c.oid
      left join pg_am am on am.oid = c.relam
      where c.oid = existing_index;

      if coalesce(valid_index, false) is not true then
        raise exception 'Index public.% exists but does not match the expected btree index on public.%(%). Inspect it manually.',
          index_spec.index_name, index_spec.table_name, index_spec.column_name;
      end if;
    else
      execute format(
        'create index %I on public.%I using btree (%I)',
        index_spec.index_name, index_spec.table_name, index_spec.column_name
      );
    end if;
  end loop;
end
$$;

do $$
declare
  cart_items_oid oid := to_regclass('public.cart_items');
  cart_id_attnum smallint;
  product_id_attnum smallint;
  named_index oid := to_regclass('public.idx_cart_items_cart_product_unique');
  valid_index boolean;
  equivalent_unique_index boolean;
begin
  if exists (
    select 1
    from public.cart_items
    group by cart_id, product_id
    having count(*) > 1
  ) then
    raise exception 'Duplicate cart_items rows exist for the same cart_id/product_id. Review and merge them explicitly, then rerun the migration.';
  end if;
  if exists (
    select 1 from public.cart_items
    where cart_id is null or product_id is null
  ) then
    raise exception 'public.cart_items cart_id/product_id must be non-null before enforcing item uniqueness.';
  end if;

  select attnum into cart_id_attnum
  from pg_attribute
  where attrelid = cart_items_oid and attname = 'cart_id' and not attisdropped;
  select attnum into product_id_attnum
  from pg_attribute
  where attrelid = cart_items_oid and attname = 'product_id' and not attisdropped;

  if named_index is not null then
    select c.relkind = 'i'
      and i.indrelid = cart_items_oid
      and i.indisunique
      and i.indisvalid
      and i.indisready
      and i.indpred is null
      and i.indexprs is null
      and i.indnatts = 2
      and i.indnkeyatts = 2
      and i.indkey[0] = cart_id_attnum
      and i.indkey[1] = product_id_attnum
    into valid_index
    from pg_class c
    left join pg_index i on i.indexrelid = c.oid
    where c.oid = named_index;

    if coalesce(valid_index, false) is not true then
      raise exception 'public.idx_cart_items_cart_product_unique exists but is not a valid unique index on (cart_id, product_id). Inspect it manually.';
    end if;
  else
    select exists (
      select 1
      from pg_index i
      where i.indrelid = cart_items_oid
        and i.indisunique
        and i.indisvalid
        and i.indisready
        and i.indpred is null
        and i.indexprs is null
        and i.indnatts = 2
        and i.indnkeyatts = 2
        and i.indkey[0] = cart_id_attnum
        and i.indkey[1] = product_id_attnum
    ) into equivalent_unique_index;
    if not equivalent_unique_index then
      create unique index idx_cart_items_cart_product_unique
        on public.cart_items(cart_id, product_id);
    end if;
  end if;
end
$$;

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

revoke all on function public.sau_current_role() from public, anon;
revoke all on function public.sau_is_admin() from public, anon;
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

revoke all on function public.sau_create_profile_for_new_user() from public, anon, authenticated;

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
drop policy if exists "Customers can create own bookings" on public.bookings;
drop policy if exists "Assigned partners can update booking status" on public.bookings;
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

do $$
declare
  remaining_policy record;
begin
  select policyname into remaining_policy
  from pg_policies
  where schemaname = 'public' and tablename = 'bookings'
  limit 1;
  if found then
    raise exception 'Unexpected policy "%" remains on public.bookings after removing recognized policies. Review all booking policies manually before migration.', remaining_policy.policyname;
  end if;
end
$$;

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
    revoke all on public.cart from public, anon;
    grant select, insert, update, delete on public.cart to authenticated;
  end if;
end
$$;

revoke all on public.categories, public.services, public.products,
  public.profiles, public.addresses, public.carts, public.cart_items, public.partner_profiles,
  public.bookings, public.orders, public.order_items, public.reviews, public.notifications
  from public, anon;
grant select on public.categories, public.services, public.products to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.addresses, public.carts, public.cart_items,
  public.partner_profiles, public.notifications to authenticated;
revoke all on public.bookings, public.orders, public.order_items from public, anon, authenticated;
grant select on public.bookings, public.orders, public.order_items, public.reviews to authenticated;
grant insert on public.reviews to authenticated;
grant select, insert, update, delete on public.categories, public.services, public.products,
  public.reviews to authenticated;

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
  where (b.status = 'PENDING' and b.partner_id is null) or b.partner_id = auth.uid()
  order by b.booking_date, b.booking_time;
end;
$$;

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
  id uuid, service_name text, service_slug text, category_slug text,
  booking_date date, booking_time text, total_amount numeric, status text
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
  if auth.uid() is null then raise exception 'Authentication is required.'; end if;
  if not exists (
    select 1
    from public.profiles p
    join public.partner_profiles pp on pp.user_id = p.user_id
    where p.user_id = auth.uid() and p.role = 'partner'
  ) then
    raise exception 'A partner account is required.';
  end if;
  if p_status is null then raise exception 'A booking status is required.'; end if;

  select b.status, b.partner_id into existing_status, existing_partner_id
  from public.bookings b where b.id = p_booking_id for update;
  if existing_status is null then raise exception 'This booking is no longer available.'; end if;

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
    ) then raise exception 'That booking status change is not allowed.'; end if;
    update public.bookings
    set status = p_status
    where id = p_booking_id and status = existing_status and partner_id = auth.uid();
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
  if auth.uid() is null then raise exception 'Authentication is required.'; end if;
  if p_checkout_attempt_id is null then raise exception 'A checkout attempt ID is required.'; end if;

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

  -- Create a pending order snapshot only. Payment is not configured in the
  -- current checkout, so inventory and cart contents remain unchanged here.
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
  from public.cart_items ci join public.products p on p.id = ci.product_id
  where ci.cart_id = owned_cart_id;
  insert into public.notifications (user_id, title, message, type)
  values (auth.uid(), 'Order received', 'Your order has been received.', 'order');
  return new_order_id;
end;
$$;

revoke all on function public.create_booking(uuid, uuid, date, text, text) from public, anon;
revoke all on function public.get_partner_bookings() from public, anon;
revoke all on function public.get_available_partner_bookings() from public, anon;
revoke all on function public.update_partner_booking_status(uuid, text) from public, anon;
revoke all on function public.create_order_from_cart(uuid) from public, anon, authenticated;
revoke all on function public.create_order_from_cart(uuid, uuid) from public, anon;
grant execute on function public.create_booking(uuid, uuid, date, text, text) to authenticated;
grant execute on function public.get_partner_bookings() to authenticated;
grant execute on function public.get_available_partner_bookings() to authenticated;
grant execute on function public.update_partner_booking_status(uuid, text) to authenticated;
grant execute on function public.create_order_from_cart(uuid, uuid) to authenticated;

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

revoke all on function public.sau_notify_booking_status_change() from public, anon, authenticated;
revoke all on function public.sau_notify_order_status_change() from public, anon, authenticated;

do $$
begin
  if to_regprocedure('public.create_profile_for_new_user()') is not null then
    revoke all on function public.create_profile_for_new_user() from public, anon, authenticated;
  end if;
  if to_regprocedure('public.notify_booking_status_change()') is not null then
    revoke all on function public.notify_booking_status_change() from public, anon, authenticated;
  end if;
  if to_regprocedure('public.notify_order_status_change()') is not null then
    revoke all on function public.notify_order_status_change() from public, anon, authenticated;
  end if;
end
$$;

do $$
declare
  function_spec record;
  unexpected_overload text;
begin
  for function_spec in
    select * from (values
      ('sau_current_role', ''),
      ('sau_is_admin', ''),
      ('sau_create_profile_for_new_user', ''),
      ('create_profile_for_new_user', ''),
      ('notify_booking_status_change', ''),
      ('notify_order_status_change', ''),
      ('create_booking', 'uuid, uuid, date, text, text'),
      ('get_partner_bookings', ''),
      ('get_available_partner_bookings', ''),
      ('update_partner_booking_status', 'uuid, text'),
      ('create_order_from_cart', 'uuid'),
      ('sau_notify_booking_status_change', ''),
      ('sau_notify_order_status_change', '')
    ) as specs(function_name, expected_arguments)
  loop
    select oidvectortypes(p.proargtypes)
      into unexpected_overload
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = function_spec.function_name
      and p.prokind in ('f', 'p')
      and (
        (
          function_spec.function_name = 'create_order_from_cart'
          and oidvectortypes(p.proargtypes) not in ('uuid', 'uuid, uuid')
        )
        or (
          function_spec.function_name <> 'create_order_from_cart'
          and oidvectortypes(p.proargtypes) <> function_spec.expected_arguments
        )
      )
    limit 1;
    if found then
      raise exception 'Unexpected overload public.%(%) exists. Inspect its grants and callers before migration.',
        function_spec.function_name, unexpected_overload;
    end if;
  end loop;
end
$$;

do $$
declare
  trigger_spec record;
  trigger_row record;
  trigger_count integer;
  expected_function oid;
  legacy_function oid;
  status_attnum smallint;
begin
  for trigger_spec in
    select * from (values
      ('auth', 'users', 'sau_auth_user_profile', 'on_auth_user_created',
        'public.sau_create_profile_for_new_user()', 'public.create_profile_for_new_user()', 5::smallint, null::text),
      ('public', 'bookings', 'sau_booking_status_notification', 'booking_status_notification',
        'public.sau_notify_booking_status_change()', 'public.notify_booking_status_change()', 17::smallint, 'status'),
      ('public', 'orders', 'sau_order_status_notification', 'order_status_notification',
        'public.sau_notify_order_status_change()', 'public.notify_order_status_change()', 17::smallint, 'status')
    ) as specs(schema_name, table_name, trigger_name, legacy_trigger_name,
      function_name, legacy_function_name, expected_tgtype, status_column)
  loop
    expected_function := to_regprocedure(trigger_spec.function_name);
    legacy_function := to_regprocedure(trigger_spec.legacy_function_name);
    if expected_function is null then
      raise exception 'Expected trigger function % is missing.', trigger_spec.function_name;
    end if;

    if trigger_spec.status_column is not null then
      select attnum into status_attnum
      from pg_attribute
      where attrelid = to_regclass(format('%I.%I', trigger_spec.schema_name, trigger_spec.table_name))
        and attname = trigger_spec.status_column and not attisdropped;
      if status_attnum is null then
        raise exception 'Expected trigger column %.%.% is missing.',
          trigger_spec.schema_name, trigger_spec.table_name, trigger_spec.status_column;
      end if;
    else
      status_attnum := null;
    end if;

    if exists (
      select 1 from pg_trigger t
      where t.tgrelid = to_regclass(format('%I.%I', trigger_spec.schema_name, trigger_spec.table_name))
        and not t.tgisinternal
        and t.tgname in (trigger_spec.trigger_name, trigger_spec.legacy_trigger_name)
        and t.tgfoid not in (expected_function, coalesce(legacy_function, expected_function))
    ) then
      raise exception 'A known trigger name on %.% points to an unexpected function. Inspect it manually.',
        trigger_spec.schema_name, trigger_spec.table_name;
    end if;

    select count(*) into trigger_count
    from pg_trigger t
    where t.tgrelid = to_regclass(format('%I.%I', trigger_spec.schema_name, trigger_spec.table_name))
      and not t.tgisinternal
      and t.tgfoid in (expected_function, coalesce(legacy_function, expected_function));
    if trigger_count > 1 then
      raise exception 'Equivalent trigger functions exist more than once on %.%. Inspect duplicate side effects manually.',
        trigger_spec.schema_name, trigger_spec.table_name;
    end if;

    select t.* into trigger_row
    from pg_trigger t
    where t.tgrelid = to_regclass(format('%I.%I', trigger_spec.schema_name, trigger_spec.table_name))
      and not t.tgisinternal
      and t.tgfoid in (expected_function, coalesce(legacy_function, expected_function))
    limit 1;

    if found then
      if trigger_row.tgtype <> trigger_spec.expected_tgtype
         or trigger_row.tgenabled <> 'O'
         or trigger_row.tgqual is not null
         or trigger_row.tgconstraint <> 0
         or octet_length(trigger_row.tgargs) <> 0
         or coalesce(array_length(trigger_row.tgattr, 1), 0)
            <> case when status_attnum is null then 0 else 1 end
         or (status_attnum is not null and not (status_attnum = any(trigger_row.tgattr))) then
        raise exception 'Existing trigger % on %.% has the wrong timing, event, enabled state, or columns. Inspect manually.',
          trigger_row.tgname, trigger_spec.schema_name, trigger_spec.table_name;
      end if;
    else
      if exists (
        select 1 from pg_trigger t
        where t.tgrelid = to_regclass(format('%I.%I', trigger_spec.schema_name, trigger_spec.table_name))
          and not t.tgisinternal
          and t.tgtype = trigger_spec.expected_tgtype
          and (
            status_attnum is null
            or coalesce(array_length(t.tgattr, 1), 0) = 0
            or status_attnum = any(t.tgattr)
          )
      ) then
        raise exception 'An unrecognized trigger has equivalent timing/events on %.%. Inspect for duplicate side effects before migration.',
          trigger_spec.schema_name, trigger_spec.table_name;
      end if;

      if trigger_spec.schema_name = 'auth' then
        execute 'create trigger sau_auth_user_profile after insert on auth.users for each row execute function public.sau_create_profile_for_new_user()';
      elsif trigger_spec.table_name = 'bookings' then
        execute 'create trigger sau_booking_status_notification after update of status on public.bookings for each row execute function public.sau_notify_booking_status_change()';
      else
        execute 'create trigger sau_order_status_notification after update of status on public.orders for each row execute function public.sau_notify_order_status_change()';
      end if;
    end if;
  end loop;
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
