---
category: Data display
---

# StatusPill

The single source of truth for lifecycle state across quotes, policies, claims and runs.

## The vocabulary
`draft` · `quoted` · `in-review` · `pending` · `bound` · `active` · `expiring` · `lapsed` · `declined`

Green is in-force (`bound`, `active`). Cyan is in flight (`quoted`, `in-review`). Amber is time-sensitive (`pending`, `expiring`). Red is terminal (`lapsed`, `declined`). Grey is not started (`draft`).

## Rules
Use `label` to add specificity while keeping the color's meaning — "Expires in 6 days" on `expiring`. Never invent a status by re-coloring a `Badge`.

## Example
```tsx
<StatusPill status="bound" />
<StatusPill status="expiring" label="Expires in 6 days" />
```
