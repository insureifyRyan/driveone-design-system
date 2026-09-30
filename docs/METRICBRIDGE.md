# MetricBridge as a source for this campaign

Findings from reading the live MetricBridge MCP surface on 28 Sep 2026. Read this before
wiring intake, because it changes what the DMS still has to supply.

## Bob Johnson is already in there

Source `elevate_service_drive`, status `approved`:

| Field | Value |
|---|---|
| `dealer_id` | `b9c46bf5-44c5-4a7b-9b53-9d3d9e5de308` |
| `source_id` | `b8440db1-62ea-41ad-a676-684a75a3f550` |
| `slug` | `bob-johnson-auto` |
| `business_name` | Bob Johnson Auto |
| Program contact | Mike Perkins, mperkins@bobjohnsonauto.com, (315) 783-3874 |
| `logo_url` | Supabase public URL, now used as the email logo |
| `down_payment_percentage` | `0.05` |

Two useful things fell out of this:

- **The logo is solved.** `logo_url` is a public Supabase storage URL, so email clients can
  load it. It is now in `brand/dealers/bob-johnson.json`. It has not been looked at, since
  this environment cannot reach supabase.co, so confirm it reads well on white.
- **5% down is corroborated.** `down_payment_percentage: 0.05` matches the brief and the
  copy in emails 1 and 5, straight from the system of record rather than from a deck.

Note the record is group level, `Bob Johnson Auto` on `bobjohnsonauto.com`, while this
campaign targets the Watertown CDJR rooftop. If MetricBridge later splits rooftops, this
dealer file should point at the Watertown record instead.

## Scoping key

`quotes.partner_id` matches `dealers.source_id`, confirmed across three dealers in the
sample. So Bob Johnson's quotes are those where:

```
partner_id = 'b8440db1-62ea-41ad-a676-684a75a3f550'
```

## What MetricBridge can and cannot do for this campaign

### It can do suppression and purchase exits

`customers` carries `opted_out`. That is a real opt-out signal from the dealer's own system,
and it is exactly the gap flagged in `docs/OPEN-ITEMS.md`: the campaign's own suppression
table cannot see unsubscribes that happened elsewhere. Wire it as a pre-send check.

`quotes` carries `status`, `payment_status`, `payment_completed_at` and `contract_number`.
A completed payment is the `vsc.purchased` exit event, so the drip can stop the moment
someone buys, without waiting on a webhook from checkout.

### It cannot trigger the campaign

This is the important one. **There is no repair order data in MetricBridge, and no vehicle
attributes.**

`customers` returns: `source`, `hub_id`, `source_customer_id`, `first_name`, `last_name`,
`email`, `phone`, `city`, `state`, `zipcode`, `opted_out`, `created_at`, `synced_at`.

`quotes` returns contract and payment fields plus `source_customer_id` and
`source_customer_vehicle_id`. The vehicle is a **reference only**. No VIN, year, make,
model or mileage is exposed.

Nothing anywhere carries a repair order: no RO number, no closed date, no op codes, no
advisor, no odometer reading at the visit.

That matters because the entire premise of this campaign is "you were just in on
{{last_ro_date}} for {{last_ro_services}} at {{vehicle_mileage}} miles." Without repair
orders there is no trigger and no personalization card, and it degrades into a generic
VSC blast, which is the thing it was built not to be.

Also worth noting: `city`, `state` and `zipcode` came back null in the sample. The
eligibility rule that keeps California out reads `garaging_state`, so if that field is
usually empty the rule silently passes everyone. The DMS feed needs to supply it.

## So the architecture is split

| Need | Source |
|---|---|
| Repair order trigger, vehicle, mileage, services, advisor, garaging state | **DMS** (still required) |
| Dealer identity, logo, down payment percentage | MetricBridge `dealers` |
| Opt-out suppression | MetricBridge `customers.opted_out` |
| Purchase exit, contract number | MetricBridge `quotes.payment_status` |

Workflow `01-intake.json` is unchanged: it still expects a DMS repair order feed, and the
vendor field map in `Normalize RO Payload` is still where a real DMS payload gets wired in.

Two additions worth making once access is confirmed, both small:

1. In `01-intake.json`, after the existing suppression check, add a MetricBridge
   `get_customers` lookup and reject anyone with `opted_out = true`.
2. A scheduled workflow polling `get_quotes` filtered to Bob Johnson's `partner_id`, posting
   `vsc.purchased` to the `03-events.json` webhook for every newly completed payment. That
   gives a purchase exit with no checkout integration work at all.

## Open question for the client

Where do repair orders actually come from? Options, best first:

1. MetricBridge has an RO or vehicle endpoint not exposed through this MCP surface. If so,
   point me at it and the split above collapses to one source.
2. A direct DMS feed, in which case: which DMS, and webhook or pull? One sample RO payload
   is enough to finish the field map.
3. Neither, in which case the campaign cannot use the post-service hook and the copy needs
   rethinking before anything else is built.
