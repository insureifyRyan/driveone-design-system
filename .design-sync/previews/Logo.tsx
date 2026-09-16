import * as React from 'react';
import { Logo } from '@kovara/design-system';

const Caption = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontFamily: 'var(--kv-font-mono)', fontSize: 11, color: 'var(--kv-color-text-muted)' }}>{children}</span>
);

export const Lockup = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 22, alignItems: 'flex-start' }}>
    {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
      <div key={size} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <span style={{ width: 28 }}>
          <Caption>{size}</Caption>
        </span>
        <Logo variant="lockup" size={size} />
      </div>
    ))}
  </div>
);

export const Variants = () => (
  <div style={{ display: 'flex', gap: 44, alignItems: 'flex-end', flexWrap: 'wrap' }}>
    {(['lockup', 'stacked', 'wordmark', 'mark'] as const).map((variant) => (
      <div key={variant} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
        <Logo variant={variant} size="lg" />
        <Caption>{variant}</Caption>
      </div>
    ))}
  </div>
);

export const OnBrand = () => (
  <div style={{ display: 'grid', gap: 16, maxWidth: 560 }}>
    <div style={{ background: 'var(--kv-indigo-900)', padding: 28, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
      <Logo variant="lockup" size="lg" onBrand />
      <Logo variant="mark" size="lg" onBrand />
    </div>
    <div style={{ background: 'var(--kv-indigo-900)', padding: 20, borderRadius: 12 }}>
      <Logo variant="lockup" size="sm" onBrand />
    </div>
    <Caption>onBrand — the only treatment approved for the indigo canvas</Caption>
  </div>
);

export const WithTagline = () => (
  <div style={{ display: 'flex', gap: 56, alignItems: 'flex-start', flexWrap: 'wrap' }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Logo size="lg" tagline />
      <Caption>lockup + tagline — login, email footer</Caption>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <Logo variant="stacked" size="xl" tagline />
      <Caption>stacked + tagline — partner decks</Caption>
    </div>
  </div>
);
