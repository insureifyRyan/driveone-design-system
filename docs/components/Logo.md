---
category: Brand
---

# Logo

The full lockup: facet mark, `kōvara` wordmark, superscript `AI`, and the ™.

## Rules
- The ™ ships on by default. Leave it on — drop it only inside running text that already carries the notice.
- Add `tagline` on first-impression surfaces (login, marketing headers, email footers, partner decks). Keep it off inside app chrome, where it competes with the page title.
- On the indigo canvas use `onBrand`; never place the color lockup on a saturated background.

## Tagline
The approved line is exported as `KOVARA_TAGLINE`: *Agentic Infrastructure for finance and insurance*. Pass `tagline` (boolean) to render it verbatim rather than retyping it.

## Example
```tsx
<Logo size="lg" tagline />
<Logo size="sm" onBrand />
<Logo variant="stacked" size="xl" tagline="Agentic Infrastructure for finance and insurance" />
```
