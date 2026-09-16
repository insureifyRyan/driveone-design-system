---
category: Forms
---

# Switch

An immediate on/off toggle — it takes effect the moment it flips, with no Save step.

## When to use
- Automation switches: auto-follow-up, AI voice answering, carrier sync, after-hours routing.
- If the change needs confirming or batching, use `Checkbox` in a form.

## Rules
Label the on state as a statement of what will happen ("Let Kōvara follow up on abandoned quotes"), not as a noun ("Follow-ups").

## Example
```tsx
<Switch label="Let Kōvara follow up on abandoned quotes" defaultChecked />
<Switch label="Answer after-hours calls with Kōvara Voice" size="sm" />
```
