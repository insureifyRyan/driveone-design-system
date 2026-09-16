import * as React from 'react';
import {
  DataTable,
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  IconButton,
  StatusPill,
} from '@kovara/design-system';

const policies = [
  { policy: 'KV-4471-0098', insured: 'Marcus Reyes', carrier: 'Centurion Mutual', premium: '$118.40', status: 'active' },
  { policy: 'KV-4471-0102', insured: 'Priya Raman', carrier: 'Harbor Point Assurance', premium: '$96.75', status: 'bound' },
  { policy: 'KV-4470-9981', insured: 'Dana Whitfield', carrier: 'Ridgeline Specialty', premium: '$141.20', status: 'expiring' },
  { policy: 'KV-4470-9874', insured: 'Luis Ferrer', carrier: 'Centurion Mutual', premium: '$88.05', status: 'lapsed' },
  { policy: 'KV-4471-0115', insured: 'Alicia Moreno', carrier: 'Harbor Point Assurance', premium: '$132.60', status: 'in-review' },
];

/** Canonical: the policy book — mono identifier, right-aligned premium, a StatusPill column. */
export const PolicyBook = () => (
  <div style={{ maxWidth: 820 }}>
    <DataTable
      columns={[
        { key: 'policy', header: 'Policy', mono: true, width: 150 },
        { key: 'insured', header: 'Insured' },
        { key: 'carrier', header: 'Carrier' },
        { key: 'premium', header: 'Premium', numeric: true, width: 100 },
        {
          key: 'status',
          header: 'Status',
          width: 120,
          render: (row: any) => <StatusPill status={row.status} />,
        },
      ]}
      rows={policies}
      caption="Showing 5 of 348 policies"
    />
  </div>
);

/** `density="compact"` + `striped` for a dense operational queue, with a row-action column. */
export const QuotePipelineCompact = () => (
  <div style={{ maxWidth: 820 }}>
    <DataTable
      density="compact"
      striped
      columns={[
        { key: 'quote', header: 'Quote', mono: true, width: 118 },
        { key: 'customer', header: 'Customer', width: 130 },
        { key: 'source', header: 'Source', render: (row: any) => <Badge tone="neutral" pill>{row.source}</Badge> },
        { key: 'term', header: 'Term', numeric: true, width: 78 },
        { key: 'premium', header: 'Premium', numeric: true, width: 96 },
        {
          key: 'status',
          header: 'Status',
          width: 116,
          render: (row: any) => <StatusPill status={row.status} />,
        },
        {
          key: 'actions',
          header: '',
          width: 48,
          render: () => <IconButton icon={<Icon name="more-horizontal" />} label="Quote actions" size="sm" />,
        },
      ]}
      rows={[
        { quote: 'KV-Q-8841', customer: 'Marcus Reyes', source: 'Beacon Auto Group', term: '36 mo', premium: '$118.40', status: 'quoted' },
        { quote: 'KV-Q-8838', customer: 'Priya Raman', source: 'Lakeshore Credit Union', term: '48 mo', premium: '$141.20', status: 'in-review' },
        { quote: 'KV-Q-8836', customer: 'Luis Ferrer', source: 'Fairview Service Center', term: '36 mo', premium: '$96.75', status: 'pending' },
        { quote: 'KV-Q-8830', customer: 'Alicia Moreno', source: 'Beacon Auto Group', term: '24 mo', premium: '$74.15', status: 'draft' },
        { quote: 'KV-Q-8824', customer: 'Grant Iwasaki', source: 'Direct', term: '60 mo', premium: '$162.90', status: 'declined' },
      ]}
      caption="Showing 5 of 61 open quotes"
    />
  </div>
);

/** Inside a `Card` with `padding="none"`, the pattern for every titled list panel. */
export const InsideCard = () => (
  <div style={{ maxWidth: 820 }}>
    <Card
      title="Claims awaiting adjuster review"
      subtitle="Assigned to Luis Ferrer"
      padding="none"
      action={<IconButton icon={<Icon name="filter" />} label="Filter claims" />}
      footer={<Button size="sm">Open claim queue</Button>}
    >
      <DataTable
        columns={[
          { key: 'claim', header: 'Claim', mono: true, width: 110 },
          { key: 'vin', header: 'VIN', mono: true, width: 180 },
          { key: 'component', header: 'Component' },
          { key: 'estimate', header: 'Estimate', numeric: true, width: 110 },
          {
            key: 'status',
            header: 'Status',
            width: 130,
            render: (row: any) => <StatusPill status={row.status} label={row.label} />,
          },
        ]}
        rows={[
          { claim: '#2210', vin: '1HGCM82633A004352', component: 'Transmission control module', estimate: '$1,842', status: 'in-review' },
          { claim: '#2207', vin: '5YJ3E1EA7JF006487', component: 'HVAC compressor', estimate: '$964', status: 'pending', label: 'Awaiting photos' },
          { claim: '#2199', vin: '3VWDX7AJ5DM301188', component: 'Turbocharger', estimate: '$2,375', status: 'declined' },
        ]}
        caption="3 claims · $5,181 total exposure"
      />
    </Card>
  </div>
);

/** The zero state: an `EmptyState` passed to `empty`, not a bare "no results" row. */
export const EmptyBook = () => (
  <div style={{ maxWidth: 820 }}>
    <DataTable
      columns={[
        { key: 'policy', header: 'Policy', mono: true, width: 150 },
        { key: 'insured', header: 'Insured' },
        { key: 'carrier', header: 'Carrier' },
        { key: 'premium', header: 'Premium', numeric: true, width: 100 },
        { key: 'status', header: 'Status', width: 120 },
      ]}
      rows={[]}
      empty={
        <EmptyState
          plain
          icon={<Icon name="file-text" size={22} />}
          title="No policies match this filter"
          description="Lakeshore Credit Union has no in-force contracts written in the last 30 days."
          actions={<Button size="sm">Clear filters</Button>}
        />
      }
    />
  </div>
);
