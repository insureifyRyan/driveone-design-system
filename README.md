# DriveOne Design System

Co-branded dealer email design system and campaign automation for the DriveOne VSC
post sale program.

First dealership: **Bob Johnson Auto Group**, Rochester NY.
First campaign: **ten emails over 60 days** to service customers who just had a repair
order closed and have no vehicle service contract on file.

Product: **Elevate Platinum VSC**, administered by Ascent Administration Services, LLC,
and in New York by ORIAS Warranty Services. Every offer claim in the campaign is quoted
from or directly supported by the executed contract form.

> Read `docs/OPEN-ITEMS.md` before sending. Nothing there is blocking any more, but the
> `$49` starting price still needs substantiation on file, and the logo, service phone and
> postal address are placeholders.

---

## What is here

```
brand/
  driveone.tokens.json        DriveOne master tokens. Locked. Never edit per dealer.
  offer.json                  Product facts. Become merge defaults, baked in at build.
  dealers/bob-johnson.json    THE ONLY FILE YOU EDIT TO REBRAND. Currently placeholders.

email/
  copy/campaign.json          All ten emails. Subject, A/B alt, preheader, body, CTA.
  build.mjs                   Renders tokens + copy into email safe HTML.
  dist/                       Built templates, merge tags intact. Feed these to n8n.

n8n/
  sql/schema.sql              Durable enrollment state.
  build-workflows.mjs         Generates the workflows from the same copy deck.
  workflows/                  Four importable workflow JSON files.

preview/                      Review gallery plus sample-data previews.
scripts/check.mjs             Pre-send guard. Run it before every launch.
docs/                         Open items, n8n setup, data contract.
```

## Build

```bash
npm run build      # emails + n8n workflows
npm run check      # pre-send guard, exits non zero on a real problem
npm run publish:static   # assembles public/ for Vercel
```

No dependencies. Node 18 or later.

## Rebranding

Colors are set from the screenshot of the live site. The logo file is still a placeholder,
so the header currently renders a type lockup mirroring the wordmark: black italic
extrabold "BOB JOHNSON" over a gold rule with "AUTO GROUP" beneath. That is also what
recipients with images off will see.

To change any of it, edit one file, `brand/dealers/bob-johnson.json`:

```jsonc
"color": {
  "primary":     "#000000",  // dealer's primary
  "primaryDark": "#1C1C1C",  // a darker step of primary
  "accent":      "#F2B229",  // the thin accent rule
  "primarySoft": "#FFF7E6",  // tint for light fills
  "onPrimary":   "#FFFFFF"   // text on primary
},
"logo": {
  "light": "https://cdn.example.com/bj/logo-light.png",  // absolute https, hosted
  "widthPx": 150
}
```

Then `npm run build`. All ten emails, both preview sets and the gallery pick it up. No
template, no copy and no workflow changes.

`dealer.state` also drives the footer: the contract names a different Administrator and
Obligor in NY, CA and FL, so `NY` prints ORIAS Warranty Services while everyone else
prints Ascent. The map lives in `brand/offer.json`.

Logos must be absolute `https` URLs. Email clients will not render relative or local
paths. Until a real logo URL is set, the header falls back to a styled type lockup of the
dealership name, which is also what customers with images turned off will see, so it is
worth looking at either way.

## Design

DriveOne palette is three colors and does not change per dealer: Brand Cyan `#1FBFEC`,
Ink `#0E1B2C`, Cyan-Soft `#E8F8FE`. The dealership's colors sit alongside it in the header
lockup and the footer bar, so the dealership visibly owns the relationship and DriveOne
provides the product.

For Bob Johnson that is black `#000000` and gold `#F2B229`. The email opens with their
wordmark on white and closes on a black bar with a gold rule, with DriveOne's cyan
reserved for the hero accent and the CTA. The two systems stay legible as two systems
rather than blending into a third.

Every email is built from the same parts, in the same order:

1. **Co-brand header.** Dealer logo left, "Coverage by DriveOne VSC" right.
2. **Ink hero** with a cyan rule, eyebrow, tight headline with one cyan accent phrase.
   Solid ground rather than a gradient, because Outlook does not render gradients.
3. **Vehicle card.** Their actual car, their actual last visit, their actual mileage.
   This is the thing a generic VSC blast cannot do and it is the reason this converts.
4. **Body copy**, three short paragraphs.
5. **Feature rows.** Cyan outline icon, title, subtitle, hairline separated. Offer facts
   rotate so no two emails lead with the same three.
6. **CTA.** VML backed so it renders as a real button in Outlook.
7. **Benefit strip**, then a P.S. that carries most of the humour.
8. **Dealer bar and legal footer.**

Technically: 600px tables, inline styles, MSO conditionals, bulletproof VML button,
hidden preheader with whitespace padding, forced light color scheme, mobile breakpoint at
620px, around 15KB per email against Gmail's 102KB clipping threshold.

## Voice

Red Bull theory, applied to someone who just paid a service bill. Sell the world the
product unlocks, not the can. Deadpan rather than loud. The buyer is competent and is
treated that way.

House rules, enforced by `npm run check`:

- No exclamation points.
- No em dashes or en dashes.
- The DriveOne product is **never** called a warranty. It is a vehicle service contract,
  or coverage. Warranty refers only to the factory warranty the customer no longer has.
- No competitor names. Own the grievance without naming anyone.
- Only claims the contract supports. `brand/offer.json` cites the form for each one and
  records under `not_included` what was removed and why.
- No testimonials, star ratings or invented reviews.
- No fake urgency. Email 9 is the only one that argues "now," and it argues it honestly,
  on mileage and model year eligibility.

## The ten emails

| # | Day | Angle |
|---|---|---|
| 1 | 0 | Thanks for the visit. One line on your file was blank. |
| 2 | 3 | Today was the cheap one. |
| 3 | 7 | Nobody is going to call you. That is the product. |
| 4 | 12 | Come back to us and your deductible goes to zero. |
| 5 | 18 | 0%, 36 months, no credit check. |
| 6 | 25 | Exclusionary. Ugly word, best coverage. |
| 7 | 32 | We are not the people from the commercial. |
| 8 | 40 | Roadside, rental, and the rest of the contract. |
| 9 | 48 | There is a real window, and it is mileage. |
| 10 | 60 | Last one. Genuinely. |

Every email carries an A/B subject line. The scheduler splits deterministically on the
customer key, so a contact stays in the same arm for all sixty days and the result stays
readable.

## Automation

Four n8n workflows, generated from the same copy deck that builds the emails so the
cadence cannot drift between creative and automation. State lives in Postgres, not in
n8n, so the instance is disposable and a 60 day campaign survives restarts, upgrades and
redeploys. See `docs/N8N-SETUP.md` for why that matters and how to install it.

## Hosting

`vercel.json` is configured. Deploying serves the review gallery at `/` and the merge tag
templates at `/templates/*.html`, which is what `TEMPLATE_BASE_URL` points at in n8n.
