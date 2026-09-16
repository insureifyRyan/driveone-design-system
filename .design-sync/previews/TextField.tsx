import * as React from 'react';
import { TextField } from '@kovara/design-system';

export const MachineIdentifiers = () => (
  <div style={{ maxWidth: 460, display: 'grid', gap: 16 }}>
    <TextField label="VIN" mono defaultValue="1HGCM82633A004352" hint="17 characters" required />
    <TextField label="Policy number" mono defaultValue="KV-4471-0098" hint="Issued by Centurion Mutual" />
    <TextField label="Insured name" defaultValue="Marcus Reyes" hint="As printed on the buyer's order" />
  </div>
);

export const Adornments = () => (
  <div style={{ maxWidth: 460, display: 'grid', gap: 16 }}>
    <TextField label="Vehicle price" startAdornment="$" defaultValue="34,995" hint="Cash price before taxes and fees" />
    <TextField label="Monthly payment" startAdornment="$" endAdornment="/mo" defaultValue="118.40" />
    <TextField label="Odometer at sale" endAdornment="mi" defaultValue="41,280" />
  </div>
);

export const Sizes = () => (
  <div style={{ maxWidth: 460, display: 'grid', gap: 16 }}>
    <TextField size="sm" label="Contract number (sm)" mono defaultValue="KV-Q-8841" />
    <TextField size="md" label="Producer of record (md)" defaultValue="Dana Whitfield" />
    <TextField size="lg" label="Dealership (lg)" defaultValue="Beacon Auto Group" />
  </div>
);

export const States = () => (
  <div style={{ maxWidth: 460, display: 'grid', gap: 16 }}>
    <TextField label="Email" type="email" defaultValue="marcus@" error="Enter a valid email address" required />
    <TextField label="Rating account" defaultValue="Centurion Rating API" disabled hint="Set by the Beacon Auto Group integration" />
    <TextField label="Claim ID" mono placeholder="#2210" hint="Leave blank to open a new claim" />
  </div>
);
