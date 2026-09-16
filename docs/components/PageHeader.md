---
category: Navigation
---

# PageHeader

The top of every content page.

## Layout
Breadcrumbs, then the title with its status chip, the description, and the page actions right-aligned with the primary last. `Tabs` go in `children`, directly under the header.

## Example
```tsx
<PageHeader
  breadcrumbs={<Breadcrumbs items={[{ label: 'Policies', href: '#' }, { label: 'KV-4471-0098' }]} />}
  title="KV-4471-0098"
  meta={<StatusPill status="active" />}
  description="2021 Ford F-150 · Marcus Reyes · Beacon Auto Group"
  actions={<>
    <Button variant="secondary">Download documents</Button>
    <Button>Endorse policy</Button>
  </>}
/>
```
