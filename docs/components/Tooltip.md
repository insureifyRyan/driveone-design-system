---
category: Feedback
---

# Tooltip

Hover/focus explanation for a control whose label had to stay short.

## Rules
- Never the only place information exists — tooltips are unreachable on touch and invisible to scanning.
- One short sentence. Definitions of metrics are the best use ("Share of eligible deals with a service contract attached").

## Example
```tsx
<Tooltip content="Share of eligible deals with a service contract attached">
  <IconButton icon={<Icon name="info" />} label="About attach rate" size="sm" />
</Tooltip>
```
