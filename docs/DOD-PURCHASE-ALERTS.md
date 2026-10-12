# DriveOne Direct purchase alerts (Slack)

Posts to Slack every time someone buys on driveonedirect.com.

```
Claude Routine (hourly)
  -> Metricbridge MCP  get_quotes(source=kovara, status=payment_pending)
                       get_quotes(source=kovara, status=paid)
  -> scripts/dod-purchase-alert.mjs   dedupe against the state ledger, format
  -> Slack incoming webhook           one message per new purchase
  -> push state to branch dod-purchase-alert-state
```

## What counts as a purchase

Metricbridge source `kovara` is DriveOne Direct. Never the dealer sources
(`elevate_bhph`, `elevate_service_drive`); the script drops them even if passed in.

| Stage | Metricbridge fields | Slack message |
|---|---|---|
| checkout | `status = payment_pending`, `payment_status = budco_initiated` | New DriveOne Direct purchase |
| paid | `status = paid`, or `payment_status = completed`, or `payment_completed_at` set | DriveOne Direct purchase paid |

As of 12 Oct 2026 every DTC sale sits at the checkout stage (5 of them) and none has
reached `paid`, so the checkout stage is the real "someone bought" signal. Each quote is
alerted at most once per stage. The message carries contract number, price, term, payment
plan, Metricbridge customer ID and quote date. Metricbridge holds no `kovara` names or
emails, so there is no PII in the alert.

## Dedupe ledger

`dod-purchase-alerts.json` on the orphan branch `dod-purchase-alert-state`. Keys are
`<hub_id>:<stage>`. It was seeded with the 5 checkouts that existed on 12 Oct 2026 so the
first run does not re-announce old sales. A Slack failure leaves the key out, so the next
run retries it.

## Setup

1. **Slack webhook.** Slack, Apps, Incoming Webhooks, add to the target channel (for example
   `#dod-sales`), copy the `https://hooks.slack.com/services/...` URL.
2. **Store it as a secret.** In the claude.ai/code environment settings for this repo, add
   the environment variable `SLACK_DOD_PURCHASE_WEBHOOK`. Never commit it.
3. **Finish the Routine** "DriveOne Direct purchase alert" (`trig_01BGnF7JZbLJV8EkmmdNH4sC`,
   hourly at :09) in the claude.ai Routines UI: attach the **Metricbridge MCP** connector and
   the `insureifyRyan/driveone-design-system` repo, then enable it. It was created disabled
   because connectors cannot be attached from a coding session.

## Run by hand

```bash
# preview, posts nothing
node scripts/dod-purchase-alert.mjs --state state.json --dry-run quotes.json

# live
SLACK_DOD_PURCHASE_WEBHOOK=https://hooks.slack.com/services/... \
  npm run alert:dod -- --state state.json quotes.json
```

`quotes.json` is the raw JSON a Metricbridge `get_quotes` call returns. Pass several files
to merge pages or statuses.
