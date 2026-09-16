---
category: Forms
---

# Checkbox

Independent choices — coverage add-ons, notification channels, row selection.

## Rules
- `hint` is where the consequence goes: price impact, who gets notified.
- `indeterminate` is for a "select all" header over a partially selected list.
- For a setting that takes effect immediately, use `Switch` instead.

## Example
```tsx
<Checkbox label="Attach roadside assistance" hint="Adds $4.10/mo to the contract" defaultChecked />
<Checkbox label="Select all 18 quotes" indeterminate />
```
