---
category: Platform
---

# WorkflowRunCard

One execution of an automated workflow — the unit of the AI workflow automation surface.

## Rules
- Show what ran, how far it got and what it touched, so an operator can tell a slow run from a stuck one without opening logs.
- `trigger` names the cause in the system's own vocabulary — "Webhook · dealer.quote.abandoned", "Schedule · 06:00".
- On `failed`, set `failedStep` so the step bar shows where it broke.

## Example
```tsx
<WorkflowRunCard
  name="Abandoned quote follow-up"
  trigger="Webhook · dealer.quote.abandoned"
  state="running"
  steps={5}
  completedSteps={3}
  duration="42s"
  recordsProcessed={18}
  action={<IconButton icon={<Icon name="more-horizontal" />} label="Run actions" size="sm" />}
/>
```
