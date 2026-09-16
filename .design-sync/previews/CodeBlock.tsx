import * as React from 'react';
import { CodeBlock } from '@kovara/design-system';

export const RateAContract = () => (
  <div style={{ maxWidth: 720 }}>
    <CodeBlock
      language="bash"
      filename="Rate a contract"
      code={`curl https://api.kovara.ai/v1/quotes \\
  -H "Authorization: Bearer kv_live_9f4c2a77bd1e4c8fa0b6" \\
  -H "Content-Type: application/json" \\
  -d '{
    "vin": "1HGCM82633A004352",
    "mileage": 41200,
    "vehicle_price": 34995,
    "term_months": 36,
    "deductible": 100,
    "carriers": ["centurion_mutual", "harbor_point", "ridgeline_specialty"]
  }'`}
    />
  </div>
);

export const BindWithTypeScript = () => (
  <div style={{ maxWidth: 720 }}>
    <CodeBlock
      language="ts"
      filename="app/api/bind/route.ts"
      code={`import { Kovara } from '@kovara/node';

const kovara = new Kovara(process.env.KOVARA_API_KEY);

// Bind the option Dana Whitfield selected for Marcus Reyes
const policy = await kovara.quotes.bind('KV-Q-8841', {
  option_id: 'centurion_platinum_36',
  insured: { name: 'Marcus Reyes', email: 'm.reyes@example.com' },
  deductible_cents: 10000,
  monthly_premium_cents: 11840,
});

policy.id;            // 'KV-4471-0098'
policy.status;        // 'bound'
policy.contract_url;  // signed PDF, valid 24h`}
    />
  </div>
);

export const SubscribeToWebhooks = () => (
  <div style={{ maxWidth: 720 }}>
    <CodeBlock
      language="bash"
      filename="Subscribe Beacon Auto Group to events"
      code={`curl https://api.kovara.ai/v1/webhook_endpoints \\
  -H "Authorization: Bearer kv_test_3b81d0f6ac5249e7b284" \\
  -d url=https://beacon-auto.example.com/hooks/kovara \\
  -d "enabled_events[]=policy.bound" \\
  -d "enabled_events[]=claim.updated" \\
  -d "enabled_events[]=quote.abandoned"`}
    />
  </div>
);

export const Tones = () => {
  const payload = `{
  "id": "evt_7f21c8a3d90b",
  "type": "policy.bound",
  "data": {
    "policy_id": "KV-4471-0098",
    "quote_id": "KV-Q-8841",
    "carrier": "Centurion Mutual",
    "monthly_premium": "$118.40"
  }
}`;
  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 720 }}>
      <CodeBlock language="json" filename="policy.bound — dark (marketing default)" code={payload} />
      <CodeBlock tone="light" language="json" filename="policy.bound — tone=&quot;light&quot; (reference page)" code={payload} />
    </div>
  );
};
