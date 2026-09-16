import * as React from 'react';
import { Switch, Card } from '@kovara/design-system';

export const AutomationSettings = () => (
  <div style={{ maxWidth: 460 }}>
    <Card title="Agent automation" subtitle="Beacon Auto Group — applies to all producers">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Switch label="Let Kōvara follow up on abandoned quotes" defaultChecked />
        <Switch label="Answer after-hours calls with Kōvara Voice" defaultChecked />
        <Switch label="Push bound contracts to CDK Drive nightly" />
        <Switch label="Draft claim summaries before Luis Ferrer reviews them" defaultChecked />
      </div>
    </Card>
  </div>
);

export const Sizes = () => (
  <div style={{ maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Switch label="Sync Lakeshore Credit Union members from Symitar" defaultChecked />
      <span style={{ fontSize: 12, color: 'var(--kv-color-text-muted)' }}>md</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Switch label="Sync Lakeshore Credit Union members from Symitar" size="sm" defaultChecked />
      <span style={{ fontSize: 12, color: 'var(--kv-color-text-muted)' }}>sm</span>
    </div>
  </div>
);

export const LabelPosition = () => (
  <div style={{ maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 16 }}>
    <Switch label="Re-rate quotes when the Centurion Rating API changes" defaultChecked />
    <Switch label="Re-rate quotes when the Centurion Rating API changes" labelPosition="start" defaultChecked />
  </div>
);

export const States = () => (
  <div style={{ maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 16 }}>
    <Switch label="Route new claims to Luis Ferrer automatically" defaultChecked />
    <Switch label="Text Marcus Reyes when his contract is issued" />
    <Switch label="Write back to Salesforce" defaultChecked disabled />
    <Switch label="Bind policies without producer review" disabled />
  </div>
);
