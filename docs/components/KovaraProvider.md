---
category: Foundations
---

# KovaraProvider

The root every Kōvara surface must be wrapped in. It applies the base typography, canvas color and box-sizing, and publishes the theme that every component reads its colors from.

## When to use
- Once at the root of an app, page or embedded Kōvara region.
- Again, nested, only when a region genuinely needs the opposite theme (a dark hero band inside a light app).

## Getting it wrong
Components rendered outside a provider inherit the host page's fonts and have no theme tokens: they render in Times-ish browser defaults with transparent surfaces. If a screen looks unbranded, this wrapper is the first thing to check.

## Example
```tsx
import '@kovara/design-system/styles.css';

<KovaraProvider theme="light" fullHeight>
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    <Sidebar brand={<Logo size="sm" onBrand />} sections={sections} />
    <main style={{ flex: 1 }}>
      <TopBar title="Quotes" />
      <div style={{ padding: 32 }}>{children}</div>
    </main>
  </div>
</KovaraProvider>
```
