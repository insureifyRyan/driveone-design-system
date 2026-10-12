# DriveOne Direct purchase alerts (Slack)

Posts to Slack every time someone buys on driveonedirect.com.

```
Claude Routine (hourly)
  -> Supabase MCP, read only          scripts/dod-purchases.sql on kovara-ai-production
  -> scripts/dod-purchase-alert.mjs   skip test accounts, dedupe against the ledger, format
  -> Slack incoming webhook           one message per new purchase
  -> push ledger to branch dod-purchase-alert-state
```

## Why not Metricbridge

The first version read Metricbridge (`get_quotes(source="kovara")`). On 12 Oct 2026 its
mirror showed 5 DriveOne Direct sales when the Kovara production database had 10 real
ones, showed two paid sales as unpaid, and counted a test account as a sale. Metricbridge
appears to sync a quote when it is created and miss later status changes, which is exactly
the moment a quote becomes a purchase. The alert now reads the source table directly.

## What counts as a purchase

| Stage | `quotes` fields | Slack message |
|---|---|---|
| checkout | `status = payment_pending` or `payment_status = budco_initiated` | New DriveOne Direct purchase |
| paid | `status = paid`, `payment_status = completed`, or `payment_completed_at` set | DriveOne Direct purchase paid |

Each quote is alerted at most once per stage. The message carries customer name, city and
state, email, phone, vehicle, price, plan, payment schedule with down payment, both contract
numbers and the quote date. Post it only to a private internal channel.

## Test accounts

Never posted. The script skips a few obvious fake emails and phone numbers, any internal
domain (kovara.ai, insureify, driveonedirect.com), plus every address listed in the
optional environment variable `DOD_TEST_EMAILS` (comma separated). Put staff test
addresses there, not in the code.

## Dedupe ledger

`dod-purchase-alerts.json` on the orphan branch `dod-purchase-alert-state`. Keys are
`<quote id>:<stage>`. It starts empty, so the first run posts every past sale as a
backfill. A Slack failure leaves the key out, so the next run retries it.

## Setup

1. **Slack webhook.** Slack, Apps, Incoming Webhooks, add to a private channel (for example
   `#dod-sales`), copy the `https://hooks.slack.com/services/...` URL.
2. **Environment variables.** In the claude.ai/code environment settings (Default
   environment, Edit, Environment variables), add `SLACK_DOD_PURCHASE_WEBHOOK` and, if
   wanted, `DOD_TEST_EMAILS`. Not under Network secrets. Never commit either.
3. **Finish the Routine** "DriveOne Direct purchase alert" (`trig_01BGnF7JZbLJV8EkmmdNH4sC`,
   hourly at :09) in the claude.ai Routines UI: attach the **Supabase** connector and the
   `insureifyRyan/driveone-design-system` repo, then enable it. It was created disabled
   because connectors cannot be attached from a coding session.

## Run by hand

```bash
# preview, posts nothing
node scripts/dod-purchase-alert.mjs --state state.json --dry-run rows.json

# live
SLACK_DOD_PURCHASE_WEBHOOK=https://hooks.slack.com/services/... \
  npm run alert:dod -- --state state.json rows.json
```

`rows.json` is the result of `scripts/dod-purchases.sql`: a JSON array of rows, or the raw
Supabase `execute_sql` output, which the script unwraps.
