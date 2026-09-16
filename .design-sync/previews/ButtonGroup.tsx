import * as React from 'react';
import { ButtonGroup, Button, IconButton, Icon } from '@kovara/design-system';

export const PipelineView = () => (
  <ButtonGroup label="Pipeline view">
    <Button variant="secondary" size="sm">Quotes</Button>
    <Button variant="secondary" size="sm">Policies</Button>
    <Button variant="secondary" size="sm">Claims</Button>
  </ButtonGroup>
);

export const DateRange = () => (
  <ButtonGroup label="Reporting period">
    <Button variant="secondary" size="sm">7 days</Button>
    <Button variant="secondary" size="sm">30 days</Button>
    <Button variant="secondary" size="sm">90 days</Button>
    <Button variant="secondary" size="sm">Year to date</Button>
  </ButtonGroup>
);

export const SplitAction = () => (
  <ButtonGroup label="Send quote KV-Q-8841">
    <Button variant="primary">Send to Marcus Reyes</Button>
    <IconButton icon={<Icon name="chevron-down" />} label="Other delivery options" variant="solid" />
  </ButtonGroup>
);

export const IconOnlyToolbar = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
    <ButtonGroup label="Quote layout">
      <IconButton icon={<Icon name="grid" />} label="Card layout" variant="outline" />
      <IconButton icon={<Icon name="file-text" />} label="Table layout" variant="outline" />
    </ButtonGroup>
    <ButtonGroup label="Claim #2210 pagination">
      <IconButton icon={<Icon name="chevron-left" />} label="Previous claim" variant="outline" />
      <IconButton icon={<Icon name="chevron-right" />} label="Next claim" variant="outline" />
    </ButtonGroup>
  </div>
);
