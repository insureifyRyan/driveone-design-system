---
category: Platform
---

# CallSummaryCard

The record of one AI voice interaction — the review surface for AI voice customer service.

## Rules
- `handledBy` must be accurate. Supervisors triage on it, and mislabeling agent work as human work destroys the queue's usefulness.
- The `summary` is the agent's own account of the call in two or three sentences — what the caller wanted and how it ended.
- `outcome` drives escalation queues: `escalated` means a person still owes this caller something.

## Example
```tsx
<CallSummaryCard
  contact="Marcus Reyes"
  phone="(614) 555-0142"
  direction="inbound"
  duration="4:12"
  timestamp="Today 2:14pm"
  outcome="resolved"
  handledBy="agent"
  topics={['claim status', 'deductible']}
  summary="Caller asked where his transmission claim stood. Confirmed the estimate was approved, a $100 deductible applies, and the shop is authorized to begin work."
  actions={<Button variant="link" size="sm">Open transcript</Button>}
/>
```
