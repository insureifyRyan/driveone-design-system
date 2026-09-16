---
category: Actions
---

# Button

The Kōvara button.

## Choosing a variant
- `primary` — the one committing action in a screen region: Bind policy, Send quote, Save changes.
- `secondary` — supporting actions sitting next to a primary.
- `accent` — cyan, reserved for actions the agent performs: Generate quote, Autofill from VIN, Draft follow-up. Consistency here teaches users that cyan means Kōvara acts.
- `ghost` — low-emphasis chrome: toolbar and table-row actions.
- `danger` — irreversible: Cancel policy, Delete workflow.
- `link` — inline navigation that must read as text.

## Rules
- One `primary` per region. Two primaries side by side means the decision hasn't been made.
- Labels are verb phrases naming the outcome ("Bind policy"), not "Submit" or "OK".
- `loading` replaces the label with a spinner and blocks the click — use it for carrier round-trips.

## Example
```tsx
<Button variant="primary" leadingIcon={<Icon name="shield" />}>Bind policy</Button>
<Button variant="accent" leadingIcon={<Icon name="sparkles" />} loading>Rating with 4 carriers</Button>
<Button variant="secondary">Save draft</Button>
```
