# DriveOne Direct: Owner series

Twenty six emails and twelve texts for customers who paid for a DriveOne Direct vehicle
service contract, running the length of their Budco payment plan (30 months by default,
extend or compress to the real `payment_term`). Separate from the dealer sold-nurture
(`driveone-sold-nurture`), which is a different brand, a different footer, and a different
audience. Never enroll one person in both.

Design: DriveOne Direct tokens (`brand/driveone-direct.tokens.json`), the same components as
the Finish Your Payment series, plus one new fixed element: a cyan strip under the header on
every email carrying the claims line (866-660-7003) and 24/7 roadside (877-626-0880) as
tappable `tel:` links. Ryan asked for both numbers prominent on every email; this is where.

## Who qualifies (Supabase, kovara-ai-production, `enrucchbvcrtailxqzjt`)

```sql
select q.contract_number, q.ascent_contract_number, q.ascent_plan_name, q.ascent_coverage_code,
       q.contract_months, q.payment_term, q.contract_price, q.down_payment,
       q.payment_completed_at::date as start_date, c.email, c.first_name, c.phone, c.cell_phone,
       c.state, c.sms_opted_out, c.opted_out, v.year, v.make, v.model, v.mileage
from quotes q join customers c on c.id = q.customer_id
left join customer_vehicles v on v.id = q.customer_vehicle_id
where q.organization_id = 'f47feda4-2537-4d6a-ad35-183ffd93c72d'
  and q.status = 'paid' and q.payment_status = 'completed'
  and q.payment_completed_at is not null and q.budco_ric_url is not null;
```

The DV contract number is `'VASDVP' || substr(ascent_contract_number, 7)` (same tail as the
VSC number; verify against the welcome email for the first few).

Scrub: test accounts (customer_id 285, @cena.com, @kovara.ai, @insureify.ai), opted out,
bounced, complained. California should not appear; if it does, skip and flag.

Exit: cancellation. The daily job checks each enrolled contract; if `status` leaves `paid`
(cancelled, refunded), set `nurture_step` 99 and `suppressed_reason` "cancelled" and
unsubscribe. Loan payoff is NOT an exit: E25 and E26 are the payoff emails.

## Cadence (days since `payment_completed_at`)

| Phase | # | Day | Hero |
|---|---|---|---|
| Activate | E1 | 0 | Save the two numbers. Plan at a glance. |
| | E2 | 3 | Openbay+: it emailed you. What it does. |
| | E3 | 7 | Diminished Value explained. One year term. |
| | E4 | 14 | Review ask (Google), while it is fresh. |
| | E5 | 21 | How a claim actually goes. Shop calls first. |
| | E6 | 30 | The card on file. Budco number. |
| Habit | E7 | 45 | First service on Openbay+. Keep receipts. |
| | E8 | 60 | Referral: $100 gift card. |
| | E9 | 90 | Second car: scan a plate. |
| | E10 | 120 | After a fender bender: the DV checklist. |
| | E11 | 150 | Brakes and tires on Openbay+. |
| Keep | E12 | 180 | Six month check: card, numbers, Openbay. |
| | E13 | 210 | Seasonal prep. Roadside. |
| | E14 | 240 | Referral two: the used car buyer. |
| | E15 | 270 | The bad day kit: roadside, rental, trip interruption. |
| | E16 | 300 | DV protection ends in two months. |
| | E17 | 330 | The family fleet: plate scan. |
| | E18 | 365 | One year recap. Card. Review. |
| | E19 | 420 | The noise: do not wait it out. |
| | E20 | 480 | Referral three: the coworker. |
| Renew | E21 | 540 | Eighteen months. Payments end before coverage. |
| | E22 | 600 | Selling the car: coverage transfers. |
| | E23 | 660 | The big service interval on Openbay+. |
| | E24 | 720 | Two year recap. |
| | E25 | 810 | Three payments left. Do not trip at the finish. |
| | E26 | 900 | Paid off. Coverage continues. Last one. |

Theme count: Openbay+ 7 (E2, E5, E7, E11, E13, E19, E23). Diminished Value 4 (E3, E10, E16,
E18). Second car 2 (E9, E17). Referral 4 (E8, E14, E20, E26). Review 2 (E4, E18, plus a line
in E24). Budco card 6 (E6, E12, E18, E21, E24, E25). Roadside and claims appear on all 26.

Shorter plans: if `payment_term` is under 30, drop E25 and move E26 to payoff day. Longer
plans (36): add a card check at day 990 and move E26 to day 1080. Coverage term emails
(E16, E18, E21, E22, E26) key off `contract_months`, not the loan.

## Texts (Sendblue)

Twelve, days 1 / 8 / 15 / 35 / 61 / 91 / 181 / 300 / 365 / 541 / 811 / 901. Each one day
after its matching email, never the same day. Full text in `dist/sms.txt`.

Gate: send only to contacts with recorded SMS consent. `customers.sms_opted_out` is an
opt-out flag, not consent. Until the site writes an explicit SMS consent field, SMS
enrollment is manual: Ryan confirms the list, or the daily job sends to nobody. First text
carries STOP language; STOP replies are honored by Sendblue and written back to
`sms_opted_out`.

Sendblue is not connected in the session that built this. When the connector is added, the
daily job gets a step: for each enrolled contact with consent and a due text, send via
Sendblue with the filled text, log the message id, bump `sms_step`.

## Variables

| Variable | Source | Fallback |
|---|---|---|
| `VEHICLE` | year make model | your car |
| `CONTRACT` | ascent_contract_number | on file |
| `DV_CONTRACT` | VASDVP + tail | on your welcome email |
| `PLAN` | tier + plan name, e.g. Platinum 60/75,000, $100 Disappearing | your plan |
| `COVERAGE_MONTHS` | contract_months + " months" | the term you chose |
| `LOAN_MONTHS` | payment_term + " months" | your plan term |
| `MONTHLY` | (price minus down) / payment_term, $60.13 | your monthly |
| `START_DATE` | payment_completed_at, October 12, 2026 | your start date |
| `DV_END_DATE` | start + 1 year | one year from your start date |
| `MILEAGE` | mileage with comma + " miles" | your odometer at purchase |
| `REF` | contract_number | on file |
| `REFERRAL_URL` | driveonedirect.com/?ref=<contract_number>&utm_source=email&utm_medium=owner_series&utm_campaign=referral | driveonedirect.com |
| `REVIEW_URL` | Google Business Profile review link, from Ryan | driveonedirect.com |
| `PLATE_URL` | driveonedirect.com/?utm_source=email&utm_medium=owner_series&utm_campaign=second_car#quote | driveonedirect.com |
| `OPENBAY_URL` | https://app.openbay.com/ | app.openbay.com |

## Referral tracking

The link carries `ref=<contract_number>`. The site already reads a `ref` query parameter
(the abandoned quote drip uses it). For the gift card to pay out, the site has to persist
`ref` onto the new quote (a `referred_by` column on `quotes`, or stash it in the existing
`partner_id` slot with a prefix). Then the daily job: every paid contract whose
`referred_by` matches an enrolled contract, 30 days after its `payment_completed_at`, is
flagged in the ledger for Ryan to approve and send a $100 gift card. Until the site writes
`referred_by`, referrals can be matched by hand from the UTM in Vercel analytics, which is
worse. Ask Asad for the column.

## Before launch

1. **REVIEW_URL.** The Google Business Profile short link (g.page/r/...). Ryan.
2. **Openbay activation email.** Confirm Openbay actually sends one on enrollment, and what
   it looks like, so E2 and SMS 2 describe a real email. Asad, or check Ryan's inbox from
   today's test purchase.
3. **DV contract number derivation.** Verify VASDVP + tail against three real contracts.
4. **Referral persistence.** `referred_by` on `quotes`. Asad.
5. **SMS consent.** Decide the consent source. Until then, email only.
6. **Shorter and longer plans.** Confirm the E25/E26 rule above.
7. Compliance footer: built from the Finish Your Payment footer with the "not active until
   paid" line removed and DV, Openbay, and referral terms added. Ryan to approve.

## Build

```
node build.mjs   # dist/*.html, dist/*.txt, dist/sms.txt, dist/manifest.json
```

Fails on an em dash, an en dash, an exclamation point, the word warranty, any
payment-series language ("not yet active", "finish my payment"), a numeric variable in a
subject, the brand written without Direct, or a text over 320 characters.
