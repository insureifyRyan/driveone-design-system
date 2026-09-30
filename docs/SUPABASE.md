# Supabase wiring

Project `bbvkqwcapqsytrdrubci`. This is both the system of record for service drive
capture and the home of the campaign's enrollment state, which is what lets intake be a
single statement instead of a feed plus a parser.

## What is live

Three tables were created by migration `create_vsc_campaign_enrollment_tables`:
`vsc_enrollment`, `vsc_suppression`, `vsc_send_log`. All three have RLS enabled with no
policies, matching the convention of every other table in this project, so only the
service role reaches them. No existing table was altered.

## How the audience is found

There is no repair order table. The service drive creates **one quote per visit**, so
`quotes` is the visit record and `quotes.created_at` is the visit date.

```
quotes q
  join customers c          on c.id  = q.customer_id
  join customer_vehicles cv on cv.id = q.customer_vehicle_id
  join quote_short_links sl on sl.quote_id = q.id
where q.partner_id = 'b8440db1-62ea-41ad-a676-684a75a3f550'
```

`partners.id` here equals `dealers.source_id` in MetricBridge, so the two systems join on
the same key.

## Bob Johnson audience, measured 28 Sep 2026

| Fact | Value |
|---|---|
| Quotes for this partner | 474 |
| Distinct customers | 447 |
| Payment status | 474 pending. Nobody has bought. |
| Quote status | 471 `vehicle_added`, 2 `priced`, 1 `personal_details` |
| Has email | 474 |
| Opted out / bounced / complained | 0 / 0 / 0 |
| Year, make, model, mileage present | 474 |
| Has a magic link | 474 |
| Date range | 21 Feb 2026 to 14 Sep 2026 |
| Age: 0-30 days | 107 |
| Age: 31-60 days | 112 |
| Age: 61-90 days | 239 |
| Age: over 90 days | 16 |
| **Would enroll at a 90 day window** | **364** |

The 90 day window is deliberate. A 30 day window enrolls 107 and strands 350. Set
`intake_window_days` in the dealer file to change it.

## Two things that do not exist in the data

### 1. Op codes, so no services line

Nothing anywhere carries what was actually done at the visit. The `{{last_ro_services}}`
merge tag has been removed from the template and the guard. The personalization card now
reads vehicle, then visit date and mileage, which is all real.

### 2. No VSC ownership flag

Searched every column in the database matching `vsc`, `warrant`, `coverage`,
`service_contract`, `owned` and similar. The only candidates with any data are
`quotes.coverage_miles` and `customer_vehicles.owned`, and `owned` is **null for all 474**
Bob Johnson rows. `customers.record_type` and `customers.segment_code` are also null for
all 474. `moto_file_import_data.owned`, the raw import staging table, has zero rows.

So "everyone who does not have a VSC in their profile, or has a 0 in that column" cannot
currently be expressed against this database.

What intake uses instead is `q.payment_status = 'pending'`, which excludes anyone who
bought **through DriveOne**. It does not exclude someone who holds a contract bought
elsewhere, because that fact is not stored.

Since all 474 are `pending` and none has a contract, the practical audience is identical
today either way. It stops being identical as soon as people start buying, and it is wrong
if the DMS knows about outside coverage.

**Needs an answer:** is the VSC flag a column in a file not yet imported (in which case
`moto_file_import_data` looks like where it lands, and intake gets one more predicate), or
did you mean the "no contract with us" proxy that is already in place?

## Pricing: do not compute it locally

The email now shows a real monthly figure in the personalization card, visible without a
click. The pipe is built. The number's **source** is the open question, and it matters.

### What the rate tables say

Pricing is keyed on `(policy, make, mileage_bracket, term, financing_plan)`:

- One policy row locally, a legacy internal name. Irrelevant now: pricing comes from the API,
  which returns `policy_name` **DriveOne VSC**, and that is the customer facing name.
- Terms 48, 60, 72 months.
- Mileage brackets `low` 0 to 49,999 and `mid` 50,000 to 99,999. **Nothing above 99,999.**
- Financing plans pay over 18, 24 or 30 months at 5% down. Longer plan, lower monthly.

The monthly arithmetic is confirmed exactly against six already-priced quotes:

```
monthly = contract_price * 0.95 / payment_term
```

e.g. 2007.00 * 0.95 / 30 = 63.56, matching to the cent.

### Why the rate tables are not enough

Recomputing `contract_price` from `vsc_rate_make_mileage_term_rates` **does not reproduce
real quotes**. Chevrolet's rates are 1869, 1936, 2017, 2046, 2099 and 2234. A real
Chevrolet quote priced at **2442**, which is not in that list. Across six sampled quotes a
locally computed best price came out **10 to 20 percent below** what was actually quoted.

Something sits between the rate table and `contract_price`: a markup, a partner
adjustment, a fee, or a newer rate set (`vsc_rates_export` also holds 704 rows).

Quoting someone 61 dollars a month by email when checkout says 77 is a bait, and it is a
price claim. So the campaign does not compute prices.

### How it is wired instead

`vsc_enrollment` gained `monthly_payment`, `down_payment`, `contract_price`,
`payment_term`, `contract_months` and `priced_at`, plus a check constraint that a row
cannot advance past step 0 without a price. The scheduler skips any unpriced row rather
than sending a blank. `npm run check` fails any template that does not show the price.

**Resolved: the rating API prices it.** Workflow `05-pricing.json` claims unpriced
enrollments, calls the rating endpoint, and writes the cheapest financed monthly back.

`vsc_rates_export` settled the question of whether a local calculation could work. It
reproduces the local rate card exactly, Chevrolet low / 60 month / 30 payments gives
`monthly_payment` 61.31 with `down_payment` 96.80 and `markup` 0, which is precisely what
the arithmetic here produced. But those numbers are not what live quotes charge: a real
Chevrolet priced at 2442 against a card price of 2099, and a second at 2309. The deltas,
343 and 210, are not constant, so it is not a flat fee or a fixed markup.

Something the API sees is not in the local card. The likely candidates are
`quotes.vehicle_class` (A or B) and the VIN attributes already stored on
`customer_vehicles`: `vin_turbo`, `vin_drive_type`, `vin_fuel_type`, `vin_engine_model`.
Those are ordinary VSC rating factors. Whatever it is, the local card is a simplified or
stale snapshot and the API is authoritative, which is why the campaign asks rather than
computes.

### The API key

The key is supplied to n8n as `RATING_API_KEY` and referenced only as `$env.RATING_API_KEY`.
It is not in this repository and must not be committed. It was shared in a chat transcript,
so rotate it once the integration is confirmed working.

### One call gets the price and the link

`GET /api/partners/quotes/{quote_id}` returns the whole quote: customer, vehicle, the
embedded `rating` block, and three customer facing links, `short_link`, `quote_link` and
`guided_purchase_link`.

That single call replaced two problems at once. The price comes from `rating.quote_options`,
and the Buy now destination comes from `guided_purchase_link`, preferred because it is the
buy flow rather than a quote view, falling back to `short_link` then `quote_link`.

**No link is ever built locally.** There is no `SHORT_LINK_BASE_URL` and the intake insert
writes `quote_url` as null. A locally assembled URL could disagree with what checkout
actually serves, and a Buy now button that 404s is worse than no email. If a row has no
usable link the mapper records the reason and leaves it unpriced, so the scheduler skips it.

The scheduler appends tracking to whatever the API returned rather than reconstructing it,
choosing `?` or `&` by what is already in the URL.

### The rating contract, confirmed

```
POST https://www.getelevatewarranty.com/api/partners/rating
x-captured-api-key: <RATING_API_KEY>
{ "vin": "...", "mileage": 45000, "partner_slug": "bob-johnson-auto" }
```

```json
{ "make": "HONDA", "mileage": 45000, "vehicle_class": "A",
  "quote_options": [ { "contract_term": 12, "financing_term": 0, "quote_price": 0,
    "monthly_payment": 0, "down_payment": 0, "financed_amount": 0,
    "coverage_miles": 75000, "plan_name": "30 Month Financing",
    "policy_name": "DriveOne VSC", "bracket_name": "15001-50000", "rate_id": 0 } ] }
```

Rating is keyed on **VIN**, which is why local rate card arithmetic could never match: the
API decodes engine, drivetrain and class from the VIN, and the local card holds none of
that. All 269 quotable enrollments have a well formed 17 character VIN, and the claim
query now requires one.

Selection rule: take the **lowest `monthly_payment`** among options where
`financing_term > 0`, `monthly_payment > 0` and `quote_price > 0`. Options that are pay in
full or quote zero are discarded rather than presented as a bargain.

A response with no usable financed option writes no price. It records the reason in
`pricing_error`, increments `pricing_attempts`, and the row stays invisible to the
scheduler. After 5 attempts it stops being retried, so a permanently unratable vehicle does
not call the API forever. **No customer can receive a blank, a zero, or an invented price.**

The response also carries `coverage_miles`, `plan_name`, `policy_name`, `vehicle_class` and
`rate_id`, all now stored on the enrollment.

**Coverage is additive.** The term and the mileage are added on from the day the policy is
bought, on top of wherever the car is at that moment. They are not a ceiling measured back
to the vehicle's in-service date. So `contract_term` 60 and `coverage_miles` 75,000 render
as "60 more months, 75,000 more miles", never as "covered to 75,000 miles", which would be
wrong for a car that already has 61,400 on it.

A null `coverage_miles` falls back to "Coverage shown on your quote" rather than claiming
unlimited, and the sentinel renders as "unlimited miles".

### Note on the API's mileage brackets

The sample response returns `bracket_name: "15001-50000"`, which is a finer and completely
different scheme from the local `low` / `mid` table. So the local 99,999 ceiling describes
the **local card**, not necessarily the API. The cheap way to find out whether high mileage
already rates is to raise `max_mileage` in the dealer file and watch whether those rows
price or land in `pricing_error`. Nothing can leak to a customer either way, because an
unpriced row is never sent.

### Two things to fix either way

- **191 of 474 Bob Johnson vehicles are over 100,000 miles**, and no bracket covers them.
  Intake now holds them back rather than emailing a blank: 269 are quotable today, 163 are
  waiting. Good news on adding the bracket: the `mileage_bracket` enum **already includes
  `high`**, alongside `low` and `mid`, so this is adding rate rows rather than a schema
  change. Raise `max_mileage` in the dealer file the day those rates exist and the held
  back customers enroll on the next sweep.
- Campaign eligibility currently allows up to 125,000 miles, which is looser than pricing
  supports. It should match whatever the bracket table ends up covering.
- The **$49 claim is gone** from the copy, replaced by each recipient's real figure. Real
  monthlies observed sit around 56 to 80 dollars, so `$49` was not supportable anyway.
  That closes the substantiation item.

## Still needed to run

| Setting | Status |
|---|---|
| Quote and buy links | **Resolved.** Returned by the quote API. Nothing to configure. |
| Sending server | Waiting on the warmed server details. |
| Postgres credential in n8n | Service role connection to this project. |

## Note on the magic link

Every quote already has a short link, and the campaign puts it in an email. If that link
alone can complete a purchase, it is a bearer token that lives in an inbox indefinitely
and survives forwarding. Worth confirming it expires, or requires a step the recipient
alone can pass, before 364 of them go out.
