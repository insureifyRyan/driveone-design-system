---
category: Feedback
---

# EmptyState

The zero state of a list or panel.

## Rules
Always say what will appear here and give the one action that makes it appear. An empty screen with no next step reads as broken, and in an agentic product it reads as "the agent isn't working".

## Rules for placement
`plain` when already inside a `Card` or a `DataTable` body; the framed default when standing alone on a page.

## Example
```tsx
<EmptyState
  icon={<Icon name="file-text" size={22} />}
  title="No open quotes"
  description="Quotes your team starts — or Kōvara rates automatically — will appear here."
  actions={<Button leadingIcon={<Icon name="plus" />}>New quote</Button>}
/>
```
