---
category: Navigation
---

# Pagination

Page control under a `DataTable`.

## Rules
Presentational only — carrier-backed lists page server-side, so it reports the requested page and nothing else. Pass `totalItems` whenever the count is known: "Showing 41–60 of 348" is what tells someone whether to filter instead of page.

## Example
```tsx
<Pagination page={3} pageCount={18} totalItems={348} pageSize={20} onPageChange={setPage} />
```
