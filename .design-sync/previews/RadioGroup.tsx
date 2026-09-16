import * as React from 'react';
import { Radio, RadioGroup } from '@kovara/design-system';

export const Vertical = () => (
  <div style={{ maxWidth: 460 }}>
    <RadioGroup legend="Term length" hint="Quote KV-Q-8841 — Marcus Reyes">
      <Radio name="rg-term" label="36 months" hint="Most common for used vehicles" defaultChecked />
      <Radio name="rg-term" label="48 months" hint="Covers the balance of a 60-month note" />
      <Radio name="rg-term" label="60 months" hint="Requires under 60,000 miles at sale" />
    </RadioGroup>
  </div>
);

export const Horizontal = () => (
  <div style={{ maxWidth: 460 }}>
    <RadioGroup legend="Deductible" orientation="horizontal" hint="Applies per claim, not per visit">
      <Radio name="rg-ded" label="$0" />
      <Radio name="rg-ded" label="$100" defaultChecked />
      <Radio name="rg-ded" label="$250" />
    </RadioGroup>
  </div>
);

export const WithError = () => (
  <div style={{ maxWidth: 460 }}>
    <RadioGroup
      legend="Payment cadence"
      error="Centurion Mutual does not file single pay in this state — choose monthly to bind."
    >
      <Radio name="rg-cadence" label="Monthly — $118.40/mo" />
      <Radio name="rg-cadence" label="Single pay — $1,842 term total" defaultChecked />
    </RadioGroup>
  </div>
);

export const LockedByCarrier = () => (
  <div style={{ maxWidth: 460 }}>
    <RadioGroup legend="Mileage band" hint="Locked by the Centurion Rating API for VIN 1HGCM82633A004352">
      <Radio name="rg-miles" label="Up to 75,000 mi" hint="Rated on this quote" defaultChecked disabled />
      <Radio name="rg-miles" label="Up to 100,000 mi" disabled />
      <Radio name="rg-miles" label="Up to 125,000 mi" disabled />
    </RadioGroup>
  </div>
);
