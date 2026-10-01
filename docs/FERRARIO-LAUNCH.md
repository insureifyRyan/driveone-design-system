# Ferrario Ford, what is left before it can send

Everything the engine needs is built and green. What remains is dealership facts, a domain,
and one decision that two documents in this repo currently disagree about.

Run `npm run check:launch -- ferrario-ford` at any point for the machine-checkable subset.

---

## Open, in the order they block things

### 1. Postal address, service phone, reply-to  — BLOCKING

`npm run check:launch` fails on all three.

- **Address.** A physical postal address in the footer is a CAN-SPAM requirement. The
  group's anniversary badge reads FERRARIO / ELMIRA / ESTABLISHED 2008 and Geoff Crossley's
  number is a 607 (Elmira) exchange, so Elmira NY is strongly indicated, but that badge
  names the *group*. Get the Ford rooftop's own street address.
- **Service phone.** `607-526-7748` is Geoff Crossley's number on the partner record, which
  is the **program** contact, not a customer-facing service line. The footer prints the
  public service number. Bob Johnson made the same distinction.
- **Reply-to.** A monitored mailbox on ferrario.com. The emails are written as though the
  service drive sent them, so replies have to reach a human at the dealership.

### 2. The sending domain — CLEARED 1 Oct 2026

**Resolved without the dealership.** Ferrario sends from `ferrario.driveoneprogram.com`,
a DriveOne-owned subdomain, verified in Resend on 1 Oct 2026 with all four records green.
`docs/ferrario-dns-request.txt` is no longer needed and is kept only as the template for a
dealership that does want to publish its own records.

    SEND_FROM = Ferrario Ford Service <service@ferrario.driveoneprogram.com>

**`docs/DELIVERABILITY.md` is the runbook for this phase** and covers what the DNS request
does not: reading their existing DMARC before sending rather than after, whether the From
belongs on the root domain or a subdomain, the enrolment ramp, and the received-header proof
that has to pass before any volume.

Assume the mailbox has MFA and that SMTP is therefore impossible. That is the Microsoft
default now, not an unusual restriction. Do not spend a day discovering it: sign in to
office.com as the sending address, and an Authenticator prompt means SMTP is closed whatever
anyone says about the password.

**Verify the domain before enrolling anybody.** Bob Johnson enrolled 150 people and then sat
blocked on DNS for days; every send date that passed became due-now.

### 2b. Reply-to — THE LAST BLOCKER

Recommendation: **a Google Group on `driveoneprogram.com`**, e.g.
`ferrario-service@driveoneprogram.com`, with the dealership's service mailbox AND a DriveOne
person both as members.

**Why a Group rather than a mailbox.** It costs no Workspace licence, it is a distribution
list by nature so it answers "do we need the dealership mailbox as well" with "yes, as a
member rather than as an alternative", and every reply lands in front of both parties at
once. The dealership can answer the sales questions; DriveOne can action the opt-outs.

**Why not Resend inbound.** Checked 1 Oct 2026: Resend Inboxes is in beta and this account
has not joined it, so the route that would have auto-suppressed opt-out replies is not
available today. Worth revisiting if the account joins the beta, because it is the only
option that removes the human step entirely.

**Why not a plain `@ferrario.com` address.** It was the better answer while the campaign
was sending as the dealership. It is not any more: the From is
`service@ferrario.driveoneprogram.com`, so a DriveOne reply-to is consistent with what the
customer already sees rather than a step down from it. More importantly, a reply-to nobody
at DriveOne can see puts a legal obligation on a mailbox nobody here owns. See below.

**The compliance reason this matters.** Nothing in the system reads replies. Workflow 03
handles Resend webhooks: bounces, complaints, and the one-click unsubscribe button. A
customer who types "take me off this list" into a reply is invisible to the campaign and
will receive all ten emails. CAN-SPAM requires an opt-out to be honoured within 10 business
days **however it is expressed**, and a reply is a valid expression of it. On 3,500 sends a
handful of replies will say exactly that. Whoever reads the Group needs a standing
instruction to suppress those customers.

**The Workspace trap, which has bitten this build before.** A new Google Group defaults
**Who can post → External: UNCHECKED**. Customer replies arrive from external senders, so
without ticking it every single reply bounces and nobody finds out until someone asks why
the campaign gets no replies. Ticking External flips the listed Access type from "Public" to
"Custom", which is expected and not an error. Set it at creation:

- Who can post → **External: CHECKED**
- Who can join → Only invited users
- Allow external members → checked, if the dealership mailbox is on `ferrario.com`

Set `contact.replyTo` in the dealer file once the Group exists, and `npm run check:launch`
stops failing.

### 2c. Reply routing setup — the steps

Chosen 1 Oct 2026: a forwarding service on `ferrario.driveoneprogram.com`, so the Reply-To
is the SAME address as the From. Picked over a Google Group and over reusing a personal
mailbox for one reason that is a real defect rather than a preference: the From address
`service@ferrario.driveoneprogram.com` currently has no MX, no A and no CNAME, so it cannot
receive mail at all. Auto-responders and clients that ignore Reply-To send to From, and
every one of those hard bounces today. This fixes that as a side effect.

**1. Create the forwarder.** Sign up with an email forwarding service (ImprovMX, Forward
Email or similar; check the current free-tier limits before committing). Add
`ferrario.driveoneprogram.com` as the domain.

**2. Add the MX records it gives you, in Vercel.** Use the exact hostnames the service
shows rather than any remembered from elsewhere. Typically two:

    npx vercel dns add driveoneprogram.com ferrario MX <their-mx-1> 10
    npx vercel dns add driveoneprogram.com ferrario MX <their-mx-2> 20

> **The Name is `ferrario`. Not blank, not `@`.**
>
> Blank or `@` puts an MX on `driveoneprogram.com` itself, which already carries Google
> Workspace MX for real people's mailboxes. A second MX at the root, at a lower priority
> than Google's `1`, silently steals inbound mail for Marc, Stephen and Hannah. There is no
> error; mail just stops arriving. This is the one genuinely destructive mistake available
> in this whole setup, and it is one character away from the correct entry.
>
> Related and harmless: `send.ferrario` ALREADY has an MX, the Resend Return-Path. It is a
> different record at a different name. Leave it alone; both coexist.

**3. Do NOT add the forwarder's SPF record** unless you intend to SEND through them. This
is forwarding only. Resend's sending SPF lives at `send.ferrario` and is already verified;
an unnecessary SPF at `ferrario` is one more thing to get wrong later.

**4. Create the alias:** `service@ferrario.driveoneprogram.com`, forwarding to BOTH the
DriveOne watcher and Ferrario's service mailbox.

**5. Verify before trusting it.** Check the MX authoritatively on both Vercel nameservers,
then actually send a message to `service@ferrario.driveoneprogram.com` from an outside
address and confirm it lands in both destinations. A forwarder that silently drops mail
looks exactly like a campaign nobody replies to, and you would not find out for weeks.

**6. Set `contact.replyTo`** to `service@ferrario.driveoneprogram.com` and rebuild. That
clears the last `check:launch` failure.

### 3. Brand palette — confirm, not blocking the build

The client supplied artwork on 30 Sep 2026 and the palette in `brand/dealers/ferrario-ford.json`
was read off it by eye: deep navy ground, red wordmark. That is the right *family*, which is
what matters most, because the previous values were a guessed Ford corporate blue and accent
drives every button and rule in the email. Confirm the exact hex against a brand sheet.

Two deliberate omissions from the lockup, both documented in the dealer file:

- **The cowboy hat** resting on the final O has no type equivalent, the same problem as
  DriveOne's own D mark. The header carries a type lockup, which is also what any recipient
  with images disabled sees.
- **The Ford oval** is omitted because this email sells a DriveOne VSC administered by
  Ascent and, in New York, obligated by ORIAS. Ford is not the administrator, the obligor or
  the seller, and setting their oval beside the offer implies a manufacturer endorsement
  that does not exist. If someone wants it in the header, that is a question for Ford's
  trademark guidelines and the client's Ford rep, not a build setting.

### 4. Rooftop versus group — RESOLVED

Two marks were supplied and they are different businesses. **Ferrario Ford** is this
rooftop. **Ferrario Auto Team / Truck Country USA** is the group, whose badge carries
Chevrolet and Jeep marks alongside Ford. This campaign is the Ford rooftop's own service
drive, so customer-facing material reads Ferrario Ford. Widening the audience to the Chevy
or Jeep rooftops means a new dealer file with the group lockup, not an edit to this one.

### 5. Legal name, website, service area — not blocking

Still `NEEDS CONFIRMATION`. None of them gate a send; they appear in footer and body copy.

---

## The one thing two documents disagree about

**Which Supabase project holds Ferrario's campaign tables.**

- `brand/dealers/ferrario-ford.json` sets `supabase.project_id` to `bbvkqwcapqsytrdrubci`,
  the shared DriveOne production project, which is also where the service drive source data
  lives and where Bob Johnson's tables already are.
- The fork's original bootstrap instructions assumed a **fresh project** for Ferrario, with
  cross-database intake and a deployed copy of the unsubscribe function.

Both are workable and the tables are keyed on `(dealer_id, campaign_id, ...)`, so the shared
project can hold every dealership without collision. The shared project is simpler, keeps
intake a single statement, and is what the dealer file currently says. It has not been
resolved here because it is an operational call rather than a code one, and choosing wrong
in the direction of "fresh project" quietly costs an unsubscribe deployment.
`docs/ADDING-A-DEALERSHIP.md` step 2 lays out what each choice costs.

## Numbers worth keeping in view

| | Bob Johnson | Ferrario |
|---|---|---|
| Eligible customers | 447 | **1,244** |
| Already own coverage | 37 (8.3%) | 1 (0.08%) |
| Backlog freshness | stale, Feb to Sep | **1,222 of 1,244 inside 90 days** |
| Opening cohort | 150 | **350** |
| Campaign id | `bj_postro_vsc_2026` | `ff_postro_vsc_2026` |

**Cohort is 350, not 1,244, and that is deliberate.** Total sends are `cohort x 10` however
slowly you feed people in, so 1,244 is 12,440 sends over roughly 34 send days: about 366 a
day against a 200 cap. The cap cannot absorb that, it just pins the domain at its ceiling
for weeks. Raise it once the first cohort's bounce and complaint rates come back clean.

**The 0.08% coverage rate is the residual risk.** `has_existing_warranty` is the only guard
against pitching coverage to someone who already owns it, and Ferrario reports 1 owner in
1,244 against Bob Johnson's 37 in 447. The rating API will happily quote an existing owner
because it has no idea they have a contract. If Ferrario under-reports the flag, those
customers receive the campaign; at Bob Johnson's rate that would be roughly 100 people. The
filter is written `= false`, which excludes nulls as well as trues, so an unknown is treated
as ineligible. That is the safe direction.

**The copy deck is shared.** `email/copy/campaign.json` is one deck rendered per rooftop.
If Ferrario's arguments should differ from Bob Johnson's, that is a real change and it needs
somewhere to live, because today editing the deck edits both campaigns. The voice rules are
not negotiable either way: no exclamation points, no em dashes, and the product is never
called a warranty. `npm run check` enforces all three.
