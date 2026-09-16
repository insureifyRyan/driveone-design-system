---
category: Data display
---

# Badge

A small classification label — coverage type, lead source, counts, "AI drafted".

## Badge vs StatusPill
`StatusPill` owns lifecycle state (quoted, bound, lapsed…). `Badge` is everything else. Never re-color a `Badge` to imitate a status: the two vocabularies must stay separate or green stops meaning in-force.

## Rules
`tone="accent"` (cyan) marks agent output, matching the `sparkles` icon and the accent button.

## Example
```tsx
<Badge tone="accent" icon={<Icon name="sparkles" size={12} />}>AI drafted</Badge>
<Badge tone="neutral" pill>Powertrain</Badge>
<Badge tone="danger" solid>Action required</Badge>
```
