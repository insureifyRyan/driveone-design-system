import * as React from 'react';
import { SearchInput } from '@kovara/design-system';

export const GlobalSearch = () => (
  <div style={{ maxWidth: 460 }}>
    <SearchInput placeholder="Search policies, VINs, claim IDs…" shortcut="⌘K" />
  </div>
);

export const Sizes = () => (
  <div style={{ maxWidth: 460, display: 'grid', gap: 16 }}>
    <SearchInput size="sm" placeholder="Filter 18 quotes…" />
    <SearchInput size="md" placeholder="Search policies, VINs, claim IDs…" shortcut="⌘K" />
    <SearchInput size="lg" placeholder="Search everything in Beacon Auto Group…" shortcut="⌘K" />
  </div>
);

export const ScopedToAList = () => (
  <div style={{ maxWidth: 460, display: 'grid', gap: 16 }}>
    <SearchInput label="Search policies" placeholder="Policy number, VIN or insured name…" />
    <SearchInput label="Search claims" placeholder="Claim ID, repair order or adjuster…" />
    <SearchInput label="Search partners" placeholder="Dealer, credit union or service center…" />
  </div>
);

export const WithQuery = () => (
  <div style={{ maxWidth: 460, display: 'grid', gap: 16 }}>
    <SearchInput label="Search policies" placeholder="Policy number, VIN or insured name…" defaultValue="1HGCM82633A004352" />
    <SearchInput label="Search claims" placeholder="Claim ID, repair order or adjuster…" defaultValue="Marcus Reyes" shortcut="⌘K" />
  </div>
);
