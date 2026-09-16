import * as React from 'react';
import { IconButton, Icon, Card } from '@kovara/design-system';

export const Variants = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
    <IconButton icon={<Icon name="more-horizontal" />} label="Policy actions" />
    <IconButton icon={<Icon name="download" />} label="Export CSV" variant="outline" />
    <IconButton icon={<Icon name="plus" />} label="Start a new quote" variant="solid" />
  </div>
);

export const Sizes = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
    <IconButton icon={<Icon name="settings" />} label="Workflow settings" variant="outline" size="sm" />
    <IconButton icon={<Icon name="settings" />} label="Workflow settings" variant="outline" size="md" />
    <IconButton icon={<Icon name="settings" />} label="Workflow settings" variant="outline" size="lg" />
  </div>
);

export const RowActions = () => (
  <div style={{ maxWidth: 460 }}>
    <Card
      title="Policy KV-4471-0098"
      subtitle="Marcus Reyes · Centurion Mutual"
      action={<IconButton icon={<Icon name="more-horizontal" />} label="Policy actions" />}
    >
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <IconButton icon={<Icon name="file-text" />} label="Open contract" size="sm" />
        <IconButton icon={<Icon name="download" />} label="Download declarations page" size="sm" />
        <IconButton icon={<Icon name="mail" />} label="Email the insured" size="sm" />
        <IconButton icon={<Icon name="phone" />} label="Call Marcus Reyes" size="sm" />
        <IconButton icon={<Icon name="external-link" />} label="Open in CDK Drive" size="sm" />
      </div>
    </Card>
  </div>
);

export const States = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
    <IconButton icon={<Icon name="x" />} label="Dismiss recommendation" />
    <IconButton icon={<Icon name="download" />} label="Export CSV" variant="outline" disabled />
    <IconButton icon={<Icon name="shield" />} label="Bind policy" variant="solid" disabled />
  </div>
);
