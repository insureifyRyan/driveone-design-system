import * as React from 'react';
import { Modal, Button, Badge, Icon, DescriptionList, TextField, Select } from '@kovara/design-system';

// `Modal` renders inline rather than through a portal, so it covers whatever
// element establishes its containing block. Give it a full-height page root,
// the way the doc says to place it at the root of the page tree.
const pageRoot: React.CSSProperties = { minHeight: 'calc(100vh - 48px)' };

export const BindConfirmation = () => (
  <div style={pageRoot}>
    <Modal
    open
    title="Bind this quote?"
    description="This issues the contract and charges the Beacon Auto Group dealer account."
    footer={
      <>
        <Button variant="secondary">Keep as draft</Button>
        <Button>Bind policy</Button>
      </>
    }
  >
    <DescriptionList
      columns={2}
      items={[
        { term: 'Quote', description: 'KV-Q-8841', mono: true },
        { term: 'Insured', description: 'Marcus Reyes' },
        { term: 'Carrier', description: 'Centurion Mutual' },
        { term: 'Product', description: 'Platinum Vehicle Service Contract' },
        { term: 'Term', description: '36 months · 75,000 mi' },
        { term: 'Term total', description: '$1,842' },
      ]}
    />
  </Modal>
);

export const CancelPolicyWarning = () => (
  <div style={pageRoot}>
    <Modal
    open
    size="sm"
    hideCloseButton
    title="Cancel this policy?"
    description="Coverage ends immediately and cannot be reinstated."
    footer={
      <>
        <Button variant="secondary">Keep policy</Button>
        <Button variant="danger">Cancel policy</Button>
      </>
    }
  >
    Policy KV-4471-0098 for Marcus Reyes will be cancelled effective today. Centurion Mutual
    refunds $1,214 pro-rata to Beacon Auto Group within 10 business days, and the remaining
    $118.40/mo payments stop after the next cycle.
  </Modal>
);

export const AgentDraftedQuoteDetail = () => (
  <div style={pageRoot}>
    <Modal
    open
    size="lg"
    title="Quote KV-Q-8841"
    description="Rated against the Centurion Rating API 4 minutes ago."
    footer={
      <>
        <Button variant="secondary">Compare carriers</Button>
        <Button>Send to customer</Button>
      </>
    }
  >
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
      <Badge tone="accent" icon={<Icon name="sparkles" size={12} />}>Kōvara drafted</Badge>
      <DescriptionList
        columns={3}
        items={[
          { term: 'Insured', description: 'Marcus Reyes' },
          { term: 'Producer', description: 'Dana Whitfield' },
          { term: 'Dealer', description: 'Beacon Auto Group' },
          { term: 'Vehicle', description: '2021 Ford F-150 · 62,400 mi' },
          { term: 'VIN', description: '1HGCM82633A004352', mono: true },
          { term: 'Vehicle price', description: '$34,995' },
          { term: 'Carrier', description: 'Centurion Mutual' },
          { term: 'Deductible', description: '$100' },
          { term: 'Payment', description: '$118.40/mo · $1,842 term' },
        ]}
      />
    </div>
  </Modal>
);

export const ShortForm = () => (
  <div style={pageRoot}>
    <Modal
    open
    title="Add a driver to this contract?"
    description="Named drivers affect eligibility on Harbor Point Assurance products."
    footer={
      <>
        <Button variant="secondary">Cancel</Button>
        <Button>Add driver</Button>
      </>
    }
  >
    <div style={{ display: 'grid', gap: 16 }}>
      <TextField label="Driver name" defaultValue="Priya Raman" />
      <Select
        label="Relationship to insured"
        defaultValue="spouse"
        options={[
          { label: 'Spouse', value: 'spouse' },
          { label: 'Dependent', value: 'dependent' },
          { label: 'Co-signer', value: 'cosigner' },
        ]}
      />
      <TextField label="License number" mono defaultValue="OH-RS4471098" hint="Verified against the state DMV feed at bind." />
    </div>
  </Modal>
);
