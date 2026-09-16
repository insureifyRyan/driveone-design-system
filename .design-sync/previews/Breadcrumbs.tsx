import * as React from 'react';
import { Breadcrumbs } from '@kovara/design-system';

export const PolicyDrilldown = () => (
  <div style={{ maxWidth: 720 }}>
    <Breadcrumbs
      items={[
        { label: 'Policies', href: '#' },
        { label: 'KV-4471-0098', href: '#' },
        { label: 'Claim #2210' },
      ]}
    />
  </div>
);

export const DeepHierarchy = () => (
  <div style={{ maxWidth: 720, display: 'grid', gap: 18 }}>
    <Breadcrumbs
      items={[
        { label: 'Distribution', href: '#' },
        { label: 'Beacon Auto Group', href: '#' },
        { label: 'Deals', href: '#' },
        { label: 'KV-Q-8841', href: '#' },
        { label: 'Contract' },
      ]}
    />
    <Breadcrumbs
      items={[
        { label: 'Automation', href: '#' },
        { label: 'Workflows', href: '#' },
        { label: 'Renewal outreach', href: '#' },
        { label: 'Run 1,284' },
      ]}
    />
  </div>
);

export const SeparatorOptions = () => (
  <div style={{ maxWidth: 720, display: 'grid', gap: 18 }}>
    <Breadcrumbs
      items={[
        { label: 'Claims', href: '#' },
        { label: 'Fairview Service Center', href: '#' },
        { label: 'Claim #2210' },
      ]}
    />
    <Breadcrumbs
      separator="›"
      items={[
        { label: 'Claims', href: '#' },
        { label: 'Fairview Service Center', href: '#' },
        { label: 'Claim #2210' },
      ]}
    />
    <Breadcrumbs
      separator="·"
      items={[
        { label: 'Claims', href: '#' },
        { label: 'Fairview Service Center', href: '#' },
        { label: 'Claim #2210' },
      ]}
    />
  </div>
);
