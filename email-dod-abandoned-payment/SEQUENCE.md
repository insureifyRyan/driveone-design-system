# Finish Your Payment: sequence spec

Companion to `README.md` (cadence, variables, open items) and `copy/campaign.json` (the
copy). This file is the logic: why the arc runs the way it does, who branches where, when
someone leaves, what to measure, and what to test.

Sequence type: abandoned cart recovery (payment step), with a re-engagement tail.
Goal: the customer completes the Budco payment and the contract flips to `paid`.
Audience: driveonedirect.com customers at `payment_pending` / `budco_initiated`, no RIC.
Platform: Resend automation on the marketing identity (`mail.driveonedirect.com`).

## Narrative arc

| Phase | Emails | Days | Job |
|---|---|---|---|
| Remove friction | E1, E2 | 0 to 1 | Name where they stopped. Hand them the payment line. Most recoveries happen here. |
| Make the money make sense | E3, E4 | 3 to 6 | 0% is real. The deductible is the only known number in car ownership. |
| Show what they almost had | E5, E6, E7 | 10 to 22 | One benefit at a time: any shop, diminished value, the bad day kit. |
| Lower the stakes | E8, E9 | 32 to 45 | The exit is unlocked. Nobody will call. The two fears that stall a payment. |
| Close with dignity | E10 | 60 | Stop. Leave the link. No fake deadline. |

Escalation is in specificity, not pressure. E1 is about the customer. E10 is about the
customer. Nothing in between raises its voice. The one thing that repeats in all ten is
the payment they already agreed to (`DOWN` today, `MONTHLY` for `TERM`, 0% APR), because
the series exists to make that number feel settled rather than new.

## Overview

| # | Day | Subject | Purpose | CTA | Condition |
|---|---|---|---|---|---|
| E1 | 0 | Your {{{VEHICLE}}} contract is one click short | Name the stall, show the plan on hold | Finish my payment | Everyone enrolled |
| E2 | 1 | If the payment page fought back | Budco help line, the two reasons payments fail | Reopen the payment step | Skip if E1 clicked (see branch A) |
| E3 | 3 | Zero is not a promotion. It is a number. | 0% APR, no credit check, no balloon | Lock in the 0% | Everyone still unpaid |
| E4 | 6 | The only part of your {{{VEHICLE}}} with no price tag | $100 deductible as the known number | Make the repair a known number | Everyone still unpaid |
| E5 | 10 | You pick the shop. We pay the shop. | Any ASE shop, direct pay, Openbay+ | Activate it on my {{{VEHICLE}}} | Everyone still unpaid |
| E6 | 15 | Your {{{VEHICLE}}} can lose money at a red light | Diminished Value Protection to $5,000 | Finish it before the red light does | Everyone still unpaid |
| E7 | 22 | Breakdowns never check your calendar | Roadside, rental, trip interruption | Turn on roadside | Everyone still unpaid |
| E8 | 32 | The exit is unlocked. That is why the door is easy. | 30 day refund, prorated after, transferable | Start the 30 days | Everyone still unpaid |
| E9 | 45 | Nobody from DriveOne Direct is going to call you | No call center; the online model is the product | Finish it without talking to anyone | Skip if any click in E5 to E8 (see branch B) |
| E10 | 60 | Last one, then we will leave you alone | Graceful close, link stays live | Finish my payment | Everyone still enrolled |

Full copy, A/B subjects and preheaders are in `copy/campaign.json`; rendered previews in
`dist/preview.html`.

## Flow

```
[Supabase: budco_initiated, no RIC, not CA, not test, not opted out]
        |
   send-event dod.payment.abandoned
        |
        v
   E1 (Day 0) ----clicked CTA, still unpaid after 24h----> E2b "Did it go through?" (Day 1)
        |                                                        |
   no click                                                      |
        |                                                        |
        v                                                        |
   E2 (Day 1) <--------------------------------------------------+
        |
        v
   E3 (Day 3) --> E4 (Day 6) --> E5 (Day 10) --> E6 (Day 15) --> E7 (Day 22) --> E8 (Day 32)
        |                                                                           |
        |                                             any click in E5..E8 ----------+----> skip E9
        |                                                                           |
        v                                                                           v
   E9 (Day 45) ------------------------------------------------------------> E10 (Day 60)
                                                                                    |
                                                                          [EXIT: sequence complete]

At ANY point: quotes.status = 'paid'  ---> [EXIT: converted] (daily suppression job)
At ANY point: unsubscribe             ---> [EXIT: opted out, never re-enter]
```

## Branching

Resend automations branch on events and on contact properties, not on open or click
state, so every branch below is driven by a property the daily job writes. Opens are not
used as a signal anywhere: Apple Mail Privacy Protection inflates them to the point of
noise, and this audience skews mobile.

**Branch A: clicked E1 but did not pay.** They went back to the page and something
stopped them a second time. That is a Budco problem, not a persuasion problem. The daily
job sets `last_click_step=1`; if the contract is still unpaid 24 hours later, send E2b
instead of E2. E2b is E2 with the headline "Did it go through?" and the Budco phone line
moved above the fold. (E2b is not built yet; it is a one line change in the copy deck.)

**Branch B: clicked any of E5 to E8 without paying.** They are interested in the benefits
and stalled on something else. Skip E9 (the no call center pitch is redundant for someone
who already engaged) and let E10 land on Day 45 instead of Day 60. The daily job sets
`engaged_late=true`; the automation checks it before E9.

**No branch on E3 or E4.** The money emails get sent to everyone. If the 0% message is the
one that lands, we want it to land regardless of what they did with E1.

## Exits

| Exit | Signal | Who does it |
|---|---|---|
| Converted | `quotes.status = 'paid'` and `budco_ric_url` present | Buyer suppression job (`trig_01UehUNkgmrqgg5datJFSrmh`, daily 11:30 UTC), pointed at this segment. Unsubscribes the contact with `suppressed_reason=purchased`. |
| Opted out | Unsubscribe link | Resend. Never resubscribe without the `purchased` marker. |
| Cancelled | Customer calls Ascent to cancel the unpaid contract | Manual: set `nurture_step=99`. Rare; the contract was never active. |
| Complete | E10 sent | Automation ends. Contact stays in the segment for reporting. |

## Re-entry

A customer who pays and later cancels inside 30 days is not re-entered here; they go to
the sold nurture exit path. A customer who abandons a second contract (new `contract_number`,
new stall) re-enters from E1 with the new contract data. The same email address with the
same contract number never re-enters.

## Suppression

Do not enroll, or stop sending, when any of these is true:

- State is CA (not sold there).
- Email is a test account (customer_id 285 is Ryan) or a dealer domain.
- Already in the abandoned quote drip (`fa283653-931a-49fa-839d-41ecf126cfed`). Move them
  out of that segment first; a stalled payment outranks an abandoned quote.
- Already in the sold nurture (should be impossible; it means the paid flag is wrong).
- Unsubscribed without the `purchased` marker.
- Contacted support@driveonedirect.com in the last 48 hours (manual hold; check the inbox
  before the daily send until this is automated).

## Benchmarks

Abandoned cart recovery for a considered purchase with a signed contract behind it sits
between e-commerce cart recovery and lead nurture. Targets for the first 90 days:

| Metric | Target | Alarm |
|---|---|---|
| Open rate (E1) | 55 to 70% | under 40%: deliverability, check `mail.` reputation |
| Open rate (series avg) | 35 to 45% | under 25% |
| Click rate (E1) | 12 to 20% | under 6%: the hero box or the resume link is wrong |
| Click rate (series avg) | 4 to 8% | under 2% |
| Payment completion (series) | 8 to 15% of enrolled | under 4% after 30 enrollments: the resume link is sending people to the wrong page |
| Time to pay | 60% of conversions inside Day 3 | conversions spread evenly: E1 and E2 are not doing their job |
| Unsubscribe (per email) | under 0.8% | over 2% on any single email: pull that email |
| Spam complaints | under 0.1% | any complaint on E1: stop and review consent |

The honest baseline is zero. Nobody has emailed these people since the welcome screen
closed. The eight in the bucket today have waited between 2 and 39 days.

## A/B tests

Run one at a time, 50/50 split, minimum 100 recipients per arm before reading a result,
which at current volume means the first test runs for a while. Measure on payment
completion, not clicks.

1. **E1 subject, friction vs. ownership.** "Your {{{VEHICLE}}} contract is one click short"
   vs. "{{{FIRST_NAME}}}, you stopped at the easy part". The first names the vehicle, the
   second names the person. Winner decides whether the rest of the series keys subjects off
   VEHICLE or FIRST_NAME.
2. **E1 hero, down payment vs. monthly.** The hero box leads with `DOWN today` (the small
   number) vs. `MONTHLY a month` (the familiar number). The welcome email leads with the
   contract total; neither of these does. Winner sets the hero order for E6 and E8.
3. **E2 timing, 24h vs. 72h.** The help email on Day 1 assumes a technical stall. Day 3
   assumes a cold feet stall. Measure Budco tel link taps and payment completion.
4. **Series length, 60 vs. 90 days.** Once volume allows: stretch the last four delays to
   14 / 20 / 20 / 20 for half the enrollments and compare completion after Day 45. If the
   tail converts nobody, cut to eight emails and stop at Day 32.

## Metrics

Primary: payment completion rate, enrolled to `paid`, by cohort week.

Per email: delivered, click rate, Budco tel link taps (E2 and E9 carry it in the body),
Ascent tel link taps, unsubscribe rate, spam complaints.

Sequence: completion rate, median time to pay, drop off by step (which email was the last
one delivered before conversion), share of conversions attributed to each email.

Review weekly for the first six weeks, then monthly. Add a DOD payment recovery line to the
Monday scorecard once the first cohort passes Day 60.

## Platform setup (Resend)

1. Segment: "DriveOne Direct: Finish Your Payment".
2. Event: `dod.payment.abandoned` with the schema from the README variables table.
3. Templates: `dod-payment-e01` to `dod-payment-e10` from `dist/*.html` and `dist/*.txt`.
   Triple brace variables. Non numeric fallbacks. Fresh `text` on every update. Re-publish
   after every edit.
4. Automation: trigger on the event, delays 1 / 2 / 3 / 4 / 5 / 7 / 10 / 13 / 15 days
   (incremental, all under the 30 day cap), property checks before E2 (`last_click_step`)
   and E9 (`engaged_late`). Build it DISABLED.
5. Daily job: Supabase query from the README, scrub, upsert net new contacts with
   properties, fire the event once per new contact, write click properties from Resend
   events, and hand paid contracts to the suppression job. Cap 15 / 25 / rest over the
   first three days for the backlog.
6. Enable only on Ryan's explicit approval, after the three open items in the README are
   closed: the Budco resume link, the monthly formula, and the compliance footer.
