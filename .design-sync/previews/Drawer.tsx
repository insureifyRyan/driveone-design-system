import * as React from 'react';
import {
  Drawer,
  Button,
  Badge,
  Icon,
  DescriptionList,
  ClaimTimeline,
  Checkbox,
  Select,
  TextField,
  Textarea,
} from '@kovara/design-system';

// `Drawer` renders inline rather than through a portal, so its scrim covers the
// element that establishes its containing block — put it at the root of a
// full-height page tree, over the list it is opened from.
const pageRoot: React.CSSProperties = { minHeight: 'calc(100vh - 48px)' };

export const QuoteDetail = () => (
  <div style={pageRoot}>
    <Drawer
      open
      title="Quote KV-Q-8841"
      description="Centurion Mutual · 36 months"
      footer={<Button fullWidth>Send to customer</Button>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
        <Badge tone="accent" icon={<Icon name="sparkles" size={12} />}>Kōvara drafted</Badge>
        <DescriptionList
          columns={1}
          items={[
            { term: 'Insured', description: 'Marcus Reyes' },
            { term: 'Producer', description: 'Dana Whitfield' },
            { term: 'Vehicle', description: '2021 Ford F-150 · 62,400 mi' },
            { term: 'VIN', description: '1HGCM82633A004352', mono: true },
            { term: 'Product', description: 'Platinum VSC · $100 deductible' },
            { term: 'Payment', description: '$118.40/mo · $1,842 term total' },
          ]}
        />
      </div>
    </Drawer>
  </div>
);

export const ClaimReview = () => (
  <div style={pageRoot}>
    <Drawer
      open
      size="lg"
      title="Claim #2210"
      description="Marcus Reyes · KV-4471-0098 · transmission · Fairview Service Center"
      footer={
        <>
          <Button variant="secondary">Request documents</Button>
          <Button>Approve estimate</Button>
        </>
      }
    >
      <ClaimTimeline
        events={[
          {
            title: 'FNOL received',
            description: 'Inbound call, transcript attached',
            timestamp: 'Mar 12, 8:02am',
            actor: 'Kōvara Voice',
            state: 'done',
          },
          {
            title: 'Coverage verified',
            description: 'Contract in force; $100 deductible applies',
            timestamp: 'Mar 12, 8:03am',
            actor: 'Kōvara',
            state: 'done',
          },
          {
            title: 'Estimate review',
            description: 'Fairview Service Center quoted $3,410',
            timestamp: 'Mar 12, 9:15am',
            actor: 'Luis Ferrer',
            state: 'active',
          },
          { title: 'Payment authorization', actor: 'Dana Whitfield', state: 'pending' },
        ]}
      />
    </Drawer>
  </div>
);

export const PipelineFilters = () => (
  <div style={pageRoot}>
    <Drawer
      open
      side="left"
      size="sm"
      title="Filter pipeline"
      description="342 quotes in the last 30 days"
      footer={
        <>
          <Button variant="ghost">Clear</Button>
          <Button>Apply</Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Select
          label="Producer"
          defaultValue="dana"
          options={[
            { label: 'Dana Whitfield', value: 'dana' },
            { label: 'Priya Raman', value: 'priya' },
            { label: 'All producers', value: 'all' },
          ]}
        />
        <Select
          label="Partner"
          defaultValue="beacon"
          options={[
            { label: 'Beacon Auto Group', value: 'beacon' },
            { label: 'Lakeshore Credit Union', value: 'lakeshore' },
            { label: 'Fairview Service Center', value: 'fairview' },
          ]}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Checkbox label="Centurion Mutual" defaultChecked />
          <Checkbox label="Harbor Point Assurance" defaultChecked />
          <Checkbox label="Ridgeline Specialty" />
          <Checkbox label="Kōvara-drafted only" hint="Quotes the agent rated without a producer" />
        </div>
      </div>
    </Drawer>
  </div>
);

export const WorkflowStepEditor = () => (
  <div style={pageRoot}>
    <Drawer
      open
      title="Edit step: Verify coverage"
      description="Renewal outreach · step 3 of 6"
      footer={
        <>
          <Button variant="secondary">Cancel</Button>
          <Button>Save step</Button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 20 }}>
        <TextField label="Step name" defaultValue="Verify coverage" />
        <Select
          label="System of record"
          defaultValue="cdk"
          options={[
            { label: 'CDK Drive', value: 'cdk' },
            { label: 'Symitar', value: 'symitar' },
            { label: 'Salesforce', value: 'salesforce' },
          ]}
          hint="Kōvara reads the contract from this system before continuing."
        />
        <Textarea
          label="Escalation note"
          rows={4}
          defaultValue="If the contract is not in force, route to Dana Whitfield instead of sending the renewal quote."
        />
        <Checkbox label="Pause the run when coverage cannot be confirmed" defaultChecked />
      </div>
    </Drawer>
  </div>
);
