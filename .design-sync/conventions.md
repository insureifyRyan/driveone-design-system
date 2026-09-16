# Building with the Kōvara AI design system

Kōvara sells **agentic infrastructure for insurance and financial services** — quoting and
product sales, embedded F&I, AI-assisted claims, workflow automation, AI voice, and the APIs
that connect a customer's systems. Screens you build are either **operator surfaces** (agency,
dealer, credit-union staff working a book) or **platform surfaces** (integrators reading an API
reference). Both are in this library.

## Wrap everything in KovaraProvider

Every Kōvara surface must sit inside `<KovaraProvider>`. It renders the `.kv-root` element that
carries the design tokens, the type stack and the theme. Components rendered outside it inherit
the page's default fonts and have no color tokens at all — they render as unstyled browser
defaults. If a screen looks unbranded, this is almost always why.

```jsx
<KovaraProvider theme="light" fullHeight>
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    <Sidebar brand={<Logo size="sm" onBrand />} sections={sections} />
    <main style={{ flex: 1, minWidth: 0 }}>
      <TopBar title="Quotes" center={<SearchInput placeholder="Search policies, VINs, claim IDs…" />} />
      <div style={{ padding: 'var(--kv-space-2xl)' }}>{children}</div>
    </main>
  </div>
</KovaraProvider>
```

`theme` is `"light"` (the product default) or `"dark"`. Nest a second provider to flip one region.

## The styling idiom: tokens, not utility classes

**This design system has no utility-class vocabulary.** There is no Tailwind preset in play here
and no `bg-*`/`p-*` classes to reach for. The `.kv-*` classes in the compiled CSS are the
components' own internals — never hand-write them, never extend them.

Style your own layout glue with CSS custom properties, via `style={{}}` or your own CSS:

| Family | Real names |
|---|---|
| Surfaces | `--kv-color-bg-canvas`, `-surface`, `-subtle`, `-inset`, `-brand`, `-brand-subtle`, `-accent`, `-accent-subtle` |
| Text | `--kv-color-text-primary`, `-secondary`, `-muted`, `-inverse`, `-brand`, `-accent`, `-success`, `-warning`, `-danger` |
| Borders | `--kv-color-border-subtle`, `--kv-color-border`, `-strong`, `-brand`, `-accent`, `-focus` |
| Space | `--kv-space-2xs` … `--kv-space-4xl` (4px grid) |
| Radius | `--kv-radius-sm`, `-md`, `-lg`, `-card` (16px), `-pill` |
| Type | `--kv-font-display`, `--kv-font-sans`, `--kv-font-mono`, `--kv-font-size-2xs` … `-5xl` |
| Elevation | `--kv-shadow-xs`, `-sm`, `-md`, `-lg`, `-xl` |

Use semantic tokens (`--kv-color-bg-surface`), not the raw palette (`--kv-ink-900`,
`--kv-cyan-400`) — the semantic layer is what flips correctly in dark mode.

## Brand rules that carry meaning

- **Cyan means the agent did it.** `Button variant="accent"`, `Badge tone="accent"`, and the
  `sparkles` icon are reserved for AI output — a quote Kōvara rated, a call it handled, a draft
  it wrote. Using cyan for ordinary human actions destroys the signal.
- **`StatusPill` owns lifecycle state** (`draft`, `quoted`, `in-review`, `pending`, `bound`,
  `active`, `expiring`, `lapsed`, `declined`). Never re-color a `Badge` to imitate a status.
- **The `Logo` carries a ™** by default — leave it on. The approved tagline is exported as
  `KOVARA_TAGLINE`: *Agentic Infrastructure for finance and insurance*.
- **The indigo `Sidebar` is the product's signature.** Keep the default tone unless you are
  building an embedded or white-label surface, where `tone="light"` is correct.
- Identifiers — policy numbers, VINs, claim IDs, API keys — render in the mono face
  (`TextField mono`, `DataTable` column `mono`, `DescriptionList` item `mono`).

## Where the truth is

Read the real files rather than guessing: the stylesheet at `_ds/<folder>/styles.css` and its
imports (tokens and fonts resolve through it), and the per-component reference at
`components/<group>/<Name>/<Name>.prompt.md`, which carries the props and the usage rules.

## A page, idiomatically

```jsx
<PageHeader
  title="Quotes"
  description="Rated through the Centurion Rating API in the last 30 days."
  actions={<Button leadingIcon={<Icon name="sparkles" />} variant="accent">Generate quote</Button>}
/>
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--kv-space-lg)', marginBottom: 'var(--kv-space-xl)' }}>
  <StatCard label="Quotes issued" value="1,284" delta="+18.2%" trend="up" caption="vs. last 30 days" />
  <StatCard label="Attach rate" value="31%" delta="+4.1 pts" trend="up" caption="Goal 40%" />
</div>
<Card title="Open quotes" padding="none">
  <DataTable columns={columns} rows={rows} caption="Showing 20 of 348" />
</Card>
```

Library components carry the design language; your own glue uses the tokens above.
