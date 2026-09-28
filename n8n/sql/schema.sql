-- DriveOne dealer VSC campaign: durable enrollment state.
-- Postgres flavored. Swap to Supabase, MySQL or Airtable by changing only the
-- Postgres nodes in the n8n workflows; nothing else in the system reads this directly.

create table if not exists vsc_enrollment (
  id                uuid primary key default gen_random_uuid(),

  -- who this belongs to
  dealer_id         text not null,
  campaign_id       text not null,

  -- identity. customer_key is sha256(dealer_id || ':' || lower(trim(email)))
  customer_key      text not null,
  email             text not null,
  first_name        text,

  -- repair order context, the whole reason this campaign converts
  vin               text,
  ro_number         text,
  ro_closed_date    date,
  vehicle_year      text,
  vehicle_make      text,
  vehicle_model     text,
  vehicle_mileage   integer,
  last_ro_services  text,
  advisor_name      text,
  garaging_state    text,

  -- state machine. current_step is the last step SENT, 0 means nothing sent yet.
  status            text not null default 'active',   -- active | completed | exited
  exit_reason       text,                             -- purchased | unsubscribed | bounced | complained | vehicle_sold | has_vsc | manual
  current_step      integer not null default 0,
  next_send_at      timestamptz not null,
  last_sent_at      timestamptz,

  quote_url         text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- idempotency: one enrollment per customer per campaign per dealer.
  -- Re-running intake on the same RO feed is a no-op.
  constraint vsc_enrollment_unique unique (dealer_id, campaign_id, customer_key)
);

-- The scheduler's only hot query.
create index if not exists vsc_enrollment_due_idx
  on vsc_enrollment (status, next_send_at)
  where status = 'active';

create index if not exists vsc_enrollment_email_idx on vsc_enrollment (dealer_id, customer_key);

-- Global do-not-contact. Checked at intake AND immediately before every send.
create table if not exists vsc_suppression (
  dealer_id   text not null,
  customer_key text not null,
  reason      text not null,
  created_at  timestamptz not null default now(),
  primary key (dealer_id, customer_key)
);

-- Append only send log. Never updated, so it survives any schema change above.
create table if not exists vsc_send_log (
  id                  bigserial primary key,
  enrollment_id       uuid not null,
  dealer_id           text not null,
  campaign_id         text not null,
  step                integer not null,
  subject             text,
  variant             text,                -- 'a' or 'b' for the subject line split
  provider            text default 'resend',
  provider_message_id text,
  sent_at             timestamptz not null default now(),
  constraint vsc_send_log_once unique (enrollment_id, step)
);

-- ---------------------------------------------------------------------------
-- These tables live in the SAME Supabase project as quotes, customers and
-- customer_vehicles (bbvkqwcapqsytrdrubci), which is what lets intake be a
-- single insert-select rather than a DMS feed plus a normalizer.
--
-- RLS is enabled to match every other table in this project. No policies are
-- defined, so only the service role reaches these tables. n8n connects as the
-- service role, and RLS-enabled-with-no-policy denies everyone else by default.
-- ---------------------------------------------------------------------------
alter table vsc_enrollment  enable row level security;
alter table vsc_suppression enable row level security;
alter table vsc_send_log    enable row level security;
