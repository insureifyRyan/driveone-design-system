---
category: Data display
---

# DescriptionList

Read-only field/value pairs — the summary block on a policy, quote or claim detail page.

## Rules
- Use it instead of a disabled form. These values are facts, not inputs that happen to be locked.
- `mono: true` on identifiers and VINs.
- Two columns inside a `Card`, three on a full-width detail page.

## Example
```tsx
<DescriptionList
  columns={2}
  items={[
    { term: 'Policy number', description: 'KV-4471-0098', mono: true },
    { term: 'Effective', description: 'Mar 1, 2026' },
    { term: 'Vehicle', description: '2021 Ford F-150 · 62,400 mi' },
    { term: 'Status', description: <StatusPill status="active" /> },
  ]}
/>
```
