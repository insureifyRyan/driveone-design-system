import * as React from 'react';
import { ApiKeyField, Card, Badge, Button, Icon } from '@kovara/design-system';

export const Masked = () => (
  <div style={{ maxWidth: 560 }}>
    <ApiKeyField
      label="Production secret key"
      value="kv_live_9f4c2a77bd1e4c8fa0b6"
      environment={<Badge tone="success">Live</Badge>}
      meta="Created Mar 2 · Last used 4 min ago"
    />
  </div>
);

export const Revealed = () => (
  <div style={{ maxWidth: 560 }}>
    <ApiKeyField
      label="Sandbox publishable key"
      value="kv_test_3b81d0f6ac5249e7b284"
      revealed
      environment={<Badge tone="neutral">Sandbox</Badge>}
      meta="Created Mar 2 · Last used 11 hours ago"
    />
  </div>
);

export const EnvironmentPair = () => (
  <div style={{ maxWidth: 560 }}>
    <Card title="API keys" subtitle="Beacon Auto Group · CDK Drive integration">
      <div style={{ display: 'grid', gap: 20 }}>
        <ApiKeyField
          label="Production secret key"
          value="kv_live_9f4c2a77bd1e4c8fa0b6"
          environment={<Badge tone="success">Live</Badge>}
          meta="Created Mar 2 · Last used 4 min ago"
        />
        <ApiKeyField
          label="Sandbox secret key"
          value="kv_test_3b81d0f6ac5249e7b284"
          environment={<Badge tone="neutral">Sandbox</Badge>}
          meta="Created Mar 2 · Last used 11 hours ago"
        />
      </div>
    </Card>
  </div>
);

export const WithActions = () => (
  <div style={{ maxWidth: 560 }}>
    <ApiKeyField
      label="Restricted key · Lakeshore Credit Union"
      value="kv_live_c05e81aa47f3406db917"
      environment={<Badge tone="success">Live</Badge>}
      meta="Created Jan 14 · Last used 2 days ago · quotes.read only · rolls in 6 days"
      actions={
        <Button size="sm" variant="secondary" leadingIcon={<Icon name="settings" size={14} />}>
          Roll
        </Button>
      }
    />
  </div>
);
