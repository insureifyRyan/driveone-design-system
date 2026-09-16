---
category: Forms
---

# Select

Native select with Kōvara field chrome.

## When to use
- Bounded lists: carrier, coverage term, state, dealership, payment cadence.
- For long or searchable lists (every VIN, every insured), build a combobox from `TextField` + `Menu` instead.

## Rules
`placeholder` renders as a disabled first option, so an unfilled select is visibly unfilled rather than defaulted to the first carrier.

## Example
```tsx
<Select
  label="Carrier"
  placeholder="Select a carrier"
  options={[
    { label: 'Centurion Mutual', value: 'centurion' },
    { label: 'Harbor Point Assurance', value: 'harbor' },
    { label: 'Ridgeline Specialty', value: 'ridgeline', disabled: true },
  ]}
  hint="Only carriers appointed for this state are listed"
/>
```
