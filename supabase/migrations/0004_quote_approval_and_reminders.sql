-- Adds: online quote approval/rejection tracking, a quote<->invoice link,
-- per-user invoice reminder settings, and a reminder send log (used both to
-- avoid duplicate sends and to show "recent reminders" on the dashboard).

-- 1. Quotes: record when the client responded (approve or reject).
alter table quotes add column if not exists responded_at timestamptz;

-- 2. Invoices: link back to the quote it was converted from (quotes already
-- link forward via converted_invoice_id; this makes it a two-way link).
alter table invoices add column if not exists quote_id uuid references quotes(id) on delete set null;
create index if not exists invoices_quote_id_idx on invoices(quote_id);

-- 3. Business timezone, used to evaluate reminder due-dates in the
-- freelancer's local day rather than server/UTC day.
alter table business_profile add column if not exists timezone text not null default 'UTC';

-- 4. Per-user reminder settings (one row per user; sensible defaults apply
-- for any user who hasn't saved settings yet).
create table if not exists invoice_reminder_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  days_before int[] not null default '{3}',
  on_due_date boolean not null default true,
  days_after int[] not null default '{3,7}',
  message text not null default '',
  updated_at timestamptz not null default now()
);

alter table invoice_reminder_settings enable row level security;
drop policy if exists "owner access invoice_reminder_settings" on invoice_reminder_settings;
create policy "owner access invoice_reminder_settings" on invoice_reminder_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5. Reminder send log. The unique constraint on (invoice_id, reminder_key)
-- is what makes "never send the same reminder twice" enforceable even under
-- concurrent/duplicate cron runs: the insert simply fails/no-ops for a repeat.
create table if not exists invoice_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references invoices(id) on delete cascade,
  reminder_key text not null,
  sent_at timestamptz not null default now(),
  unique (invoice_id, reminder_key)
);

create index if not exists invoice_reminders_user_id_idx on invoice_reminders(user_id);
create index if not exists invoice_reminders_invoice_id_idx on invoice_reminders(invoice_id);

alter table invoice_reminders enable row level security;
drop policy if exists "owner read invoice_reminders" on invoice_reminders;
create policy "owner read invoice_reminders" on invoice_reminders
  for select using (auth.uid() = user_id);
-- No insert/update/delete policy for regular users: only the reminders Edge
-- Function (using the service role key, which bypasses RLS) writes here.

-- =============================================================================
-- OPTIONAL: schedule the reminders Edge Function to run automatically.
--
-- Easiest path (no SQL needed): in the Supabase dashboard, go to
-- Database -> Cron, create a new job, choose "Supabase Edge Function" as the
-- target, pick send-invoice-reminders, and run it hourly (or daily).
--
-- Equivalent via SQL (requires the pg_cron and pg_net extensions, enabled
-- under Database -> Extensions): uncomment and fill in your project URL and
-- anon key (Project Settings -> API — the anon key is safe to use here, it's
-- the same key already shipped in the frontend).
--
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
--
-- select cron.schedule(
--   'invoice-reminders-hourly',
--   '0 * * * *',
--   $$
--   select net.http_post(
--     url := 'https://<your-project-ref>.supabase.co/functions/v1/send-invoice-reminders',
--     headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer <your-anon-key>'),
--     body := '{}'::jsonb
--   );
--   $$
-- );
-- =============================================================================
