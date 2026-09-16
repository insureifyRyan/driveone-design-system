import * as React from 'react';
import { DescriptionList, Card, StatusPill, Badge, Icon } from '@kovara/design-system';

export const PolicySummary = () => (
  <div style={{ maxWidth: 460 }}>
    <Card title="Policy summary" subtitle="Centurion Mutual · bound Mar 1, 2026">
      <DescriptionList
        columns={2}
        items={[
          { term: 'Policy number', description: 'KV-4471-0098', mono: true },
          { term: 'Status', description: <StatusPill status="active" /> },
          { term: 'Named insured', description: 'Marcus Reyes' },
          { term: 'Producer', description: 'Dana Whitfield' },
          { term: 'Effective', description: 'Mar 1, 2026' },
          { term: 'Expires', description: 'Mar 1, 2029' },
          { term: 'Premium', description: '$118.40/mo' },
          { term: 'Deductible', description: '$100' },
        ]}
      />
    </Card>
  </div>
);

export const ClaimDetailThreeColumn = () => (
  <div style={{ maxWidth: 720 }}>
    <DescriptionList
      columns={3}
      items={[
        { term: 'Claim', description: '#2210', mono: true },
        { term: 'Policy', description: 'KV-4471-0098', mono: true },
        { term: 'Status', description: <StatusPill status="in-review" /> },
        { term: 'Vehicle', description: '2021 Ford F-150 · 62,400 mi' },
        { term: 'VIN', description: '1HGCM82633A004352', mono: true },
        { term: 'Adjuster', description: 'Luis Ferrer' },
        { term: 'Administrator', description: 'Harbor Point Assurance' },
        { term: 'Repair facility', description: 'Fairview Service Center' },
        { term: 'Estimate', description: '$1,842' },
      ]}
    />
  </div>
);

export const QuoteAside = () => (
  <div style={{ maxWidth: 260 }}>
    <Card title="Quote details" padding="compact">
      <DescriptionList
        columns={1}
        items={[
          { term: 'Quote', description: 'KV-Q-8841', mono: true },
          { term: 'Status', description: <StatusPill status="quoted" /> },
          { term: 'Vehicle price', description: '$34,995' },
          { term: 'Term', description: '36 months / 75,000 mi' },
          { term: 'Rated by', description: 'Centurion Rating API' },
        ]}
      />
    </Card>
  </div>
);

export const RichValues = () => (
  <div style={{ maxWidth: 460 }}>
    <Card title="Intake record" subtitle="Extracted from the customer's uploaded documents" variant="accent">
      <DescriptionList
        columns={2}
        items={[
          {
            term: 'Source',
            description: <Badge tone="accent" icon={<Icon name="sparkles" size={12} />}>AI extracted</Badge>,
          },
          { term: 'Confidence', description: '96%' },
          { term: 'Applicant', description: 'Marcus Reyes' },
          { term: 'Lender', description: 'Lakeshore Credit Union' },
          { term: 'VIN', description: '1HGCM82633A004352', mono: true },
          { term: 'Odometer', description: '62,400 mi' },
          { term: 'Contract', description: <a href="#contract">View signed contract</a> },
          { term: 'Synced to', description: 'CDK Drive' },
        ]}
      />
    </Card>
  </div>
);
