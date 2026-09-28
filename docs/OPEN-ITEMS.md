# Open items before this campaign can send

Nothing in here blocks review of the creative. Everything in here blocks hitting send.
Ordered by how expensive it is to get wrong.

---

## 1. New York is not on the approved state list

**Severity: blocking. Resolve this first.**

Bob Johnson Auto Group is a Rochester, New York operation. Every store, every service
customer, every garaging address in this audience is NY.

The DriveOne launch state list on record is PA, TX, FL, OH, NC, SC and WI. New York is
not on it. There is a separate note that NY contracts run through ORIAS as obligor,
which suggests NY is contemplated, but "contemplated" and "filed and approved" are
different things, and VSC forms are regulated state by state.

Before any of this sends, confirm in writing:

- The VSC form is filed and approved for sale in New York.
- ORIAS is the correct obligor on the NY form, and the footer names the right entity.
  The templates currently print Ascent Administration Services LLC. If NY requires
  ORIAS, `brand/offer.json` needs a per state obligor map and the footer needs to read
  from it.
- Bob Johnson Auto Group holds whatever NY licensing or registration selling a VSC
  requires of the dealer.

If New York is not approved, this campaign cannot run at this dealership at all, and
that is worth knowing before anyone reviews subject lines.

---

## 2. The word "warranty"

The program was described as a "post sale warranty program." The standing DriveOne
compliance rule is that the product is never called a warranty. It is a vehicle service
contract, or coverage. Warranty refers only to the customer's factory warranty, which
this audience no longer has.

All ten emails follow the compliance rule, not the brief. `npm run check` enforces it.
Flagging rather than silently choosing: if the rule has changed, say so and the check
script comes out.

Related, still unresolved from before this campaign: the ads print
`EXTENDED SERVICE CONTRACT` while the digital flyer, the Notion logo page and the signed
VSC application all print `EXTENDED WARRANTY`. The templates use
`EXTENDED SERVICE CONTRACT`. One of those two artifacts is wrong and somebody has to
pick.

---

## 3. Claims that need substantiation on file

| Claim | Where | What is needed |
|---|---|---|
| Plans start at `$49` a month | Emails 1 and 5 | At least one genuinely available plan at that price for a vehicle in this audience. A "starting at" price is a price claim and needs a real SKU behind it. |
| `$0` deductible at our store, `$100` elsewhere | Emails 1 and 4 | Contract language on record reads `$0` when the vehicle returns to the selling dealer. For a dealer sold contract the selling dealer is Bob Johnson, so this should be correct. Confirm against the NY form specifically. |
| Exclusionary coverage on **all** plans | Emails 1 and 6 | The brief says all plans are exclusionary. Tiers on record are Silver, Gold and Platinum. Confirm all three are exclusionary and none is a listed component plan. |
| 0% for up to 36 months, 5% down, no credit check | Emails 1 and 5 | Confirm 5% down and the 0% / 36 month terms are both current, and that "payment plan, not a loan" survives NY lending review. |
| Rental `$35` per 6 hours, `$250` max | Email 8 | Confirm against the NY form. |
| Diminished value | Email 8 | Written as "up to the contract maximum," formula based, deliberately never a flat figure. The source figure for the maximum was unreadable in the brand record and was not guessed. Supply it if it should appear. |
| Openbay | Email 8 | Named as an included partner benefit. The standing rule requires explicit sign off before naming Openbay in customer facing copy. Get it, or the line comes out. |

**No repair cost figures are used anywhere in the campaign.** The alternator and
transmission numbers in the brand record were corrupted and unreadable, and stale repair
figures are a compliance problem. Email 2 makes the repair cost argument without naming a
dollar amount. If you want real numbers, source them fresh from RepairPal and date them
on the creative.

---

## 4. Consent and sender identity

This is marketing sent on behalf of the dealership to its own service customers.

- **Sender identity.** The from address, friendly from and reply-to must make clear the
  mail comes from Bob Johnson. `SEND_FROM` should be a Bob Johnson domain, not a
  DriveOne one, or the co-branding is undercut and deliverability suffers.
- **Physical address.** CAN-SPAM requires a real postal address in every message. The
  footer prints it from `brand/dealers/bob-johnson.json`, which is currently
  `PLACEHOLDER`.
- **Consent basis.** Confirm the dealer's service customer records carry a marketing
  email consent basis and that the DMS feed excludes anyone who has already opted out at
  the dealership level. The campaign's own suppression list does not know about
  unsubscribes that happened in the dealer's other systems.
- **Bulk sender requirements.** One click `List-Unsubscribe` and
  `List-Unsubscribe-Post` headers are implemented in the scheduler. The sending domain
  still needs SPF, DKIM and a DMARC policy before any volume.

---

## 5. Brand assets are placeholders

`bobjohnsonautogroup.com` is blocked by this environment's network egress proxy, on both
the www and apex hostnames. Nothing in this repo was sampled from the live site.

Everything currently in `brand/dealers/bob-johnson.json` marked `PLACEHOLDER` or
`REPLACE-ME` is a guess: colors, logo URLs, tagline, address, phone.

Replacing them is a single file edit followed by `npm run build`. No template, no
workflow and no copy needs to change. See `README.md`.

Logos must be hosted at absolute `https` URLs. Email clients will not render relative or
local paths.

---

## 6. n8n could not be wired directly from this session

The n8n MCP server requires OAuth and this session is non-interactive, so nothing was
pushed into a live n8n instance. Authorize it in claude.ai connector settings, or via
`/mcp` in an interactive session, and the workflows can be created through the API
instead of imported by hand.

The importable JSON in `n8n/workflows/` is the better artifact regardless: it is version
controlled, diffable, and regenerated from the same copy deck that builds the emails, so
the cadence cannot drift between the creative and the automation.
