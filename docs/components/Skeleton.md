---
category: Data display
---

# Skeleton

Loading placeholder shaped like the content that is coming.

## When to use
Lists and dashboards waiting on carrier round-trips — layout stability matters more than a progress hint when a call can take 20 seconds.

## Rules
Match the real content's shape: `text` with `lines` for copy, `rect` for cards and charts, `circle` for avatars.

## Example
```tsx
<Skeleton shape="text" lines={3} />
<Skeleton shape="rect" height={120} />
<Skeleton shape="circle" width={40} height={40} />
```
