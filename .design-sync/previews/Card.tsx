import * as React from 'react';
import {
  Card,
  Badge,
  Button,
  DataTable,
  DescriptionList,
  Icon,
  IconButton,
  Progress,
  StatusPill,
} from '@kovara/design-system';

/** Canonical: a detail panel with a header action and a right-aligned footer. */
export const PolicyDetailPanel = () => (
  <div style={{ maxWidth: 460 }}>
    <Card
      title="Policy summary"
      subtitle="Centurion Mutual · updated 4 minutes ago"
      action={<IconButton icon={<Icon name="more-horizontal" />} label="Panel options" />}
      footer={
        <>
          <Button variant="secondary" size="sm">
            Download contract
          </Button>
          <Button size="sm">File a claim</Button>
        </>
      }
    >
      <DescriptionList
        columns={2}
        items={[
          { term: 'Policy number', description: 'KV-4471-0098', mono: true },
          { term: 'Status', description: <StatusPill status="active" /> },
          { term: 'Insured', description: 'Marcus Reyes' },
          { term: 'Producer', description: 'Dana Whitfield' },
          { term: 'VIN', description: '1HGCM82633A004352', mono: true },
          { term: 'Premium', description: '$118.40/mo' },
        ]}
      />
    </Card>
  </div>
);

/** The variant axis: default, flat, raised, and the cyan accent rule for agent-owned panels. */
export const Variants = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(260px, 1fr))', gap: 16, maxWidth: 720 }}>
    <Card title="Open quotes" subtitle="Default — the standard panel">
      <Progress label="Warranty attach rate" value={31} valueText="31% of 40% goal" />
    </Card>
    <Card variant="flat" title="Coverage terms" subtitle="Flat — nested inside another surface">
      <DescriptionList
        columns={1}
        items={[
          { term: 'Term', description: '36 months / 75,000 mi' },
          { term: 'Deductible', description: '$100 per visit' },
        ]}
      />
    </Card>
    <Card variant="raised" title="Beacon Auto Group" subtitle="Raised — a panel that floats above the page">
      <DescriptionList
        columns={1}
        items={[
          { term: 'Contracts this month', description: '184' },
          { term: 'Rooftops live on CDK Drive', description: '6 of 9' },
        ]}
      />
    </Card>
    <Card
      variant="accent"
      title="Agent recommendation"
      subtitle="Accent — reserved for panels the agent owns"
      action={<Badge tone="accent" icon={<Icon name="sparkles" size={12} />}>AI drafted</Badge>}
    >
      <p style={{ margin: 0 }}>
        Marcus Reyes declined the 48-month term on price. Centurion Mutual now rates the same coverage at
        $118.40/mo — re-present before the quote expires Friday.
      </p>
    </Card>
  </div>
);

/** `padding="none"` so a DataTable body aligns to the card edge. */
export const TableCard = () => (
  <div style={{ maxWidth: 720 }}>
    <Card
      title="Open quotes"
      subtitle="Beacon Auto Group · last 7 days"
      padding="none"
      action={<IconButton icon={<Icon name="more-horizontal" />} label="Panel options" />}
      footer={<Button size="sm">New quote</Button>}
    >
      <DataTable
        density="compact"
        columns={[
          { key: 'quote', header: 'Quote', mono: true, width: 130 },
          { key: 'customer', header: 'Customer' },
          { key: 'premium', header: 'Premium', numeric: true, width: 110 },
          {
            key: 'status',
            header: 'Status',
            width: 120,
            render: (row: any) => <StatusPill status={row.status} />,
          },
        ]}
        rows={[
          { quote: 'KV-Q-8841', customer: 'Marcus Reyes', premium: '$118.40', status: 'quoted' },
          { quote: 'KV-Q-8836', customer: 'Priya Raman', premium: '$96.75', status: 'in-review' },
          { quote: 'KV-Q-8829', customer: 'Luis Ferrer', premium: '$141.20', status: 'bound' },
        ]}
      />
    </Card>
  </div>
);

/** `interactive` — the whole card is the link to a detail route. */
export const InteractiveCards = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(260px, 1fr))', gap: 16, maxWidth: 720 }}>
    <Card interactive title="Beacon Auto Group" subtitle="9 rooftops · CDK Drive">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Badge tone="brand" pill>Dealer</Badge>
        <Badge tone="neutral" pill>F&amp;I embedded</Badge>
      </div>
    </Card>
    <Card interactive title="Lakeshore Credit Union" subtitle="Symitar core · 41,200 members">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Badge tone="brand" pill>Credit union</Badge>
        <Badge tone="neutral" pill>Indirect lending</Badge>
      </div>
    </Card>
  </div>
);
