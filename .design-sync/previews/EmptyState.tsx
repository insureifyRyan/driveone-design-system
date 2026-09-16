import * as React from 'react';
import { EmptyState, Button, Icon, Card, SearchInput } from '@kovara/design-system';

export const NoOpenQuotes = () => (
  <div style={{ maxWidth: 560 }}>
    <EmptyState
      icon={<Icon name="file-text" size={22} />}
      title="No open quotes"
      description="Quotes your team starts — or Kōvara rates automatically — will appear here."
      actions={<Button leadingIcon={<Icon name="plus" />}>New quote</Button>}
    />
  </div>
);

export const NoSearchResults = () => (
  <div style={{ maxWidth: 560 }}>
    <EmptyState
      icon={<Icon name="search" size={22} />}
      title="No policies match “Ridgeline”"
      description="No policy for Ridgeline Specialty was found under Beacon Auto Group. Try the VIN or the policy number KV-4471-0098."
      actions={
        <>
          <Button variant="secondary">Clear filters</Button>
          <Button variant="ghost" trailingIcon={<Icon name="external-link" />}>Search all agencies</Button>
        </>
      }
    />
  </div>
);

export const PlainInsideCard = () => (
  <div style={{ maxWidth: 560 }}>
    <Card title="Open claims" subtitle="Fairview Service Center · last 30 days">
      <EmptyState
        plain
        icon={<Icon name="shield" size={22} />}
        title="No open claims"
        description="Claims filed against policies in this book will show up here for Luis Ferrer to review."
        actions={<Button size="sm" variant="secondary" leadingIcon={<Icon name="plus" />}>File a claim</Button>}
      />
    </Card>
  </div>
);

export const NoSystemsConnected = () => (
  <div style={{ maxWidth: 560, display: 'grid', gap: 12 }}>
    <SearchInput placeholder="Search integrations" defaultValue="" />
    <EmptyState
      icon={<Icon name="plug" size={22} />}
      title="No systems connected yet"
      description="Connect CDK Drive, Symitar or Salesforce and Kōvara will start pulling deals in automatically."
      actions={
        <>
          <Button leadingIcon={<Icon name="plug" />}>Connect a system</Button>
          <Button variant="ghost" trailingIcon={<Icon name="external-link" />}>Browse integrations</Button>
        </>
      }
    />
  </div>
);
