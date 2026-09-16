---
category: Actions
---

# IconButton

A square, icon-only control for dense chrome.

## When to use
- Table-row overflow, toolbar actions, dismiss affordances, collapse toggles.
- Not for primary actions: if it matters, it deserves a word.

## Rules
`label` is required and becomes both the accessible name and the tooltip — write what the action does ("Policy actions"), not what it looks like ("More").

## Example
```tsx
<IconButton icon={<Icon name="more-horizontal" />} label="Policy actions" />
<IconButton icon={<Icon name="download" />} label="Export CSV" variant="outline" />
```
