---
category: Navigation
---

# Menu

The overflow / actions menu behind a `…` button.

## Rules
- Destructive rows go last, in their own group, with `danger`.
- Group with dividers rather than listing ten flat rows.
- `shortcut` only for actions the app actually binds.

## Example
```tsx
<Menu
  trigger={<IconButton icon={<Icon name="more-horizontal" />} label="Policy actions" />}
  defaultOpen
  groups={[
    { items: [
      { label: 'View documents', icon: <Icon name="file-text" size={16} /> },
      { label: 'Email insured', icon: <Icon name="mail" size={16} />, shortcut: '⌘E' },
    ]},
    { items: [{ label: 'Cancel policy', icon: <Icon name="x-circle" size={16} />, danger: true }] },
  ]}
/>
```
