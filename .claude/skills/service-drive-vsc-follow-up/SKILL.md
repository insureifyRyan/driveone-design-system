---
name: service-drive-vsc-follow-up
description: Operations manual for the DriveOne Service Drive VSC follow up campaign, the co-branded email drip sent on a dealership's behalf to its own service drive customers after a visit. Use this whenever the user mentions the service drive follow up, the dealer VSC campaign, the post-service or post-RO emails, the Ferrario or Ferrario Ford campaign, enrolling service customers, the vsc_enrollment tables, the rating or quote API at getelevatewarranty.com, auto-quoting a monthly payment into an email, adding a new dealership or rooftop to the campaign, the No Warranty Bucket or any other audience bucket for this campaign, the Bob Johnson campaign, or the driveone-design-system repo. Also use it when asked to change campaign copy, the checkout card, the send cadence, eligibility rules, or the co-branded email design, even if the campaign is not named. This is the DEALER channel, sent as the dealership; for DTC use driveone-direct-retargeting, for pre-sale abandoned quotes use driveone-workflow, and for customers who already bought use driveone-sold-nurture.
---

# Service Drive VSC follow up

> **One repo, one engine, one brand file per rooftop.** This began as two projects: the
> Bob Johnson build and a Ferrario fork of it, each carrying its own copy of
> `n8n/build-workflows.mjs`, `email/build.mjs`, `n8n/verify.mjs` and this file. They were
> merged on 30 Sep 2026, before the fork had a chance to drift.
>
> That merge was the point. The fork's own bootstrap notes that the shared engine took
> thirteen commits in the thirty hours before it was cut, including a cadence bug that
> flattened a ten email sequence into a weekly drip, a `$json` reference that would have
> killed every inbound event, and a positional parameter bug that silently discarded rows.
> Every one of those would have needed applying twice, and every one was invisible at
> runtime rather than loud.
>
> The merge itself found a fourth of exactly that kind. `scripts/publish-templates.mjs`
> read `campaign.id` from the shared copy deck, where it is Bob Johnson's, while
> `n8n/build-workflows.mjs` read it from the dealer file. Ferrario's templates would have
> been inserted as `(ferrario-ford, bj_postro_vsc_2026)` and queried as
> `(ferrario-ford, ff_postro_vsc_2026)`, so every send would have found no template.
> Nothing errored at build or at publish, and the md5 checksum step would still have
> passed, because it compares html bytes and never looks at `campaign_id`. Both files now
> resolve it the same way and the publisher refuses a manifest that disagrees.
>
> **Adding a rooftop is a new file in `brand/dealers/`, never a copy of the repo.**
> See `docs/ADDING-A-DEALERSHIP.md`.


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
| Supabase, campaign state AND service drive source | `bbvkqwcapqsytrdrubci`, project **elevate-production** |
| Dealer | Ferrario Ford |
| Partner id | `bd2de835-a881-467c-b78b-c5963ff9fbd5` (Supabase `partners.id`) |
| Partner slug | `ferrario-ford` |
| MetricBridge dealer id | `f97b1597-e7ef-46e0-981a-ac83cdda34d7`, `elevate_service_drive` |
| Program contact | Geoff Crossley, Gcrossley@ferrario.com, 607-526-7748 |
| Campaign id | `ff_postro_vsc_2026` |
| n8n | same instance, workflows tagged `dealer:ferrario-ford` |
| Sending domain | `ferrario.driveoneprogram.com`, verified, DKIM/SPF/DMARC all aligned |

**There is one database, not two.** Campaign state and the service drive source live in the
same project, `bbvkqwcapqsytrdrubci` = **elevate-production**. An earlier version of this
file said a separate project was still to be created, which sent two sessions hunting for a
second Supabase that does not exist. Everything else in the Kovara org is a different
product or empty. If someone says the service data is "in a different Supabase", ask for the
URL and check the ref before searching: it has come back as this one both times.

`partners.id` in Supabase **is** `dealers.source_id` in MetricBridge. That is the join key
between the two systems, and it is confirmed for Ferrario.

**Ferrario is armed and waiting on one switch.** Workflows 01, 02, 03, 05 and 06 are
published and running hourly, all ten templates are published and checksummed against
`email/dist`, and all 30 enrolled rows are priced, linked and spread across the send window.
`$vars.DRY_RUN` is still set, so every send is redirected to one inbox and nothing advances.
**Deleting that variable is go-live**; there is no other step.

Two things about that moment, both learned the hard way:

- **Re-spread immediately before, not days before.** Every row whose send date passes while
  the scheduler is held becomes due-now, so the backlog grows and then arrives as one burst.
  Worse, a dry run *consumes* a re-spread: the claim pushes `next_send_at` two hours out
  whether or not anything was really sent. A spread laid down on Tuesday is gone by
  Wednesday lunchtime if DRY_RUN is still on and the window has opened.
- **A cohort of 30 is 30 emails in the first hour** unless they are spread, because they all
  come due the moment the window opens. The launch spread put ten a day across Wednesday,
  Thursday and Friday, one or two an hour. That is the shape the ramp asks for on a brand
  new subdomain; the daily cap does not produce it, because the cap is 200.

`docs/FERRARIO-LAUNCH.md` tracks what is still open.

### Blockers before a first send

- Brand colours in `brand/dealers/ferrario-ford.json` are a **guessed Ford blue**. Replace
  all seven from the real brand sheet.
- Street address is missing. CAN-SPAM requires a physical postal address in the footer.
- `intake.staffEmailDomains` is unconfirmed, so no staff filter is emitted at all. The
  dealership's own mail domain does not appear in the data; the vendor's does
  (`@captureds.io`), and that one is worth filtering on its own.
- The copy deck is shared. `email/copy/campaign.json` is one deck rendered per rooftop; there is no per dealer copy. If Ferrario's arguments should differ from Bob Johnson's, that is a real change to make and it needs somewhere to live, because today editing the deck edits both campaigns.

## Build and check

```bash
npm run build       # emails + n8n workflows, then verify. Fails the build on a bad cadence.
npm run check       # pre-send guard on the EMAILS, exits non-zero on a real problem
npm run verify      # pre-send guard on the WORKFLOWS, run alone when iterating
npm run n8n:sdk n8n/workflows/02-scheduler.json   # JSON -> n8n Workflow SDK code
node scripts/publish-templates.mjs bob-johnson 1 2  # emit template SQL, in slices
```

`npm run check` is not decoration. It fails on unknown merge tags, a missing unsubscribe
link, a template over Gmail's clip threshold, a missing price, and on register violations.

`npm run verify` (`n8n/verify.mjs`) asserts **behaviour, not shape**, and that distinction is
the point. Every bug in this project's history was findable by reading output and invisible
by reading config: the weekday spreading was measured against the metric it improved (peak
daily volume, 178 down to 103) and never against the thing it broke (the gap between two
emails to one person). So the cadence check runs the generated Prepare Send code once per
send, advancing a fake clock to each send time, and compares where emails actually land
against `campaign.json`. Every other check in the file is a bug that shipped: `$json` in a
run-once-for-all-items node, the `queryBatching` default that discards items, the
replacement count that shifted every positional parameter.

Both are wired into `npm run build`, so they gate rather than wait to be remembered. When
you add a check, prove it fails: revert the fix and watch it go red. A check that has only
ever agreed with the current state is not evidence of anything.

**Simulate at the right granularity.** Evaluating all ten steps at a single instant reports
every email on the same date, which reads as a catastrophic bug and is only the harness.
Advance the clock to each send.

**Build test fixtures by reading the row, never by typing it.** A hand-typed Kevin omitted
`contract_price`, so a preview went out with a hole in the card reading "18 payments ·
total", and the design feedback that came back was partly aimed at a defect that did not
exist in the real send. `select * from vsc_enrollment where id = ...` costs one query.

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

### The checkout form pre-fills from `customers`, live

Buy now lands on the guided purchase form, which asks for name, email, phone and a full
postal address. It is pre-filled from the quote API's `customer` block, and that block is
**joined live from `customers` every time the link is opened**. `quotes` carries no name
and no address of its own, only `customer_id`, so there is no frozen snapshot: fix the
source row and every existing quote link renders the fix, including ones already emailed.

That cuts both ways, and the direction that bites is this one: **whatever junk is in
`customers` is what the customer sees in the form.** A record whose name was never captured
holds the literal strings `First` and `Last`, and those arrive pre-filled in the name
fields, which is worse than leaving them empty. An empty field invites typing; a field
reading `First` looks filled and gets submitted as somebody's legal name onto a contract.

`first_name` and `last_name` are **NOT NULL**, so the repair is the empty string, not null.
That is lucky rather than clever: `'' !~* '(…)'` is true so a blanked name still passes the
intake name filter, while `null !~* '(…)'` is **null**, which is not true, so nulling a name
would silently drop that person from eligibility with nothing erroring. Check the eligible
count before and after any name repair.

**The address cannot be pre-filled on this channel and that is not a bug to hunt.** For
Ferrario, 1 of 1,098 eligible customers has a complete address. Five independent sources
agree: `customers` (3 with a street), `quote_static_data` and `quote_static_table` (2 and 6
rows total, snapshots of completed purchases), reporting-hub, MetricBridge, and the live
quote API, which returns `address: {street:"", city:"", state:"", zip:""}`. Other partners
in the same `customers` table populate street at ~100%, so the schema and the pipeline both
work — the service drive channel specifically is not capturing it. The only fix is upstream
in what the DMS writes at quote creation. Do not keep re-deriving this.

**MetricBridge is not a second source.** Its `source_customer_id` **is** `customers.id`, so
it is a downstream sync of the same table, and it carries no street column at all. It can
never hold something the source lacks.

To inspect what a customer will actually see, call the quote API directly:
`GET https://www.getelevatewarranty.com/api/partners/quotes/<quote_id>` with the header
`x-captured-api-key: $vars.RATING_API_KEY`. Without that header it returns 401, which reads
like the endpoint is wrong. The sandbox this repo is usually edited in cannot reach that
host at all, so run it from a throwaway n8n workflow and archive it afterwards. Report
field **shapes** (empty / absent / length) rather than values, so the output is safe to
paste into a ticket.

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

### What the service drive sends that is not a customer

The feed is a record of repair orders, not a mailing list, and a meaningful slice of it is
the store's own business. Eyeball every new rooftop's first cohort by hand; the shapes
below are the ones that have actually turned up.

**Organisations arrive with a placeholder in the other name field.** The DMS has two name
columns and a business has one name, so it goes in whichever column and the other gets a
literal `First` or `Last`. Both halves occur, and a scan of one column alone finds half
the problem:

| `first_name` | `last_name` | |
|---|---|---|
| `First` | `KEYSTONE SERVICES INC` | business in the surname |
| `BOB JOHNSON SUBARU WATERTOWN` | `Last` | business in the forename |

The intake name filter reads `first_name` only, which is right for the second row and
blind to the first. When cleaning these up, **evaluate each field independently and blank
only the half that is literally a placeholder.** `COMPLIANT AUTOMOTIVE` and
`OKLAHOMA HIGHWAY PATROL` are real data and the only record of who the customer is;
a blanket "junk name" sweep deletes them.

Commercial and fleet accounts (`CW RESOURCES INC`, `DIVISION OF STATE POLICE`,
`MCEVOY INSURANCE`) are **not** internal and not automatically ineligible. They are
businesses that had a vehicle serviced. Decide per rooftop whether the consumer copy is
honest for them rather than filtering them on the shape of the name.

**Internal records that must never be mailed**, in rough order of how often they appear:
the group's other rooftops (`BOB JOHNSON WEST`, `BOB JOHNSON CDJ`, `BOB JOHNSON VOLKSWAGEN`),
PDI entries (`BOBJOHNSONAUTOGROUP - 859 PDI CUSTOMER`), fleet rows (`FLEET GSA`), vendor and
staff test records, and **competing dealerships that took a trade** (`WIDRICK AUTO SALES` —
emailing a rival a pitch signed by the dealer is a phone call nobody wants).

Two traps worth knowing:

- **The vendor's own address is in the data.** `@captureds.io` is Captured, the DMS vendor,
  not a customer. Their staff also appear under consumer addresses with names like
  `tomTest`, which no domain filter catches.
- **Suppressing is not the same as filtering.** A past clean-up suppressed thirteen of
  these at Bob Johnson, which is why they look handled; two more enrolled afterwards and
  sat `active` because the intake filter matches names and theirs read as ordinary people.
  Check `vsc_enrollment` for `status = 'active'` against the junk-address and internal-name
  patterns before any launch, not just the source table.

### Later buckets

Not yet defined. When one arrives, settle three things before writing any SQL: the
predicate that defines it, whether the existing copy is still honest for that population,
and whether it can share the sending cap with a bucket already running. A bucket whose
members already own coverage cannot reuse email 1 at all — it opens on the absence of it.

Buckets share `vsc_enrollment`, keyed by `dealer_id` and `campaign_id`, so a second bucket
should get its own `campaign_id` rather than being mixed into this one. That keeps
reporting, suppression scope and cadence independent.

## Sending

Mail goes out through **Resend**, signing as the dealership's domain. It is an HTTP POST to
`api.resend.com/emails` from workflow 02, not an SMTP node and not the Resend n8n node, which
does not exist.

**This was not the original design, and the reason for the change is worth carrying
forward.** The plan was to send over SMTP from the dealership's own warmed mailbox, which
keeps the From address, the domain reputation and a copy in Sent Items all with the dealer.

That is closed, and it is worth being precise about why, because "the dealership would not
allow SMTP" makes it sound like a decision someone could be talked out of. It is not. The
mailbox has MFA enforced, and SMTP has nowhere to carry a second factor. Tested directly:
the password authenticates fine at office.com and is immediately met with an Authenticator
number prompt, while the same password over SMTP returns `535 5.7.3`. No password, app
password or endpoint change gets around that. Assume this is the posture at every dealer
from now on; it is the Microsoft default, not a quirk of this one.

That leaves three routes, and only one of them asks the dealership for nothing beyond DNS:

| Route | Needs from them | Gets you |
|---|---|---|
| Resend + 4 DNS records | DNS only, no access granted | Bounce webhooks, List-Unsubscribe |
| Microsoft Graph via OAuth | App registration + admin consent | Sent Items copy, custom headers, no DNS |
| SMTP | Impossible while MFA is on | — |

The Outlook node is genuinely the best of the three on capability — it supports
`internetMessageHeaders`, `saveToSentItems` and `replyTo`, so it beats even Resend — and it
is what the dealership's other vendor already does. It costs an app registration. Put both
live options in front of their IT and let them choose; a choice is a far easier
conversation than a single take-it-or-leave-it request.

Authenticating the domain is the smaller ask and it is worth knowing why when you have to
make the case. It needs **four DNS records and nothing else**: no mailbox access, no app
registration, no Microsoft admin consent, no change to existing mail flow. The DKIM key goes
on the root, and SPF and MX go on a `send.` **subdomain**, so the existing root SPF record is
never touched — which matters, because a domain may have only one SPF record and a second one
on the root silently spams the dealership's own business mail. `docs/bobjohnson-dns-request.md`
is the request written out; reuse its shape for the next dealer.

What is lost is the Sent Items copy. What is gained is real:

**Provider webhooks.** Bounces and complaints arrive as signed events rather than as English
prose to be regex-parsed out of an inbox. That deleted workflow 06 entirely, which was the
most fragile thing in this system. `email.bounced` carries `data.bounce.type`: only
`Permanent` suppresses. `Transient` is a full mailbox or a greylisting server, and burning a
real customer's address over a condition that clears by itself is the exact mistake the old
regex was careful to avoid — keep avoiding it.

**One-click `List-Unsubscribe`.** An HTTP call can set headers, which n8n's SMTP node could
not, so the `List-Unsubscribe` and `List-Unsubscribe-Post` headers Google and Yahoo expect
from bulk senders are finally there. Keep the visible footer link large and bold anyway: a
reader who cannot find it presses Report spam instead, which costs the domain far more.

Resend allows **two requests a second**. The send node paces itself with
`batching: { batchSize: 2, batchInterval: 1100 }` rather than firing a run of 45 at once,
because a 429 surfaces as a failed send rather than as back pressure.

### Throughput and timing

Configured under `sending` in the dealer file and compiled into workflow 02.

| Setting | Bob Johnson | Why |
|---|---|---|
| `dailyCap` | 200 | Ceiling per dealer-local calendar day. |
| `days` | Tue, Wed, Thu, **Fri** | Monday inboxes get cleared in bulk. Friday is in for an arithmetic reason, below. |
| `hours` | 9, 10, 11, 13, 14, 15, 16 | Mid morning and early afternoon, skipping lunch. |
| `maxPerRun` | 45 | Stops a backlog arriving as one spike. |

**The send window has to be able to express the deck's gaps, and that is arithmetic rather
than taste.** Two days drawn from Tue/Wed/Thu can only ever be 1, 2, 5, 6 or 7 days apart:
3 and 4 are impossible. The deck opens with gaps of 3 and 4. On the old three day window
every gap silently became 7, email 2 was written to land three days after the service visit
and landed eight days after, and a 60 day campaign became a flat 64 day weekly drip with
nothing erroring anywhere. Before narrowing `days` on any dealer, check the set can still
produce every gap in `campaign.json`; `npm run verify` does exactly this and fails the build
when it cannot.

Two more traps in the same code, both of which produced the flat 7 day result:

- **Snap to the nearest day in the window, never the next one.** Searching forward only
  pins each contact to one weekday, and once pinned a 3 day gap and an 8 day gap land on
  the same next occurrence. Searching outward keeps the shape and still spreads the load,
  because the days outside the window divide between the two nearest inside it rather than
  all draining into Tuesday.
- **Normalise the send hour before applying the minimum gap floor, not after.** Clamping raw
  timestamps and then setting the hour lets the hour move a date back under the floor by up
  to a day, which pushes it a full week forward.

`next_send_at` is floored at **three days from now**, the tightest real gap in the deck.
Without it a contact enrolled weeks before launch has several steps dated in the past and
receives them in consecutive hourly runs. The daily cap does not catch that: it counts sends
across the campaign, not per person, so 150 people getting three emails each still sits
inside 200 a day and looks healthy from outside.

Perfect fidelity is not achievable and the target is not zero drift. A 3 day gap from a
Wednesday lands on a Saturday, and the nearest sending days are 2 days out (under the floor)
or 6. Any window excluding weekends has holes like that. Worst drift is 3 days, which is the
calendar's floor rather than a tolerance picked to make a check pass.

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

**Raising the cohort is the ramp, so the raise has to actually enrol people.** It did not,
twice, in two different ways, and both failures look identical from outside: a sweep that
reports success and inserts nothing.

- A bare `limit $6` caps one RUN, not the campaign. The sweep is hourly and idempotent, so
  it tops up to the cohort every hour and keeps going: Bob Johnson sat at 163 enrolled
  against a cohort of 150.
- `limit cohort - already_enrolled` fixes that and is still not enough on its own. Applied
  to the raw candidate rows it is spent on people already enrolled, who are then discarded
  by `on conflict do nothing` — far too late, the slot is gone. The ordering makes it
  systematic rather than unlucky: candidates come freshest-visit-first and the previous
  cohort was taken freshest-first, so the already-enrolled are exactly the rows at the top
  of the queue. Measured at Ferrario, 30 → 90 enrolled 31 people rather than 60, and the
  next sweep enrolled nobody at all, for good. **The ramp stalls at roughly double its
  first step and stays there.**

So the candidate set must exclude the already-enrolled **before** the limit, and must be
deduplicated to one row per person first, because a customer with two visits in the window
is two candidate rows that spend two slots and fill one. `initial_cohort` is denominated in
people. `on conflict do nothing` stays, as the guard between two concurrent sweeps, which
is the job it can actually do. `n8n/verify.mjs` checks both halves.

After every raise, read the enrolment count back and compare it to the number you set.
Never assume the sweep did what it was told.

**Separate the audience decision from the pacing decision**, and keep them in different
fields. `cohort_target` is who the campaign is eventually for; `initial_cohort` is where
the ramp has got to. Only the second one enrols anybody. Ferrario's target is the whole
bucket at 1,098 **measured** people — not the 1,244 raw `has_existing_warranty = false`
count, which is before the window, contactability, internal-record and one-row-per-person
filters. Re-measure rather than quoting either number from memory.

Note what the cap can and cannot absorb before promising a target. 1,098 people is 10,980
sends; at 200 a day over four send days a week that is about fourteen weeks pinned at the
ceiling, and the overflow does not queue tidily — it defers each contact's next step, so
the sixty day cadence quietly stretches. Raise `dailyCap` first, or accept the stretch
deliberately.

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

**The monthly payment is the loudest thing in the email, and the contract total is fine
print.** 34px weight 800 in ink against 12px weight 400 in muted grey, roughly three times
the size. Two rules follow, and they pull in opposite directions on purpose:

- Nothing else may tie the payment for prominence. The hero headline and the payment were
  both 32/800 for a while, so the two loudest things on the page were the same size and
  neither won. The headline sits at 30 now.
- The total is never removed. An email showing a monthly payment with no total anywhere is
  the shape that draws complaints, and the number is disclosed on the Budco form at the
  point of sale regardless. Small is the answer; absent is not.

Whole dollar amounts drop their cents: "$3,364 total" is easier to hold in your head than
"$3,364.00". A total that genuinely has cents still shows them, and the monthly keeps its
cents always, because that is the figure the customer is agreeing to.

Watch the register in microcopy. "149,999 miles on the clock" is British and shipped for a
while to a Watertown truck owner; it reads "149,999 miles".

**Updating a published template without the publish script.** The container this is usually
built in cannot reach Supabase, so `npm run publish:templates` may not run. A chained
`replace()` inside one `update vsc_email_template` handles small edits across all ten rows
at once, because the card markup is shared. Then prove it landed: `md5(html)` from the
database must equal `md5sum email/dist/*.html` for all ten. Ten matching hashes is proof;
"the query returned ten rows" is not.

Email-safe, not web: 600px tables, inline styles, MSO conditionals, VML buttons, hidden
preheader, forced light scheme, ~19KB against Gmail's 102KB clip.

**Logos are type, not hosted images.** A hosted file cannot be verified from a sandboxed
environment and does not render with images blocked, which is a large share of opens. If you
must switch to a file, set `logo.useImage` and verify it actually loads first.

## The list is not yours, and it is too small anyway

This comes up as "can we upload these to Meta and Google and retarget them", and the answer
has two independent halves. Both need settling before anyone exports a CSV.

**Whose data it is.** These are the dealership's service customers. Processing them to send
a co-branded campaign on the dealer's behalf is a narrow purpose; loading the same list into
a Kovara ad account to advertise DriveOne Direct is a different one, and both platforms make
you warrant you hold the rights and gave notice. The clean resolution is to run the ads from
**the dealership's ad account, as the dealership**, exactly as the email does. Anything
feeding the DTC funnel is a specific conversation to have with the dealer, not an assumption.

**Whether it would even work.** Bob Johnson is 447 customers, 446 with a usable email, 37 of
whom already own a VSC. There are **zero** usable cell numbers and 10 zip codes, so email is
the only match key and match rates sit at the low end. Google Customer Match needs roughly
1,000 matched members before it will serve: 446 uploaded becomes maybe 250-300 matched and
the audience will build and never deliver. Meta will accept it and optimise badly.

**The unlock is multi-dealer, not this dealer.** Five to ten rooftops is 2,000-4,000 and
Customer Match becomes real. Build it then.

**Meanwhile the better audience is people who clicked.** Every link already carries
`utm_source=email&utm_medium=crm&utm_campaign=<campaign_id>` and `step=N`, so traffic is
attributable per email. Someone who opened a note about their 149,999 mile RAM, clicked, and
landed on a priced quote has told you far more than a cold address. Confirm before launch
that the quote pages actually carry a Google Ads tag and a Meta pixel, not only GA4 — GA4
lets you *see* the traffic and not *retarget* it, and there is no backfilling a pixel that
was not firing.

Two rules whenever a list does go up: hash to SHA-256 first, never plaintext; and wire
`vsc_suppression` into audience exclusion as well as email, or you will chase someone across
Instagram who told you to stop. Purchasers and the `has_existing_warranty` group come out too.

## Adding a dealership

**Everything is keyed by dealer, and every build command takes the dealer id. Passing it to
one command and not the next is how a dealership gets another one's branding.**

1. Copy `brand/dealers/<id>.json`. Set colours, wordmark, address, `state`,
   `supabase.partner_id`, `supabase.slug`, and **`campaign.id`**. The campaign id must be
   unique per dealership: enrolment and template rows are keyed on
   `(dealer_id, campaign_id, ...)`, so a shared one puts two stores in one namespace.
   Never change an id that is already live; rows already carry it.
2. `node email/build.mjs <id>` then `node n8n/build-workflows.mjs <id>` then
   `node n8n/verify.mjs <id>`, or just `npm run build:<id>` once you add the script.
3. `node scripts/publish-templates.mjs <id>` and apply the SQL.
4. Import the five workflows from `n8n/workflows/<id>/` under a `dealer:<id>` tag.

Output is namespaced: `email/dist/<id>/`, `preview/filled/<id>/`, `n8n/workflows/<id>/`.
That is a correctness requirement, not tidiness. All three used to be shared paths written
by commands that each took their own dealer argument, so building one dealership and
publishing another wrote the wrong branding into live template rows with nothing erroring.
`publish-templates.mjs` now refuses when the manifest's dealer does not match its argument.

Enrollment rows are keyed by `dealer_id`, so dealerships share the database without
touching each other. `dealer.state` drives the footer obligor automatically, so it must be
the DEALERSHIP's state, not the customer's.

**Size the cohort before enrolling anyone.** `cohort x 10 / send days` is the daily rate,
and the daily cap cannot rescue a cohort that is too big: it just pins the domain at its
ceiling for weeks. Ferrario is 1,244 eligible against Bob Johnson's 447, which is 366 a day
against a 200 cap if you enrol everyone. `supabase.initial_cohort` is the only lever that
lowers total volume.

## Before any first send

Check `docs/OPEN-ITEMS.md` in the repo. The recurring blockers are the sending domain
(must be the **dealership's**, with SPF, DKIM and DMARC), a monitored reply-to, and consent
basis for the service customer records.

Then, in order:

0. **Re-import the workflows from the repo, then run `npm run verify`.** The live drafts
   drift: this campaign has been debugged by editing nodes in the n8n UI and through the
   API, and a draft that disagrees with the generator is the single most productive source
   of bugs in this project. The repo is the source of truth. Never publish a workflow whose
   draft was not generated from the current `build-workflows.mjs`.
1. Confirm the Code node runner is alive. Run any workflow with a Code node and watch it
   finish. If it times out at 60 seconds, nothing else on this list matters yet.
2. Set the `$vars` (see `docs/N8N-SETUP.md`). `$env` does not work on Cloud.
3. Get the four DNS records in with the dealer's IT, then verify the domain in Resend.
   Nothing authenticates until that lands, and mail sent before it will be treated as
   spoofed by the receivers who matter most.
4. Checksum the published templates against `email/dist/*.html`.
5. Activate 01, then 05. Confirm `vsc_enrollment` rows carry both a `monthly_payment` and
   a `quote_url` before anything can send: the scheduler skips rows missing either, which
   is the last of the four guards against mailing a blank price.
6. **Dry run the whole thing.** Set `$vars.DRY_RUN` to your own address and publish 02
   for one send window. Every message in the run goes to you instead of the customer, with
   the intended recipient printed in the subject as `[DRY RUN -> name@example.com]`, so a
   full forty five row run arrives in one inbox and can be read end to end. This is the
   only way to exercise claim, prepare, load, render and send as a chain against real
   claimed rows before real people are on the other end.

   The state writes sit behind a gate, so a dry run logs nothing and advances nobody.
   Without that gate the redirect would be worse than useless: forty five customers marked
   as having received email 1 they never got, silently resuming at email 2, and nobody
   finding out until someone asked why the first email had no replies.

   A dry run does still claim, which pushes `next_send_at` two hours out. That is self
   healing; the rows come back on a later sweep.

   **Then unset `DRY_RUN` before the real launch.** Absent means live, which is the right
   default, but it also means a forgotten value silently sends the whole campaign to one
   inbox and nothing looks wrong.
7. Send one to yourself and read it in a real client. **Do not publish 02 to do this**
   outside a dry run.
   Rows go due while the scheduler is off, so publishing during a send window mails real
   customers within the hour. Use a throwaway workflow that reads one real row, renders it
   through the real template, and sends only to you; archive it afterwards. Same pattern
   works for probing SMTP, a webhook signature, or anything else you would otherwise test
   by switching on production.
8. **Re-spread anything overdue, immediately before publishing 02.** Every send date that
   passes while the scheduler is off becomes due-now, so the backlog grows the longer
   go-live slips and then arrives on day one as a single burst under the daily cap. The
   three day floor protects steps 2 to 10 but not step 1. One `update` spreading
   `next_send_at` across the window fixes it, and a domain that has never sent should not
   open with its largest day.
9. Delete any internal test rows from `vsc_enrollment`, then publish 02. That is go-live.

Do the volume arithmetic at step 5, before enrolling anyone: if `backlog × 10` is close to
`dailyCap × send days per week × campaign weeks`, throttle enrolment rather than letting
the cap do the pacing. See Throughput and timing.

Everything is created inactive. Nothing sends until someone activates it.

Worth saying once when a dealer proposes a sending address: a mailbox whose name implies
safety recalls, service reminders, or anything else a customer reads as non-commercial is a
poor carrier for sales mail. It draws complaints rather than clicks and it burns the address
for the thing it was named after. Raise it once, then respect the answer. The dealer owns
their customer relationship.

## Gotchas worth knowing before you rediscover them

- **MFA on the sending mailbox means SMTP can never work, and no password will fix it.**
  An SMTP session has nowhere to carry a second factor: no prompt, no callback, nothing.
  A correct password gets you `535 5.7.3 Authentication unsuccessful`, which reads exactly
  like a wrong password and is not one. Settle it in two minutes before touching any SMTP
  credential: sign in to office.com as the sending address. An Authenticator prompt means
  SMTP is closed, whatever anyone says about the password. Note the sub-code, because they
  mean different things — `5.7.139` with `SmtpClientAuthentication is disabled for the
  tenant` is a policy switch an admin can flip; plain `5.7.3` is credentials, account
  state, or MFA.
  Do not go looking for an app password as the way around it. It needs the admin to permit
  app passwords *and* enable SMTP AUTH on the mailbox, Security Defaults blocks app
  passwords outright, and the whole point of the request is to weaken MFA on a mailbox that
  sends to customers. Any IT person worth having says no, correctly.
- **n8n Cloud cannot greet Office 365 without a client hostname set.** Before the auth
  failure above there is an earlier one that looks unrelated: `501 5.5.4 Invalid domain
  name` / `Invalid HELO`. n8n Cloud runs in a container whose hostname has no dots in it,
  which is not a valid domain, and `smtp.office365.com` rejects it at the greeting. Set the
  client hostname field on the SMTP credential to any valid FQDN. Worth knowing only so it
  is not mistaken for a credential problem: it fails *before* authentication, so it tells
  you nothing about whether the password works.
- **Assume dealer mailboxes are MFA-protected and OAuth-only.** That is the default posture
  at Microsoft tenants now, not an unusual restriction. Plan the sending path around it
  from the start rather than discovering it three days in. See Sending for the three
  routes and what each one costs.
- **`$json` does not exist in a Code node that runs once for all items.** It is bound only
  in run-once-per-item mode, so reading `$json.params?.dealer` inside a `for` loop over
  `$input.all()` is a `ReferenceError` that takes the whole node down — valid events
  included. Use `item.json`. Found by running the generated `jsCode` through plain `node`
  locally before deploying it, which is cheap and catches this class of thing immediately:
  extract the string from the built JSON, wrap it in `new Function`, feed it fixtures.
- **Resend's webhooks are signed by Svix and cannot send a custom header.** An n8n webhook
  node set to `headerAuth` will reject every delivery, and `create-webhook` takes only an
  endpoint and an event list — there is nowhere to put an `Authorization` value. Verify the
  signature in a Code node instead: it is the stronger control anyway, since a shared header
  only proves the caller knows a string that sits in two configs and rides every request.
- **Svix signs the bytes it sent, so the webhook node needs `options.rawBody: true`.**
  Parsing the body and re-serialising it produces a different byte string over whitespace
  alone, and the mismatch looks exactly like an attack. Under `rawBody` the body arrives as
  binary, so read `item.binary.data.data` (base64) and fall back to
  `this.helpers.getBinaryDataBuffer(i, 'data')` for when n8n keeps binary off-item.
  Signed content is `${svix-id}.${svix-timestamp}.${raw}`, HMAC-SHA256, key is the
  `whsec_` secret base64-decoded **with the prefix stripped**, compared base64 against the
  `v1,`-prefixed entries in `svix-signature`. Svix publishes a test vector; check against it
  rather than against your own implementation.
- **An endpoint that writes to a suppression list must fail closed.** Missing secret,
  missing headers, bad signature and stale timestamp all throw before any statement reaches
  the database. Otherwise anyone who guesses the URL can empty the campaign quietly.
- **`require('crypto')`, `Buffer`, `timingSafeEqual`, `this.helpers` and `$vars` all work**
  in Code nodes on this n8n Cloud instance — verified by running a throwaway two-node
  workflow rather than assuming. Worth re-checking on a different instance before relying
  on them.
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
  apart. Four of the five workflows use Code nodes, so this stops the campaign dead.
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
  you need a real run from a tool. (A `manualTrigger` throwaway did execute from the API
  and returned real data, so treat this as "expect it to hang", not "it cannot work" —
  check the execution rather than assuming either way.)
- **The marker scan matches the English word, not just the marker.** `scripts/check.mjs`
  flags a dealer file field containing `NEEDS CONFIRMATION|PLACEHOLDER|REPLACE-ME`, case
  insensitively, so a note that merely uses the word *placeholder* in prose reports itself
  as an unconfirmed field. Reword the prose; do not weaken the guard. The same regex over
  the generated workflows is deliberately case **sensitive** for exactly this reason.
- **One rooftop's prose leaks into another's generated SQL.** The engine is shared, so a
  comment naming a dealership and quoting its cohort is emitted verbatim into every other
  dealership's query. It changes no behaviour and it is still wrong: reading one rooftop's
  workflow should tell you about that rooftop. Describe the failure mode, not the store it
  was measured at, and check with a grep for each dealership's name in the other's build.
- **`UPDATE` and `DELETE` through the Supabase MCP time out at 60 seconds; `INSERT` does
  not.** Wrap the write in a data-modifying CTE whose outer statement is an insert:
  `with upd as (update … returning …) insert into <audit table> select … from upd
  returning …`. That also leaves a record of exactly which rows changed. Create the audit
  table in its own call first — a failed batch rolls back the `create table` with it.
- **Back up before mutating a shared production table, in the database.** Name every
  original into a side table (`vsc_name_scrub_backup`) before the write and the change
  stays reversible without a restore. These tables are read by systems outside this repo,
  so "I can re-derive it" is not true of data the DMS no longer sends.
