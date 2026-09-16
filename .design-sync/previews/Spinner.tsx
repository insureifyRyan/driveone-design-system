import * as React from 'react';
import { Spinner, Button, Card, Icon } from '@kovara/design-system';

const caption: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--kv-color-text-muted)',
};

export const Sizes = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-end' }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Spinner size="sm" label="Rating with 4 carriers" />
      <span style={caption}>sm</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Spinner size="md" label="Rating with 4 carriers" />
      <span style={caption}>md</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Spinner size="lg" label="Rating with 4 carriers" />
      <span style={caption}>lg</span>
    </div>
  </div>
);

export const InlineWithText = () => (
  <div style={{ maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 16 }}>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--kv-color-text-secondary)' }}>
      <Spinner size="sm" label="Rating quote KV-Q-8841" />
      Rating KV-Q-8841 with 4 carriers…
    </span>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--kv-color-text-secondary)' }}>
      <Spinner size="sm" label="Syncing CDK Drive" />
      Pulling deal 1HGCM82633A004352 from CDK Drive…
    </span>
  </div>
);

export const InheritsColor = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
    <Button loading>Binding KV-4471-0098</Button>
    <Button variant="secondary" loading>Saving draft</Button>
    <Button variant="accent" loading>Generating quote</Button>
  </div>
);

export const AgentWorking = () => (
  <div style={{ maxWidth: 460 }}>
    <Card variant="accent" title="Claim #2210" subtitle="Harbor Point Assurance · Luis Ferrer">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
        <span style={{ color: 'var(--kv-color-text-accent)', display: 'inline-flex' }}>
          <Spinner size="lg" label="Kōvara is drafting the claim summary" />
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--kv-color-text-primary)' }}>
            <Icon name="sparkles" size={16} />
            Kōvara is drafting the claim summary
          </span>
          <span style={caption}>Reading 3 adjuster notes and the Centurion Rating API response</span>
        </span>
      </div>
    </Card>
  </div>
);
