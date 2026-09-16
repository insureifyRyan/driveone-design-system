---
category: Developer
---

# ApiKeyField

A credential, displayed the way credentials have to be.

## Rules
- Secret keys stay masked. `revealed` is an explicit user action, never a default.
- Always pair with an environment `Badge` — the single most common integration mistake is
  shipping a sandbox key to production, or the reverse.
- `meta` should carry creation and last-used ("Created Mar 2 · Last used 4 min ago"). Last-used is
  what tells someone whether a key is safe to roll.
- Never truncate the value silently — the masked form keeps the prefix and the last characters so
  a key can still be identified.

## Example
```tsx
<ApiKeyField
  label="Production secret key"
  value="kv_live_9f4c2a77bd1e4c8fa0b6"
  environment={<Badge tone="success">Live</Badge>}
  meta="Created Mar 2 · Last used 4 min ago"
/>
```
