-- InvoiceFlow schema
-- This app currently has no authentication layer, so this schema is single-tenant:
-- one business_profile row, shared clients/products/invoices/quotes/templates.
-- RLS is enabled with permissive policies for the anon key so the SPA can read/write
-- directly. If you later add auth, tighten these policies to scope rows per user.

create extension if not exists "pgcrypto";

-- Business profile (single row, id fixed to 1)
create table if not exists business_profile (
  id int primary key default 1,
  name text not null default '',
  business_type text not null default '',
  country text not null default '',
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  currency text not null default 'USD',
  logo_initial text not null default '',
  logo_data_url text,
  invoice_prefix text not null default 'INV',
  default_tax_rate numeric not null default 0,
  tax_label text not null default 'Tax',
  default_payment_terms text not null default 'Net 14',
  invoice_footer text not null default '',
  email_subject_template text not null default 'Invoice {{invoice_number}} from {{business_name}}',
  email_body_template text not null default '',
  onboarded boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into business_profile (id) values (1) on conflict (id) do nothing;

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  company text not null default '',
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  description text not null default '',
  price numeric not null default 0,
  tax_rate numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null,
  client_id uuid references clients(id) on delete set null,
  issue_date timestamptz not null default now(),
  due_date timestamptz not null default now(),
  items jsonb not null default '[]',
  discount numeric not null default 0,
  notes text not null default '',
  payment_terms text not null default '',
  status text not null default 'draft' check (status in ('draft','sent','paid','overdue')),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  paid_at timestamptz
);

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  number text not null,
  client_id uuid references clients(id) on delete set null,
  issue_date timestamptz not null default now(),
  expiry_date timestamptz not null default now(),
  items jsonb not null default '[]',
  discount numeric not null default 0,
  notes text not null default '',
  payment_terms text not null default '',
  status text not null default 'draft' check (status in ('draft','sent','accepted','declined','converted')),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  converted_invoice_id uuid references invoices(id) on delete set null
);

-- Document Templates (Settings -> Document Templates). One row per document type.
create table if not exists document_templates (
  type text primary key check (type in ('invoice', 'quote')),
  html text not null,
  updated_at timestamptz not null default now()
);

alter table business_profile enable row level security;
alter table clients enable row level security;
alter table products enable row level security;
alter table invoices enable row level security;
alter table quotes enable row level security;
alter table document_templates enable row level security;

create policy "public read/write business_profile" on business_profile for all using (true) with check (true);
create policy "public read/write clients" on clients for all using (true) with check (true);
create policy "public read/write products" on products for all using (true) with check (true);
create policy "public read/write invoices" on invoices for all using (true) with check (true);
create policy "public read/write quotes" on quotes for all using (true) with check (true);
create policy "public read/write document_templates" on document_templates for all using (true) with check (true);
