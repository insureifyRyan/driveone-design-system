import * as React from 'react';
import { QuoteCard, Button } from '@kovara/design-system';

export const RecommendedQuote = () => (
  <div style={{ maxWidth: 340 }}>
    <QuoteCard
      carrier="Centurion Mutual"
      product="Platinum Vehicle Service Contract"
      price="$118.40"
      term="/mo"
      recommended
      aiGenerated
      meta={['36 months', '$100 deductible', '75,000 mi']}
      features={['Powertrain + electronics', 'Nationwide claims network', 'Transferable to next owner']}
      actions={
        <>
          <Button variant="secondary" size="sm">Compare</Button>
          <Button size="sm">Send to customer</Button>
        </>
      }
    />
  </div>
);

export const ComparisonSet = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
    <QuoteCard
      carrier="Centurion Mutual"
      product="Platinum VSC"
      price="$118.40"
      term="/mo"
      recommended
      aiGenerated
      meta={['36 months', '$100 deductible']}
      features={['Powertrain + electronics', 'Nationwide claims']}
      actions={<Button size="sm" fullWidth>Send to customer</Button>}
    />
    <QuoteCard
      carrier="Harbor Point Assurance"
      product="Gold VSC"
      price="$96.75"
      term="/mo"
      meta={['36 months', '$250 deductible']}
      features={['Powertrain only', 'Regional network']}
      actions={<Button size="sm" variant="secondary" fullWidth>Send to customer</Button>}
    />
    <QuoteCard
      carrier="Ridgeline Specialty"
      product="Complete Care"
      price="$141.20"
      term="/mo"
      meta={['48 months', '$0 deductible']}
      features={['Bumper-to-bumper', 'Rental + roadside', 'Transferable']}
      actions={<Button size="sm" variant="secondary" fullWidth>Send to customer</Button>}
    />
  </div>
);

export const SingleTermPrice = () => (
  <div style={{ maxWidth: 340 }}>
    <QuoteCard
      carrier="Harbor Point Assurance"
      product="GAP Coverage"
      price="$695"
      term="per term"
      meta={['Term of loan', 'Single pay']}
      features={['Covers negative equity', 'Includes $1,000 deductible waiver']}
      actions={<Button size="sm" fullWidth>Add to deal</Button>}
    />
  </div>
);
