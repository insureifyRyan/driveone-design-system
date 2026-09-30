# Adding a dealership

A rooftop is a new file in `brand/dealers/`, a build script in `package.json`, and a
sequence of operational steps. It is never a copy of the repo.

That last sentence is the whole point of this document. This repo briefly was two repos:
the Bob Johnson build and a Ferrario fork of it. In the thirty hours before that fork was
cut, the shared engine took thirteen commits, including a cadence bug that flattened a ten
email sequence into a weekly drip, a `$json` reference that would have killed every inbound
event, and a positional parameter bug that silently discarded rows. Every one would have
needed applying twice, and none of them announced themselves at runtime. A drifted copy
does not error. It just quietly behaves differently, and you find out from a customer.

---

## 1. The brand file

Copy the closest existing dealer file and work through every field. `brand/dealers/` is the
only place a rooftop differs; the engine, the copy deck and the SQL are shared.

Mark anything you do not know with `NEEDS CONFIRMATION`, `PLACEHOLDER` or `REPLACE-ME`.
The build reads those markers, names the fields in the review gallery banner, and
`npm run check -- --launch` fails on the ones that are legally or operationally required.
Leaving a gap marked is strictly better than guessing at it.

Two fields decide more than they look like they do:

- **`color.accent`** carries every button and rule in the email. Get the hue family right
  before you worry about the exact hex. Ferrario shipped for a while with a guessed Ford
  corporate blue against a brand whose wordmark is red.
- **`brandLead.mode`** set to `dealer` makes the dealership's colour lead and reduces
  DriveOne to the provider mark. That is correct for a send made on their behalf. Absent,
  the layout falls back to DriveOne cyan, which is a silent and very visible mistake.

Add the two `package.json` scripts alongside the existing ones, and add the dealer to
`npm run build`.

## 2. Decide where the campaign tables live

The four `vsc_*` tables are keyed on `(dealer_id, campaign_id, ...)`, so **one Supabase
project can hold every dealership**, and that is what `supabase.project_id` in both current
dealer files points at (`bbvkqwcapqsytrdrubci`, the DriveOne production project). It is also
where the service drive source data (`quotes`, `customers`, `customer_vehicles`) already
lives, which keeps intake a single `insert ... select` inside one database.

Giving a dealership its own project is a legitimate choice for isolation, but it costs more
than it looks like:

- Intake stops being one statement and becomes read-then-write across two Postgres
  credentials in n8n. The atomicity you actually care about is unaffected, since that is in
  the **claim** of due enrolments, entirely inside the campaign tables. Intake's safety came
  from `on conflict (dealer_id, campaign_id, customer_key) do nothing`, which still applies.
  (`postgres_fdw` and `dblink` are both available on Supabase if you would rather keep the
  single statement. More elegant, more moving parts: an extension, a foreign server, a user
  mapping, and a credential stored inside the database.)
- The read-only role has to exist in the **source** project. `n8n/sql/campaign-role.sql`
  creates `vsc_campaign`, which can read the three source tables and nothing else. Set its
  password yourself with the statement at the bottom of that file; it is deliberately not in
  the file so the secret never passes through a chat window or a commit. Letters and digits
  only, 32+ characters, because a password containing `@ : / ? # %` has to be
  percent-encoded inside a connection string and someone eventually pastes the encoded form
  into a plain password field and loses an hour.
- **The unsubscribe function follows the suppression table.** `vsc-unsubscribe` is keyed per
  recipient and scoped by `dealer_id`, so one deployment can serve every dealership, but it
  writes to `vsc_suppression` in whichever project it points at. A separate project means
  deploying a copy pointed at that project's tables. This is the one piece that is genuinely
  not copy-paste. Budget time for it.

If you stay in the shared project, run `n8n/sql/schema.sql` only if the tables are not
already there, and skip `campaign-role.sql` entirely.

## 3. Build

```bash
npm run build                      # every dealership
npm run build:<dealer>             # just one
```

`npm run build` fails if the cadence drifts from the copy deck. That check exists because
the send window silently flattened every gap to 7 days once, and nothing errored.

## 4. Publish templates

```bash
node scripts/publish-templates.mjs <dealer> > /tmp/t.sql
```

Apply it in the project holding that dealership's tables. Then checksum: `md5(html)` from
the database must equal `md5sum email/dist/<dealer>/*.html` for all ten. Ten matching hashes
is proof. "The query returned ten rows" is not.

The publisher refuses to run if `email/dist/<dealer>/manifest.json` was built for a different
dealership, because it once wrote one rooftop's HTML into another's template rows and the
only clue was a byte count.

## 5. n8n

Import the five workflows from `n8n/workflows/<dealer>/` under a `dealer:<dealer>` tag.
Publish 04 first, or nothing else will accept it as their error workflow. Variables and
credentials are in `docs/N8N-SETUP.md`; note that `$env` does not work on n8n Cloud, only
`$vars`.

## 6. Before the first send

Follow **Before any first send** in the campaign skill. It is ordered, and the order is
load-bearing. Then:

```bash
npm run check:launch -- <dealer>
```

The two that catch people, both of which have already happened:

- **Do not publish workflow 02 to do a test send.** Rows go due while the scheduler is off,
  so publishing during a send window mails real customers within the hour. Use a throwaway
  workflow that reads one real row and sends only to you.
- **Do not enrol until sending works.** One rooftop enrolled 150 people and then sat blocked
  on DNS for days. Every send date that passed became due-now, and the backlog had to be
  re-spread before launch. Get the domain verified first, then enrol.

## 7. Sizing the cohort

Total sends are `cohort x 10` however slowly you feed people in. Work backwards from the
daily cap, not forwards from the size of the list.

```bash
node scripts/simulate-volume.mjs
```

Enrolling an entire backlog is almost always wrong. Ferrario's 1,244 eligible customers
would be 12,440 sends over roughly 34 send days, about 366 a day against a 200 cap: the cap
cannot absorb that, it just pins the domain at its ceiling for weeks. Cohort is the only
lever that lowers total volume. Start small, raise it once the first cohort's bounce and
complaint rates come back clean.
