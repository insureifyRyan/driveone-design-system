# Captured inbox ingest (Ferrario)

Recipe run by the scheduled task "Captured inbox ingest (Ferrario)" every weekday
morning, and runnable by hand in any session that has the Microsoft 365 and
Supabase connectors. It turns reports emailed by Capture Data Services into
`vsc_audience` rows, which workflow 01 then quotes (fifty an hour) and enrols
once the bucket's `initial_cohort` is above zero. Nothing here sends email.

## Who and what to look for

Mailbox: ryan@kovara.ai (the signed-in Microsoft 365 account).
Senders: `eric.nordlund@captureds.io`, `tim.morford@captureds.io` (Captured
often forwards Tim's reports through Eric, so the sender is Eric and Tim is in
the quoted header).

Relevant mail is anything from those two that carries, or links to, a table of
vehicles or customers for Ferrario Ford: subjects or attachment names such as
"Campaign Reconciliation", "RO data", "ROData.csv", "Ferrario", "Lane Capture",
"camera", "lot". A Bob Johnson or Mark Allen report is NOT loaded by this
recipe; note it in the summary and leave it.

Ledger: `vsc_inbox_ingest` (Supabase project `bbvkqwcapqsytrdrubci`). One row
per Outlook message id. A message in the ledger is never processed again, so
the search can be wide and cheap.

## Steps

1. Load tools: `ToolSearch select:mcp__Microsoft_365__outlook_email_search,mcp__Microsoft_365__read_resource,mcp__Supabase__execute_sql`.
2. `select message_id from vsc_inbox_ingest` → the processed set.
3. `outlook_email_search` with `sender` = each address in turn, `afterDateTime`
   = 14 days ago, `limit` 25, page with `offset` while `moreResults`. Keep
   messages whose id is not in the ledger and that have attachments or a
   SharePoint link in the body (the body is in `read_resource`).
4. For each kept message, `read_resource` the `mail:///messages/{id}` URI. For
   each attachment that is .xlsx or .csv, `read_resource` the attachment URI
   (xlsx reads one worksheet per page: `startPage`/`endPage`; a 2 MB workbook is
   several pages of ~200k characters, so read one sheet at a time and extract
   as you go, never all at once). A SharePoint link in the body is a
   `file:///` resource only if it is in Kovara's tenant; a link into
   capturedsio-my.sharepoint.com cannot be read by the connector: record the
   message in the ledger with notes = "external link, not readable" and say so
   in the summary so Ryan can ask for the file as an attachment.
5. Extract rows. A usable row has a 17 character VIN (no I, O, Q) and an email
   with an @. Carry the customer name if there is one. Decide the bucket from
   the sheet or column headings:
   - "service", "visit", "came in", "RO", "repair order", "recall" → `visited`
   - "drive by", "drove by", "not in DMS", "camera", "plate", "lot", "lane" → `list`
   - unclear → `list`, and say so.
6. Dedupe before loading. Skip a row when ANY of these already holds the VIN
   (case-insensitive) or the email (lower, trimmed):
   - `vsc_audience` where dealer_id = 'ferrario-ford' (any bucket)
   - `vsc_enrollment` where dealer_id in ('ferrario-ford','ferrario-ford-visited','ferrario-ford-list')
   - `customer_vehicles cv join quotes q on q.customer_vehicle_id = cv.id` where
     q.partner_id = 'bd2de835-a881-467c-b78b-c5963ff9fbd5' (VIN), or
     `customers c join quotes q on q.customer_id = c.id` with that partner (email)
   Also skip the dealership's own addresses and junk (`@ferrario`, `noemail`,
   `none@`, `test@`).
7. Insert the survivors into `vsc_audience` in batches of 200:
   `(dealer_id, bucket, email, vin, customer_names, source_campaigns,
   status_at_load, loaded_at, source, model_year, est_mileage, mileage_basis)`
   = ('ferrario-ford', bucket, email, upper(vin), name, NULL, 'NEW', now(),
   '<subject> / <attachment> / <message date>', model year from VIN position 10
   (letter or digit, 2010+ cycle when position 7 is a letter), greatest((2026 - year) * 15000, 7500),
   'estimated 15k/yr'). `on conflict (dealer_id, bucket, email, vin) do nothing`.
   Do not insert rows with no VIN; they cannot be quoted.
8. Insert the ledger row for every message looked at, loaded or not:
   message_id, internet_message_id, sender, subject, received_at,
   attachment_name, dealer_id 'ferrario-ford', rows_seen, rows_loaded, buckets,
   notes.
9. Summary for Ryan, one short paragraph: messages found, rows seen, rows
   loaded per bucket, rows skipped as already known, anything unreadable. If
   nothing new arrived, one line saying so. Never paste customer rows.

Workflow 01 for each bucket (recall `UC9l4GQBJXIRKkJI`, drive-by
`JDB3DiprdnKBN8Op`) picks the new rows up on its next hourly sweep, decodes the
VIN and creates the quote. No workflow change is needed for new rows.
