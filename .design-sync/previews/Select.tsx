import * as React from 'react';
import { Select } from '@kovara/design-system';

export const CarrierSelect = () => (
  <div style={{ maxWidth: 460 }}>
    <Select
      label="Carrier"
      placeholder="Select a carrier"
      required
      options={[
        { label: 'Centurion Mutual', value: 'centurion' },
        { label: 'Harbor Point Assurance', value: 'harbor' },
        { label: 'Ridgeline Specialty', value: 'ridgeline', disabled: true },
      ]}
      hint="Only carriers appointed for this state are listed"
    />
  </div>
);

export const Sizes = () => (
  <div style={{ maxWidth: 460, display: 'grid', gap: 16 }}>
    <Select
      size="sm"
      label="Deductible (sm)"
      defaultValue="100"
      options={[
        { label: '$0', value: '0' },
        { label: '$100', value: '100' },
        { label: '$250', value: '250' },
      ]}
    />
    <Select
      size="md"
      label="Coverage term (md)"
      defaultValue="36"
      options={[
        { label: '24 months / 24,000 mi', value: '24' },
        { label: '36 months / 45,000 mi', value: '36' },
        { label: '48 months / 60,000 mi', value: '48' },
      ]}
    />
    <Select
      size="lg"
      label="Payment cadence (lg)"
      defaultValue="monthly"
      options={[
        { label: 'Monthly — $118.40/mo', value: 'monthly' },
        { label: 'Single pay — $1,842 term total', value: 'single' },
      ]}
    />
  </div>
);

export const States = () => (
  <div style={{ maxWidth: 460, display: 'grid', gap: 16 }}>
    <Select
      label="Selling dealership"
      defaultValue="beacon"
      options={[
        { label: 'Beacon Auto Group', value: 'beacon' },
        { label: 'Fairview Service Center', value: 'fairview' },
      ]}
      hint="Synced nightly from CDK Drive"
    />
    <Select
      label="Garaging state"
      placeholder="Select a state"
      required
      error="Centurion Mutual is not appointed in the selected state"
      options={[
        { label: 'California', value: 'ca' },
        { label: 'Oregon', value: 'or' },
        { label: 'Washington', value: 'wa' },
      ]}
    />
    <Select
      label="Lender"
      defaultValue="lakeshore"
      disabled
      options={[{ label: 'Lakeshore Credit Union', value: 'lakeshore' }]}
      hint="Locked by the Symitar loan record"
    />
  </div>
);

export const UnfilledVersusSelected = () => (
  <div style={{ maxWidth: 460, display: 'grid', gap: 16 }}>
    <Select
      label="Product"
      placeholder="Select a product"
      hint="Unfilled — the placeholder keeps it visibly unanswered"
      options={[
        { label: 'Platinum Vehicle Service Contract', value: 'cm-platinum' },
        { label: 'Gold Vehicle Service Contract', value: 'cm-gold' },
        { label: 'GAP Coverage', value: 'hp-gap' },
      ]}
    />
    <Select
      label="Product"
      defaultValue="cm-platinum"
      hint="Answered — options grouped by administrator"
    >
      <optgroup label="Centurion Mutual">
        <option value="cm-platinum">Platinum Vehicle Service Contract</option>
        <option value="cm-gold">Gold Vehicle Service Contract</option>
      </optgroup>
      <optgroup label="Harbor Point Assurance">
        <option value="hp-gap">GAP Coverage</option>
        <option value="hp-tire">Tire &amp; Wheel</option>
      </optgroup>
      <optgroup label="Ridgeline Specialty">
        <option value="rs-complete">Complete Care</option>
      </optgroup>
    </Select>
  </div>
);
