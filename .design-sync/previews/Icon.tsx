import * as React from 'react';
import { Icon, Button, Badge, Card, StatusPill } from '@kovara/design-system';
import type { IconName } from '@kovara/design-system';

const ALL_ICONS: IconName[] = [
  'check', 'check-circle', 'x', 'x-circle', 'alert-triangle', 'info', 'chevron-down', 'chevron-right',
  'chevron-left', 'arrow-up', 'arrow-down', 'arrow-right', 'plus', 'minus', 'search', 'filter',
  'bell', 'user', 'users', 'shield', 'file-text', 'clipboard', 'phone', 'mail',
  'message', 'zap', 'plug', 'grid', 'car', 'building', 'credit-card', 'clock',
  'calendar', 'download', 'external-link', 'more-horizontal', 'settings', 'sparkles', 'trending-up', 'trending-down',
];

export const AllGlyphs = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 10, maxWidth: 840 }}>
    {ALL_ICONS.map((name) => (
      <div
        key={name}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          padding: '10px 4px',
          borderRadius: 8,
          border: '1px solid var(--kv-color-border-subtle)',
          color: name === 'sparkles' ? 'var(--kv-color-text-accent)' : 'var(--kv-color-text-brand)',
        }}
      >
        <Icon name={name} size={22} />
        <span
          style={{
            fontFamily: 'var(--kv-font-mono)',
            fontSize: 9.5,
            lineHeight: 1.2,
            textAlign: 'center',
            color: 'var(--kv-color-text-muted)',
            wordBreak: 'break-word',
          }}
        >
          {name}
        </span>
      </div>
    ))}
  </div>
);

export const Sizes = () => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28, color: 'var(--kv-color-text-brand)' }}>
    {[
      { size: 12, where: 'badges' },
      { size: 14, where: 'metadata' },
      { size: 16, where: 'buttons' },
      { size: 18, where: 'nav, alerts' },
      { size: 22, where: 'empty states' },
    ].map(({ size, where }) => (
      <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <Icon name="shield" size={size} />
        <span style={{ fontFamily: 'var(--kv-font-mono)', fontSize: 11, color: 'var(--kv-color-text-primary)' }}>{size}</span>
        <span style={{ fontSize: 11, color: 'var(--kv-color-text-muted)' }}>{where}</span>
      </div>
    ))}
  </div>
);

export const InheritsColor = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
    <Button leadingIcon={<Icon name="shield" />}>Bind policy</Button>
    <Button variant="secondary" trailingIcon={<Icon name="external-link" />}>Open in CDK Drive</Button>
    <Button variant="danger" leadingIcon={<Icon name="x-circle" />}>Decline claim</Button>
    <Badge tone="brand" icon={<Icon name="car" size={12} />}>Vehicle service contract</Badge>
    <StatusPill status="expiring" label="Expires in 6 days" />
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--kv-color-text-muted)' }}>
      <Icon name="clock" size={14} />
      Updated 4 minutes ago
    </span>
  </div>
);

export const AgentSemantics = () => (
  <div style={{ maxWidth: 460 }}>
    <Card
      variant="accent"
      title="Kōvara rated this deal"
      subtitle="Quote KV-Q-8841 · Marcus Reyes"
      action={<Badge tone="accent" icon={<Icon name="sparkles" size={12} />}>AI drafted</Badge>}
      footer={<Button size="sm" variant="accent" leadingIcon={<Icon name="sparkles" />}>Generate quote</Button>}
    >
      <span style={{ fontSize: 13, color: 'var(--kv-color-text-secondary)' }}>
        Cyan and <code>sparkles</code> mean the agent produced it. Everything the producer did keeps the
        indigo glyphs above — never mark human work with <code>sparkles</code>.
      </span>
    </Card>
  </div>
);
