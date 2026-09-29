---
name: driveone-service-drive-vsc-follow-up
description: Operations manual for the DriveOne Service Drive VSC follow up campaign, the co-branded email drip sent on a dealership's behalf to its own service drive customers after a visit. Use this whenever the user mentions the service drive follow up, the dealer VSC campaign, the post-service or post-RO emails, the Bob Johnson campaign, enrolling service customers, the vsc_enrollment tables, the rating or quote API at getelevatewarranty.com, auto-quoting a monthly payment into an email, adding a new dealership or rooftop to the campaign, the No Warranty Bucket or any other audience bucket for this campaign, or the driveone-design-system repo. Also use it when asked to change campaign copy, the checkout card, the send cadence, eligibility rules, or the co-branded email design, even if the campaign is not named. This is the DEALER channel, sent as the dealership; for DTC use driveone-direct-retargeting, for pre-sale abandoned quotes use driveone-workflow, and for customers who already bought use driveone-sold-nurture.
---

# DriveOne Service Drive VSC follow up

A co-branded follow up sent **as the dealership**, to its own service drive customers after
their visit, offering the
DriveOne VSC they do not yet have. Ten emails over 60 days, each carrying that customer's
real vehicle, real visit, and a real monthly price with a Buy now button.

**Audience today: the No Warranty Bucket** — customers with no coverage on file,
`customers.has_existing_warranty = false`. More buckets follow once this one has run. See
Buckets.

**Scope.** Dealer channel only. Not DriveOne Direct (DTC), not the abandoned-quote engine,
not sold-customer nurture. The dealership is the sender; DriveOne is the provider.

## Where everything lives

| Thing | Value |
|---|---|
| Repo | `insureifyRyan/driveone-design-system` |
| Vercel | project `driveone-design-system`, team Kovara `team_8nigxm82ciiHRSt2s2gtbBu1` |
| Supabase | project `bbvkqwcapqsytrdrubci` (service drive capture **and** campaign state) |
| First dealer | Bob Johnson Dodge Jeep Ram, Watertown NY |
| Partner id | `b8440db1-62ea-41ad-a676-684a75a3f550` (Supabase `partners.id`) |
| Partner slug | `bob-johnson-auto` |
| MetricBridge | same dealer, `elevate_service_drive`, `dealers.source_id` equals the partner id |
| n8n | `ryan-3522-williams.app.n8n.cloud`, personal project `zQfBVzsoRHjkhFD7` |

`partners.id` in Supabase **is** `dealers.source_id` in MetricBridge. That is the join key
between the two systems.

The six workflows are live in n8n, created from the generated JSON via
`scripts/to-n8n-sdk.mjs`:

| Workflow | ID | Nodes | State |
|---|---|---|---|
| 01 Intake | `hLKeSkYbQfQgJIsO` | 4 | **active**, 148 enrolled |
| 02 Scheduler | `8ajOLclNiDmo4jyR` | 12 | inactive, the one that sends |
| 03 Events | `0qJrCUa2YYHrls0d` | 8 | inactive |
| 04 Error Handler | `7e7gFQtQMHZJduxL` | 3 | **active** |
| 05 Pricing | `1eAnSbVAYI6Ez8CU` | 7 | **active**, 148 priced, 0 errors |
| 06 Bounce Watcher | `HQeTdMk8tyg7qfLl` | 3 | inactive |

01 and 05 are safe to run alone: they enrol and price, and nothing in either touches a
mailbox. 02 is the one that sends, so it stays off until a test send has been read by a
human. 04 has to be published before any workflow will accept it as their Error Workflow.

Credentials attached: Postgres `lb0H0xZWFnSnRsBz`, SMTP `qpZ7RhGkOTZjchlL`, IMAP
`vCdTYNMkKDnlSPPB`, Header Auth `IoJuINMIbHzD6FJM` (shared with unrelated workflows, so
the campaign should get its own secret before a second dealership).

**Two credentials, two different ports, and they are easy to confuse.** Most of the
setup conversation is about the Postgres credential, so when talk turns to SMTP it is
very easy to edit the one you already had open. Putting 587 into the Postgres
credential broke intake, pricing and events at once, and the giveaway was a database
node reporting `connect ETIMEDOUT <aws ip>:587`: a Postgres node has no business on a
mail port. Say which credential you mean, every time.

| Credential | Port | SSL |
|---|---|---|
| Postgres account `lb0H0xZWFnSnRsBz` | `5432` | `Require`, Ignore SSL Issues **on** |
| SMTP account `qpZ7RhGkOTZjchlL` | `587` | SSL/TLS **off**, so STARTTLS is used |

**The Postgres credential must use the Supabase session pooler, not the direct host.**
n8n Cloud reaches the internet over IPv4 and `db.<ref>.supabase.co` resolves to IPv6 only
without the IPv4 add-on. Copy the values out of the Supabase dashboard under Connect,
Session pooler:

| Field | Value |
|---|---|
| Host | `aws-1-us-east-2.pooler.supabase.com` |
| Database | `postgres` |
| User | `postgres.bbvkqwcapqsytrdrubci`, the project ref is part of the username |
| Port | `5432`, session mode |
| SSL | `Require` |
| Ignore SSL Issues | **on**, and this is not optional |

Session mode (5432) rather than transaction mode (6543): the claim statements in 02 and 05
hold row locks with `for update skip locked`, and the node sends parameterised queries.
Transaction pooling is the wrong shape for both.

**Ignore SSL Issues has to be on** or the credential fails with `self-signed certificate in
certificate chain`. Node validates the pooler's certificate against its own bundled CA
list, Supabase's does not chain to one, and the Postgres credential has nowhere to put
Supabase's CA. The connection stays TLS encrypted; what is given up is verifying the far
end, which is a theoretical man in the middle between n8n Cloud and AWS us-east-2. If n8n
ever adds a CA field, put the Supabase root in it and turn this back off.

Getting this credential right took five attempts, each failing differently. The messages
form a ladder, and where you are on it tells you what is already proven:

| Message | What it means | Fix |
|---|---|---|
| `Connection refused`, description `127.0.0.1:5432` | Host is blank, so the node dialled itself | Set Host |
| `Host not found` | DNS failed, usually a stray space in Host | Repaste the host |
| `self-signed certificate in certificate chain` | TCP and TLS both fine, trust failing | Ignore SSL Issues on |
| `database "..." does not exist` | the hostname got pasted into Database too | Database is `postgres` |
| `password authentication failed for user "postgres"` | everything above is working | the password is wrong |

Read it as a ladder rather than five unrelated faults: each message only appears once the
stage before it succeeded, so a later error is progress. The last one names the role as
`postgres` rather than `postgres.<ref>` because Supavisor maps the pooler username onto the
underlying role before authenticating. That is not the suffix going missing; a missing
suffix gives `Tenant or user not found`, and never reaches a password check at all.

Config lives in n8n **Variables**, not environment variables, and every workflow reads
`$vars`:

| Key | Holds |
|---|---|
| `SEND_FROM` | `Name <addr>` form, 67 chars for Bob Johnson |
| `SEND_REPLY_TO` | the monitored mailbox |
| `UNSUBSCRIBE_URL_BASE` | the Supabase Edge Function |
| `PREFERENCES_URL_BASE` | same function today, separate key so it can split later |
| `CAMPAIGN_EVENT_URL` | the 03 webhook, where 06 posts bounces |
| `RATING_API_KEY` | 44-char base64, sent as `x-captured-api-key` |
| `SLACK_ALERT_WEBHOOK` | 04's destination |

## Build and check

```bash
npm run build       # emails + n8n workflows, both generated from the copy deck
npm run check       # pre-send guard, exits non-zero on a real problem
npm run n8n:sdk n8n/workflows/02-scheduler.json   # JSON -> n8n Workflow SDK code
node scripts/publish-templates.mjs bob-johnson 1 2  # emit template SQL, in slices
```

`npm run check` is not decoration. It fails on unknown merge tags, a missing unsubscribe
link, a template over Gmail's clip threshold, a missing price, and on register violations.
Run it before every push.

## Architecture, and why it is shaped this way

Six n8n workflows, all generated from `email/copy/campaign.json` so the cadence in the
automation can never drift from the cadence in the creative.

```
01-intake     hourly  ->  one atomic insert-select enrolls eligible service customers
05-pricing    hourly  ->  calls the quote API, writes the price and the checkout link
02-scheduler  hourly  ->  gate, claim what is due, render, send, advance state
03-events     webhook ->  purchase / unsubscribe / bounce  ->  exit and suppress
04-error      any failure anywhere  ->  Slack alert
06-bounce     IMAP    ->  reads bounces back out of the sending mailbox
```

**State lives in Postgres, not in n8n.** A 60 day drip built on Wait nodes dies on every
restart, upgrade or redeploy, silently losing everyone mid-flight, and you cannot query who
is on step 6 or change cadence for people already enrolled. The enrollment row is the truth
and n8n is disposable.

That choice buys: restart safety; no double sends (atomic claim with `for update skip
locked` plus a unique send-log constraint); late sends that do not compress the cadence
(next send is computed from enrollment date, not "now"); immediate exits (suppression is
re-checked inside the claim, not only at intake); and free quiet hours (outside the window
the prepare step emits nothing, the lease expires, the row is retried).

Details of every table and query: `references/data-contracts.md`.

## The rules that matter most

### Never compute a price locally

The local `vsc_rate_*` tables reproduce their own export exactly, and still do **not**
reproduce live quotes. Chevrolet's card rates top out at 2234 while a real Chevrolet quote
priced at 2442; deltas across samples were 343 and 210, so it is neither a flat fee nor a
fixed markup. Rating is keyed on **VIN**, so the API decodes engine, drivetrain and class
that the card never had.

A locally computed "best price" came out **10 to 20 percent under** what was actually
charged. Emailing someone $61 when checkout says $77 is a bait and a price claim. Always
ask the API.

### Never build a customer link locally

The quote API returns `guided_purchase_link`, `short_link` and `quote_link`. Buy now points
at `guided_purchase_link`, the actual buy flow. There is no `SHORT_LINK_BASE_URL` and intake
writes `quote_url` as null. A hand-built URL can disagree with what checkout serves, and a
Buy now that 404s is worse than no email.

### Nothing sends without a price and a destination

Enforced in four places, deliberately redundant because a wrong price in an inbox cannot be
recalled: a check constraint on `vsc_enrollment`; the pricing mapper records a reason rather
than inventing a number; the scheduler skips rows missing either; `npm run check` fails any
template that does not display the price.

An unpriced row is invisible, retried, and abandoned after 5 attempts so a permanently
unratable vehicle does not call the API forever.

### Let the API decide eligibility it owns

Do not impose a local mileage ceiling. Rating decides what it can price. An early 99,999
ceiling, copied from the local bracket table, was holding back 163 of 432 people for no
reason: the API uses a finer bracket scheme entirely (`15001-50000`).

## Buckets

The audience is cut into buckets, launched one at a time. Each bucket is a distinct
population with its own reason to hear from the dealer, so each gets its own eligibility
predicate and eventually its own copy. Do not blur two buckets into one send.

### Bucket 1, the No Warranty Bucket — live

**Definition: `customers.has_existing_warranty = false`.** Service drive customers with no
coverage on file. They are the whole premise of the ten email sequence in this repo: the
copy says "your profile shows no vehicle service contract", and that sentence has to be
true of every person receiving it.

This is the only bucket currently wired. Everything else in this file — the cadence, the
copy deck, the checkout card — was written for it.

Write the predicate as `= false`, never `coalesce(has_existing_warranty, false)`. A null is
unknown, not "no coverage", and an unknown is not worth a complaint. For Bob Johnson the
column reads 436 false, 38 true, no nulls.

**Do not use `payment_status` as a stand-in for this.** Every service drive quote is
pending, so that predicate excludes nobody; it means "has not bought from us", which is a
different question. Leaning on it as a proxy left 37 covered customers in a 432 person
audience, 29 of them inside the freshest 150 — nearly one in five of the first send would
have pitched a VSC to someone who already owned one.

### Later buckets

Not yet defined. When one arrives, settle three things before writing any SQL: the
predicate that defines it, whether the existing copy is still honest for that population,
and whether it can share the sending cap with a bucket already running. A bucket whose
members already own coverage cannot reuse email 1 at all — it opens on the absence of it.

Buckets share `vsc_enrollment`, keyed by `dealer_id` and `campaign_id`, so a second bucket
should get its own `campaign_id` rather than being mixed into this one. That keeps
reporting, suppression scope and cadence independent.

## Sending

Mail goes out over **SMTP from the dealership's own warmed mailbox**, not through an ESP.
That keeps the From address and the domain reputation with the dealer, which is the point of
a co-branded send. It costs two things, and both are compensated for rather than ignored. If
a dealer ever moves onto an ESP, both compensations can come back out.

**No provider webhooks.** Bounces and complaints arrive as ordinary mail in the sending
mailbox. Left alone the campaign keeps mailing dead addresses for the full 60 days, which is
how a warmed domain stops being warm. Workflow 06 reads them over IMAP and posts to the same
exit endpoint a webhook would have hit.

Match on the RFC 3463 status class, not on wording: delivery notifications are not
standardised in practice. Hard failures (`5.x.x`, user unknown, address rejected) suppress.
Soft failures (`4.x.x`, over quota) deliberately do **not**, because a full mailbox is not a
dead customer. Abuse reports suppress as complaints. Ordinary replies and out-of-office
messages are ignored, which matters: a customer replying with a question must never be
suppressed for it.

**No one-click `List-Unsubscribe`**, because n8n's SMTP node cannot set custom headers. Under
Google's 5,000-a-day bulk threshold this is a best-practice gap rather than a compliance one.
The footer link is set larger and bolder than the surrounding legal text to compensate: a
reader who cannot find it presses Report spam instead, which costs the domain far more.

Keep `appendAttribution: false` on the send node, or n8n prints its own footer under a
dealership's customer email.

### Throughput and timing

Configured under `sending` in the dealer file and compiled into workflow 02.

| Setting | Bob Johnson | Why |
|---|---|---|
| `dailyCap` | 200 | Ceiling per dealer-local calendar day. |
| `days` | Tue, Wed, Thu | Monday inboxes get cleared in bulk, Friday afternoon decays. |
| `hours` | 9, 10, 11, 13, 14, 15, 16 | Mid morning and early afternoon, skipping lunch. |
| `maxPerRun` | 45 | Stops a backlog arriving as one spike. |

`Send Window Gate` runs **before** the claim, so an out-of-window hour costs one cheap check
rather than a wasted lease. It spreads what is left for the day across the hours still to
come. The cap is enforced inside the claim as `least(per_run, cap - sent_today)`, so two runs
racing cannot jointly exceed it.

Anything unsent when the window closes simply waits. Because each next send is computed from
the enrolment date rather than from the last send, slipping a day never compresses the rest
of the sequence.

Derive the day boundary from the timezone, never a fixed offset, or the cap drifts by an hour
twice a year. Test across the DST change.

These days and hours are starting heuristics, not measured truth. Supabase already records
`last_email_opened_at` and `email_open_count`, so tune them against real opens once a few
thousand sends have landed.

**The daily cap is not what makes this a drip.** Intake enrols every eligible customer in
one sweep, so without a limit the whole backlog becomes due for email 1 at the same
moment, and the cap just chops that wall into consecutive days at the ceiling. Then the
same thing happens on day 3 for email 2, and on every cadence day after. Nothing is lost
and nobody's spacing is wrong, but the domain sits pinned at its ceiling for weeks, which
is the opposite of what a warmed server wants.

**Slowing enrolment does not reduce volume either.** Total sends are `cohort x 10`
however slowly you feed people in; pacing enrolment only smooths the peaks. The one lever
that genuinely lowers daily volume is **cohort size**, set by `supabase.initial_cohort`
as a `limit` on the intake insert-select, ordered `q.created_at desc` so the freshest
visits go first. Fresh is also the slice most likely to convert, since the email refers to
the visit by date.

Do this arithmetic before any first send on a new dealer, and note it is **send days, not
calendar days** — getting that wrong understates the number by more than half:

```
total      = cohort x 10
send days  = campaign weeks x send days per week
per send day = total / send days
```

Bob Johnson, for the record: the full 432 backlog would have been 4,320 sends over about
29 send days, roughly 150 a day against a 200 ceiling. The 150 cohort is about 52 a send
day. Raise the cohort once bounce and complaint rates on the first one are clean.

## Product facts

Everything here is quoted from the signed contract form, AAS VSC 1 11-2022. If a claim is
not in `brand/offer.json` with a basis, it does not go in an email.

- **DriveOne VSC** is the product name, what prints on the customer form. **Platinum** is
  the coverage level, the top tier and the only one sold in this program.
- Platinum is the **exclusionary** tier, which is what makes that claim safe here. Silver
  and Gold are listed-component and are never named.
- Deductible **$0** at the selling dealer, **$100** elsewhere.
- Coverage is **additive**: term and mileage are added from the day of purchase, on top of
  where the car is now. Render as "60 more months, 75,000 more miles", never "covered to
  75,000 miles", which reads as already spent to someone at 61,400.
- 0% **payment plan**, 5% down, no credit check. Never "loan", "financing" or "APR".
- 30 day full refund when no claim has been made. Transferable to a valid transferee.
- Roadside included anywhere in the US, 3 events a year, towing to $100 per occurrence.
- Repairs at any licensed repair facility **authorized by the administrator**. Not "any ASE
  certified shop nationwide", which the form does not support.
- Obligor varies by state: NY **ORIAS Warranty Services**, FL Old Republic, otherwise
  Ascent Administration Services, LLC. The footer resolves this from `dealer.state`.
- Not sold in California.

**Never in this program:** diminished value, Protection Plus (tire, key, dent, windshield),
Openbay, a fixed contract term ceiling, or any repair-cost figure that is not current and
dated on the creative.

## Two arguments that are locked in

These are requirements, not suggestions. They are already written into
`email/copy/campaign.json` at steps 2 and 7. If the copy is ever rewritten, they come with
it, and if a new bucket gets its own campaign file, they go in that one too.

### The zero-dollar covered repair, off the back of the visit they just paid for

**Email 2 owns this.** The customer paid a real bill on a date the email names. The argument
is that the next one could have a zero on it, and that they can prepare for it now.

The guardrail is the whole reason this needs to be written down. **No vehicle service
contract covers routine maintenance**, ours included, so an oil change or a brake job would
not have been free under a VSC either. Implying the ticket they just paid would have been
zero is a claim the contract does not support, and it is the kind of thing a customer
notices when they read the form. Email 2 therefore says so out loud:

> Routine maintenance is not covered by any vehicle service contract, ours included, so we
> are not going to pretend that particular ticket would have been free.

and then pivots to the claim that **is** true and is stronger anyway: a covered repair
brought back to the selling dealer costs **$0**, because the deductible disappears at our
store. Not reduced, zero. At another authorized shop it is $100. That is `brand/offer.json`,
not a flourish.

Keep the split clean whenever you touch this: **maintenance stays theirs, covered breakdowns
become ours,** and that line is in the contract rather than only in the email.

### Not the TV people, not a subscription, the store that already fixes your car

**Email 7 owns this.** Two things to contrast against, not one:

1. **The robocall and late-night TV sellers.** A call center that bought their number,
   selling a product they will never service. This is the one deliberate place the word
   *warranty* appears for our own category, because we are quoting the robocall
   (`"your vehicle's extended warranty"`), and `scripts/check.mjs` allows exactly that form.
2. **Monthly subscription coverage plans.** A subscription covers you for as long as you
   keep paying, at whatever the price becomes. What we sell is a **contract**: term, mileage
   allowance and price all fixed on the day of purchase, transferable if the car is sold,
   refundable in full for 30 days. That distinction is the argument, so the feature row
   carries it as "Fixed at purchase, not month to month".

The resolution in both cases is the same and is the only one available to a dealership:
**the trusted partner is the store that already has the car's service history and will do
the repair in its own bays.** Never name a competitor, and never characterise the
subscription sellers as dishonest. The fixed-versus-open-ended difference does all the work
on its own, which is the register this campaign is written in.

## Voice

Deadpan and confident, addressing someone who just paid a service bill. Sell what the
product unlocks. The buyer is competent and is treated that way.

Enforced by `npm run check`:

- No exclamation points.
- No em dashes or en dashes.
- The product is **never** called a warranty. Only the customer's factory warranty is, and
  the one deliberate exception is quoting the robocall in email 7.

Also: no competitor names, no testimonials or star ratings, no invented urgency. Email 9 is
the only one arguing "now", and it argues honestly from the additive mechanic.

## Design

Full spec in `references/design-system.md`. The essentials:

The **dealership's colour leads**. On a send made on their behalf, DriveOne reads as the
provider, not the sender. `brandLead.mode: "dealer"` resolves every structural accent to
their colour; set it to `driveone` to flip the whole system back.

The card is a **checkout summary**, not a fact box: plan and vehicle in a tinted header,
then Coverage added / Due today / a rule / the monthly figure large, then Buy now and a
reassurance row. Two purchase points per email, card and foot, sharing one button
implementation.

Email-safe, not web: 600px tables, inline styles, MSO conditionals, VML buttons, hidden
preheader, forced light scheme, ~19KB against Gmail's 102KB clip.

**Logos are type, not hosted images.** A hosted file cannot be verified from a sandboxed
environment and does not render with images blocked, which is a large share of opens. If you
must switch to a file, set `logo.useImage` and verify it actually loads first.

## Adding a dealership

1. Copy `brand/dealers/<id>.json`. Set colours, wordmark, address, `state`, `supabase.partner_id`, `supabase.slug`.
2. `node email/build.mjs <id>` and `node n8n/build-workflows.mjs`.
3. Import the five workflows under a `dealer:<id>` tag.

Enrollment rows are keyed by `dealer_id`, so dealerships share the database without
touching each other. `dealer.state` drives the footer obligor automatically.

## Before any first send

Check `docs/OPEN-ITEMS.md` in the repo. The recurring blockers are the sending domain
(must be the **dealership's**, with SPF, DKIM and DMARC), a monitored reply-to, and consent
basis for the service customer records.

Then, in order:

1. Confirm the Code node runner is alive. Run any workflow with a Code node and watch it
   finish. If it times out at 60 seconds, nothing else on this list matters yet.
2. Set the seven `$vars` (see `docs/N8N-SETUP.md`). `$env` does not work on Cloud.
3. Checksum the published templates against `email/dist/*.html`.
4. Activate 01, then 05. Confirm `vsc_enrollment` rows carry both a `monthly_payment` and
   a `quote_url` before anything can send: the scheduler skips rows missing either, which
   is the last of the four guards against mailing a blank price.
5. Send one to yourself. Then 02, 03, 06.

Do the volume arithmetic at step 4, before enrolling anyone: if `backlog × 10` is close to
`dailyCap × send days per week × campaign weeks`, throttle enrolment rather than letting
the cap do the pacing. See Throughput and timing.

Everything is created inactive. Nothing sends until someone activates it.

Worth saying once when a dealer proposes a sending address: a mailbox whose name implies
safety recalls, service reminders, or anything else a customer reads as non-commercial is a
poor carrier for sales mail. It draws complaints rather than clicks and it burns the address
for the thing it was named after. Raise it once, then respect the answer. The dealer owns
their customer relationship.

## Gotchas worth knowing before you rediscover them

- **There is no repair order table.** The service drive writes one quote per visit, so
  `quotes.created_at` is the visit date. `customers.last_seen_date` is empty.
- **Op codes do not exist.** There is no services line; do not add the merge tag back.
- **`customers.has_existing_warranty` is the ownership flag, and it is populated.** An
  earlier version of this file claimed no such flag existed with data. That was wrong, and
  believing it nearly sent 29 pitches to people who already owned the product. See
  Buckets. The general lesson: when this file says a column is empty, re-check the column
  before building on it. Schemas get backfilled and notes go stale.
- **`customers.state` is mostly null**, so a state-based exclusion silently passes almost
  everyone. Do not rely on it alone.
- **Backlog is old.** Quotes ran Feb to Sep 2026 with only 107 inside 30 days. A 30 day
  window strands most of the list; `intake_window_days` is 90.
- **Two golds once shipped together** because the wordmark carried its own colour override.
  Keep one accent value; never let a component define its own.
- **MetricBridge cannot trigger this campaign** and holds no vehicle attributes. It is good
  for `customers.opted_out` suppression and `quotes.payment_status` purchase exits.
- **Regenerating SQL shifts parameter indices.** Verify with `EXPLAIN` against the live
  schema before pushing; that caught a trailing comma before `FROM` that would have failed
  on the first sweep.
- **n8n Cloud blocks `$env`.** An expression reading it returns the literal string
  `access to env vars denied`, not an empty value, so a workflow wired to `$env` does not
  fail loudly: it puts that text into the From address and into the API key header. Use
  `$vars` and set the values under Settings, Variables. Confirmed by probe, not assumed.
- **`$vars` is plaintext** in n8n settings. Credentials are encrypted; variables are not.
  An API key belongs in a Header Auth credential, and only sits in a variable because that
  was the faster path to a first send.
- **Check variables by shape, never by value.** A pasted value can carry trailing
  whitespace or wrapping quotes that are invisible in the settings list and fatal in a From
  address. Run a throwaway workflow that reports length, `s === s.trim()`, and a format
  test per key, and prints no values — then the output is safe to paste anywhere. That
  caught a truncated Slack webhook twice.
- **A Slack webhook has three path segments after `/services/`** and runs about 75 to 80
  characters. A short one still passes a `startsWith('https://hooks.slack.com/')` test,
  still returns HTTP 200, and returns Slack's developer *documentation page* instead of
  `ok`. Count the segments; do not trust the status code.
- **`publish_workflow` ACTIVATES an inactive workflow.** It is not just "save a
  version". Publishing the sender to pick up a bug fix turned it on, and the
  hourly cron fired twenty minutes later and claimed 45 real customers. Nothing
  was sent, only because the SMTP credential was broken, which is luck and not
  design. Before publishing anything, know whether it is meant to be running, and
  check the active flags again afterwards. `unpublish_workflow` turns it back off.
- **`update_workflow` writes the DRAFT. An active workflow keeps running its
  published version.** Nothing warns you. Edits are applied, the API returns
  success, and the schedule goes on running the old code. Half an afternoon went
  into debugging a fix that was never live. After every `update_workflow`, call
  `publish_workflow`, then confirm from an execution rather than from the editor:
  the execution record carries the node parameters it actually ran with, so grep
  those for something only the new version contains.
- **n8n runs ONE query for all items unless you tell it otherwise.** The Postgres
  node defaults `queryBatching` to `single`: one execution for the whole batch,
  using only the first item's replacements, silently discarding every other item.
  Found when a pricing sweep claimed 100 rows, made 100 rating calls, mapped 100
  results and wrote exactly one price. Five nodes here take multi-item input, and
  left alone this would have meant repeat sends (Advance State advancing one
  enrolment a run), an unenforced daily cap (Log Send logging one send in
  forty-five), and ignored bounces (one address suppressed per batch). Set
  `queryBatching: 'independently'` on every Postgres node. Prefer it over
  `transaction`: these writes record things that already happened outside the
  database, and an email that was sent cannot be unsent by a rollback.
- **`$itemIndex` does not advance inside a Code node.** A Code node runs once for
  all items, so `$itemIndex` is fixed and `itemMatching($itemIndex)` returns item
  zero on every pass of your loop. It is the documented idiom for *node parameter*
  expressions, which are evaluated per item, and it is wrong everywhere else. In
  pricing it wrote 100 rating results onto one enrolment, so a Camry at 113,000
  miles and a Durango at 73,000 came out with identical prices to the cent. In the
  sender it would have rendered every email in a batch from the first recipient's
  data. Pair by position instead, and throw if the two sides differ in length.
- **A key that is `undefined` is dropped from `queryReplacement`, not sent as
  null.** It shortens the positional array and shifts every parameter after it,
  and Postgres reports `there is no parameter $N`. Build a blank object carrying
  every key the query names and spread it first, so no branch can get the shape
  wrong.
- **Subject lines need merging too, and are easy to forget.** Render Merge Tags
  rewrote the HTML and passed the subject through untouched, so step 1 variant A
  was going to arrive as a literal `{{first_name}}, one thing was missing from
  your file` on the first email of the campaign. Merge the subject with the same
  loop and the same loud failure on leftovers.
- **The service drive is not a customer list.** 13 of the first 132 enrolled were
  fleet rows, PDI entries, a test record, the group's other rooftops, the
  dealership's own staff address, and two rival dealerships. Emailing a competitor
  a pitch signed by the dealer is a phone call nobody wants. Placeholder addresses
  are worse than bounces: `noemail@gmail.com` and `ask@gmail.com` are real
  accounts belonging to strangers, so they cost a complaint rather than a bounce.
  Intake filters the pattern and the 13 are suppressed, but eyeball the first
  cohort of any new rooftop by hand.
- **Names arrive in block capitals**, 129 of the first 132. `properName` in
  Prepare Send recases only when the source is entirely upper case, so a properly
  typed name is left alone and McBride and O'Brien survive.
- **The quote links expire in seven days. The campaign runs sixty.**
  `guided_purchase_link` is a JWT and `quote_link` carries a Clerk sign-in
  token; both are minted with a seven day life every time the quote API is
  called. A link written once at pricing time is dead from email 3 onward, and
  because the cohort is staggered it was already dead for 61 of 150 on email 1.
  Decode the token, store `quote_expires_at`, let pricing re-fetch two days
  before it dies, and let the scheduler refuse to claim a row past it. Only
  `short_link` carries no token, and nobody has yet confirmed where it lands or
  whether it outlives the others. Check this on any new provider: an expiring
  link looks identical to a working one in every preview.
- **Check the copy against the real spread of data, not against one example.**
  Email 5 promised everyone 36 months when only 69 of 148 had that term. The
  same sweep found a RAM 1500 whose model in the DMS is the string "1500" and
  nothing else, so a subject rendered as "1500 math, briefly" for 24 of the
  first 150 people. Pull the distribution of every field the copy leans on
  (`payment_term`, `contract_months`, `coverage_miles`, `vehicle_model`) before
  a first send, and read one rendered email for the ugliest row rather than the
  prettiest.
- **Never state an offer term the quote does not carry.** Email 5 promised
  everyone 36 months; of 148 priced, only 69 are on 36, with 53 on 30, 25 on 18
  and one on 24. The body was already right because it says "up to 36 months",
  which is true. The subject was not. Use `{{payment_term}}` for anything a
  particular customer's quote decides.
- **An active workflow is not a working workflow.** 01 and 05 sat active and green in the
  list for a day while every hourly run failed at its first Postgres node with
  `Connection refused`, description `127.0.0.1:5432`: the credential had never been
  pointed at Supabase, so it was dialling n8n's own container. Nothing in the workflow
  list says this. Before believing a scheduled workflow works, read an execution, and read
  the error's `description` field, which carries the host and port actually dialled.
- **The Code node runner can be down while everything else looks healthy.** Executions sit
  at `running` and fail after exactly 60 seconds with `Task request timed out`. A Set-node
  workflow on the same instance finishes in milliseconds, which is how you tell the two
  apart. Four of the six workflows use Code nodes, so this stops the campaign dead.
- **Never trust a published template you have not checksummed.** Relaying 200 KB of SQL
  drops characters. It has now happened twice, both times taking exactly one
  `&#847;&zwnj;&nbsp;` (18 characters) out of the preheader padding run, on step 3 and
  later on step 7, invisible to review and harmless only by luck. Compare `md5(html)` in
  `vsc_email_template` against `md5sum email/dist/*.html` after **every** publish; they
  must match exactly, and a row 18 bytes short is this bug rather than a copy change.
  Repair by rebuilding the whole run rather than inserting the missing entity, because an
  insert at a character offset lands mid-entity and produces a row of the right length
  that is still wrong:

  ```sql
  update vsc_email_template
  set html = substring(html from 1 for <bytes before the run>)
          || repeat('&#847;&zwnj;&nbsp;', 60)
          || substring(html from strpos(html, E'\n</div>'))
  where dealer_id = 'bob-johnson' and step = <n>;
  ```

  Get the prefix length from the local file, not by counting: find the first occurrence of
  the entity in `email/dist/<n>-*.html` and use its index. Then checksum again.
- **Manual executions started through the API never run.** They stay queued until the
  editor is open in a browser. Publish the workflow and execute in production mode when
  you need a real run from a tool.
