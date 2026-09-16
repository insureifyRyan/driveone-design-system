---
category: Data display
---

# Card

The standard content container: every dashboard panel, detail section and form block sits in one.

## Rules
- `variant="accent"` adds the cyan top rule — reserve it for panels the agent owns (AI recommendations, automated activity), same discipline as the cyan button.
- `padding="none"` when the body is a `DataTable` or a full-bleed chart, so the table's own header aligns to the card edge.
- `footer` is right-aligned: put the card's actions there, primary last.

## Example
```tsx
<Card
  title="Open quotes"
  subtitle="Updated 4 minutes ago"
  padding="none"
  action={<IconButton icon={<Icon name="more-horizontal" />} label="Panel options" />}
  footer={<Button size="sm">New quote</Button>}
>
  <DataTable columns={columns} rows={rows} />
</Card>
```
