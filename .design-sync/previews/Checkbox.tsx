import * as React from 'react';
import { Checkbox } from '@kovara/design-system';

export const CoverageAddOns = () => (
  <div style={{ maxWidth: 460, display: 'grid', gap: 14, justifyItems: 'start' }}>
    <Checkbox label="Attach roadside assistance" hint="Adds $4.10/mo to the contract" defaultChecked />
    <Checkbox label="Rental reimbursement" hint="Adds $6.25/mo — $40/day for up to 5 days" defaultChecked />
    <Checkbox label="Tire & wheel protection" hint="Adds $9.80/mo — Harbor Point Assurance" />
    <Checkbox label="Key replacement" hint="Adds $2.40/mo — up to $800 per term" />
  </div>
);

export const SelectAllHeader = () => (
  <div style={{ maxWidth: 460, display: 'grid', gap: 14, justifyItems: 'start' }}>
    <Checkbox label="Select all 18 quotes" hint="6 of 18 selected on this page" indeterminate />
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start', paddingLeft: 26 }}>
      <Checkbox label="KV-Q-8841 — Marcus Reyes · Beacon Auto Group" defaultChecked />
      <Checkbox label="KV-Q-8842 — Priya Raman · Lakeshore Credit Union" defaultChecked />
      <Checkbox label="KV-Q-8843 — Dana Whitfield · Fairview Service Center" />
    </div>
  </div>
);

export const NotificationChannels = () => (
  <div style={{ maxWidth: 460, display: 'grid', gap: 14, justifyItems: 'start' }}>
    <Checkbox label="Email Dana Whitfield when a claim is authorized" defaultChecked />
    <Checkbox label="Post to the Beacon Auto Group workflow channel" defaultChecked />
    <Checkbox label="Write the outcome back to CDK Drive" />
    <Checkbox label="Notify Lakeshore Credit Union of lien changes" />
  </div>
);

export const States = () => (
  <div style={{ maxWidth: 460, display: 'grid', gap: 14, justifyItems: 'start' }}>
    <Checkbox label="Unchecked — Tire & wheel protection" />
    <Checkbox label="Checked — Roadside assistance" defaultChecked />
    <Checkbox label="Indeterminate — Select all 18 quotes" indeterminate />
    <Checkbox label="Disabled — GAP Coverage" hint="Not available on a 2016 model year" disabled />
    <Checkbox label="Disabled and checked — State-mandated disclosure" hint="Required by Centurion Mutual in this state" defaultChecked disabled />
  </div>
);
