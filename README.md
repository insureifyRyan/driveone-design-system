# DriveOne Direct design system

Paid-social creative for **DriveOne Direct**, the direct-to-consumer vehicle
service contract brand at [www.driveonedirect.com](https://www.driveonedirect.com).
Twenty-three creatives across two art directions and four placements, plus the
export pipeline, the compliance source and the tests that keep the artwork and
the contract from drifting apart.

```
design/          the design canvas, tokens and runtime the exporter consumes
src/creative/    frames, copy, vector art and the renderer (edit these)
src/lib/         compliance copy and the destination/attribution scheme
scripts/         canvas build, ad export, monthly link check
tests/           compliance pins
ads/             exported PNGs at 1x, ads/2x/ for upload
docs/            the claims audit
CAPTIONS.md      one caption per concept, plus the do-not-write list
```

## Quick start

```bash
npm install
npm run ads:all      # build the canvas, export 1x, export 2x
npm test             # compliance pins
npm run links:check  # destination reachability (also runs monthly in CI)
```

Needs Node 22+ and a Chromium. Set `CHROMIUM_PATH` if you already have one on
disk rather than letting Playwright download its own.

## How this fits together

`src/creative/frames.ts` holds the seven concepts and their copy.
`src/creative/render.ts` turns a frame into a canvas.
`scripts/build-canvas.mts` assembles all twenty-three into
`design/DriveOneDirectAds.dc.html`, which you can open in a browser to review.
`scripts/export-ads.mts` renders that file in Chromium, strips the gallery
chrome, un-scales each canvas and screenshots it at true pixel size.

**The canvas HTML is generated. Edit `src/creative/`, not the HTML.**

The compliance block lives in exactly one constant, `AD_DISCLOSURE`, and the
tests assert every CTA-bearing frame carries it verbatim. That is deliberate:
on the equivalent Vista build the design handoff had the administrator's city
wrong and named no obligor at all, and nothing caught it until someone read the
executed contract.

## Start here

- **`ads/README.md`** for the frame list, the destination URL scheme and the
  rules baked into the artwork.
- **`docs/claims-audit.md`** for what the executed contract does and does not
  support. Read this before adding any offer fact to a creative.
- **`CAPTIONS.md`** for the captions and the Meta do-not-write list.
