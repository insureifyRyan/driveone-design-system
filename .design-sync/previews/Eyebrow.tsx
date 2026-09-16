import * as React from 'react';
import { Eyebrow } from '@kovara/design-system';

export const SectionOpener = () => (
  <div style={{ maxWidth: 720, display: 'grid', gap: 12 }}>
    <Eyebrow>Kōvara portfolio</Eyebrow>
    <h2 style={{ fontSize: 'var(--kv-font-size-4xl)', lineHeight: 'var(--kv-line-height-tight)', fontWeight: 700 }}>
      One team building the next generation of vehicle protection products.
    </h2>
    <p style={{ fontSize: 'var(--kv-font-size-md)', color: 'var(--kv-color-text-secondary)', lineHeight: 'var(--kv-line-height-relaxed)' }}>
      Four products on one agentic platform — quoting, embedded F&amp;I, claims and onboarding —
      shipped for insurance agencies, dealers, credit unions and drivers.
    </p>
  </div>
);

export const SectionVocabulary = () => (
  <div style={{ maxWidth: 720, display: 'grid', gap: 28 }}>
    <div style={{ display: 'grid', gap: 10 }}>
      <Eyebrow>Platform</Eyebrow>
      <h2 style={{ fontSize: 'var(--kv-font-size-2xl)', lineHeight: 'var(--kv-line-height-snug)', fontWeight: 700 }}>
        Rate, bind and remit through one contract.
      </h2>
    </div>
    <div style={{ display: 'grid', gap: 10 }}>
      <Eyebrow>For developers</Eyebrow>
      <h2 style={{ fontSize: 'var(--kv-font-size-2xl)', lineHeight: 'var(--kv-line-height-snug)', fontWeight: 700 }}>
        A REST API, typed SDKs and signed webhooks.
      </h2>
    </div>
    <div style={{ display: 'grid', gap: 10 }}>
      <Eyebrow>Integrations</Eyebrow>
      <h2 style={{ fontSize: 'var(--kv-font-size-2xl)', lineHeight: 'var(--kv-line-height-snug)', fontWeight: 700 }}>
        Already speaking CDK Drive, Symitar and Salesforce.
      </h2>
    </div>
  </div>
);

export const WithoutRule = () => (
  <div style={{ maxWidth: 720, display: 'grid', gap: 24 }}>
    <div style={{ display: 'grid', gap: 10 }}>
      <Eyebrow>Embedded F&amp;I</Eyebrow>
      <h2 style={{ fontSize: 'var(--kv-font-size-xl)', lineHeight: 'var(--kv-line-height-snug)', fontWeight: 700 }}>
        With the cyan rule — the default section opener.
      </h2>
    </div>
    <div style={{ display: 'grid', gap: 10 }}>
      <Eyebrow rule={false}>Embedded F&amp;I</Eyebrow>
      <h2 style={{ fontSize: 'var(--kv-font-size-xl)', lineHeight: 'var(--kv-line-height-snug)', fontWeight: 700 }}>
        Without it — for stacked cards where the rule repeats.
      </h2>
    </div>
  </div>
);

export const OnBrand = () => (
  <div
    style={{
      maxWidth: 720,
      display: 'grid',
      gap: 12,
      padding: 40,
      borderRadius: 'var(--kv-radius-2xl)',
      backgroundColor: 'var(--kv-indigo-700)',
    }}
  >
    <Eyebrow onBrand>For developers</Eyebrow>
    <h2
      style={{
        fontSize: 'var(--kv-font-size-3xl)',
        lineHeight: 'var(--kv-line-height-tight)',
        fontWeight: 700,
        color: 'var(--kv-color-text-on-brand)',
      }}
    >
      Ship protection products in an afternoon, not a quarter.
    </h2>
    <p style={{ fontSize: 'var(--kv-font-size-sm)', color: 'rgba(255,255,255,0.72)', lineHeight: 'var(--kv-line-height-relaxed)' }}>
      One POST to <code>/v1/quotes</code> returns every appointed carrier, priced.
    </p>
  </div>
);
