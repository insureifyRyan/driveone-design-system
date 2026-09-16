---
category: Forms
---

# RadioGroup

Groups `Radio` options under one legend.

## When to use
Term length, payment cadence, deductible tier, coverage level — any question with two to five visible answers. Past five, use `Select`.

## Rules
`orientation="horizontal"` only for two or three short options; long labels in a row wrap badly.

## Example
```tsx
<RadioGroup legend="Deductible" orientation="horizontal" hint="Applies per claim, not per visit">
  <Radio name="ded" label="$0" />
  <Radio name="ded" label="$100" defaultChecked />
  <Radio name="ded" label="$250" />
</RadioGroup>
```
