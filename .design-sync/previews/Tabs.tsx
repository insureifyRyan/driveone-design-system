import * as React from 'react';
import { Tabs, DataTable, DescriptionList, StatusPill, Badge, Icon } from '@kovara/design-system';

const quoteColumns = [
  { key: 'id', header: 'Quote', mono: true, width: 120 },
  { key: 'customer', header: 'Customer' },
  { key: 'carrier', header: 'Carrier' },
  { key: 'premium', header: 'Premium', numeric: true, width: 110 },
  {
    key: 'status',
    header: 'Status',
    width: 110,
    render: (row: { status: 'quoted' | 'in-review' | 'bound' }) => <StatusPill status={row.status} />,
  },
];

const quoteRows = [
  { id: 'KV-Q-8841', customer: 'Marcus Reyes', carrier: 'Centurion Mutual', premium: '$118.40/mo', status: 'quoted' as const },
  { id: 'KV-Q-8839', customer: 'Priya Raman', carrier: 'Harbor Point Assurance', premium: '$96.75/mo', status: 'in-review' as const },
  { id: 'KV-Q-8834', customer: 'Dana Whitfield', carrier: 'Ridgeline Specialty', premium: '$141.20/mo', status: 'bound' as const },
];

export const RecordSections = () => (
  <div style={{ maxWidth: 720 }}>
    <Tabs
      items={[
        { id: 'coverage', label: 'Coverage' },
        { id: 'documents', label: 'Documents', count: 4 },
        { id: 'claims', label: 'Claims', count: 2 },
        { id: 'activity', label: 'Activity' },
      ]}
    >
      <DescriptionList
        columns={2}
        items={[
          { term: 'Policy number', description: 'KV-4471-0098', mono: true },
          { term: 'Administrator', description: 'Centurion Mutual' },
          { term: 'Insured', description: 'Marcus Reyes' },
          { term: 'VIN', description: '1HGCM82633A004352', mono: true },
          { term: 'Deductible', description: '$100' },
          { term: 'Term total', description: '$1,842' },
        ]}
      />
    </Tabs>
  </div>
);

export const ListFilters = () => (
  <div style={{ maxWidth: 720 }}>
    <Tabs
      variant="pills"
      defaultValue="open"
      items={[
        { id: 'open', label: 'Open', count: 12 },
        { id: 'bound', label: 'Bound', count: 148 },
        { id: 'expiring', label: 'Expiring', count: 6 },
        { id: 'declined', label: 'Declined', count: 4 },
      ]}
    >
      <DataTable density="compact" columns={quoteColumns} rows={quoteRows} getRowId={(r) => r.id} />
    </Tabs>
  </div>
);

export const UnderlineVersusPills = () => (
  <div style={{ maxWidth: 720, display: 'grid', gap: 28 }}>
    <div style={{ display: 'grid', gap: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#6b7280' }}>
        underline — sections of one record
      </span>
      <Tabs
        items={[
          { id: 'coverage', label: 'Coverage' },
          { id: 'documents', label: 'Documents', count: 4 },
          { id: 'claims', label: 'Claims', count: 2 },
          { id: 'activity', label: 'Activity', count: 31 },
        ]}
      />
    </div>
    <div style={{ display: 'grid', gap: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#6b7280' }}>
        pills — filters over one list
      </span>
      <Tabs
        variant="pills"
        defaultValue="open"
        items={[
          { id: 'open', label: 'Open', count: 12 },
          { id: 'bound', label: 'Bound', count: 148 },
          { id: 'expiring', label: 'Expiring', count: 6 },
          { id: 'declined', label: 'Declined', count: 4 },
        ]}
      />
    </div>
  </div>
);

export const DisabledSection = () => (
  <div style={{ maxWidth: 720 }}>
    <Tabs
      defaultValue="coverage"
      items={[
        { id: 'coverage', label: 'Coverage' },
        { id: 'documents', label: 'Documents', count: 4 },
        { id: 'endorsements', label: 'Endorsements', disabled: true },
        { id: 'cancellation', label: 'Cancellation', disabled: true },
      ]}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Badge tone="accent" pill icon={<Icon name="sparkles" size={12} />}>
          Agent summary
        </Badge>
        <span style={{ fontSize: 14 }}>
          Endorsements unlock once Centurion Mutual returns the bound contract for KV-4471-0098.
        </span>
      </div>
    </Tabs>
  </div>
);
