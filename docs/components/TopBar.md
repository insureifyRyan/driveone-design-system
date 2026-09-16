---
category: Navigation
---

# TopBar

The application header above the content column.

## Layout
Workspace identity at the left, global `SearchInput` in the middle, alerts and account at the right. Keep that order across every surface — it is the only chrome users navigate by muscle memory.

## Example
```tsx
<TopBar
  title="Quotes"
  center={<SearchInput placeholder="Search policies, VINs, claim IDs…" shortcut="⌘K" />}
  end={<>
    <IconButton icon={<Icon name="bell" />} label="Notifications" />
    <Avatar name="Dana Whitfield" size="sm" />
  </>}
/>
```
