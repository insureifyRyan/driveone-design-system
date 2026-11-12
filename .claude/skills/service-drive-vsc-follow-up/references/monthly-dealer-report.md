# Monthly dealer report (Ferrario Ford)

Recipe run by the scheduled task "Ferrario monthly dealer report"
(`trig_01RELffdJGNhCUzxQafgBZa6`, 1st of each month, 13:17 Eastern, bound to
the session that built the campaign), and runnable by hand in any session with
the Supabase and Gmail connectors. It refreshes the dealer-facing program
report, republishes it, renders a PDF and emails the PDF to ryan@kovara.ai for
forwarding. The report is written for the dealer and is deliberately short:
no customer names, emails, VINs or plates, ever, and nothing the dealer does
not need to act on.

Template: `reports/ferrario-ford/program-report-<YYYY-MM>.html` in this repo
(the latest one is the starting point; copy it to the new month's name).
Published artifact: https://claude.ai/artifact/WCXBksKfHQsAa7cxuXqeeN
(republish by passing that `url`; a publish without it makes a new link).

## Section order (large to small, keep it)

1. What the lot cameras showed. Static figures from Captured's June to August
   reconciliation (`recon.xlsx`, kept out of the repo): four tiles, the
   funnel table, one chart (visits by week). Only changes when a new Captured
   reconciliation arrives through the inbox ingest.
2. Where those people are now. Three tiles, descending.
3. The three audiences. On the list / eligible / quoted / in sequence.
4. Who is eligible, and why the lists shrink. Rules only.
5. What the emails say. Changes only with a copy deck change.
6. Pricing. Average, range, model years of what was priced.
7. What has happened so far. Append the month's dated rows; drop rows older
   than three months once the table is longer than six rows.
8. What Ferrario Ford should expect. Operational: calls, replies, opt-outs,
   sales, this report.
9. Planning ranges. Replace with actuals against the ranges as purchases land.

Things already cut on purpose, do not bring them back: plate reads by hour and
by weekday, plate states, repeat-visit distribution, the mileage-estimate box,
the October pilot paragraph, the weekly scorecard reference.

## Figures to refresh (Supabase project `bbvkqwcapqsytrdrubci`)

Run once per campaign: `ferrario-ford` (service drive),
`ferrario-ford-visited` (recall), `ferrario-ford-list` (drive-by); take each
campaign id from `brand/dealers/<id>.json`.

```sql
select
  (select count(*) from vsc_enrollment where dealer_id = $1 and campaign_id = $2) as enrolled_total,
  (select count(*) from vsc_enrollment where dealer_id = $1 and campaign_id = $2 and status = 'active') as active_now,
  (select count(*) from vsc_send_log where dealer_id = $1 and campaign_id = $2) as sent_total,
  (select count(*) from vsc_send_log where dealer_id = $1 and campaign_id = $2
     and sent_at >= date_trunc('month', now()) - interval '1 month'
     and sent_at <  date_trunc('month', now())) as sent_last_month,
  (select count(*) from vsc_send_log where dealer_id = $1 and campaign_id = $2 and provider_message_id is not null) as trackable,
  (select count(*) from vsc_enrollment e join quotes q on q.id = e.quote_id
    where e.dealer_id = $1 and e.campaign_id = $2 and q.payment_status = 'completed') as purchased_total,
  (select coalesce(sum(q.contract_price), 0) from vsc_enrollment e join quotes q on q.id = e.quote_id
    where e.dealer_id = $1 and e.campaign_id = $2 and q.payment_status = 'completed') as revenue_total;
```

For the two audience buckets, the pipeline in front of the cohort:

```sql
select bucket,
  count(*) filter (where quote_id is not null) as quoted,
  count(*) filter (where quote_id is null and status_at_load = 'NEW' and quote_attempts < 3) as unquoted,
  count(*) filter (where quote_id is null and quote_attempts >= 3) as parked
from vsc_audience where dealer_id = 'ferrario-ford' group by bucket;
```

Opens, clicks, bounces and complaints come from the event columns workflow 03
writes on `vsc_enrollment`, and from Resend `get-email-metrics` per sending
domain (`ferrario.driveoneprogram.com`, `ferrario.driveoneservice.com`).
Report delivery as a share of trackable sends, never of all sends.

Purchases come from `quotes.payment_status = 'completed'`, never from
`exit_reason` (workflow 07's Gather Numbers node explains why). A purchase is
the one figure the dealer reads first.

## Steps

1. Copy last month's template to the new month's filename. Update the
   "Figures as of" line, the tiles, the audiences table, the status table
   and the planning table from the queries above.
2. Render a check with Playwright (viewport 1100 wide) and read the
   screenshot: no tile wraps, no empty chart.
3. Publish with the Artifact tool to the url above (`label` the month).
4. PDF: Playwright `page.pdf({ format: 'Letter', printBackground: true,
   margin: 0.5in all round })`, named
   `Ferrario-Ford-Program-Report-<YYYY-MM-DD>.pdf`, in the scratchpad.
5. Email the PDF to ryan@kovara.ai with `mcp__Gmail__send_message` (sha256
   file reference), subject "Ferrario Ford program report, <Month YYYY>", a
   five-line plain-text note of what moved, and the artifact link.
6. Commit the new HTML (never the workbook, never a customer list), push.
