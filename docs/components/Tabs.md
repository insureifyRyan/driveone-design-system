---
category: Navigation
---

# Tabs

Switches between views of the same subject.

## Variants
- `underline` for page-level sections of one record: Coverage / Documents / Activity.
- `pills` for filtering one list: Open / Bound / Expiring.

## Rules
Labels are nouns. `count` belongs on filter tabs where the number is the reason to switch.

## Example
```tsx
<Tabs variant="pills" items={[
  { id: 'open', label: 'Open', count: 12 },
  { id: 'bound', label: 'Bound', count: 148 },
  { id: 'expiring', label: 'Expiring', count: 6 },
]}>
  <DataTable columns={columns} rows={rows} />
</Tabs>
```
