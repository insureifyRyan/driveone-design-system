import * as React from 'react';
import { StatusPill, DataTable, DescriptionList } from '@kovara/design-system';

/** The whole lifecycle vocabulary, in the order a quote travels it. */
export const Vocabulary = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', maxWidth: 720 }}>
    <StatusPill status="draft" />
    <StatusPill status="quoted" />
    <StatusPill status="in-review" />
    <StatusPill status="pending" />
    <StatusPill status="bound" />
    <StatusPill status="active" />
    <StatusPill status="expiring" />
    <StatusPill status="lapsed" />
    <StatusPill status="declined" />
  </div>
);

/** Grouped by what the color means: grey not started, cyan in flight, amber time-sensitive, green in-force, red terminal. */
export const ColorMeanings = () => (
  <div style={{ display: 'grid', gap: 14, maxWidth: 560 }}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <span style={{ width: 170, fontSize: 13 }}>Not started</span>
      <StatusPill status="draft" />
    </div>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <span style={{ width: 170, fontSize: 13 }}>In flight</span>
      <StatusPill status="quoted" />
      <StatusPill status="in-review" />
    </div>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <span style={{ width: 170, fontSize: 13 }}>Time-sensitive</span>
      <StatusPill status="pending" />
      <StatusPill status="expiring" />
    </div>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <span style={{ width: 170, fontSize: 13 }}>In force</span>
      <StatusPill status="bound" />
      <StatusPill status="active" />
    </div>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <span style={{ width: 170, fontSize: 13 }}>Terminal</span>
      <StatusPill status="lapsed" />
      <StatusPill status="declined" />
    </div>
  </div>
);

/** `label` adds specificity while the color keeps its meaning. */
export const CustomLabels = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', maxWidth: 720 }}>
    <StatusPill status="expiring" label="Expires in 6 days" />
    <StatusPill status="bound" label="Bound 4/12" />
    <StatusPill status="pending" label="Awaiting signature" />
    <StatusPill status="in-review" label="Underwriting — Centurion" />
    <StatusPill status="declined" label="Declined · mileage" />
  </div>
);

/** In place: the status column of the policy book, and a detail-page field. */
export const InContext = () => (
  <div style={{ display: 'grid', gap: 20, maxWidth: 720 }}>
    <DataTable
      density="compact"
      columns={[
        { key: 'policy', header: 'Policy', mono: true, width: 150 },
        { key: 'insured', header: 'Insured' },
        { key: 'premium', header: 'Premium', numeric: true, width: 100 },
        {
          key: 'status',
          header: 'Status',
          width: 170,
          render: (row: any) => <StatusPill status={row.status} label={row.label} />,
        },
      ]}
      rows={[
        { policy: 'KV-4471-0098', insured: 'Marcus Reyes', premium: '$118.40', status: 'active' },
        { policy: 'KV-4470-9981', insured: 'Dana Whitfield', premium: '$141.20', status: 'expiring', label: 'Expires in 6 days' },
        { policy: 'KV-4470-9874', insured: 'Luis Ferrer', premium: '$88.05', status: 'lapsed' },
      ]}
    />
    <DescriptionList
      columns={2}
      items={[
        { term: 'Quote', description: 'KV-Q-8841', mono: true },
        { term: 'Quote status', description: <StatusPill status="quoted" /> },
        { term: 'Policy', description: 'KV-4471-0098', mono: true },
        { term: 'Policy status', description: <StatusPill status="active" /> },
      ]}
    />
  </div>
);
