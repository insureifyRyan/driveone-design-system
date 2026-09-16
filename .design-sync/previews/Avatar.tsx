import * as React from 'react';
import { Avatar, Badge, Card, DataTable, StatusPill } from '@kovara/design-system';

/** The size axis, xs through lg — circles for people, squares for organizations. */
export const Sizes = () => (
  <div style={{ display: 'grid', gap: 20, maxWidth: 460 }}>
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end' }}>
      {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} style={{ display: 'grid', justifyItems: 'center', gap: 6 }}>
          <Avatar name="Dana Whitfield" size={size} />
          <span style={{ fontSize: 12, opacity: 0.7 }}>{size}</span>
        </div>
      ))}
    </div>
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end' }}>
      {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} style={{ display: 'grid', justifyItems: 'center', gap: 6 }}>
          <Avatar name="Centurion Mutual" square tone="accent" size={size} />
          <span style={{ fontSize: 12, opacity: 0.7 }}>{size} square</span>
        </div>
      ))}
    </div>
  </div>
);

/** People are circles; vary `tone` across a list so producers stay distinguishable. */
export const People = () => (
  <div style={{ display: 'grid', gap: 14, maxWidth: 460 }}>
    {[
      { name: 'Dana Whitfield', role: 'Producer · Beacon Auto Group', tone: 'brand' as const },
      { name: 'Marcus Reyes', role: 'Insured · KV-4471-0098', tone: 'secondary' as const },
      { name: 'Priya Raman', role: 'Underwriter · Centurion Mutual', tone: 'accent' as const },
      { name: 'Luis Ferrer', role: 'Adjuster · claim #2210', tone: 'brand' as const },
    ].map((p) => (
      <div key={p.name} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Avatar name={p.name} tone={p.tone} size="md" />
        <div style={{ display: 'grid' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</span>
          <span style={{ fontSize: 13, opacity: 0.7 }}>{p.role}</span>
        </div>
      </div>
    ))}
  </div>
);

/** `square` marks organizations — carriers, dealers, credit unions, service centers. */
export const Organizations = () => (
  <div style={{ display: 'grid', gap: 14, maxWidth: 460 }}>
    {[
      { name: 'Centurion Mutual', kind: 'Carrier · rating API connected', tone: 'brand' as const },
      { name: 'Harbor Point Assurance', kind: 'Carrier · 4 products', tone: 'accent' as const },
      { name: 'Beacon Auto Group', kind: 'Dealer · 9 rooftops on CDK Drive', tone: 'secondary' as const },
      { name: 'Lakeshore Credit Union', kind: 'Credit union · Symitar core', tone: 'brand' as const },
      { name: 'Fairview Service Center', kind: 'Service center · claims intake', tone: 'secondary' as const },
    ].map((o) => (
      <div key={o.name} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Avatar name={o.name} square tone={o.tone} size="md" />
        <div style={{ display: 'grid' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{o.name}</span>
          <span style={{ fontSize: 13, opacity: 0.7 }}>{o.kind}</span>
        </div>
      </div>
    ))}
  </div>
);

/** `initials` overrides the derived pair — for long legal names and for the agent itself. */
export const InitialsOverride = () => (
  <div style={{ display: 'grid', gap: 14, maxWidth: 560 }}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Avatar name="Ridgeline Specialty Insurance Company" square initials="RS" tone="brand" size="md" />
      <span style={{ fontSize: 13 }}>
        <strong>Ridgeline Specialty Insurance Company</strong> — <code>initials="RS"</code>, not “RS(I)”
      </span>
    </div>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Avatar name="Kōvara Agent" tone="accent" initials="AI" size="md" />
      <span style={{ fontSize: 13 }}>
        <strong>Kōvara Agent</strong> — cyan tone marks the agent as the actor
      </span>
    </div>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Avatar name="Marcus Reyes" tone="secondary" size="md" />
      <span style={{ fontSize: 13 }}>
        <strong>Marcus Reyes</strong> — derived initials, no override
      </span>
    </div>
  </div>
);

/** In place: an owner column in the book of business, and a card header. */
export const InContext = () => (
  <div style={{ display: 'grid', gap: 20, maxWidth: 720 }}>
    <Card title="Assigned producer" subtitle="Beacon Auto Group · Chicago North">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Avatar name="Dana Whitfield" size="lg" />
        <div style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontWeight: 600 }}>Dana Whitfield</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Badge tone="brand" pill>Producer</Badge>
            <Badge tone="neutral" pill>Licensed IL, IN, WI</Badge>
          </div>
        </div>
      </div>
    </Card>
    <DataTable
      density="compact"
      columns={[
        { key: 'policy', header: 'Policy', mono: true, width: 150 },
        {
          key: 'insured',
          header: 'Insured',
          render: (row: any) => (
            <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
              <Avatar name={row.insured} size="xs" tone={row.tone} />
              {row.insured}
            </span>
          ),
        },
        {
          key: 'carrier',
          header: 'Carrier',
          render: (row: any) => (
            <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
              <Avatar name={row.carrier} size="xs" square tone="accent" />
              {row.carrier}
            </span>
          ),
        },
        { key: 'status', header: 'Status', width: 110, render: (row: any) => <StatusPill status={row.status} /> },
      ]}
      rows={[
        { policy: 'KV-4471-0098', insured: 'Marcus Reyes', tone: 'brand', carrier: 'Centurion Mutual', status: 'active' },
        { policy: 'KV-4471-0102', insured: 'Priya Raman', tone: 'secondary', carrier: 'Harbor Point Assurance', status: 'bound' },
        { policy: 'KV-4470-9874', insured: 'Luis Ferrer', tone: 'brand', carrier: 'Ridgeline Specialty', status: 'lapsed' },
      ]}
    />
  </div>
);
