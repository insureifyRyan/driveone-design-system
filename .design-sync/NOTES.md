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

## Authoring previews (folded from wave 1)

- **Capture geometry**: the capture viewport is 900×700 and card chrome eats ~74px, leaving
  ~826 usable CSS px. Wrap `cardMode: "column"` components (tables, top bars, page headers) in
  `maxWidth: 820`, and card-like components in `maxWidth: 460`. At 720 a 7-column table squeezes
  its columns below their declared widths and breaks mono identifiers mid-token.
- `DataTable` column `width` is a hint, not a floor — a wrapping mono column means the container
  is over-constrained, not that the width is wrong.
- `DataTable`'s `empty` slot keeps the header row; pass `<EmptyState plain />` or the dashed frame
  double-borders against the table.
- `Skeleton`'s single-shape branch renders an intrinsically-sized span, so a `width: 100%` child
  can measure ~0 inside a flex/grid parent — pass an explicit numeric `width` or wrap in
  `<div style={{ flex: 1 }}>`. The multi-line branch is safe. Its shimmer is near-invisible on the
  bare canvas; compositions inside a `Card` are what make those cells legible.
- A closed native `<select>` cannot show a variant axis that only exists in its open popup. Sweep
  something visible instead (unfilled-with-placeholder vs. a real selection).
- `RadioGroup` injects no `name` — grouping is the author's job, and two same-`name` radios both
  carrying `defaultChecked` silently collapse to the last one.
- Scoped capture re-reads every component in the run, so re-Read each sheet before re-grading,
  not just the ones edited.

## Deliberate behaviours — do not "fix" these
- `StatCard` `trend="up"` on a negative delta (manual touches down 38%) renders a green up arrow
  beside a falling number. `trend` is the judgement, not the arrow direction — that is the
  documented intent and has its own `FallingIsGood` preview cell.
- `Avatar`'s circle-vs-square distinction is unreadable at review-sheet scale because the sheet
  downsamples a 900px page. The CSS is correct; verify before touching it.
- `optional` is a `FormField`-only prop. `TextField`/`Textarea`/`Select` forward only
  `label`/`hint`/`error`/`required`, and they spread `...rest` onto the control, so passing
  `optional` to them would leak the attribute to the DOM.
- `FormField` does not style a raw child control — add `kv-input kv-input--md` yourself, plus
  `kv-input--invalid` when passing `error`, or the message goes red while the input stays neutral.
- `Spinner`'s `label` is screen-reader-only by design; visible status text must sit beside it.
- `IconButton` sizes its box, not its glyph — pass a larger `<Icon size>` for `size="lg"`.
- `Textarea` has a 96px `min-height`, so `rows={3}` and `rows={4}` render identically.

## Component fixes made during preview review (wave 1)
- `.kv-check__control:indeterminate` was unscoped, and per spec **every radio in a group with no
  checked member matches `:indeterminate`** — so an untouched `RadioGroup` drew every option as
  filled-indigo checked. Now scoped to `.kv-check__control--box:indeterminate`.
- `.kv-avatar-group` used a fixed `-8px` overlap, which swallowed the initials of `xs` avatars.
  Overlap is now per size (xs −5, sm −7, default −8, lg −12).
- `.kv-toast__content` had no `align-items`, so a `Toast` `action` button stretched full width and
  centered its label. Now `flex-start`.

## Authoring previews (folded from wave 2 and 3)

- **Captures are viewport-clipped, not full-page**: every `?story=` shot is exactly 900x700, so
  roughly 650px of usable height after body padding. A tall cell is silently sliced — this is the
  most common failure mode when authoring, and it looks like a content bug rather than a crop.
- `[CONFIG_STALE]` fires when a component's `viewport` override changes after the last full build
  stamped `ds-bundle/.stories-map.json`. Only `viewport` trips it — `cardMode` and `primaryStory`
  are stripped before hashing. The guard is whole-run, so a mixed `--components` rebuild aborts
  having written nothing. Fix: run `package-build.mjs` once to re-stamp. Note that
  `package-capture.mjs --components X` reports `0 component(s) — 0 captured, 0 with errors` when
  no `_preview/X.js` exists; that is a silent no-op, never a pass.
- **`position: fixed` overlays collapse in the capture wrapper.** `emit.mjs` wraps each solo story
  in `.ds-single { transform: translateZ(0) }`, making it the containing block for fixed
  descendants — but it has no intrinsic height, so `inset: 0` overlays collapse to a thin strip.
  `Modal` and `Drawer` previews work around it with a `minHeight: calc(100vh - 48px)` page root,
  which also matches the documented "place it at the root of your page tree" usage. This is a
  harness limitation, not a component bug; do not "fix" the components for it.
- `ClaimTimeline` and `OnboardingSteps` switch to the sparkles marker via
  `actor.toLowerCase().includes('kōvara')` — **with the macron**. Writing ASCII "Kovara" silently
  renders the person glyph and breaks the "cyan means the agent acted" rule.
- `WorkflowRunCard`: `failedStep` wins over `completedSteps` at the same index, so set
  `failedStep === completedSteps` or a grey gap opens between the green run and the red segment.
  Don't pass `recordsProcessed={0}` — the guard is `!== undefined`, so a queued run prints "0 records".
- `OnboardingSteps` horizontal gives roughly 165px per column at five steps; titles and owners
  must be short or the wizard header goes ragged.

## Component fixes made during preview review (wave 2 and 3)
- `.kv-tooltip` had `max-width` but no `width`, so the absolutely-positioned tip shrink-to-fit
  against a narrow trigger and rendered one word per line — on icon-sized triggers, which is the
  component's canonical usage. Now `width: max-content`.
- `.kv-menu-root__panel` had the same class of bug: absolutely positioned inside an inline-flex
  root, so it sized to the trigger and wrapped ordinary labels. Now `width: max-content`.
- `IntegrationTile`'s initials fallback took the first letter of each of the first two words, so
  every single-word connector collided on one glyph (Symitar and Salesforce both rendered "S").
  Single-word names now take their first two letters.
- `.kv-endpoint--bare` set `padding-inline: 0`, so the documented composition (bare rows inside
  `Card padding="none"`) put the method chip flush against the card border. Bare rows keep their
  inline padding and the last row drops its rule.
- `ApiKeyField`'s reveal toggle used `search` and `x-circle` glyphs, which read as "search this
  key" and "revoke". Added real `eye` / `eye-off` glyphs to the icon set.

## First-sync outcome (2026-09)

53 components, all authored and graded `good`, render check clean (0 bad, 0 thin, 0 identical
variants, 0 floor cards). The bundle in `ds-bundle/` validates and `.resync-verdict.json` reports
`ok: true` on every stage.

**The upload did not happen.** `DesignSync` needs design-system authorization, and `/design-login`
cannot run in a non-interactive cloud session, so no Claude Design project exists yet and
`cfg.projectId` is unset. The next run creates the project. Everything the sync needs is
committed — config, conventions header, 53 previews, 53 docs, these notes — so the next run
re-captures and re-grades (grades are machine-local, never committed) rather than re-authoring.

To finish from an interactive session on a machine that can authorize:
```
npm ci && npm run build
/design-login
/design-sync
```
