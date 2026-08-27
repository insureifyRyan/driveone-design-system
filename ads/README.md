# DriveOne Direct creatives

Twenty-three finished creatives, exported from
`design/DriveOneDirectAds.dc.html` in two sets:

- **`ads/2x/` — upload these.** 2160x2700 / 2160x2160 / 2160x3840. Meta wants
  the highest resolution available and downsamples better than we can; at the
  same physical size the type is visibly crisper than the 1x set.
- **`ads/` — 1x, true pixel size.** 1080 wide, matching the placement spec. Use
  it where something insists on exact dimensions.

Both carry identical artwork and copy. Static images: upload to Meta with the
destination below. No engineering dependency except UTM capture on the quote
flow.

Regenerate with:

```bash
npm run ads:all      # canvas, then 1x, then 2x
```

`npm run ads:export` alone gives 1x; `EXPORT_SCALE=2` gives the masters. It
needs a Chromium (`npx playwright install chromium`, or set `CHROMIUM_PATH` to
one already on disk) and reaches fonts.googleapis.com for Inter Tight and Inter.
Where that host is unreachable, drop the `.woff2` files into `ads/fonts/` and
the script uses those instead. Without one or the other the export falls back to
a system face and is not usable.

**Do not edit the canvas HTML by hand.** It is generated from `src/creative/`
by `npm run canvas:build` and your edit will be overwritten on the next export.

## Destination URL

Every CTA-bearing frame points at the same place, with its own `utm_content`:

```
https://www.driveonedirect.com?utm_source=facebook&utm_medium=paid_social&utm_campaign=dod-tof-q3-2026&utm_content=<FRAME_ID>
```

`utm_source=facebook` matches the live prospecting campaign's existing tags
rather than Vista's `meta`, so reporting does not fork into two sources.

### Set it once, not twenty times

Do not hand-enter twenty URLs. Meta fills `utm_content` per ad from a dynamic
parameter, so this goes in the **URL parameters** field once at the ad set level:

```
utm_source=facebook&utm_medium=paid_social&utm_campaign=dod-tof-q3-2026&utm_content={{ad.name}}&utm_term={{adset.name}}
```

Then name each ad by its frame id: `A1`, `B6`, `V2`. Meta substitutes the name
per ad. Keep the names free of spaces and punctuation, because `{{ad.name}}` is
URL-encoded and a space becomes `%20` in your reports.

> **Watch the first ad of a new campaign.** On this account,
> `create_meta_image_campaign` did not apply `url_tags` to its first ad and
> reported success twice while the tags never persisted. The original C1A had to
> be retired and rebuilt as C1A v2. Verify with `list_meta_ads` and patch with
> `update_meta_ad`.

### Why bother, when Meta already reports per ad

Meta gives you impressions, clicks, CTR and spend per ad with no UTMs at all.
For ranking creative on clicks that is enough.

What it does not give you is what happened after the click. The Drive One
Direct Pixel (`925372106600745`) is live and firing, last event 26 Aug 2026, but
Meta still only sees what the pixel catches: it misses iOS ATT opt-outs and
cross-device journeys, and until a Quote Started custom conversion exists in
Events Manager there is no quote event to optimize against. `utm_content`
arriving at the quote flow is what tells you which creative produced a sale.
The two answer different questions, and the second one is the one worth
spending against.

## The set

Sizes below are the 1x set; the 2x masters are double in both dimensions.

| Frame | Size | Ratio | Placement | Concept | Caption |
|---|---|---|---|---|---|
| A1 | 1080x1350 | 4:5 | IG + FB feed | Coverage gap | 1 |
| A2 | 1080x1350 | 4:5 | IG + FB feed | Transmission | 2 |
| A3 | 1080x1350 | 4:5 | IG + FB feed | Nobody calls you | 3 |
| A4 | 1080x1350 | 4:5 | IG + FB feed | Water pump | 4 |
| A5 | 1080x1350 | 4:5 | IG + FB feed | Pick the shop | 5 |
| A6 | 1080x1350 | 4:5 | IG + FB feed | Roadside | 6 |
| A7 | 1080x1350 | 4:5 | IG + FB feed | Thirty days | 7 |
| B1 to B7 | 1080x1350 | 4:5 | IG + FB feed | same seven, Daylight | 1 to 7 |
| S1 | 1080x1080 | 1:1 | Right column, Marketplace | Coverage gap | 1 |
| S2 | 1080x1080 | 1:1 | Right column, Marketplace | Transmission | 2 |
| S3 | 1080x1080 | 1:1 | Right column, Marketplace | Nobody calls you | 3 |
| R1 | 1080x1920 | 9:16 | Stories | Coverage gap | 1 |
| R2 | 1080x1920 | 9:16 | Stories | Water pump | 4 |
| R3 | 1080x1920 | 9:16 | Stories | Thirty days | 7 |
| V1 | 1080x1920 | 9:16 | Reels | Nobody calls you | 3, **full boilerplate required** |
| V2 | 1080x1920 | 9:16 | Reels | Pick the shop | 5, **full boilerplate required** |
| V3 | 1080x1920 | 9:16 | Reels | Roadside | 6, **full boilerplate required** |

Two directions run through the feed set: **A1 to A7 "Ink"** (Ink ground, cyan
bloom behind the hero, cyan accent type) and **B1 to B7 "Daylight"** (Cyan-Soft
ground, Ink type, the accent phrase set as Ink inside a cyan block). Same seven
concepts, same captions, so the direction test is not confounded by the message.

## Why the placement coverage is the point

The live prospecting campaign carried nothing but 1080x1350. Over its first
seven active days Meta pushed that 4:5 into placements it was never drawn for,
and the delivery record says what that cost:

| Placement | Impressions | Spend | CPC |
|---|---|---|---|
| Facebook Feed | 1,209 | $13.04 | $0.36 |
| Facebook Reels Overlay | 5,400 | $8.87 | $0.12 |
| Facebook Right Hand Column | 1,226 | $2.33 | $0.33 |
| Facebook Reels | 94 | $4.21 | $0.53 |
| Instagram Reels | 267 | $3.15 | $1.57 |
| **Instagram Feed** | **0** | **$0** | n/a |

Instagram Feed, the stated primary placement, received nothing, and Instagram
Reels charged four to thirteen times the CPC of every Facebook placement while
running a cropped 4:5. S, R and V exist to stop that.

Creative shape is not the whole story: the campaign spent $31.60 against
$50/day. Ad review status and audience size are worth a look alongside this set.

## Rules that are already baked in, keep them that way

- **Reels (V1 to V3) carry no in-image CTA.** Reels supplies its own, and the
  content clears the bottom chrome. Their in-image legal line is the short form,
  so **the caption must carry the full boilerplate.** Never run a Reels cut with
  a truncated caption.
- **Stories (R1 to R3)** keep content above the 250px bottom reserve.
- **Disclosures render at 20px** on the 1080px canvas, at higher contrast than
  the body secondary text. Do not shrink them to make room for copy.
- **Claim-specific qualifiers sit next to their claim**, never in the footer:
  the deductible, the dated repair figure, the repair-facility condition, the
  roadside limits and the cancellation window each carry their own.
- **The carrier claim appears on every creative.** It is set in type rather than
  with the Old Republic wordmark, because the mark is Old Republic's trademark
  and no use grant covering DriveOne Direct has been produced. If one exists the
  pill can become the mark.
- **The rounded tile never appears.** Per the logo spec it is reserved for app
  icons. On the Cyan-Soft ground the mark is redrawn in Ink instead of tiled,
  and the accent phrase becomes Ink inside a cyan block, because Brand Cyan type
  on Cyan-Soft is about 1.9:1 and unreadable.
- **No payment plan, 0% or credit language anywhere.** Ryan's call, to stay out
  of Meta's Credit special ad category.

## Meta policy exposure

Vista's risk was the Employment category. This set's is **Personal Attributes**,
and it is not theoretical: C1B was disapproved on 19 Aug 2026 for copy that
narrated the viewer's own situation, while C12 passed using the identical
photograph with a general framing. Every headline here states a category truth
rather than asserting anything about the reader. `CAPTIONS.md` carries the
do-not-write list.

## Compliance

Every entity name, address, phone number and licence number comes from the
executed contract (`AAS VSC 1 11-2022`), not from a deck or a workspace page.
`src/lib/compliance.ts` is the source, and `tests/compliance.test.mts` pins each
value and asserts all twenty CTA-bearing frames carry the block verbatim, that
the three Reels cuts carry the short line and no CTA, that every claim has its
qualifier, and that none of the unsupported claims can reappear.

`docs/claims-audit.md` records what the contract does and does not support,
including the five claims that appear nowhere in it, the "ASE-certified"
correction, the drifted transmission figure, and the thirty-day cancellation
window that the workspace had at sixty.

## Rendering notes

The export applies `-webkit-font-smoothing: antialiased` and
`text-rendering: geometricPrecision`. The first turns off subpixel antialiasing,
which would otherwise bake coloured fringes into glyph edges, invisible on the
screen it was tuned for and visible once composited elsewhere. The second stops
Chromium rounding glyph advances to whole pixels, so tracked display type keeps
its drawn spacing.

**Nothing here caps sharpness.** The Vista set was limited by a 205x58 Old
Republic PNG rendered at 42px. Every mark and every hero object in this set is
vector drawn in the canvas itself, so 2x, 3x and 4x are all clean.

## Monthly destination check

The destination lives in Meta's Ads Manager, not in anything this repo deploys.
If the quote route moves or starts dropping query params, nothing here breaks:
the ads quietly stop converting, or stop being attributable, and nobody finds
out until someone reads a report.

`.github/workflows/link-check.yml` runs on the 1st of each month, and on demand
via *Run workflow*. It checks the bare URL plus all twenty per-frame UTM
variants and fails the job if any is unreachable.

Run it locally with `npm run links:check`, or point it elsewhere with
`DESTINATION_URL=https://staging.example.com npm run links:check`.
