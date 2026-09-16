import * as React from 'react';
import { Badge, Card, Icon } from '@kovara/design-system';

/** The tone axis. `accent` (cyan) is reserved for anything the agent produced. */
export const Tones = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', maxWidth: 720 }}>
    <Badge tone="neutral">Powertrain</Badge>
    <Badge tone="brand">Beacon Auto Group</Badge>
    <Badge tone="accent" icon={<Icon name="sparkles" size={12} />}>AI drafted</Badge>
    <Badge tone="success">Rate verified</Badge>
    <Badge tone="warning">Signature missing</Badge>
    <Badge tone="danger">Action required</Badge>
  </div>
);

/** Tinted (default) against solid — solid wins attention or sits on dark chrome. */
export const SolidAndTinted = () => (
  <div style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <Badge tone="neutral">Tinted</Badge>
      <Badge tone="brand">Embedded F&amp;I</Badge>
      <Badge tone="accent" icon={<Icon name="sparkles" size={12} />}>AI summary</Badge>
      <Badge tone="success">Bound today</Badge>
      <Badge tone="warning">Rate expires Friday</Badge>
      <Badge tone="danger">Chargeback risk</Badge>
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <Badge tone="neutral" solid>Solid</Badge>
      <Badge tone="brand" solid>Embedded F&amp;I</Badge>
      <Badge tone="accent" solid icon={<Icon name="sparkles" size={12} />}>AI summary</Badge>
      <Badge tone="success" solid>Bound today</Badge>
      <Badge tone="warning" solid>Rate expires Friday</Badge>
      <Badge tone="danger" solid>Chargeback risk</Badge>
    </div>
  </div>
);

/** `pill` for counts and labels; squared corners for classifications. */
export const PillsAndCounts = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', maxWidth: 720 }}>
    <Badge tone="brand" pill solid>12</Badge>
    <Badge tone="danger" pill solid>3 overdue</Badge>
    <Badge tone="neutral" pill>Direct</Badge>
    <Badge tone="neutral" pill>Lakeshore Credit Union</Badge>
    <Badge tone="accent" pill icon={<Icon name="sparkles" size={12} />}>Agent handled</Badge>
    <Badge tone="success" pill icon={<Icon name="check" size={12} />}>Synced to CDK Drive</Badge>
  </div>
);

/** In place: classifications on a contract, with the cyan badge marking agent output. */
export const InContext = () => (
  <div style={{ maxWidth: 460 }}>
    <Card
      title="Platinum Vehicle Service Contract"
      subtitle="Centurion Mutual · KV-4471-0098"
      action={<Badge tone="accent" icon={<Icon name="sparkles" size={12} />}>AI rated</Badge>}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Badge tone="neutral">Powertrain</Badge>
        <Badge tone="neutral">Electronics</Badge>
        <Badge tone="neutral">Rental + roadside</Badge>
        <Badge tone="brand">Transferable</Badge>
        <Badge tone="warning">Signature missing</Badge>
      </div>
    </Card>
  </div>
);
