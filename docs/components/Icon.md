---
category: Foundations
---

# Icon

The Kōvara line icon set — one 24×24 grid, `currentColor` stroke, so an icon always takes the color of the text or button around it.

## When to use
- Inside buttons, nav items, status rows, stat tiles and empty states.
- Never as the only carrier of meaning: pair with text, or use `IconButton`, which forces a label.

## Sizing
`12` in badges, `13–14` in metadata rows, `16` in buttons and table cells (the default), `18` in nav and alerts, `22+` in empty-state tiles.

## Semantics that matter in Kōvara
`sparkles` means the agent did it. Use it only for AI-produced output — quotes it rated, calls it handled, drafts it wrote — so the mark stays trustworthy.

## Example
```tsx
<Button leadingIcon={<Icon name="sparkles" />}>Generate quote</Button>
<Icon name="shield" size={18} title="Coverage in force" />
```
