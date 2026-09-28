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
