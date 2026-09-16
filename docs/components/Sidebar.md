---
category: Navigation
---

# Sidebar

The primary application rail, and the single strongest brand signal in the product.

## Rules
- Keep the default `indigo` tone. It is what makes a screen read as Kōvara at a glance; `light` is for embedded and white-label surfaces only.
- Exactly one item `active`.
- Group with `SidebarSection` labels once past ~6 items — Operations, Distribution, Automation, Admin.
- `badge` carries counts that need action (open claims, approvals waiting), not decoration.

## Example
```tsx
<Sidebar
  brand={<Logo size="sm" onBrand />}
  sections={[
    { label: 'Operations', items: [
      { label: 'Dashboard', icon: <Icon name="grid" size={18} />, active: true },
      { label: 'Quotes', icon: <Icon name="file-text" size={18} />, badge: 12 },
      { label: 'Policies', icon: <Icon name="shield" size={18} /> },
      { label: 'Claims', icon: <Icon name="clipboard" size={18} />, badge: 3 },
    ]},
    { label: 'Automation', items: [
      { label: 'Workflows', icon: <Icon name="zap" size={18} /> },
      { label: 'Voice', icon: <Icon name="phone" size={18} /> },
      { label: 'Integrations', icon: <Icon name="plug" size={18} /> },
    ]},
  ]}
  footer={<Avatar name="Dana Whitfield" size="sm" />}
/>
```
