---
category: Data display
---

# Progress

A determinate bar for a ratio or a completion.

## When to use
Attach rate against goal, documents received, onboarding completeness, quota. For unknown duration use `Spinner`.

## Rules
`valueText` carries the interpretation ("31% of 40% goal"); the bar alone never says whether the number is good.

## Example
```tsx
<Progress label="Warranty attach rate" value={31} valueText="31% of 40% goal" tone="accent" />
<Progress label="Documents received" value={18} max={24} valueText="18 of 24" tone="success" size="sm" />
```
