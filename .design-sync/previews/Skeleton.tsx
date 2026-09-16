import * as React from 'react';
import { Skeleton, Card } from '@kovara/design-system';

const label: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--kv-color-text-muted)',
};

const Row = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <Skeleton shape="circle" width={36} height={36} />
    <div style={{ flex: 1, display: 'grid', gap: 8 }}>
      <Skeleton shape="text" width={180} />
      <Skeleton shape="text" width={110} />
    </div>
    <Skeleton shape="rect" width={72} height={28} />
  </div>
);

export const QuoteListLoading = () => (
  <div style={{ maxWidth: 460 }}>
    <Card title="Rating with 3 carriers" subtitle="Centurion Mutual · Harbor Point · Ridgeline">
      <div style={{ display: 'grid', gap: 18 }}>
        <Row />
        <Row />
        <Row />
      </div>
    </Card>
  </div>
);

export const Shapes = () => (
  <div style={{ display: 'grid', gap: 22, maxWidth: 460 }}>
    <div style={{ display: 'grid', gap: 8 }}>
      <span style={label}>text · lines 3 (copy block)</span>
      <Skeleton shape="text" lines={3} />
    </div>
    <div style={{ display: 'grid', gap: 8 }}>
      <span style={label}>rect · 120 (card or chart)</span>
      <Skeleton shape="rect" height={120} />
    </div>
    <div style={{ display: 'grid', gap: 8 }}>
      <span style={label}>circle · 40 (avatar)</span>
      <div style={{ display: 'flex', gap: 10 }}>
        <Skeleton shape="circle" width={40} height={40} />
        <Skeleton shape="circle" width={40} height={40} />
        <Skeleton shape="circle" width={40} height={40} />
      </div>
    </div>
  </div>
);

export const DashboardPanelLoading = () => (
  <div style={{ maxWidth: 460 }}>
    <Card title="Attach rate by store" subtitle="Loading from CDK Drive">
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, display: 'grid', gap: 8 }}>
            <Skeleton shape="text" width={64} />
            <Skeleton shape="rect" height={34} />
          </div>
          <div style={{ flex: 1, display: 'grid', gap: 8 }}>
            <Skeleton shape="text" width={64} />
            <Skeleton shape="rect" height={34} />
          </div>
          <div style={{ flex: 1, display: 'grid', gap: 8 }}>
            <Skeleton shape="text" width={64} />
            <Skeleton shape="rect" height={34} />
          </div>
        </div>
        <Skeleton shape="rect" height={132} />
        <Skeleton shape="text" lines={2} />
      </div>
    </Card>
  </div>
);

export const PolicyTableLoading = () => (
  <div style={{ maxWidth: 720 }}>
    <Card title="Policies" subtitle="Fetching from Centurion Mutual" padding="compact">
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr 1fr 0.8fr', gap: 16 }}>
          <span style={label}>Policy</span>
          <span style={label}>Insured</span>
          <span style={label}>Premium</span>
          <span style={label}>Status</span>
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr 1fr 0.8fr', gap: 16, alignItems: 'center' }}>
            <Skeleton shape="text" width={120} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Skeleton shape="circle" width={24} height={24} />
              <Skeleton shape="text" width={132} />
            </div>
            <Skeleton shape="text" width={72} />
            <Skeleton shape="rect" width={68} height={20} />
          </div>
        ))}
      </div>
    </Card>
  </div>
);
