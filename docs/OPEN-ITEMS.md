# Open items before this campaign can send

Most of the original list is now closed against the executed contract form
(`Elevate_Platinum_VSC_Contract_1.pdf`, AAS VSC 1 11-2022, 16 pages). What is left is
short and mostly operational.

---

## Still open

### 1. The VSC ownership flag does not exist in the data

The audience was described as everyone without a VSC in their profile, or with a 0 in that
column. No such populated column exists anywhere in the Supabase project. Intake currently
uses `quotes.payment_status = 'pending'` as the proxy, which is equivalent today because
all 474 are pending, but is not the same rule once people buy, and misses coverage bought
elsewhere. See `docs/SUPABASE.md`. Needs an answer before the first send.

**Resolved:** repair order data. There is no RO table, but the service drive writes one
quote per visit, so `quotes.created_at` is the visit date and `customer_vehicles` carries
year, make, model and mileage. Op codes do not exist, so the services line was removed
from the template.

### 2. Where the monthly price comes from

The emails now show each recipient's real monthly figure in the card, no click needed. The
plumbing is done; the source is not settled. Do not let anything compute it from the rate
tables: those do not reproduce real quotes and come out 10 to 20 percent low. See
`docs/SUPABASE.md`. Related: 191 of 474 vehicles are over 100,000 miles and no rate bracket
covers them.

**Closed:** the `$49` claim. It is gone, replaced by real per-recipient pricing. Observed
monthlies run about 56 to 80 dollars, so it was not supportable.

### 3. Assets and contact details

| Item | Status |
|---|---|
| Logo file | **Done.** Uses the dealer's real logo from the MetricBridge dealer record, a public Supabase URL. Not visually checked, since this environment cannot reach supabase.co, so eyeball one preview. |
| Service phone | **Done.** (315) 782-8436, confirmed from the dealership page. Sales, service and parts share it. |
| Postal address | **Done.** 18712 US-11, Watertown NY 13601, confirmed from the dealership page. |
| Store name | **Done.** Bob Johnson Dodge Jeep Ram, per the store's own page heading. The group site also calls it Chrysler Dodge Jeep Ram, so say if it should read Chrysler. |
| Reply-to mailbox | Still `PLACEHOLDER`. |
| Quote URL base | Still `REPLACE-ME`. |

Colors are read off screenshots of the live site: black `#000000`, gold `#E9A93C`, white.
Still worth confirming the gold against the brand sheet, since it came from an image rather
than the stylesheet.

Until a logo URL is set, the header renders a type lockup that mirrors the wordmark:
black italic extrabold "BOB JOHNSON" over a gold rule with "AUTO GROUP" letterspaced
beneath. That is also exactly what recipients with images disabled will see, so it is
worth a look either way.

### 4. Consent, sender identity and deliverability

- `SEND_FROM` should be a Bob Johnson domain, not a DriveOne one, or the co-branding is
  undercut and deliverability suffers.
- Confirm the service customer records carry a marketing email consent basis, and that
  the DMS feed excludes anyone who already opted out at the dealership level. The
  campaign's own suppression list cannot see unsubscribes that happened in the dealer's
  other systems.
- SPF, DKIM and a DMARC policy on the sending domain before any volume. One click
  `List-Unsubscribe` and `List-Unsubscribe-Post` headers are already implemented in the
  scheduler.

### 5. n8n was not wired directly

The n8n MCP server needs OAuth and this session is non-interactive. Authorize it in
claude.ai connector settings, or via `/mcp` in an interactive session, and the workflows
can be created through the API rather than imported by hand. The versioned JSON in
`n8n/workflows/` is the better artifact regardless.

---

## Closed against the contract

### New York is approved, and the obligor is ORIAS

The form carries a full New York disclosure block, so NY is a covered state. From the
DEFINITIONS section:

> In New York, the Administrator/Obligor is ORIAS Warranty Services, 8282 S Memorial Dr.,
> Ste. 202, Tulsa, OK 74133, 800-331-3780

Not ORIC. The footer now resolves the obligor from the dealer's state, so Bob Johnson
prints ORIAS while a Florida dealership would print Old Republic Insurance Company and
everyone else prints Ascent Administration Services, LLC. The map is in
`brand/offer.json` under `obligor_by_state`.

NY also amends cancellation: mail delivered contracts get a 30 day cancellation window
with full refund if no claim was made, and a 10% per month penalty if a refund owed is
not paid within 30 days.

### Platinum only, and Platinum is the exclusionary tier

Confirmed, and it is the reason the exclusionary claim is safe here:

> PLATINUM COVERAGE: Includes coverages listed in SILVER COVERAGE and GOLD COVERAGE, plus
> ALL OF YOUR VEHICLE'S ORIGINAL FACTORY-EQUIPPED MECHANICAL AND ELECTRICAL PARTS, EXCEPT
> those excluded by the TERMS AND CONDITIONS and the following PLATINUM COVERAGE
> EXCLUSIONS

And the inverse, which confirms Silver and Gold are listed component plans:

> Unless You have chosen PLATINUM COVERAGE, components not listed on Your SCHEDULE OF
> COVERAGE, regardless of failure.

Silver and Gold are no longer named anywhere in the campaign.

### The deductible language is exactly as briefed

> Your Deductible is $0 per claim visit if You return the Vehicle to the selling Dealer
> for repair. If You do not return to the Vehicle's selling Dealer for repair, Your
> Deductible is $100 per claim visit.

Bob Johnson is the selling dealer on these contracts, so `$0` at store is correct.

### "Warranty"

Your call, and the campaign follows it: vehicle service contract throughout. The only
uses of the word are email 7 quoting the robocall on purpose, and the required footer
disclosure that this is not a manufacturer warranty. `npm run check` enforces this.

---

## Claims removed because the form does not support them

These came from other DriveOne material and are not in this contract. All are now out of
the campaign and recorded in `brand/offer.json` under `not_included`.

| Removed | Why |
|---|---|
| **Diminished value protection** | Appears nowhere in this contract. Was in email 8, now removed. |
| **Protection Plus** (tire and wheel, key replacement, dent repair, windshield) | Not in this program. Tires, valve stems, wheels and rims are expressly excluded under Platinum, as are glass and windshields. Was in emails 6 and 8. |
| **Openbay** scheduling and service discounts | Not part of this program, per your direction. Was in email 8. |
| **"Any ASE certified shop nationwide"** | The form defines Repair Facility as "A licensed Repair Facility (licensed as a retail merchant to perform mechanical repairs) **authorized by the Administrator/Obligor**." Authorization is required, so the open network claim was overstated. Now reads "any licensed repair facility the administrator authorizes." Was in emails 4 and 7. |
| **"Terms up to 60 months"** | Term is per contract on the Application Page, not a fixed ceiling in the form. Email 2 now says the term is set at purchase. |
| Repair cost figures | Never used. The source numbers were corrupted in the brand record, and stale repair figures are a compliance problem. Email 2 makes the argument without a dollar amount. |

## Claims added because the form does support them

| Added | Where | Basis |
|---|---|---|
| 30 day full refund, no claims made | Email 3 | Cancellation section, and reinforced by the NY amendment. |
| Transferable to a valid transferee | Email 6 | Term definition, and "You" includes "any valid transferee." |
| Towing up to $100 per occurrence | Email 8 | Roadside section, Quest Towing Services. |
| Seals and gaskets excluded past 125,000 miles | Email 9 | Platinum exclusions. This is a genuine, honest reason the window matters, which is better than manufacturing urgency. |
| Rental needs proof of rental with an authorized claim | Email 8 P.S. | Rental benefits section. |
