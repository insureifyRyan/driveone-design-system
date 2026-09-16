import * as React from 'react';
import { BrandMark, Card, Badge, Icon, Spinner } from '@kovara/design-system';

const Label = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontFamily: 'var(--kv-font-mono)', fontSize: 11, color: 'var(--kv-color-text-muted)' }}>{children}</span>
);

export const Tones = () => (
  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ padding: 18, borderRadius: 12, border: '1px solid var(--kv-color-border-subtle)', background: 'var(--kv-color-bg-surface)' }}>
        <BrandMark size={48} tone="color" title="Kōvara AI" />
      </div>
      <Label>color</Label>
      <span style={{ fontSize: 11, color: 'var(--kv-color-text-muted)' }}>light surfaces</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ padding: 18, borderRadius: 12, background: 'var(--kv-indigo-900)' }}>
        <BrandMark size={48} tone="on-brand" title="Kōvara AI" />
      </div>
      <Label>on-brand</Label>
      <span style={{ fontSize: 11, color: 'var(--kv-color-text-muted)' }}>indigo canvas</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ padding: 18, borderRadius: 12, border: '1px solid var(--kv-color-border-subtle)', background: 'var(--kv-color-bg-surface)' }}>
        <BrandMark size={48} tone="mono" title="Kōvara AI" />
      </div>
      <Label>mono</Label>
      <span style={{ fontSize: 11, color: 'var(--kv-color-text-muted)' }}>one-color print</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ padding: 18, borderRadius: 12, background: 'var(--kv-neutral-900)' }}>
        <BrandMark size={48} tone="inverse" title="Kōvara AI" />
      </div>
      <Label>inverse</Label>
      <span style={{ fontSize: 11, color: 'var(--kv-color-text-muted)' }}>dark chrome</span>
    </div>
  </div>
);

export const Sizes = () => (
  <div style={{ display: 'flex', gap: 28, alignItems: 'flex-end' }}>
    {[
      { size: 24, where: 'top bar' },
      { size: 32, where: 'sidebar' },
      { size: 40, where: 'collapsed nav' },
      { size: 64, where: 'marketing' },
    ].map(({ size, where }) => (
      <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <BrandMark size={size} />
        <Label>{size}px</Label>
        <span style={{ fontSize: 11, color: 'var(--kv-color-text-muted)' }}>{where}</span>
      </div>
    ))}
  </div>
);

export const AsAgentAvatar = () => (
  <div style={{ maxWidth: 460 }}>
    <Card
      title="Claim #2210"
      subtitle="Marcus Reyes · Fairview Service Center"
      action={<Badge tone="accent" icon={<Icon name="sparkles" size={12} />}>AI drafted</Badge>}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'var(--kv-indigo-900)',
            flexShrink: 0,
          }}
        >
          <BrandMark size={22} tone="on-brand" title="Kōvara AI" />
        </span>
        <div style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Kōvara agent</span>
          <span style={{ fontSize: 13, color: 'var(--kv-color-text-secondary)' }}>
            Pulled the repair order from Fairview Service Center, matched it to policy KV-4471-0098 and
            queued $1,842 for Luis Ferrer to approve.
          </span>
        </div>
      </div>
    </Card>
  </div>
);

export const CollapsedChrome = () => (
  <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
    <div
      style={{
        width: 64,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
        padding: '18px 0',
        borderRadius: 12,
        background: 'var(--kv-indigo-900)',
        color: 'rgba(255,255,255,0.75)',
      }}
    >
      <BrandMark size={28} tone="on-brand" title="Kōvara AI" />
      <Icon name="file-text" size={18} />
      <Icon name="shield" size={18} />
      <Icon name="phone" size={18} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Label>collapsed sidebar rail</Label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <BrandMark size={20} />
        <Spinner size="sm" />
        <span style={{ fontSize: 13, color: 'var(--kv-color-text-muted)' }}>Rating with Centurion Rating API…</span>
      </div>
    </div>
  </div>
);
