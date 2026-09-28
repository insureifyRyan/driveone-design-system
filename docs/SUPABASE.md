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

- One policy, `Century`. Worth a look, since the contract form is `Elevate Platinum`.
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

**Needs an answer:** what should populate those columns? Options, best first.

1. Run the existing pricing engine over the 474 pending quotes so `quotes.contract_price`
   and `quotes.payment_term` get filled, then intake copies them across. One pricer, one
   source of truth, and the email always agrees with checkout.
2. Expose the pricer as an endpoint that n8n calls per enrollment.
3. Tell me the missing markup rule and I will compute it, though I would rather not: two
   implementations of a price will drift.

### Two things to fix either way

- **191 of 474 Bob Johnson vehicles are over 100,000 miles**, and no bracket covers them.
  Today they cannot be priced at all. Either a high bracket is needed or those customers
  must be excluded from the campaign, which is a big slice of the list.
- Campaign eligibility currently allows up to 125,000 miles, which is looser than pricing
  supports. It should match whatever the bracket table ends up covering.
- The **$49 claim is gone** from the copy, replaced by each recipient's real figure. Real
  monthlies observed sit around 56 to 80 dollars, so `$49` was not supportable anyway.
  That closes the substantiation item.

## Still needed to run

| Setting | Status |
|---|---|
| `SHORT_LINK_BASE_URL` | Unknown. Short codes are 8 characters, e.g. `KwR8HW4m`. Need the domain they resolve on so `{{quote_url}}` can be built. |
| Sending server | Waiting on the warmed server details. |
| Postgres credential in n8n | Service role connection to this project. |

## Note on the magic link

Every quote already has a short link, and the campaign puts it in an email. If that link
alone can complete a purchase, it is a bearer token that lives in an inbox indefinitely
and survives forwarding. Worth confirming it expires, or requires a step the recipient
alone can pass, before 364 of them go out.
