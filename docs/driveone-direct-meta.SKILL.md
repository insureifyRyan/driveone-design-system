---
name: driveone-direct-meta
description: Build, review, and optimize Facebook/Instagram ads for DriveOne Direct, the DTC vehicle service contract brand at driveonedirect.com. Use for anything on Meta ads for DriveOne Direct — creating campaigns, writing ad copy, refreshing creative, checking performance, or answering what is live. Carries the live account and pixel IDs, the approved design system, the confirmed offer facts, the compliance rules, and the Red Bull copy register. Do NOT use for the DriveOne dealership/B2B track (driveonenow.com) or DriveOne Service — see driveone-workflow for those.
---

# DriveOne Direct on Meta

The DTC side of the business. Car owners buy a vehicle service contract directly at
**driveonedirect.com**, with no dealership and no finance office in the middle.

## Scope rule (get this wrong and everything is wrong)

**DriveOne Direct only.** Not DriveOne dealer/B2B (driveonenow.com), not DriveOne Service.
Never mix the two tracks' ad accounts, audiences, pixels, conversions, or copy. Ryan corrects
this distinction quickly, so name the brand "DriveOne Direct" in full in campaign names.

## Live IDs

| Thing | Value |
|---|---|
| Meta ad account | `833315373680570` |
| Meta pixel | `925372106600745` "Drive One Direct Pixel" |
| Landing page | https://driveonedirect.com |
| Google Ads (separate track) | DTC `4398312613`, dealer `1151526992` |
| Instagram account | `17841444879230899` `@drive_one_dx`, linked to the Drive One Direct Page |

**Live campaigns (27 Aug 2026):**

| Campaign | ID | Placements | Budget |
|---|---|---|---|
| TOF Prospecting (OLD) | `120248438101950575` | automatic, in practice Facebook junk | $50/day CBO, LINK_CLICKS. **Retire once the FB rebuild launches.** |
| TOF Prospecting **IG** | `120248577865220575` | Instagram `stream` only | $50/day, LANDING_PAGE_VIEWS, **ACTIVE 27 Aug** |
| TOF Prospecting **FB** | `120248591880460575` | Facebook `feed` + `marketplace` | $50/day, LANDING_PAGE_VIEWS, **PAUSED, built 28 Aug** |

Ad sets: IG `120248577865530575` (IGC12, IGC11, IGC13, IGC16), FB `120248591880670575`
(FBC3, FBC12, FBC4B, FBC13).

**Instagram day one (27 to 28 Aug): $28.49 of $50 spent, 2,815 impressions, 1.39% CTR, $0.73 CPC,
no disapprovals, 0 Leads on 39 clicks.** Against the old Facebook campaign's $6.40/day, that is the
placement lock plus LANDING_PAGE_VIEWS doing their job. Tracking verified in the destination URL.
Watch: Meta put 68% of spend on IGC11 within a day while IGC13 posted a better CTR on a fifth of
the impressions.

**Never add an Instagram ad set to the Facebook CBO campaign.** CBO always funds the cheapest ad
set, Instagram inventory is many times the price of Facebook Reels Overlay, and the IG ad set will
be starved exactly the way C16 was. Instagram gets its own campaign or it gets nothing.

**Before assuming anything about state, check it.** Pixel fire status, custom conversions,
Page linkage, and what is running all change. `get_meta_campaign_performance`,
`list_meta_campaigns`, `list_meta_pixels`, `get_meta_pixel_stats`.

Current-state notes live in the Notion page **"Meta Build State — DriveOne Direct (live)"**
under DriveOne → Facebook Ads. Read it first; it is the source of truth.

**Account gotcha, confirmed 7 Sep 2026: pass `ad_account_id` explicitly on every Adspirer call.**
The Adspirer default account is `564668939074102` ("MyFamilyInsurance"), which is not DriveOne.
Every DriveOne Direct campaign, ad set, pixel and custom audience lives on `833315373680570`.
Calling `list_meta_custom_audiences` without the account id returns "0 audiences", which reads
like the audience was deleted. It was not. It is on the other account.

**State as of 7 Sep 2026:**

| Campaign | ID | Status |
|---|---|---|
| Leads, IG Feed (created 5 Sep by someone else) | `120248711195770575` | PAUSED, OUTCOME_LEADS |
| TOF Prospecting FB (rebuild) | `120248591880460575` | PAUSED, awaiting Ryan's go |
| TOF Prospecting IG | `120248577865220575` | **ACTIVE** |
| TOF Prospecting (old) | `120248438101950575` | PAUSED by Ryan |
| Promoting Drive One Direct | `120248437199330575` | PAUSED, PAGE_LIKES |

Fourteen-day totals to 5 Sep: $925.84, 170,548 impressions, 2,092 clicks, 1.23% CTR, $0.44 CPC.
Instagram $467.98, old Facebook $457.86. After Ryan paused Facebook the daily fell $103.00 (2 Sep)
to $63.40, $41.98, $41.07 (5 Sep), so the Instagram budget is now running about $9/day short.
Meta's reporting feed runs roughly two days behind.

**Custom audiences on `833315373680570`:**

| Audience | ID | Size |
|---|---|---|
| DOD (website) | `120248478043290575` | 1,000 (27 Aug), 1,300 (31 Aug), 1,600 (2 Sep), 2,100 (7 Sep) |
| Instagram page engagement 365 days | `120248684422660575` | 1,000 (display floor) |
| Facebook Page Engagement 365 Days | `120248684420180575` | 1,000 (display floor) |

DOD is growing about 100/day on Instagram-only spend, down from ~150/day when Facebook was also
running. It reaches the ~3,000 mark where retargeting starts working around 16 Sep.

**Do not switch an ad set to conversion optimization on `Lead` yet.** An ad set needs roughly
7 Leads a day on its own for a week to leave learning. Site-wide Lead volume across all sources
sits about there, so Meta's share alone cannot sustain it and the ad set would never exit
learning. Run LANDING_PAGE_VIEWS until the pixel is producing real volume.

## Known traps

- **Page Likes is not a growth objective.** A boost-style PAGE_LIKES campaign buys the cheapest
  available likes: no quotes, no retargeting pool, nothing taught to the pixel. If one is
  running, say so plainly and offer to move the budget to prospecting.
- **Pixel status, verified 27 Aug 2026: the Drive One Direct Pixel IS firing** (last event
  26 Aug 2026). The trap below applied to the pre-launch state; the unblock now is creating the
  Quote Started custom conversion in Events Manager, which still does not exist.
- **No pixel data means no conversion optimization.** If the pixel has never fired, an
  OUTCOME_SALES campaign against a custom conversion will not exit learning. Use
  OUTCOME_TRAFFIC with the pixel attached to seed data and build the retargeting pool, then
  flip to Quote Started once events are flowing. There is no Quote Started custom conversion
  until someone creates it in Events Manager after the pixel fires.
- **Adspirer budgets here are decimals in account currency, not cents.** `budget_daily: 50`
  books $50/day. (This contradicts the generic Adspirer cents guidance — these tools differ.)
- **Every ad needs a Facebook Page identity.** If creation fails with "No Facebook Pages found
  linked to this ad account," the account is likely outside the Business Portfolio and cannot
  see the business-owned Page. That is a Business Settings fix, not something to work around.
- **`url_tags` writes do not reliably persist on this account, and the tools report success anyway.**
  Confirmed again 27 Aug 2026 on the IG campaign: `create_meta_image_campaign` dropped them,
  `update_meta_ad_set` applied nothing (empty "Changes Applied"), and four `update_meta_ad` calls
  each echoed the tag back as applied while `list_meta_ads` still read `None`. `list_meta_ads` does
  render the field when it is genuinely set (it shows for the FB campaign's ads), so `None` is real,
  not a display gap. **Treat UTMs as unset until a read-back proves otherwise.**

  **The workaround that does hold: bake the parameters into `landing_page_url` at ad creation.**
  Meta substitutes `{{ad.name}}` and `{{adset.name}}` in the destination URL just as it does in the
  URL parameters field, and the destination URL is a required creative field rather than the
  optional `url_tags` bolt-on, so it is written with the creative instead of patched afterwards.
  Pass the whole thing to `add_meta_ad`:

  ```
  https://driveonedirect.com/?utm_source=instagram&utm_medium=paid_social&utm_campaign=<campaign>&utm_content={{ad.name}}&utm_term={{adset.name}}
  ```

  `list_meta_ads` will still show `URL Tags: None` for these, which is correct and expected: the
  tracking lives in the URL, not that field. Note the URL Parameters field in Ads Manager is
  **ad-level**, not ad set level, which is why `update_meta_ad_set(url_tags=...)` reports success
  and changes nothing.

  Also: name ads with no spaces or punctuation (`IGC12`, not `C12 | A Handshake...`). `{{ad.name}}`
  is URL-encoded, so a space becomes `%20` in every report.
- **Meta region keys** for the launch states: PA `3881`, TX `3886`, FL `3852`, OH `3878`,
  NC `3876`, SC `3883`, WI `3892`. Always include `"type": "region"` or Meta reads the key as a
  country code and rejects it.
- **You cannot change `optimization_goal` on one ad set in a lowest-cost CBO campaign.** Meta
  rejects it with code 100/1885760: "The same optimization for ad delivery selection is required if
  the campaign bid strategy is lowest cost." All ad sets must share the goal, and Meta offers no
  atomic multi-ad-set update, so the only routes are duplicating the campaign or building a fresh
  one. Verified 27 Aug 2026 trying to move the FB prospecting campaign off LINK_CLICKS. A
  single-ad-set campaign (like the IG one) changes fine.
- **`LINK_CLICKS` is the wrong default on this account.** It makes Meta buy the cheapest clicks in
  existence, which is how the FB campaign ended up spending 45% of budget on Facebook Reels Overlay
  ($1.64 CPM) and Right Hand Column while Instagram Feed got zero. **`LANDING_PAGE_VIEWS` is the
  right prospecting goal here:** it needs only PageView (firing at 100+/day) and it makes Meta bid
  on intent rather than on the price floor.
- **`Lead` = quote started** (Ryan, 27 Aug 2026). It is the standard pixel event on
  driveonedirect.com and it fires when someone begins a quote, not when they buy. Verified firing
  27 Aug 2026 at roughly 8 to 10 a day across all traffic sources.

  So **conversion optimization does not need a new custom conversion.** There is no Quote Started
  custom conversion to build; `Lead` already is it. What it needs is volume: Meta wants ~50
  conversions per ad set per week (~7/day) to exit learning, and that has to come from Meta's own
  traffic, not the site total. **The trigger to switch an ad set to `OFFSITE_CONVERSIONS` on `Lead`
  is that ad set producing ~7 Leads/day on its own for a week.** Until then stay on
  `LANDING_PAGE_VIEWS`; a conversion ad set below the threshold sits in learning forever.

  Because `Lead` is quote start and not purchase, **optimizing to it buys quote starts, not sales.**
  That is the right prospecting objective for a 3-click checkout, but read it alongside actual sales
  or you will scale a creative that is good at starting quotes nobody finishes.

  The funnel is impression → click → landing page view → `Lead` (quote start) → purchase, and
  `utm_content` survives to the quote flow, so quote starts are attributable per creative. The gap
  between PageView and `Lead`, and between `Lead` and purchase, is also the raw material for the
  retargeting audiences in `driveone-direct-retargeting`.
- **Everything is created paused.** Never activate a campaign or move budget without Ryan
  explicitly saying to launch.

## Targeting default

PA, TX, FL, OH, NC, SC, WI. California is excluded by construction (VSCs are not sold there).
Age 25 to 65, broad, no interest layers. Facebook + Instagram, Audience Network excluded.
$50/day per ad set unless told otherwise.

## The offer

**"Elevate" is the Ascent product brand that DriveOne Direct private labels** (Ryan,
27 Aug 2026). It is a program name, never a contract citation: the word appears nowhere in
the executed contract, which is form `AAS VSC 1 11-2022` and names its tiers Silver, Gold and
Platinum. Do not print "Elevate Platinum" as though the contract used it.

Facts below marked **[contract]** are transcribed from `AAS VSC 1 11-2022`. Facts marked
**[program]** are true of the DriveOne Direct offer but are not contract terms, so they need a
non-contract source before they go on a creative.

- **[program] 0% payment plan up to 36 months**, no credit check. Say "payment plan," never loan
  or financing. **Do not print it on Meta creative** (Ryan, 27 Aug 2026): Meta would classify it
  under the Credit special ad category and restrict targeting, and the claim is not worth that on
  prospecting. Site and email are fine.
- **$100 deductible.** The contract says $0 if the vehicle returns to the selling dealer and $100
  otherwise; Direct buyers have no selling dealer, so $100 is the honest number for this audience.
- **[contract] Any licensed repair facility of your choosing in the United States**, and the claim
  must be authorized before repairs begin (shop calls 866-660-7003). **Not "ASE-certified"**:
  that string appears nowhere in the contract, it narrows a broader right, and it drops the prior
  authorization condition, which is what actually gets claims denied. Corrected 27 Aug 2026.
- **Comprehensive coverage**, 24/7 roadside assistance included (up to 3 events/year, Quest Towing).
- **One year of Diminished Value protection, up to $5,000.** Always "up to $5,000," never a flat
  guaranteed payout, it is formula-based. **Source unverified:** "diminish" appears nowhere in
  `AAS VSC 1 11-2022`. Keep it off creative until a document supporting it is produced.
- **100% online checkout.** Per the logo spec this claim stays out of the lockup; use it as a
  tagline, pill, or benefit line.
- **Openbay service scheduling** plus discounts on future service through Openbay.com.
  **Source unverified:** no occurrence in `AAS VSC 1 11-2022`, and the third-party-brand
  sign-off is still an open item. Keep it off creative until both are settled.
- Rental reimbursement $35 per 6 hours of labor time, max $250 per claim visit.
- **[contract]** Coverage tiers Silver / Gold / Platinum. **The "up to 60 months" figure is the
  payment plan term, not the coverage term** (Ryan, 27 Aug 2026), so it travels with the payment
  plan facts and stays off Meta creative.
- **[contract] 30 day full refund** if no claim has been made, pro rata after, contract IX(a).
  Sixty days is Florida only. Texas runs to the 31st day, Wisconsin 30, North Carolina caps the
  fee at $25 or 10%. **"Thirty days" is honest in all seven launch states; "sixty" is wrong in
  six of them.**
- **[contract]** Labor at the repair facility's posted retail rate, capped at $150.00 per hour.
- Protection Plus 4-in-1 bundle (tire and wheel, key/remote replacement, paintless dent repair,
  windshield repair and replacement) is **a paid upgrade in the website checkout flow, not part of
  the base VSC** (Ryan, 27 Aug 2026). Never present it as included coverage: the contract
  **excludes those exact items by name** ("Glass; Windows; Mirrors; Windshields" and "Body Parts;
  Tires, Valve Stems and Wheels/Rims"). Sell it as an upgrade or leave it off.
- Administrator/Obligor: Ascent Administration Services LLC (Old Republic in CA, Minnehoma/Old
  Republic in FL, ORIAS in NY).

## Compliance

- **Meta Personal Attributes is the live policy risk on this account**, not Employment. C1B was
  disapproved 19 Aug 2026 for copy that narrated the viewer's own situation, while C12 passed with
  the identical photograph and a general framing. Rule: **state the category truth, never narrate
  the viewer's life.**
- **Never call DriveOne's product a warranty.** It is a vehicle service contract, or "coverage."
  "Warranty" is only ever used for the customer's factory warranty, which they no longer have.
- Never name a competitor or third-party brand in copy. **Openbay is a live exception** (it is an
  included partner benefit, not a competitor) and should carry explicit sign-off.
- No testimonials, star ratings, or fabricated reviews.
- No price claims in copy beyond contract terms. The $100 deductible is a term, not a quote.
- Repair-cost figures must be current and dated on the creative. Verify against RepairPal before
  reuse; they drift. Verified 27 Aug 2026: alternator **$806 to $1,087** (unchanged), transmission
  **$6,165 to $6,685** (drifted up from $6,003 to $6,525, RepairPal updated 7 Aug 2026).
- Geo-restrict to the launch states. California stays out.
- **Never use em dashes or en dashes** in anything drafted for Ryan. Commas, colons, parentheses,
  or separate sentences instead.
- Re-check Meta's Credit special ad category before running any creative that leads with the 0%
  payment plan.

## Logo lockup

Tile-less D-arrow mark + "DriveOne" (Inter Tight ExtraBold) + "Direct" (Medium, Brand Cyan) +
descriptor `EXTENDED SERVICE CONTRACT` in letterspaced small caps. Bottom left, same position and
size on every ad.

The rounded white tile is reserved for **app icons** and must not appear on an ad.

**Known conflict:** the ads say EXTENDED SERVICE CONTRACT (Ryan's explicit call, and what the
compliance rules support), but the digital flyer, the Notion Logo Set & Usage page, and the signed
VSC application form all print EXTENDED WARRANTY. Flag it; do not silently pick a side.

## Design system

Three colors only: Brand Cyan `#1FBFEC`, Ink `#0E1B2C`, Cyan-Soft `#E8F8FE`.
Inter Tight for display, Inter for body. Canvas 1080x1350 (4:5) for feed, 1080x1080 for carousel
cards.

The approved look (Ryan signed off on the C3 and C11 treatments) has four parts:

1. **Depth.** Ink or Cyan-Soft ground with a soft cyan bloom behind the hero. Never a flat field
   with type floating in it — that reads unfinished.
2. **A real hero object.** A device screen, a rendered part, or licensed photography. Never
   salvaged crops from previous ads; patched fragments always look patched.
3. **Structured content column.** Eyebrow, big tight headline with one cyan accent phrase, one
   supporting line, then feature rows (circular cyan-outline icon + title + subtitle) separated by
   hairline dividers, then a thin benefit strip.
4. **An identical footer on every ad.** Logo lockup left, cyan CTA pill right.

Rotate the offer facts through the feature rows and benefit strip so no two ads repeat the same
three.

## Copy: Red Bull theory

Sell the world the product unlocks, not the can. The territory is **the buyer who went around the
system and should not be punished for it**. Ryan wants it contrarian, cheeky, and fun.

- Identity before product. Affirm the buyer's competence before mentioning coverage.
- The product is a supporting character, not the hero.
- Deadpan. No exclamation points, no urgency, no pleading. The flattest line is the funniest.
- One idea per ad.
- Give before you ask (the free coverage checker asks for nothing).
- Own the grievance (F&I markup, call centers, hold music) without naming anyone.

Lines that landed:

- "You outsmarted the finance office. Your alternator is unimpressed."
- "He waved goodbye. So did the warranty."
- "A handshake is not a warranty. Shocking, we know."
- "Your negotiating skills do not apply to transmissions."
- "Nobody is going to call you. That is not an oversight. That is the product."
- "You negotiated well. The transmission has not been informed."

Meta character targets: primary text under 125 characters, headline under 40, description under 30.

## Placement coverage

**Build every concept at 4:5 (1080x1350), 1:1 (1080x1080), 9:16 Stories and 9:16 Reels.** A
4:5-only set does not stay in feed: over the live prospecting campaign's first seven active days
Meta pushed the 4:5 into Facebook Reels Overlay and Right Hand Column, **Instagram Feed received
zero impressions**, and Instagram Reels charged $1.57 a click against $0.12 to $0.36 everywhere
else. Reels frames carry no in-image CTA (Reels supplies its own) and their captions must carry
the full boilerplate. Stories clear the bottom 250px reserve.

The built set and its export pipeline live in the `driveone-design-system` repo:
`npm run ads:all` regenerates all 23 creatives at 1x and 2x, `npm test` pins the compliance copy,
and `docs/claims-audit.md` records what the contract does and does not support.

## Cadence

Ryan does not want a weekly or biweekly creative chore. Load the whole top-of-funnel creative
supply up front, let Meta rotate it, and review monthly. Refresh when frequency crosses 2.5 to 3.0
or CTR decays materially. With ~11 creatives across the 7 states that is roughly 5 to 7 weeks.

## Working style

- Verify claims against the live account before reporting them. Do not restate what a doc says
  without checking.
- Surface conflicts (stale figures, contradictory brand assets, wrong-objective campaigns) rather
  than quietly picking a side.
- Deliver creative as files, and keep an approval sheet with copy plus an open-items list.
