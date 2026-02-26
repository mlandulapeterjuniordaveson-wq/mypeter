-- ═══════════════════════════════════════════════════════════════
-- KUMSIKA — COMPLETE DATABASE SCHEMA v11
-- Malawi's #1 Marketplace — O-Techy Company 2026
-- Run this in your Supabase SQL Editor
-- CHANGES FROM v10:
--   + seller_type column on profiles ('person' | 'shop')
--   + shop_status, shop_expiry, badge columns on profiles
--   + notifications table (was missing)
--   + bug_reports table (was missing)
--   + is_banned column on profiles
--   + Admin RLS policies for payment_requests and profiles
--   + Admin can approve payments, manage shops, grant badges
-- ═══════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ── UTILITY FUNCTION ─────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════════════════════════════
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  email         text unique,
  phone         text,
  district      text default 'Lilongwe',
  bio           text,
  avatar_url    text,
  is_seller     boolean default false,
  seller_type   text default 'person'  check (seller_type in ('person','shop')),
  is_admin      boolean default false,
  is_verified   boolean default false,
  is_banned     boolean default false,
  shop_status   text default 'none'    check (shop_status in ('none','unpaid','pending','active','expired','suspended')),
  shop_expiry   date,
  badge         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Migrate existing rows to have seller_type if missing
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='seller_type') then
    alter table profiles add column seller_type text default 'person' check (seller_type in ('person','shop'));
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='shop_status') then
    alter table profiles add column shop_status text default 'none';
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='shop_expiry') then
    alter table profiles add column shop_expiry date;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='badge') then
    alter table profiles add column badge text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='is_banned') then
    alter table profiles add column is_banned boolean default false;
  end if;
end $$;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles for each row execute function update_updated_at();

alter table profiles enable row level security;
drop policy if exists "Users can read all profiles"     on profiles;
drop policy if exists "Users can update own profile"    on profiles;
drop policy if exists "Users can insert own profile"    on profiles;
drop policy if exists "Admins can read all profiles"    on profiles;
drop policy if exists "Admins can update any profile"   on profiles;

create policy "Users can read all profiles"     on profiles for select using (true);
create policy "Users can insert own profile"    on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile"    on profiles for update using (auth.uid() = id);
-- Admins can update any profile (for granting badges, banning, etc.)
create policy "Admins can update any profile"   on profiles for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

-- ═══════════════════════════════════════════════════════════════
-- SHOPS
-- ═══════════════════════════════════════════════════════════════
create table if not exists shops (
  id                   uuid primary key default uuid_generate_v4(),
  owner_id             uuid references profiles(id) on delete cascade,
  name                 text not null,
  description          text,
  district             text not null,
  category             text,
  logo_url             text,
  cover_url            text,
  whatsapp_number      text,
  subscription_status  text default 'pending'
    check (subscription_status in ('pending','active','unpaid','suspended','expired')),
  subscription_plan    text check (subscription_plan in ('month','year')),
  subscription_expiry  date,
  total_views          integer default 0,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

drop trigger if exists shops_updated_at on shops;
create trigger shops_updated_at
  before update on shops for each row execute function update_updated_at();

alter table shops enable row level security;
drop policy if exists "Anyone can read shops"             on shops;
drop policy if exists "Owner can insert own shop"         on shops;
drop policy if exists "Owner can update own shop"         on shops;
drop policy if exists "Owner can delete own shop"         on shops;
drop policy if exists "Admins can manage all shops"       on shops;

create policy "Anyone can read shops"       on shops for select using (true);
create policy "Owner can insert own shop"   on shops for insert with check (auth.uid() = owner_id);
create policy "Owner can update own shop"   on shops for update using (auth.uid() = owner_id);
create policy "Owner can delete own shop"   on shops for delete using (auth.uid() = owner_id);
-- Admins can update any shop
create policy "Admins can manage all shops" on shops for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

-- ═══════════════════════════════════════════════════════════════
-- PRODUCTS
-- ═══════════════════════════════════════════════════════════════
create table if not exists products (
  id            uuid primary key default uuid_generate_v4(),
  seller_id     uuid references profiles(id) on delete cascade,
  shop_id       uuid references shops(id) on delete set null,
  name          text not null,
  description   text,
  price         numeric(12,2) not null check (price >= 0),
  category      text not null,
  district      text not null,
  image_url     text,
  extra_images  text[] default '{}',
  negotiable    boolean default false,
  delivery      boolean default false,
  is_hidden     boolean default false,
  views         integer default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists products_search_idx on products using gin (
  (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,'')))
);
create index if not exists products_district_idx on products(district);
create index if not exists products_category_idx on products(category);
create index if not exists products_seller_idx   on products(seller_id);

drop trigger if exists products_updated_at on products;
create trigger products_updated_at
  before update on products for each row execute function update_updated_at();

alter table products enable row level security;
drop policy if exists "Anyone can read visible products"  on products;
drop policy if exists "Seller can insert own products"    on products;
drop policy if exists "Seller can update own products"    on products;
drop policy if exists "Seller can delete own products"    on products;
drop policy if exists "Admins can manage all products"    on products;

create policy "Anyone can read visible products"  on products for select using (is_hidden = false or auth.uid() = seller_id);
create policy "Seller can insert own products"    on products for insert with check (auth.uid() = seller_id);
create policy "Seller can update own products"    on products for update using (auth.uid() = seller_id);
create policy "Seller can delete own products"    on products for delete using (auth.uid() = seller_id);
create policy "Admins can manage all products"    on products for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

create or replace function increment_views(product_id uuid)
returns void as $$
begin update products set views = views + 1 where id = product_id; end;
$$ language plpgsql security definer;

-- ═══════════════════════════════════════════════════════════════
-- PAYMENT REQUESTS
-- ═══════════════════════════════════════════════════════════════
create table if not exists payment_requests (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references profiles(id) on delete cascade,
  user_email     text,
  user_name      text,
  sender_number  text not null,
  txn_ref        text,
  method         text not null check (method in ('tnm','airtel')),
  plan           text not null check (plan in ('month','year')),
  amount         numeric(12,2) not null,
  proof_url      text,
  status         text default 'pending' check (status in ('pending','approved','rejected')),
  admin_note     text,
  submitted_at   timestamptz default now(),
  reviewed_at    timestamptz
);

alter table payment_requests enable row level security;
drop policy if exists "User can read own requests"   on payment_requests;
drop policy if exists "User can insert own request"  on payment_requests;
drop policy if exists "Admins can manage payments"   on payment_requests;

create policy "User can read own requests"   on payment_requests for select using (auth.uid() = user_id);
create policy "User can insert own request"  on payment_requests for insert with check (auth.uid() = user_id);
-- Admins can read AND update payment requests (approve/reject)
create policy "Admins can manage payments"   on payment_requests for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

-- ═══════════════════════════════════════════════════════════════
-- NOTIFICATIONS  (was missing from v10 schema)
-- ═══════════════════════════════════════════════════════════════
create table if not exists notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references profiles(id) on delete cascade,
  type        text default 'system',   -- 'message' | 'sale' | 'view' | 'system'
  title       text,
  body        text,
  data        jsonb default '{}',
  read        boolean default false,
  created_at  timestamptz default now()
);

create index if not exists notifications_user_idx on notifications(user_id);
create index if not exists notifications_read_idx on notifications(user_id, read);

alter table notifications enable row level security;
drop policy if exists "User can manage own notifications" on notifications;
drop policy if exists "Admins can create notifications"   on notifications;

create policy "User can manage own notifications" on notifications using (auth.uid() = user_id);
create policy "Admins can create notifications"   on notifications for insert
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

-- ═══════════════════════════════════════════════════════════════
-- BUG REPORTS  (was missing from v10 schema)
-- ═══════════════════════════════════════════════════════════════
create table if not exists bug_reports (
  id          uuid primary key default uuid_generate_v4(),
  type        text,
  description text not null,
  device      text,
  user_email  text,
  status      text default 'open',
  timestamp   timestamptz default now()
);

alter table bug_reports enable row level security;
drop policy if exists "Anyone can insert bug reports" on bug_reports;
drop policy if exists "Admins can read bug reports"   on bug_reports;

create policy "Anyone can insert bug reports" on bug_reports for insert with check (true);
create policy "Admins can read bug reports"   on bug_reports for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

-- ═══════════════════════════════════════════════════════════════
-- CONVERSATIONS & MESSAGES
-- ═══════════════════════════════════════════════════════════════
create table if not exists conversations (
  id           uuid primary key default uuid_generate_v4(),
  buyer_id     uuid references profiles(id) on delete cascade,
  seller_id    uuid references profiles(id) on delete cascade,
  shop_id      uuid references shops(id) on delete set null,
  product_id   uuid references products(id) on delete set null,
  last_message text,
  unread_count integer default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

drop trigger if exists conversations_updated_at on conversations;
create trigger conversations_updated_at
  before update on conversations for each row execute function update_updated_at();

alter table conversations enable row level security;
drop policy if exists "Participants can access conversations" on conversations;
create policy "Participants can access conversations" on conversations
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create table if not exists messages (
  id               uuid primary key default uuid_generate_v4(),
  conversation_id  uuid references conversations(id) on delete cascade,
  sender_id        uuid references profiles(id) on delete cascade,
  content          text not null,
  sent_at          timestamptz default now()
);

create index if not exists messages_conv_idx on messages(conversation_id);

alter table messages enable row level security;
drop policy if exists "Conversation participants can access messages" on messages;
create policy "Conversation participants can access messages" on messages
  using (exists (
    select 1 from conversations c where c.id = conversation_id
      and (auth.uid() = c.buyer_id or auth.uid() = c.seller_id)
  ));

-- ═══════════════════════════════════════════════════════════════
-- SAVED / SHELVES
-- ═══════════════════════════════════════════════════════════════
create table if not exists saved_products (
  user_id    uuid references profiles(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  saved_at   timestamptz default now(),
  primary key (user_id, product_id)
);
alter table saved_products enable row level security;
drop policy if exists "User can manage own saves" on saved_products;
create policy "User can manage own saves" on saved_products using (auth.uid() = user_id);

create table if not exists shelves (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references profiles(id) on delete cascade,
  name       text not null,
  created_at timestamptz default now()
);
alter table shelves enable row level security;
drop policy if exists "User can manage own shelves" on shelves;
create policy "User can manage own shelves" on shelves using (auth.uid() = user_id);

create table if not exists shelf_products (
  shelf_id   uuid references shelves(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  added_at   timestamptz default now(),
  primary key (shelf_id, product_id)
);
alter table shelf_products enable row level security;
drop policy if exists "User can manage own shelf products" on shelf_products;
create policy "User can manage own shelf products" on shelf_products
  using (auth.uid() = (select user_id from shelves where id = shelf_id));

-- ═══════════════════════════════════════════════════════════════
-- GRANT ADMIN INSTRUCTIONS
-- After running this schema, grant yourself admin:
--
--   UPDATE profiles SET is_admin = true WHERE email = 'otechy8@gmail.com';
--
-- ═══════════════════════════════════════════════════════════════
