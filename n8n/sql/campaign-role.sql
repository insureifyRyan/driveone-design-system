-- The database role the n8n workflows connect as.
--
-- Why this exists: the only credential anyone had for this project was the
-- postgres superuser-equivalent account, which owns every table and can drop
-- any of them. Putting that in n8n means every workflow in that instance,
-- including ones nobody has written yet, holds god mode over production. This
-- role can read three tables, write campaign rows, and do nothing else.
--
-- No password is set here on purpose. Set it yourself afterwards with the
-- statement at the bottom, so the secret never passes through a chat window,
-- a transcript, or this file.
--
-- To undo all of it: drop owned by vsc_campaign; drop role vsc_campaign;

-- 1. The role itself. noinherit so it never silently picks up privileges from
--    a future group membership; the rest is belt and braces, since none of
--    these are granted by default anyway.
create role vsc_campaign with login noinherit
  nosuperuser nocreatedb nocreaterole noreplication;

grant usage on schema public to vsc_campaign;

-- 2. Reads. The service drive source tables, which intake joins to find
--    eligible customers. Select only: nothing in this campaign writes back to
--    the system of record.
grant select on public.quotes            to vsc_campaign;
grant select on public.customers         to vsc_campaign;
grant select on public.customer_vehicles to vsc_campaign;

-- 3. Campaign state. Note what is absent: no delete on anything, and no update
--    on the log or the suppression list. A send that happened cannot be
--    unhappened, and a do-not-contact cannot be quietly lifted by a workflow.
grant select, insert, update on public.vsc_enrollment     to vsc_campaign;
grant select, insert         on public.vsc_send_log       to vsc_campaign;
grant select, insert         on public.vsc_suppression    to vsc_campaign;
grant select                 on public.vsc_email_template to vsc_campaign;

-- vsc_send_log.id is a serial rather than a uuid, so the insert needs the
-- sequence too. The other three campaign tables default their keys.
grant usage, select on sequence public.vsc_send_log_id_seq to vsc_campaign;

-- 4. Row level security.
--
-- RLS is enabled on all seven tables. The four campaign tables carry no
-- policies at all, which denies everything to any role that does not own them,
-- so the grants above would produce a role that connects fine and then reads
-- nothing. The postgres account only works today because it owns the tables.
--
-- Every policy is scoped `to vsc_campaign`, so the existing policies on
-- quotes, customers and customer_vehicles are untouched and nothing changes
-- for the application roles already reading them.
--
-- Postgres 15 cannot grant BYPASSRLS from a non-superuser, which is why this
-- is done with policies rather than a role attribute. That is the better
-- shape anyway: a bypass flag would apply to every table in the database,
-- including ones this role has no business reading.

create policy vsc_campaign_read on public.quotes
  for select to vsc_campaign using (true);
create policy vsc_campaign_read on public.customers
  for select to vsc_campaign using (true);
create policy vsc_campaign_read on public.customer_vehicles
  for select to vsc_campaign using (true);

create policy vsc_campaign_read on public.vsc_email_template
  for select to vsc_campaign using (true);

create policy vsc_campaign_read on public.vsc_enrollment
  for select to vsc_campaign using (true);
create policy vsc_campaign_insert on public.vsc_enrollment
  for insert to vsc_campaign with check (true);
create policy vsc_campaign_update on public.vsc_enrollment
  for update to vsc_campaign using (true) with check (true);

create policy vsc_campaign_read on public.vsc_send_log
  for select to vsc_campaign using (true);
create policy vsc_campaign_insert on public.vsc_send_log
  for insert to vsc_campaign with check (true);

create policy vsc_campaign_read on public.vsc_suppression
  for select to vsc_campaign using (true);
create policy vsc_campaign_insert on public.vsc_suppression
  for insert to vsc_campaign with check (true);

-- 5. Set the password yourself, in the Supabase SQL editor, and paste the same
--    value into the n8n Postgres credential.
--
--    Use letters and digits only, 32 or more characters. That is not
--    superstition: a password containing @ : / ? # or % has to be percent
--    encoded inside a connection string, and someone eventually pastes the
--    encoded form into a plain password field and loses an hour to it.
--
-- alter role vsc_campaign with password 'replace-with-a-long-random-string';
