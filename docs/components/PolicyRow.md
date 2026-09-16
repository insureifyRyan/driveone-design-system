---
category: Platform
---

# PolicyRow

A single contract in a list — denser than a card, richer than a table row.

## PolicyRow vs DataTable
Use `PolicyRow` when the holder and the status are what people scan. Use `DataTable` when the columns themselves are being compared across rows.

## Rules
Always show `policyNumber` — it is how people search, phone in and reconcile. `owner` renders as a small avatar so the assigned producer is visible without a column.

## Example
```tsx
<PolicyRow
  holder="Marcus Reyes"
  policyNumber="KV-4471-0098"
  subject="2021 Ford F-150 · 62,400 mi"
  premium="$118.40"
  cadence="monthly"
  status="active"
  owner="Dana Whitfield"
  interactive
  action={<IconButton icon={<Icon name="chevron-right" />} label="Open policy" size="sm" />}
/>
```
