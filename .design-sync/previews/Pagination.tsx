import * as React from 'react';
import { Pagination, DataTable, StatusPill } from '@kovara/design-system';

const columns = [
  { key: 'policy', header: 'Policy', mono: true, width: 130 },
  { key: 'insured', header: 'Insured' },
  { key: 'administrator', header: 'Administrator' },
  { key: 'premium', header: 'Premium', numeric: true, width: 110 },
  {
    key: 'status',
    header: 'Status',
    width: 100,
    render: (row: { status: 'active' | 'expiring' | 'lapsed' }) => <StatusPill status={row.status} />,
  },
];

const rows = [
  { policy: 'KV-4471-0098', insured: 'Marcus Reyes', administrator: 'Centurion Mutual', premium: '$118.40/mo', status: 'active' as const },
  { policy: 'KV-4470-9912', insured: 'Priya Raman', administrator: 'Harbor Point Assurance', premium: '$96.75/mo', status: 'expiring' as const },
  { policy: 'KV-4470-8804', insured: 'Dana Whitfield', administrator: 'Ridgeline Specialty', premium: '$141.20/mo', status: 'lapsed' as const },
];

export const UnderATable = () => (
  <div style={{ maxWidth: 720, display: 'grid', gap: 16 }}>
    <DataTable density="compact" columns={columns} rows={rows} getRowId={(r) => r.policy} />
    <Pagination page={3} pageCount={18} totalItems={348} pageSize={20} />
  </div>
);

export const PagePositions = () => (
  <div style={{ maxWidth: 720, display: 'grid', gap: 22 }}>
    <Pagination page={1} pageCount={18} totalItems={348} pageSize={20} />
    <Pagination page={9} pageCount={18} totalItems={348} pageSize={20} />
    <Pagination page={18} pageCount={18} totalItems={348} pageSize={20} />
  </div>
);

export const ShortList = () => (
  <div style={{ maxWidth: 720 }}>
    <Pagination page={2} pageCount={5} totalItems={87} pageSize={20} />
  </div>
);

export const WithoutTotalCount = () => (
  <div style={{ maxWidth: 720 }}>
    <Pagination page={7} pageCount={18} />
  </div>
);
