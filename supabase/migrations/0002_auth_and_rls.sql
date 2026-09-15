-- Adds real per-user ownership and Row Level Security on top of 0001_init.sql.
-- Every business's data (business_profile, clients, products, invoices,
-- quotes, document_templates) now belongs to exactly one auth.users row via
-- a user_id column, and RLS enforces that a user can only ever read or write
-- their own rows — enforced at the database level, not just in the app.

-- 1. clients / products / invoices / quotes: add ownership column
alter table clients add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table products add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table invoices add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table quotes add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists clients_user_id_idx on clients(user_id);
create index if not exists products_user_id_idx on products(user_id);
create index if not exists invoices_user_id_idx on invoices(user_id);
create index if not exists quotes_user_id_idx on quotes(user_id);

-- 2. business_profile: move from a single fixed row (id = 1) to one row per user
alter table business_profile drop constraint if exists single_row;
alter table business_profile add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table business_profile drop constraint if exists business_profile_pkey;
alter table business_profile drop column if exists id;
alter table business_profile drop constraint if exists business_profile_user_unique;
alter table business_profile add constraint business_profile_user_unique unique (user_id);

-- 3. document_templates: was a single global row per type — now one pair (invoice/quote) per user.
-- Uses a plain unique constraint (not a primary key) so existing rows can keep
-- a NULL user_id for now — a primary key column can never be NULL, but a
-- unique constraint allows it, since Postgres treats each NULL as distinct.
alter table document_templates drop constraint if exists document_templates_pkey;
alter table document_templates add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table document_templates drop constraint if exists document_templates_user_type_unique;
alter table document_templates add constraint document_templates_user_type_unique unique (user_id, type);

-- 4. Replace the old permissive "anyone can read/write everything" policies
-- with ones scoped to the authenticated owner.
drop policy if exists "public read/write business_profile" on business_profile;
drop policy if exists "public read/write clients" on clients;
drop policy if exists "public read/write products" on products;
drop policy if exists "public read/write invoices" on invoices;
drop policy if exists "public read/write quotes" on quotes;
drop policy if exists "public read/write document_templates" on document_templates;

create policy "owner access business_profile" on business_profile
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owner access clients" on clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owner access products" on products
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owner access invoices" on invoices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owner access quotes" on quotes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owner access document_templates" on document_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- NOTE: any pre-existing rows (created before accounts existed) will have a
-- NULL user_id and become invisible under the new RLS policies — auth.uid()
-- never equals NULL. To reclaim that legacy data for your own account after
-- signing up, run (with your real user id from Authentication -> Users):
--
--   update business_profile set user_id = '<your-auth-user-id>' where user_id is null;
--   update clients set user_id = '<your-auth-user-id>' where user_id is null;
--   update products set user_id = '<your-auth-user-id>' where user_id is null;
--   update invoices set user_id = '<your-auth-user-id>' where user_id is null;
--   update quotes set user_id = '<your-auth-user-id>' where user_id is null;
--   update document_templates set user_id = '<your-auth-user-id>' where user_id is null;
