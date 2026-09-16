import * as React from 'react';
import { PageHeader, Breadcrumbs, Button, StatusPill, Badge, Icon, Tabs } from '@kovara/design-system';

export const PolicyDetail = () => (
  <div style={{ maxWidth: 820 }}>
    <PageHeader
      breadcrumbs={<Breadcrumbs items={[{ label: 'Policies', href: '#' }, { label: 'KV-4471-0098' }]} />}
      title="KV-4471-0098"
      meta={<StatusPill status="active" />}
      description="2021 Ford F-150 · Marcus Reyes · Beacon Auto Group"
      actions={
        <>
          <Button variant="secondary">Download documents</Button>
          <Button>Endorse policy</Button>
        </>
      }
    />
  </div>
);

export const WithTabsRow = () => (
  <div style={{ maxWidth: 820 }}>
    <PageHeader
      breadcrumbs={
        <Breadcrumbs
          items={[{ label: 'Policies', href: '#' }, { label: 'KV-4471-0098', href: '#' }, { label: 'Claim #2210' }]}
        />
      }
      title="Claim #2210"
      meta={<StatusPill status="in-review" />}
      description="Transmission failure · Fairview Service Center · Adjuster Luis Ferrer"
      actions={
        <>
          <Button variant="secondary">Request documents</Button>
          <Button>Approve $1,842</Button>
        </>
      }
    >
      <Tabs
        items={[
          { id: 'summary', label: 'Summary' },
          { id: 'estimate', label: 'Estimate' },
          { id: 'documents', label: 'Documents', count: 6 },
          { id: 'activity', label: 'Activity', count: 18 },
        ]}
      />
    </PageHeader>
  </div>
);

export const ListPage = () => (
  <div style={{ maxWidth: 820 }}>
    <PageHeader
      title="Quotes"
      description="Every quote rated through the Centurion Rating API in the last 30 days."
      actions={
        <>
          <Button variant="secondary" leadingIcon={<Icon name="plug" size={16} />}>
            Import from CDK Drive
          </Button>
          <Button leadingIcon={<Icon name="plus" size={16} />}>New quote</Button>
        </>
      }
    />
  </div>
);

export const AgentDraftedRecord = () => (
  <div style={{ maxWidth: 820 }}>
    <PageHeader
      breadcrumbs={<Breadcrumbs items={[{ label: 'Quotes', href: '#' }, { label: 'KV-Q-8841' }]} />}
      title="KV-Q-8841"
      meta={
        <>
          <StatusPill status="quoted" />
          <Badge tone="accent" pill icon={<Icon name="sparkles" size={12} />}>
            Agent drafted
          </Badge>
        </>
      }
      description="Marcus Reyes · VIN 1HGCM82633A004352 · $34,995"
      actions={
        <>
          <Button variant="ghost">Discard</Button>
          <Button variant="secondary">Compare carriers</Button>
          <Button>Send to customer</Button>
        </>
      }
    />
  </div>
);
