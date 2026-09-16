import * as React from 'react';
import { Radio, RadioGroup } from '@kovara/design-system';

export const TermLength = () => (
  <div style={{ maxWidth: 460 }}>
    <RadioGroup legend="Term length">
      <Radio name="kv-term" label="36 months" hint="Most common for used vehicles" defaultChecked />
      <Radio name="kv-term" label="48 months" hint="Covers the balance of a 60-month note" />
      <Radio name="kv-term" label="60 months" hint="Requires under 60,000 miles at sale" />
    </RadioGroup>
  </div>
);

export const CoverageLevel = () => (
  <div style={{ maxWidth: 460 }}>
    <RadioGroup legend="Coverage level" hint="Quoted against Beacon Auto Group's Centurion Mutual program">
      <Radio name="kv-cov" label="Powertrain" hint="Engine, transmission, drive axle — $96.75/mo" />
      <Radio name="kv-cov" label="Powertrain + electronics" hint="Adds infotainment and sensors — $118.40/mo" defaultChecked />
      <Radio name="kv-cov" label="Bumper-to-bumper" hint="Ridgeline Specialty Complete Care — $141.20/mo" />
    </RadioGroup>
  </div>
);

export const States = () => (
  <div style={{ maxWidth: 460, display: 'grid', gap: 20 }}>
    <RadioGroup legend="Deductible" hint="Applies per claim, not per visit">
      <Radio name="kv-ded" label="$100" hint="Rated on quote KV-Q-8841" defaultChecked />
      <Radio name="kv-ded" label="$250" />
      <Radio name="kv-ded" label="$0" hint="Not filed by Centurion Mutual in this state" disabled />
    </RadioGroup>
    <RadioGroup legend="Legacy deductible" hint="Read-only — retired tiers stay on existing contracts">
      <Radio name="kv-ded-legacy" label="$500" hint="On policy KV-4471-0098" defaultChecked disabled />
      <Radio name="kv-ded-legacy" label="$1,000" disabled />
    </RadioGroup>
  </div>
);

export const WithoutGroup = () => (
  <div style={{ maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 12 }}>
    <Radio name="kv-pay" label="Pay in full — $1,842 term total" defaultChecked />
    <Radio name="kv-pay" label="Roll into the retail contract — $118.40/mo" />
    <Radio name="kv-pay" label="Bill Lakeshore Credit Union directly" />
  </div>
);
