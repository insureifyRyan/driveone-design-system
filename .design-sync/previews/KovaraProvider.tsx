import * as React from 'react';
import {
  KovaraProvider,
  Logo,
  Card,
  StatCard,
  StatusPill,
  Badge,
  Button,
  Icon,
  DescriptionList,
} from '@kovara/design-system';

/** A small, real Kōvara region — the thing the provider is responsible for theming. */
const DealerDeskRegion = () => (
  <div style={{ padding: 24, display: 'grid', gap: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <Logo size="sm" />
      <Badge tone="neutral" icon={<Icon name="building" size={12} />}>
        Beacon Auto Group
      </Badge>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      <StatCard label="Quotes issued" value="1,284" delta="+18.2%" trend="up" caption="vs. last 30 days" icon={<Icon name="file-text" size={18} />} />
      <StatCard label="Attach rate" value="31.4%" delta="+2.1 pts" trend="up" caption="vs. last 30 days" icon={<Icon name="trending-up" size={18} />} />
      <StatCard label="Calls handled" value="412" delta="-6.0%" trend="down" caption="vs. last 30 days" icon={<Icon name="phone" size={18} />} />
    </div>
    <Card
      title="Quote KV-Q-8841"
      subtitle="Marcus Reyes · 2021 Honda Accord"
      action={<StatusPill status="quoted" />}
      footer={<Button size="sm" leadingIcon={<Icon name="shield" />}>Bind policy</Button>}
    >
      <DescriptionList
        columns={2}
        items={[
          { term: 'Carrier', description: 'Centurion Mutual' },
          { term: 'Monthly premium', description: '$118.40/mo', mono: true },
          { term: 'Deductible', description: '$100', mono: true },
          { term: 'VIN', description: '1HGCM82633A004352', mono: true },
        ]}
      />
    </Card>
  </div>
);

export const LightSurface = () => (
  <KovaraProvider theme="light">
    <DealerDeskRegion />
  </KovaraProvider>
);

export const DarkSurface = () => (
  <KovaraProvider theme="dark">
    <DealerDeskRegion />
  </KovaraProvider>
);

export const NestedDarkBand = () => (
  <KovaraProvider theme="light">
    <div style={{ padding: 24, display: 'grid', gap: 16 }}>
      <Card title="Policy KV-4471-0098" subtitle="Lakeshore Credit Union · Dana Whitfield" action={<StatusPill status="active" />}>
        <DescriptionList
          columns={2}
          items={[
            { term: 'Effective date', description: 'May 15, 2024' },
            { term: 'Term total', description: '$1,842', mono: true },
          ]}
        />
      </Card>
      <KovaraProvider theme="dark">
        <div style={{ padding: 20, borderRadius: 12, display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Badge tone="accent" icon={<Icon name="sparkles" size={12} />}>Kōvara agent</Badge>
            <StatusPill status="in-review" />
          </div>
          <span style={{ fontSize: 13 }}>
            Rated this vehicle with 4 carriers and flagged Centurion Mutual as the best value at $118.40/mo.
          </span>
          <div>
            <Button size="sm" variant="accent" leadingIcon={<Icon name="sparkles" />}>Review agent findings</Button>
          </div>
        </div>
      </KovaraProvider>
    </div>
  </KovaraProvider>
);
