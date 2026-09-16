---
category: Developer
---

# WebhookEventRow

One webhook delivery attempt.

## Rules
- Integrators debug against this row, so it carries exactly four things: event type, destination,
  HTTP status and latency. Resist adding more.
- `state` colors the status code: `ok` green, `retry` amber, `failed` red. A 200 that took 30
  seconds is still a problem — the latency column is why.
- Show `attempt` once it is above 1; a silent retry looks like a duplicate event.
- Event names use the platform's own vocabulary (`policy.bound`, `claim.updated`,
  `quote.abandoned`) — the same strings that appear in a `WorkflowRunCard` trigger.

## Example
```tsx
<Card title="Recent deliveries" padding="none">
  <WebhookEventRow event="policy.bound" target="https://beacon-auto.example.com/hooks/kovara" status={200} state="ok" latency="184ms" timestamp="2:14:08pm" />
  <WebhookEventRow event="claim.updated" target="https://lakeshore-cu.example.com/kovara" status={503} state="retry" latency="30.0s" attempt={3} timestamp="2:11:42pm" />
</Card>
```
