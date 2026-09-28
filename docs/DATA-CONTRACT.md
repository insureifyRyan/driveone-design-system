# Data contract

## Merge tags

Offer level facts (deductible, price, administrator, dealer name) are **baked into the
HTML at build time** from `brand/offer.json` and the dealer file. They are not runtime
merge tags. Change them in JSON and rebuild.

Only these eleven tags survive into `email/dist/*.html` and must be supplied at send time.
The scheduler throws if any is left unresolved, because a raw `{{tag}}` in a customer
inbox is worse than a missed send.

| Tag | Source | Fallback | Example |
|---|---|---|---|
| `{{first_name}}` | DMS customer record | `there` | `Dana` |
| `{{vehicle_year}}` | RO vehicle | empty | `2021` |
| `{{vehicle_make}}` | RO vehicle | empty | `Chevrolet` |
| `{{vehicle_model}}` | RO vehicle | `your vehicle` | `Equinox` |
| `{{vehicle_mileage}}` | RO odometer | empty | `61,400` |
| `{{last_ro_date}}` | RO close date | `your last visit` | `September 19` |
| `{{last_ro_services}}` | RO op code description | `Service visit` | `Oil and filter, tire rotation` |
| `{{advisor_name}}` | RO advisor | empty | `Marcus` |
| `{{quote_url}}` | built at send | required | `.../quote?vin=...&k=...&step=3` |
| `{{unsubscribe_url}}` | built at send | required | one click capable |
| `{{preferences_url}}` | built at send | required | |

Adding a tag means adding it to `ALLOWED_TAGS` in `scripts/check.mjs` and to the `merge`
object in the scheduler's `Prepare Send` node. The check script fails the build otherwise,
which is deliberate.

## Where each field comes from

Repair order and vehicle fields come from the **DMS**. MetricBridge carries dealer identity,
opt-out suppression and purchase exits, but holds no repair orders and no vehicle
attributes. See `docs/METRICBRIDGE.md` for what was verified against the live surface and
what is still needed.

## Inbound repair order payload

Workflow 01 accepts a single RO object, an array, or an object with `repair_orders`.
Field names are resolved through the vendor map in `Normalize RO Payload`, which tries
several aliases per field. The canonical shape after normalization:

```json
{
  "email": "dana@example.com",
  "first_name": "Dana",
  "vin": "1GNAXUEV4MZ100000",
  "ro_number": "482913",
  "ro_closed_date": "2026-09-19",
  "vehicle_year": "2021",
  "vehicle_make": "Chevrolet",
  "vehicle_model": "Equinox",
  "vehicle_mileage": 61400,
  "last_ro_services": "Oil and filter, tire rotation, multi point inspection",
  "advisor_name": "Marcus",
  "garaging_state": "NY",
  "has_vsc": false
}
```

`customer_key` is derived, never supplied: `sha256(dealer_id + ":" + lower(trim(email)))`.
Stable identity is what makes replaying the entire RO feed a no-op.

## Eligibility rules

Enforced in `Apply Eligibility Rules`, workflow 01. Each rejection returns a named reason
rather than a silent drop.

| Rule | Reason code |
|---|---|
| Has an email | `no_email` |
| Email is well formed | `invalid_email` |
| No VSC already on file | `already_has_vsc` |
| Has a VIN | `no_vin` |
| Garaging state not excluded | `excluded_state` |
| Mileage at or under 125,000 | `over_mileage` |
| Model year within 12 years | `too_old` |
| RO closed in the last 30 days | `ro_too_old` |

Thresholds live in the `CONFIG` object at the top of that node.

## Exit events

`POST /webhook/vsc/events/:dealer`

```json
{ "type": "vsc.purchased", "dealer_id": "bob-johnson", "email": "dana@example.com" }
```

Pass `customer_key` instead of `email` when you have it.

| Type | Exits campaign | Adds to suppression |
|---|---|---|
| `vsc.purchased` | yes | no |
| `vsc.quote_started` | no | no |
| `vehicle.sold` | yes | no |
| `customer.has_vsc` | yes | no |
| `manual.exit` | yes | no |
| `email.unsubscribed` / `unsubscribe` | yes | yes |
| `email.bounced` | yes | yes |
| `email.complained` | yes | yes |
| `email.delivery_delayed` | no | no |

Resend event names are accepted as is, so the Resend webhook can point straight at this
endpoint. Unknown types are acknowledged with `known: false` and ignored, so a new
provider event can never crash the endpoint.

Adding an exit signal means adding one line to the `EVENTS` map in `Classify Event`.
