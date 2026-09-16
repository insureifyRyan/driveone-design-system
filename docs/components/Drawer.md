---
category: Overlay
---

# Drawer

A side panel for detail work that must keep the list behind it in view.

## When to use
Inspecting a quote from the pipeline, editing a workflow step, reviewing a call transcript. Use `Modal` when the user must decide before anything else can happen.

## Example
```tsx
<Drawer
  open
  title="Quote KV-Q-8841"
  description="Centurion Mutual · 36 months"
  footer={<Button fullWidth>Send to customer</Button>}
>
  <DescriptionList columns={1} items={items} />
</Drawer>
```
