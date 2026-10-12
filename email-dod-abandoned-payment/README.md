# DriveOne Direct: Finish Your Payment

Ten email series for driveonedirect.com customers who signed a contract, got an Ascent
contract number, started the Budco 0% plan, and never completed the payment.

This is a different audience from the abandoned quote drip (`dod-abandon-e01..e08`).
Those people never checked out. These people checked out and stalled on the last screen.
Never enroll one person in both.

## Who qualifies (Supabase, kovara-ai-production, `enrucchbvcrtailxqzjt`)

```sql
select q.contract_number, q.ascent_contract_number, q.ascent_plan_name, q.contract_price,
       q.down_payment, q.payment_term, q.created_at, c.email, c.first_name, c.state,
       v.year, v.make, v.model
from quotes q
join customers c on c.id = q.customer_id
left join customer_vehicles v on v.id = q.customer_vehicle_id
where q.organization_id = 'f47feda4-2537-4d6a-ad35-183ffd93c72d'
  and q.status = 'payment_pending'
  and q.payment_status = 'budco_initiated'
  and q.payment_completed_at is null
  and q.budco_ric_url is null
  and c.state <> 'CA';
```

Exit: the moment `quotes.status = 'paid'` for that contract. The existing buyer suppression
job (`trig_01UehUNkgmrqgg5datJFSrmh`, daily 11:30 UTC) handles this if it is pointed at the
new segment; it unsubscribes with `suppressed_reason=purchased`.

Scrub before enrolling: California, test accounts (Ryan's own rows, customer_id 285),
dealer-domain emails, anyone unsubscribed without the `purchased` marker.

## Cadence: 10 emails over 60 days

| # | Day | Delay | Hero | Subject |
|---|---|---|---|---|
| E1 | 0 | 0 | The payment they built | Your {{{VEHICLE}}} contract is one click short |
| E2 | 1 | +1 | Budco help line, the two reasons payments fail | If the payment page fought back |
| E3 | 3 | +2 | 0% APR, no credit check | Zero is not a promotion. It is a number. |
| E4 | 6 | +3 | $100 deductible | The only part of your {{{VEHICLE}}} with no price tag |
| E5 | 10 | +4 | Any ASE shop, we pay the shop | You pick the shop. We pay the shop. |
| E6 | 15 | +5 | Diminished Value Protection to $5,000 | Your {{{VEHICLE}}} can lose money at a red light |
| E7 | 22 | +7 | Roadside, rental $250, trip interruption $450 | Breakdowns never check your calendar |
| E8 | 32 | +10 | 30 day refund, prorated after, transferable | The exit is unlocked. That is why the door is easy. |
| E9 | 45 | +13 | No call center | Nobody from DriveOne Direct is going to call you |
| E10 | 60 | +15 | Graceful close | Last one, then we will leave you alone |

Front loaded on purpose: half the series lands in the first ten days, when the contract
is still fresh in their head and the Ascent number is still on the welcome screen they
closed. Resend delays are incremental and all under the 30 day cap. To stretch to 90 days,
change the last four delays to 14 / 20 / 20 / 20 and nothing else moves.

## Variables (Resend, triple brace)

| Variable | Source | Fallback |
|---|---|---|
| `VEHICLE` | `year make model` | your car |
| `MONTHLY` | `(contract_price - down_payment) / payment_term`, formatted `$60.13` | the monthly on your contract |
| `DOWN` | `down_payment`, formatted `$94.95` | the small first payment |
| `TERM` | `payment_term` + " months" | the term you picked |
| `PLAN` | `ascent_coverage_code` tier + `ascent_plan_name`, e.g. `Platinum 60/75,000, $100 Disappearing` | your plan |
| `CONTRACT` | `ascent_contract_number` | on file |
| `RESUME_URL` | the Budco payment resume link for this contract | https://www.driveonedirect.com/#quote |
| `REF` | `contract_number` | on file |

`FIRST_NAME` and `RESEND_UNSUBSCRIBE_URL` are Resend built-ins. Never declare them.
Fallbacks are deliberately non-numeric; Resend rejects numeric-looking fallbacks.

## Open before launch

1. **RESUME_URL.** The link must reopen the Budco payment step for the signed contract, not
   a fresh quote. `quotes.budco_callback_token` is null on every stalled row, so confirm with
   Asad what the resume path is. Until then the fallback sends people to a new quote, which
   is wrong for this audience.
2. **MONTHLY math.** The welcome email shows `$60.13 x 30` after `$94.95` down on a `$1,898.95`
   contract: (1898.95 - 94.95) / 30 = 60.13. Confirm that is Budco's formula for every term.
3. **Compliance footer.** Built from the live welcome email disclaimer plus the drip's CAN-SPAM
   block. Ryan to approve the merged block before the first send.
4. **Sending.** Marketing identity only: `DriveOne Direct <coverage@mail.driveonedirect.com>`,
   reply-to `support@driveonedirect.com`. Never the transactional `send.` subdomain.
5. Build the Resend segment, templates (aliases `dod-payment-e01..e10`), event
   `dod.payment.abandoned`, and automation **disabled**. Enable only on Ryan's say so.

## Build

```
node build.mjs      # dist/*.html, dist/*.txt, dist/manifest.json
```

The build fails on an em dash, an en dash, an exclamation point, the word warranty, any
claim that coverage is active, or a numeric variable in a subject line.
