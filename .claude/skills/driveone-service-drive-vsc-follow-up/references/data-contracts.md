# Data contracts

Read this when changing intake, pricing, the scheduler, or when wiring a new dealership.

## Contents

1. Campaign tables
2. How the audience is found
3. Eligibility
4. Quote API
5. Merge tags
6. Exit events

---

## 1. Campaign tables

Created in the same Supabase project as the service drive data, which is what lets intake
be a single statement rather than a feed plus a parser. RLS enabled, no policies, matching
every other table there, so only the service role reaches them.

| Table | Purpose |
|---|---|
| `vsc_enrollment` | One row per customer per campaign. The state machine. |
| `vsc_suppression` | Permanent do-not-contact, keyed `(dealer_id, customer_key)`. |
| `vsc_send_log` | Append only. Unique on `(enrollment_id, step)`, which is the second line of defence against a double send. |

`customer_key` is `sha256(dealer_id || ':' || lower(trim(email)))`, computed in SQL with the
native `sha256`, no extension needed. Stable identity is what makes replaying the whole feed
harmless.

`vsc_enrollment` carries the enrollment state (`status`, `current_step`, `next_send_at`,
`exit_reason`), a snapshot of the vehicle at enrollment, the price fields
(`monthly_payment`, `down_payment`, `contract_price`, `payment_term`, `contract_months`,
`coverage_miles`, `plan_name`, `policy_name`, `vehicle_class`, `rate_id`), the links
(`quote_url`, `short_link`, `quote_link`, `guided_purchase_link`), and the pricing guards
(`pricing_attempts`, `pricing_error`, `priced_at`).

A check constraint stops a row advancing past step 0 without `monthly_payment`.

## 2. How the audience is found

There is no repair order table. The service drive writes **one quote per visit**, so the
quote is the visit record and `quotes.created_at` is the visit date.

```sql
from quotes q
  join customers c          on c.id  = q.customer_id
  join customer_vehicles cv on cv.id = q.customer_vehicle_id
where q.partner_id = '<partner uuid>'
```

Intake is one atomic `insert ... select ... on conflict do nothing`, so re-running the sweep
is a no-op and eligibility is SQL predicates rather than a rules engine.

## 3. Eligibility

| Rule | Why |
|---|---|
| `payment_status = 'pending'` | Anyone who bought is not a prospect. Also the stand-in for the VSC flag that does not exist. |
| Within `intake_window_days` | 90, because the backlog is months old. |
| Email present, not opted out, not bounced, not complained | Contactable. |
| Garaging state not CA | Not sold there. Note `customers.state` is mostly null. |
| Model year within 12 | Eligibility ceiling. |
| Mileage not null | No local ceiling: the API decides. |
| Not in `vsc_suppression` | Outlives any single enrollment. |

Pricing additionally requires a 17 character VIN and `pricing_attempts < 5`.

## 4. Quote API

One call returns the price **and** the customer facing links, which is why nothing is built
locally.

```
GET https://www.getelevatewarranty.com/api/partners/quotes/{quote_id}
x-captured-api-key: <RATING_API_KEY>
```

There is also a direct rating endpoint, `POST /api/partners/rating` with
`{ vin, mileage, partner_slug }`, but the quote endpoint is preferred because it returns the
links too.

Response carries `customer`, `vehicle`, `contract_months`, `coverage_miles`, `payment_term`,
`vehicle_class`, `short_link`, `quote_link`, `guided_purchase_link`, a `payment` block, and:

```json
"rating": { "make": "...", "vehicle_class": "A", "quote_options": [
  { "contract_term": 60, "financing_term": 30, "quote_price": 2099,
    "monthly_payment": 66.47, "down_payment": 104.95, "coverage_miles": 75000,
    "plan_name": "...", "policy_name": "DriveOne VSC", "bracket_name": "15001-50000",
    "rate_id": 0 } ] }
```

**Selection:** lowest `monthly_payment` among options where `financing_term`,
`monthly_payment` and `quote_price` are all above zero. Options that are pay-in-full or
quote zero are discarded, never shown as a bargain.

**Link preference:** `guided_purchase_link`, then `short_link`, then `quote_link`.

No usable option, or no link, means no price is written: record the reason, bump the attempt
counter, leave the row invisible to the scheduler.

The key lives only in `RATING_API_KEY`. Never commit it.

The arithmetic, confirmed against real quotes to the cent, is
`monthly = contract_price * 0.95 / payment_term`. Know it for sanity checks; do not use it
to originate a price.

## 5. Merge tags

Offer facts are baked in at build time. Only these survive into `email/dist/*.html`, and the
scheduler throws on any unresolved tag, because a raw `{{tag}}` in an inbox is worse than a
missed send.

`first_name`, `vehicle_year`, `vehicle_make`, `vehicle_model`, `vehicle_mileage`,
`last_ro_date`, `advisor_name`, `monthly_payment`, `down_payment`, `coverage_label`,
`quote_url`, `unsubscribe_url`, `preferences_url`

Adding one means updating `ALLOWED_TAGS` in `scripts/check.mjs` and the `merge` object in
the scheduler's Prepare Send node. The guard fails otherwise, deliberately.

`coverage_label` is derived, not stored: it combines `contract_months` and `coverage_miles`
into additive phrasing, renders "unlimited mileage" at the sentinel, and falls back to a
neutral line on a null rather than claiming a benefit that cannot be proved.

## 6. Exit events

`POST /webhook/vsc/events/:dealer` with `{ type, dealer_id, email | customer_key }`.

| Type | Exits | Suppresses |
|---|---|---|
| `vsc.purchased` | yes | no |
| `vehicle.sold`, `customer.has_vsc`, `manual.exit` | yes | no |
| `email.unsubscribed`, `email.bounced`, `email.complained` | yes | yes |
| `vsc.quote_started`, `email.delivery_delayed` | no | no |

Resend event names are accepted as-is so its webhook can point straight at the endpoint.
Unknown types are acknowledged and ignored, so a new provider event cannot crash it.

MetricBridge can also drive exits: `quotes.payment_status` flipping is a purchase, and
`customers.opted_out` is a suppression source the campaign's own table cannot see.
