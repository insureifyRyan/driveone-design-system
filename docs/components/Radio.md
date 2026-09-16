---
category: Forms
---

# Radio

One option in a mutually exclusive set.

## Rules
Every radio in a set shares one `name`, and the set belongs in a `RadioGroup` so screen readers announce the question with each option.

## Example
```tsx
<RadioGroup legend="Term length">
  <Radio name="term" label="36 months" hint="Most common for used vehicles" defaultChecked />
  <Radio name="term" label="48 months" />
  <Radio name="term" label="60 months" hint="Requires under 60,000 miles" />
</RadioGroup>
```
