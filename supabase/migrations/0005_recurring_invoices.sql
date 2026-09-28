-- Adds recurring invoices: a saved invoice "template" (client, items,
-- discount, notes, payment terms) plus a schedule. The
-- send-recurring-invoices Edge Function creates a real invoice from each
-- schedule whose next_run_at has passed, emails it to the client, and moves
-- next_run_at forward to the following occurrence.

create table if not exists recurring_invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  items jsonb not null default '[]',
  discount numeric not null default 0,
  notes text not null default '',
  payment_terms text not null default 'Net 14',

  -- Schedule, expressed in the freelancer's wall-clock time: the first send
  -- is on start_date at send_time (in `timezone`), then every
  -- `interval_count` units. Monthly/yearly schedules keep the start day of
  -- the month, clamped to the last day in shorter months (31st -> 30th/28th).
  frequency text not null default 'month' check (frequency in ('day', 'week', 'month', 'year')),
  interval_count int not null default 1 check (interval_count between 1 and 365),
  start_date date not null,
  send_time time not null default '09:00',
  timezone text not null default 'UTC',
  end_date date,

  -- Next send moment in UTC (null once the schedule has ended). This is the
  -- only column the Edge Function filters on.
  next_run_at timestamptz,
  active boolean not null default true,
  last_run_at timestamptz,
  last_invoice_id uuid references invoices(id) on delete set null,
  last_error text,
  run_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists recurring_invoices_user_id_idx on recurring_invoices(user_id);
create index if not exists recurring_invoices_due_idx on recurring_invoices(next_run_at) where active;

alter table recurring_invoices enable row level security;
drop policy if exists "owner access recurring_invoices" on recurring_invoices;
create policy "owner access recurring_invoices" on recurring_invoices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Invoices created by a schedule link back to it.
alter table invoices add column if not exists recurring_id uuid references recurring_invoices(id) on delete set null;
create index if not exists invoices_recurring_id_idx on invoices(recurring_id);

-- =============================================================================
-- REQUIRED: run the Edge Function on a schedule, or nothing gets sent.
--
-- Deploy it first:  supabase functions deploy send-recurring-invoices
--
-- Then, in the Supabase dashboard: Database -> Cron -> create a job targeting
-- the "Supabase Edge Function" send-recurring-invoices, every 5 minutes
-- (invoices go out within 5 minutes of the chosen time).
--
-- Equivalent via SQL (requires pg_cron and pg_net, under Database ->
-- Extensions):
--
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
--
-- select cron.schedule(
--   'recurring-invoices-every-5-min',
--   '*/5 * * * *',
--   $$
--   select net.http_post(
--     url := 'https://<your-project-ref>.supabase.co/functions/v1/send-recurring-invoices',
--     headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer <your-anon-key>'),
--     body := '{}'::jsonb
--   );
--   $$
-- );
-- =============================================================================
