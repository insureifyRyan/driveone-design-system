# design-sync notes — @kovara/design-system

Repo-specific gotchas for future syncs. Read this before re-running the driver.

## Build
- `npm ci` then `npm run build`. The build is two stages: `scripts/build-css.mjs` emits the
  stylesheets, then `tsup` emits ESM + CJS + `.d.ts`. Both are one-shot; neither watches.
- The converter entry is `./dist/index.js` (ESM). `--node-modules ./node_modules` — single
  package, no workspaces.
- `cfg.cssEntry` points at **`dist/kovara-components.css`**, not `dist/kovara.css`. The two are
  identical except that `kovara.css` also carries the `@font-face` block. Fonts reach the bundle
  through `cfg.extraFonts: ["src/styles/fonts.css"]`, which lets the converter copy the woff2s
  into `fonts/` and rewrite the urls. Pointing `cssEntry` at `kovara.css` would ship `@font-face`
  rules whose `url()` targets don't exist at that depth → `[FONT_DANGLING]`.

## Fonts
- Plus Jakarta Sans (600/700/800), Inter (400/500/600), JetBrains Mono (400/500), latin subset,
  self-hosted from `src/styles/fonts/`. They are vendored from the `@fontsource/*` dev
  dependencies by hand — `scripts/build-css.mjs` copies them to `dist/fonts/`, it does not
  re-fetch them. To add a weight: copy the woff2 out of `node_modules/@fontsource/...` into
  `src/styles/fonts/` and add the `@font-face` rule to `src/styles/fonts.css`.

## Components and grouping
- 47 components. Groups come from the `category:` frontmatter in `docs/components/<Name>.md`
  (Foundations, Brand, Actions, Forms, Data display, Feedback, Navigation, Overlay, Platform).
  A new component without a doc silently lands in `general` — write the doc with the component.
- `cfg.componentSrcMap` excludes `KOVARA_TAGLINE` (an exported string constant, not a component).
- `cfg.provider` is `KovaraProvider` with `theme: "light"`. Every preview needs it: components
  rendered outside `.kv-root` lose all tokens and fonts and render as unstyled browser defaults.

## Known render warns
- Floor-card components are not failures. Any component without an authored
  `.design-sync/previews/<Name>.tsx` ships the typographic floor card by design.
- `Skeleton` is deliberately low-contrast; a `[RENDER_THIN]`-style warning on it is expected
  unless its preview composes several shapes.

## Fixes made during the first sync (2026-09)
- `CallSummaryCard`: the meta line concatenated strings around a mono `<span>`, which wrapped
  mid-separator. Now each `· value` pair is its own nowrap span inside a wrapping flex row.
- `QuoteCard`: footers didn't align across a comparison row. `.kv-quote__features` got `flex: 1`
  and `.kv-quote__foot` `margin-top: auto`.
- `cx()` accepts `string | number | boolean | null | undefined` and keeps only non-empty strings,
  because `error && 'class'` narrows to `0 | ''` when `error` is a `ReactNode`.
- Several prop interfaces `Omit<..., 'title'>` from their HTML attributes, because the DS uses
  `title` as a `ReactNode` heading while `HTMLAttributes` types it as `string`.

## Brand facts the design agent must not get wrong
- Tagline (exported as `KOVARA_TAGLINE`): **Agentic Infrastructure for finance and insurance**.
- The `Logo` lockup carries a **™** by default. Do not remove it.
- Cyan (`accent` tone, `sparkles` icon) means *the agent did this*. It is not a decorative color.
- `BrandMark`'s SVG geometry is a **reconstruction** from the supplied PNG logo files — the
  official vector was never available in this environment. If Kōvara provides the real SVG,
  replace the three `<polygon>`s in `src/components/BrandMark.tsx` and re-sync.

## Re-sync risks
- `www.kovara.ai` is blocked by this environment's egress proxy, so nothing here was verified
  against the live site's CSS. Brand hexes (indigo `#2E2A8C`, cyan `#17D7FB`, periwinkle
  `#7B6CF6`, deep `#271F72`) were sampled from the logo PNGs and confirmed by the user as
  "use sampled values" — they are approximations, not brand-book values. If a brand book turns
  up, the only file to change is `src/styles/tokens/palette.css`.
- The wordmark font is **Plus Jakarta Sans**, chosen to match the kōvara wordmark's
  geometric-humanist build. It is not confirmed to be the actual logo typeface.
- Preview fixtures (carrier names, people, policy numbers) are invented and live inside
  `.design-sync/previews/*.tsx`. They are illustrative, not real customer data.
- Playwright must match the cached chromium build: this environment cached `chromium-1194`,
  which is pinned by **playwright 1.56.0**. A newer playwright fails with
  `browserType.launch: Executable doesn't exist`.
