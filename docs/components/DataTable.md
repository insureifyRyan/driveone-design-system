---
category: Data display
---

# DataTable

The workhorse list view: policies, quotes, claims, workflow runs, dealer accounts.

## Rules
- Declare columns rather than hand-writing cells, so alignment and mono treatment stay identical everywhere the same field appears.
- `numeric` right-aligns and applies tabular figures — use it for every premium, count and percentage.
- `mono` for identifiers: policy number, VIN, claim ID.
- `render` returns nodes, so status columns are `StatusPill`s and action columns are `Menu`s.
- Pass an `EmptyState` to `empty`; a bare "no results" row reads as a bug.

## Example
```tsx
<DataTable
  columns={[
    { key: 'policy', header: 'Policy', mono: true, width: 160 },
    { key: 'holder', header: 'Insured' },
    { key: 'premium', header: 'Premium', numeric: true },
    { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
  ]}
  rows={rows}
  caption="Showing 20 of 348 policies"
/>
```
