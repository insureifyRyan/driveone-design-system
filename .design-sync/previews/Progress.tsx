import * as React from 'react';
import { Progress, Card } from '@kovara/design-system';

export const AttachRateAgainstGoal = () => (
  <div style={{ maxWidth: 460 }}>
    <Progress label="Warranty attach rate" value={31} valueText="31% of 40% goal" tone="accent" />
  </div>
);

export const Tones = () => (
  <div style={{ display: 'grid', gap: 20, maxWidth: 460 }}>
    <Progress label="Quota to date · Dana Whitfield" value={72} valueText="$720K of $1M" tone="brand" />
    <Progress label="Agent-handled intake" value={58} valueText="58% of conversations" tone="accent" />
    <Progress label="Documents received" value={18} max={24} valueText="18 of 24" tone="success" />
    <Progress label="Credential expires" value={83} valueText="6 days left" tone="warning" />
    <Progress label="Centurion Rating API error rate" value={11} valueText="11% of calls failing" tone="danger" />
  </div>
);

export const Sizes = () => (
  <div style={{ display: 'grid', gap: 20, maxWidth: 460 }}>
    <Progress size="sm" label="Beacon Auto Group onboarding" value={40} max={100} valueText="2 of 5 steps" />
    <Progress size="md" label="Lakeshore Credit Union onboarding" value={80} valueText="4 of 5 steps" />
    <Progress size="lg" label="Fairview Service Center onboarding" value={100} valueText="Complete" tone="success" />
  </div>
);

export const DealerScorecard = () => (
  <div style={{ maxWidth: 460 }}>
    <Card title="Beacon Auto Group" subtitle="Program scorecard · March 2026">
      <div style={{ display: 'grid', gap: 18 }}>
        <Progress label="VSC attach rate" value={31} valueText="31% of 40% goal" tone="accent" />
        <Progress label="GAP attach rate" value={22} valueText="22% of 25% goal" tone="brand" />
        <Progress label="Contracts remitted" value={148} max={160} valueText="148 of 160" tone="success" />
        <Progress label="Cancellations" value={9} max={160} valueText="9 of 160 · within tolerance" tone="warning" />
      </div>
    </Card>
  </div>
);

export const BareTrackRows = () => (
  <div style={{ maxWidth: 460 }}>
    <Card title="Integration health" subtitle="Beacon Auto Group · last sync 4 minutes ago">
      <div style={{ display: 'grid', gap: 16 }}>
        {[
          { system: 'CDK Drive', value: 100, tone: 'success' as const, note: 'Complete' },
          { system: 'Symitar', value: 46, tone: 'brand' as const, note: '46%' },
          { system: 'Salesforce', value: 12, tone: 'warning' as const, note: 'Stalled' },
          { system: 'Centurion Rating API', value: 0, tone: 'brand' as const, note: 'Not started' },
        ].map((r) => (
          <div
            key={r.system}
            style={{ display: 'grid', gridTemplateColumns: '150px 1fr 82px', gap: 12, alignItems: 'center' }}
          >
            <span style={{ fontSize: 13, color: 'var(--kv-color-text-primary)' }}>{r.system}</span>
            <Progress value={r.value} tone={r.tone} size="sm" />
            <span style={{ fontSize: 12, textAlign: 'right', color: 'var(--kv-color-text-secondary)' }}>{r.note}</span>
          </div>
        ))}
      </div>
    </Card>
  </div>
);
