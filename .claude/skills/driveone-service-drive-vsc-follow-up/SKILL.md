---
name: driveone-service-drive-vsc-follow-up
description: Operations manual for the DriveOne Service Drive VSC follow up campaign, the co-branded email drip sent on a dealership's behalf to its own service drive customers after a visit. Use this whenever the user mentions the service drive follow up, the dealer VSC campaign, the post-service or post-RO emails, the Bob Johnson campaign, enrolling service customers, the vsc_enrollment tables, the rating or quote API at getelevatewarranty.com, auto-quoting a monthly payment into an email, adding a new dealership or rooftop to the campaign, or the driveone-design-system repo. Also use it when asked to change campaign copy, the checkout card, the send cadence, eligibility rules, or the co-branded email design, even if the campaign is not named. This is the DEALER channel, sent as the dealership; for DTC use driveone-direct-retargeting, for pre-sale abandoned quotes use driveone-workflow, and for customers who already bought use driveone-sold-nurture.
---

# DriveOne Service Drive VSC follow up

A co-branded follow up sent **as the dealership**, to its own service drive customers after
their visit, offering the
DriveOne VSC they do not yet have. Ten emails over 60 days, each carrying that customer's
real vehicle, real visit, and a real monthly price with a Buy now button.

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

`partners.id` in Supabase **is** `dealers.source_id` in MetricBridge. That is the join key
between the two systems.

## Build and check

```bash
npm run build   # emails + n8n workflows, both generated from the copy deck
npm run check   # pre-send guard, exits non-zero on a real problem
```

`npm run check` is not decoration. It fails on unknown merge tags, a missing unsubscribe
link, a template over Gmail's clip threshold, a missing price, and on register violations.
Run it before every push.

## Architecture, and why it is shaped this way

Five n8n workflows, all generated from `email/copy/campaign.json` so the cadence in the
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

Everything imports inactive. Nothing sends until someone activates it.

Worth saying once when a dealer proposes a sending address: a mailbox whose name implies
safety recalls, service reminders, or anything else a customer reads as non-commercial is a
poor carrier for sales mail. It draws complaints rather than clicks and it burns the address
for the thing it was named after. Raise it once, then respect the answer. The dealer owns
their customer relationship.

## Gotchas worth knowing before you rediscover them

- **There is no repair order table.** The service drive writes one quote per visit, so
  `quotes.created_at` is the visit date. `customers.last_seen_date` is empty.
- **Op codes do not exist.** There is no services line; do not add the merge tag back.
- **No VSC-ownership flag exists** anywhere with data. Intake uses
  `payment_status = 'pending'` as the proxy. That is "has not bought from us", not "has no
  coverage anywhere".
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
