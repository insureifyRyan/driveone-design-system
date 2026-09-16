---
category: Navigation
---

# Breadcrumbs

Shows where a detail page sits in the hierarchy.

## Rules
Use on any screen reached by drilling in; skip on top-level dashboards. The last crumb is the current page and is never a link.

## Example
```tsx
<Breadcrumbs items={[
  { label: 'Policies', href: '/policies' },
  { label: 'KV-4471-0098', href: '/policies/kv-4471-0098' },
  { label: 'Claim #2210' },
]} />
```
