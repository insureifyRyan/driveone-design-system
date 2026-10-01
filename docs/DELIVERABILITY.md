# Deliverability and sending readiness

Applies the cold-email infrastructure playbook to this campaign. Most of it transfers. Some
of it does not, and the parts that do not are the dangerous ones, because a rule applied
out of scope reads exactly like a rule applied correctly.

---

## This is not cold email, and that changes four things

The playbook is written for outbound prospecting to strangers. This campaign goes to the
dealership's own service customers, days after they stood in the service drive and paid an
invoice. That is an existing business relationship, and it flips four of the playbook's
rules.

**1. "Permission-based ESPs are disqualified" does not apply here.** The playbook lists
Resend, Mailchimp and HubSpot as disqualified because they require opted-in lists and will
throttle or suspend a cold send. That is their contract, and this campaign satisfies it:
these are the dealership's own customers with a transactional relationship. Resend is the
right platform for this and should not be swapped for a cold-email sequencer. Do not read
that line as a finding against the current build.

**2. "Never send from the money site's domain" inverts.** For cold outbound the sending
domain must be disposable. Here the whole premise is that the dealership sent it, so it has
to be their real domain. The underlying concern is still live, and is actually worse, which
is the next section.

**3. Tracking should not simply be turned off.** The playbook's 2026-08-07 correction turns
click tracking off for cold email, because bots click everything and tracked links are a
deliverability tax. Here the click is not an analytics nicety: `linkMode: short` and the
events webhook are how a customer reaches their quote and how the campaign learns they
bought. Keep click tracking. **Open tracking is a different question and should be off** —
Apple Mail Privacy Protection has made the open pixel close to meaningless, and it is a pure
deliverability cost.

**4. Warmup is shorter, but it is not zero.** ferrario.com is an established domain with
years of ordinary business mail behind it. What has no history is *this sending path*:
Resend over Amazon SES, signing with a brand new DKIM key. Receivers score the combination.
The 21-day cold ramp is too conservative here; sending 82 messages on day one is too
aggressive. See **The ramp** below.

---

## What transfers unchanged

**Verify DNS against the authoritative nameservers, never the registrar's table.** Use the
playbook's `verify_dns.py`. Query both nameservers; anycast nodes disagree for a minute or
two after a write, which is indistinguishable from a failed write if you only check one.

**Never confirm a write by reading the thing that accepted it.** Resend's dashboard saying
"verified" is corroboration. A received message header is proof.

**Publishing DKIM is not the same as signing with it.** The exact procedure is below.

**Do not purchase anything, and do not send on the client's behalf without explicit
per-action permission.** Permission for the DNS records is not permission for a test send to
a third party.

---

## The gap in the current DNS request

`docs/ferrario-dns-request.txt` asks for four records: the DKIM key, the Return-Path MX and
SPF on `send.ferrario.com`, and the sending CNAME. Those four are correct and the warning it
gives about not touching the existing root SPF is exactly right.

**It never mentions DMARC, and that is the one to check before sending rather than after.**
Do not send them a DMARC record to add. Read what is already there:

```bash
# Find their authoritative nameservers first. The script defaults to Vercel's,
# and ferrario.com is very unlikely to be on them.
dig +short NS ferrario.com          # or: python3 -c "import dns.resolver;
                                    #   print([str(r) for r in dns.resolver.resolve('ferrario.com','NS')])"

python3 verify_dns.py ferrario.com \
  --ns <their nameserver IPs> \
  --check _dmarc.ferrario.com:TXT
```

The script lives in the cold-email-infrastructure skill, at `scripts/verify_dns.py`. It is
referenced rather than vendored into this repo on purpose: a copied script is a script that
drifts, which is the same reasoning that merged the Ferrario fork back in. It needs
`pip install dnspython`.

Three outcomes:

- **No DMARC record.** Nothing blocks the send. Worth proposing `p=none` with a same-domain
  `rua` afterwards, for the reporting, but it is not a launch gate.
- **`p=none`.** Nothing blocks the send.
- **`p=quarantine` or `p=reject`.** Now alignment matters, and it is worth ten minutes of
  care. The From is `@ferrario.com` and DKIM signs with `d=ferrario.com`, so **DKIM aligns
  under both relaxed and strict**. SPF authenticates `send.ferrario.com`, which aligns with
  `ferrario.com` under relaxed (`aspf=r`) but **not under strict (`aspf=s`)**. DMARC passes
  on either identifier, so DKIM alignment carries it regardless. The failure mode to rule out
  is DKIM silently not signing, which strict policy converts from a deliverability problem
  into outright rejection.

If they already publish DMARC, **do not add a second record.** Two DMARC records is the same
class of mistake as two SPF records: it does not merge, it invalidates.

---

## Which domain sends, now that Captured's server is out

**Update 1 Oct 2026.** The sending mailbox turned out to live on Captured's server, which
is not accessible. That rules out sending *through* Captured. It does **not**, on its own,
rule out sending *as* ferrario.com.

### Check this before giving up ferrario.com

Resend authorises a sender by **DNS records, not by mail server access**. That is the whole
content of `docs/ferrario-dns-request.txt`, which already says it in as many words: no
mailbox access, no logins, no app approvals, nothing installed anywhere. So:

| What is needed | Who provides it | Blocked by losing Captured? |
|---|---|---|
| DKIM, MX, SPF, CNAME on ferrario.com | Whoever controls ferrario.com **DNS** | **No** |
| A From address at ferrario.com | Nobody. Resend sends from any address on a verified domain | **No** |
| A reply-to that reaches a human | Any monitored mailbox, anywhere | **No** |
| Sending through Captured's SMTP | Captured | Yes, and we are not doing that |

So the question to put back to the client is narrow: **do they control DNS for
ferrario.com?** If yes, the original plan stands. If DNS is also held by a vendor nobody
can reach, that is a genuine blocker and the options below apply.

One real caveat if ferrario.com proceeds: pick a From address that **actually accepts mail**,
or arrange a catch-all. Reply-To steers most replies, but some clients and most
auto-responders reply to From regardless, and those would hard bounce.

### If ferrario.com is genuinely unavailable

**Do not use the Kovara domains.** `getkovara.com`, `meetkovara.com`, `trykovara.com` and
`gokovara.com` are the dealer-acquisition cold outbound stack: 12 mailboxes, 44 days old,
nine on Google and three on Microsoft, carrying named human personas. Four reasons, in
order of how much they cost:

1. **The copy does not survive the From line.** These emails say "bring it back to
   Ferrario", "the service department you drove to", "we fixed your car". From
   `sophie@getkovara.com` that is incoherent to a recipient who has never heard of Kovara,
   and CAN-SPAM prohibits materially misleading header information. The From line is header
   information.
2. **It cross-contaminates the motion the business runs on.** Kovara prospecting and
   Ferrario customers would share a reputation. A complaint spike on 3,500 consumer sends
   lands on the domains used to reach dealership owners, and a bad prospecting week lands on
   Ferrario's customers. These should fail separately; that is the entire reason the
   prospecting stack has four domains rather than one.
3. **The warmup does not transfer the way it sounds.** Those domains are warmed through
   Google Workspace and M365, at roughly 25 a day per mailbox. Resend sends over Amazon SES.
   Domain reputation carries over partially; **IP and sending-path reputation does not carry
   at all.** You would be starting the hard part from zero anyway, while spending the good
   name of the prospecting stack to do it.
4. **The volume does not fit.** Twelve mailboxes at ~25/day is ~300/day total, and that is
   the working capacity of the Kovara motion. Ferrario alone peaks near 200/day.

To be fair to the idea: the SPF objection people usually raise does **not** apply, because
the Return-Path goes on a `send.` subdomain and never touches the root record. The problem
is not mechanical. It is that these are the wrong domains wearing the wrong name.

**Better fallback: a DriveOne-owned domain used only for dealer co-branded sends.** Not a
cold prospecting domain and not a money site. The From then reads honestly, something like
`Ferrario Ford Service <service@…>` on a DriveOne sending domain, with the body identifying
both parties and carrying the dealership's postal address, which is what CAN-SPAM actually
asks for. Costs two to three weeks of warmup before the first real send, and that is the
honest price of losing ferrario.com.

**`driveonepartners.com` is the strongest named candidate.** A lemlist audit on 1 Oct 2026
shows it already carries the team's custom tracking domain at `link.driveonepartners.com`,
which is proof that DriveOne controls its DNS — the one thing ferrario.com may turn out to
lack. It is DriveOne-branded rather than Kovara-branded, and it is not one of the four
domains the cold prospecting stack sends from, so a consumer complaint on this campaign
would not land on the dealer-acquisition motion. `driveoneprogram.com` and
`driveonedealers.com` also exist, carrying team members' addresses.

Use a dedicated subdomain on it rather than the root, for the same blast-radius reason as
above, and because the root is already doing a job.

> Worth knowing before anyone proposes reusing the warm Kovara mailboxes anyway: their
> lemwarm deliverability scores are genuinely high (98, 99 and 88 on the three readable
> ones, warming since 18 Aug 2026). The instinct that they are "warmed up" is correct. That
> warmth is reputation earned through Google Workspace and M365 SMTP, and it is the domain
> half of a two-part score. Pointing those domains at Resend puts them on Amazon SES IPs
> they have never sent from, so the path half restarts at zero regardless.

### On "these are all opt-in people"

Worth stating precisely, because the precise version is the stronger one.

These are **existing customers of the dealership** who paid an invoice days earlier. That is
an existing business relationship, it is a solid basis under CAN-SPAM's opt-out regime, and
it satisfies Resend's acceptable use policy. It is **not** express marketing opt-in, and
nobody ticked a box. If complaints ever spike and Resend asks for the consent basis, "these
are service customers of the dealership that sent the email, with suppression and one-click
unsubscribe honoured" is defensible and true; "they opted in" is neither, and would be the
worse answer at exactly the wrong moment.

The practical point: **the list question and the domain question are independent.** Resend
accepts this list from ferrario.com just as readily as from anywhere else. Using a Kovara
domain unlocks nothing with Resend, because the list was never what blocked it.

## Blast radius: root domain or subdomain

The campaign sends from `<TBC>@ferrario.com` — the dealership's primary business domain,
the one their Microsoft 365 mail runs on. Everything from deal paperwork to recall notices
shares that reputation.

This is the playbook's "never burn the money domain" concern arriving in a different shape.
It cannot be solved by using a disposable domain, because the point is that the dealership
sent it. It can be substantially reduced by moving the **From** to a subdomain:

| | From on root `ferrario.com` | From on `mail.ferrario.com` |
|---|---|---|
| Looks like the dealership | Yes | Yes, to almost every recipient |
| Complaint damage hits business mail | **Yes, directly** | Largely contained to the subdomain |
| Extra setup | None | DKIM and SPF on the subdomain instead |

Most receivers track subdomain reputation with meaningful independence from the parent.
Bulk and marketing mail on a subdomain, transactional and corporate mail on the root, is
the standard split and it exists for exactly this reason.

**Recommendation: move the From to a subdomain before the first send.** The Return-Path is
already on `send.ferrario.com`, so the shape is half built. This is a decision for Ryan and
the client rather than a code change, and it is much cheaper now than after a bad week.

---

## The ramp

Total sends are cohort x 10 however slowly people are fed in. What the ramp controls is the
shape, and shape is what a sending path with no history is judged on.

`node scripts/simulate-volume.mjs ferrario-ford` against the live dealer file:

| Intake per day | Peak/day | First six send days |
|---|---|---|
| 350, all at once | **200** (pins the cap) | 82, 80, 100, 176, 164, 160 |
| 60 | 168 | 10, 26, 52, 77, 133, 130 |
| 40 | 161 | 8, 20, 33, 46, 98, 86 |
| 30 | 142 | 7, 15, 22, 36, 69, 63 |
| 20 | 130 | 6, 10, 18, 25, 41, 46 |
| 10 | 106 | 2, 5, 10, 13, 17, 25 |

Enrolling the full cohort at once starts at 82 sends on day one and reaches the 200 cap
inside a fortnight. Nothing about that is illegal or broken, and it is a poor way to
introduce a brand new DKIM key to Gmail.

**Recommended ramp.** Raise `supabase.initial_cohort` in steps rather than setting 350 on
day one. It is now a ceiling on *total* enrolment, so raising it is the feed rate:

| Days | `initial_cohort` | Roughly |
|---|---|---|
| 1 to 3 | 30 | single digits to ~20 a day |
| 4 to 7 | 90 | ~30 to 50 a day |
| 8 to 14 | 200 | ~60 to 100 a day |
| 15+ | 350 | full cohort, peak ~200 |

Watch bounce and complaint rates at each step before taking the next one. This is also the
mechanism for raising the cohort past 350 later, which the dealer file already anticipates.

> **This only works because of a bug fixed on 30 Sep 2026.** `initial_cohort` fed a bare
> `limit` on an **hourly** sweep, so it capped one run rather than the campaign. At 350 with
> 1,244 eligible, intake would have taken 350 in the first hour, 350 in the second, and had
> everyone enrolled before lunch: 12,440 sends at ~366 a day against a 200 cap, the exact
> outcome the cohort is documented as preventing. Nothing errored, because every row was
> genuinely eligible and the conflict clause made re-runs free. The limit now subtracts rows
> already enrolled, and `n8n/verify.mjs` fails the build if that subtraction disappears.

---

## Proof before volume

Ordered. Each gates the next.

**1. DNS verified authoritatively.** All four records, queried against ferrario.com's own
nameservers, plus the DMARC read above. Not the Resend dashboard.

**2. Resend reports the domain verified.** Necessary, not sufficient.

**3. A real received header.** The hard gate. Send from the Ferrario sending address to a
mailbox **on a different provider**, open the *received* copy, and confirm all of:

- `dkim=pass header.i=@ferrario.com`
- `DKIM-Signature ... d=ferrario.com`
- `spf=pass`
- `dmarc=pass`
- `header.from=<the sending address>`
- delivered to **Inbox**, not spam
- the CAN-SPAM postal address present in the received body

Three ways this goes wrong, all from the playbook and all still true here:

- **The sender's own copy is useless.** It carries no `DKIM-Signature` and no
  `Authentication-Results`; signing happens on the way out and those headers exist only on
  the delivered copy.
- **A self-addressed message is useless.** It never crosses a real SMTP hop.
- **Direction matters.** Mail *to* ferrario.com proves nothing about ferrario.com's signing.

**Pick the seed deliberately.** ferrario.com is Microsoft-hosted, so send to a Gmail address,
not to another ferrario.com mailbox. And know the Microsoft-specific trap: **Defender
quarantines at the tenant level.** The message is accepted at SMTP, so there is no bounce
and Resend's log reads "delivered", but it appears in neither Inbox nor Junk. If a test
message vanishes with a clean send record, check the tenant quarantine console before
concluding the send failed.

**4. Register ferrario.com in Google Postmaster Tools** before the first real send, so there
is a baseline to compare against. It reports nothing useful without volume, which is exactly
why it has to be in place first.

**5. `npm run check:launch -- ferrario-ford` passes.** Currently four failures: postal
address, service phone, reply-to, and the verified domain behind them.

**6. Then, and only then, enrol.** Do not enrol before sending works. Rows go due while the
scheduler is off, so a cohort enrolled during a DNS delay turns into a backlog of past-due
sends that has to be re-spread before launch. Bob Johnson enrolled 150 people and then sat
blocked on DNS for days.

**7. Do not publish workflow 02 to run a test send.** Publishing the scheduler during a send
window mails real customers within the hour. Use a throwaway workflow that reads one real
row and sends only to you.

---

## Deliberately not done

No DNS was queried, no domain verified, no Postmaster registration, no test send. All of it
touches the client's live domain or their customers, and none of it is authorised by a
request to apply this playbook. The DNS request in `docs/ferrario-dns-request.txt` is still
waiting on Geoff, and it remains the first blocker.
