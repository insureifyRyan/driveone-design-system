import * as React from 'react';
import { WebhookEventRow, Card, Button } from '@kovara/design-system';

export const DeliveriesLog = () => (
  <div style={{ maxWidth: 720 }}>
    <Card
      title="Recent deliveries"
      subtitle="Beacon Auto Group · last 15 minutes"
      padding="none"
      action={<Button size="sm" variant="secondary">Replay failed</Button>}
    >
      <WebhookEventRow event="policy.bound" target="https://beacon-auto.example.com/hooks/kovara" status={200} state="ok" latency="184ms" timestamp="2:14:08pm" />
      <WebhookEventRow event="quote.abandoned" target="https://beacon-auto.example.com/hooks/kovara" status={200} state="ok" latency="96ms" timestamp="2:13:51pm" />
      <WebhookEventRow event="claim.updated" target="https://lakeshore-cu.example.com/kovara" status={503} state="retry" latency="30.0s" attempt={3} timestamp="2:11:42pm" />
      <WebhookEventRow event="policy.bound" target="https://fairview-service.example.com/api/kovara" status={200} state="ok" latency="212ms" timestamp="2:09:30pm" />
      <WebhookEventRow event="quote.abandoned" target="https://lakeshore-cu.example.com/kovara" status={500} state="failed" latency="1.4s" attempt={5} timestamp="2:04:17pm" />
    </Card>
  </div>
);

export const DeliveryStates = () => (
  <div style={{ maxWidth: 720, border: '1px solid var(--kv-color-border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
    <WebhookEventRow event="policy.bound" target="https://beacon-auto.example.com/hooks/kovara" status={200} state="ok" latency="184ms" timestamp="2:14:08pm" />
    <WebhookEventRow event="claim.updated" target="https://lakeshore-cu.example.com/kovara" status={503} state="retry" latency="30.0s" attempt={3} timestamp="2:11:42pm" />
    <WebhookEventRow event="quote.abandoned" target="https://fairview-service.example.com/api/kovara" status={500} state="failed" latency="1.4s" attempt={5} timestamp="2:04:17pm" />
  </div>
);

export const FailingSubscriber = () => (
  <div style={{ maxWidth: 720 }}>
    <Card title="quote.abandoned → Lakeshore Credit Union" subtitle="5 attempts · backing off, next retry 2:36pm" padding="none">
      <WebhookEventRow event="quote.abandoned" target="https://lakeshore-cu.example.com/kovara" status={500} state="failed" latency="1.4s" attempt={5} timestamp="2:04:17pm" />
      <WebhookEventRow event="quote.abandoned" target="https://lakeshore-cu.example.com/kovara" status={503} state="retry" latency="30.0s" attempt={4} timestamp="1:52:03pm" />
      <WebhookEventRow event="quote.abandoned" target="https://lakeshore-cu.example.com/kovara" status={503} state="retry" latency="30.0s" attempt={3} timestamp="1:44:55pm" />
      <WebhookEventRow event="quote.abandoned" target="https://lakeshore-cu.example.com/kovara" status={502} state="retry" latency="8.9s" attempt={2} timestamp="1:41:28pm" />
      <WebhookEventRow event="quote.abandoned" target="https://lakeshore-cu.example.com/kovara" status={200} state="ok" latency="143ms" timestamp="1:39:02pm" />
    </Card>
  </div>
);
