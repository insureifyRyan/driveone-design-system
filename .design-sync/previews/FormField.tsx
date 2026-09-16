import * as React from 'react';
import { FormField, Button } from '@kovara/design-system';

export const EffectiveDate = () => (
  <div style={{ maxWidth: 460 }}>
    <FormField
      label="Effective date"
      htmlFor="eff-date"
      hint="Coverage starts 12:01am local time at the selling dealership"
      required
    >
      <input id="eff-date" type="date" defaultValue="2024-05-15" className="kv-input kv-input--md" />
    </FormField>
  </div>
);

export const OptionalOnARequiredForm = () => (
  <div style={{ maxWidth: 460, display: 'grid', gap: 16 }}>
    <FormField label="Insured name" htmlFor="ff-insured" hint="As printed on the buyer's order">
      <input id="ff-insured" defaultValue="Marcus Reyes" className="kv-input kv-input--md" />
    </FormField>
    <FormField label="Odometer at sale" htmlFor="ff-odo" hint="Miles, whole numbers">
      <input id="ff-odo" defaultValue="41,280" className="kv-input kv-input--md" />
    </FormField>
    <FormField
      label="Co-buyer email"
      htmlFor="ff-cobuyer"
      optional
      hint="Contract copies go to the co-buyer as well"
    >
      <input id="ff-cobuyer" type="email" placeholder="name@example.com" className="kv-input kv-input--md" />
    </FormField>
  </div>
);

export const ErrorReplacesHint = () => (
  <div style={{ maxWidth: 460, display: 'grid', gap: 16 }}>
    <FormField
      label="Deductible"
      htmlFor="ff-ded-ok"
      hint="Per visit, applied at the repair facility"
    >
      <input id="ff-ded-ok" defaultValue="$100" className="kv-input kv-input--md" />
    </FormField>
    <FormField
      label="Deductible"
      htmlFor="ff-ded-bad"
      hint="Per visit, applied at the repair facility"
      error="Centurion Mutual allows $0, $100 or $250 on this program"
      required
    >
      <input id="ff-ded-bad" defaultValue="$175" className="kv-input kv-input--md kv-input--invalid" aria-invalid />
    </FormField>
  </div>
);

export const WrappingAThirdPartyControl = () => (
  <div style={{ maxWidth: 460 }}>
    <FormField
      label="Vehicle identification number"
      htmlFor="ff-vin"
      hint="Scan the door jamb tag or type all 17 characters"
      required
    >
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          id="ff-vin"
          defaultValue="1HGCM82633A004352"
          className="kv-input kv-input--md kv-input--mono"
        />
        <Button variant="secondary" size="md">Scan</Button>
      </div>
    </FormField>
  </div>
);
