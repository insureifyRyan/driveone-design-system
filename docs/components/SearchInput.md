---
category: Forms
---

# SearchInput

The search control in the top bar and above every list.

## Rules
- Label-less by design — the magnifier and the placeholder carry the meaning; `label` sets the accessible name.
- Name what is searchable in the placeholder: users need to know a VIN will work.
- Pass `shortcut` when the app binds a global key.

## Example
```tsx
<SearchInput placeholder="Search policies, VINs, claim IDs…" shortcut="⌘K" />
```
