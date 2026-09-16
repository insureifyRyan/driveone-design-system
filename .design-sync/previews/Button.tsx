import * as React from 'react';
import { Button, Icon } from '@kovara/design-system';

export const Variants = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
    <Button variant="primary">Bind policy</Button>
    <Button variant="secondary">Save draft</Button>
    <Button variant="accent" leadingIcon={<Icon name="sparkles" />}>Generate quote</Button>
    <Button variant="ghost">Cancel</Button>
    <Button variant="danger">Cancel policy</Button>
    <Button variant="link">View contract</Button>
  </div>
);

export const Sizes = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
    <Button size="sm">Small</Button>
    <Button size="md">Medium</Button>
    <Button size="lg">Large</Button>
  </div>
);

export const WithIcons = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
    <Button leadingIcon={<Icon name="shield" />}>Bind policy</Button>
    <Button variant="secondary" trailingIcon={<Icon name="external-link" />}>Open in carrier portal</Button>
    <Button variant="accent" leadingIcon={<Icon name="zap" />}>Run workflow</Button>
  </div>
);

export const States = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
    <Button loading>Rating with 4 carriers</Button>
    <Button disabled>Bind policy</Button>
    <Button variant="secondary" disabled>Save draft</Button>
  </div>
);
