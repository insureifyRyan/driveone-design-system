---
category: Feedback
---

# Alert

An inline, page-level message that stays until the condition clears.

## When to use
- Carrier feed degraded, rate change effective today, credential expiring, compliance hold.
- For a transient confirmation use `Toast`; for a blocking decision use `Modal`.

## Rules
Say what happened, what it means, and what to do — put the fix in `actions`.

## Example
```tsx
<Alert tone="warning" title="Carrier feed degraded" actions={<Button size="sm" variant="secondary">View status</Button>} onDismiss={() => {}}>
  Centurion Mutual is returning rates slowly. Quotes may take up to 90 seconds.
</Alert>
```
