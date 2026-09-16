import * as React from 'react';
import { OnboardingSteps, Card, Button, Icon, IconButton } from '@kovara/design-system';

export const DealerChecklist = () => (
  <div style={{ maxWidth: 560 }}>
    <OnboardingSteps
      steps={[
        {
          title: 'Licensing verified',
          description: 'NIPR check cleared for OH, IN, KY',
          state: 'complete',
          owner: 'Kōvara',
        },
        {
          title: 'Dealer agreement signed',
          description: 'Countersigned 12 Sep by Beacon Auto Group',
          state: 'complete',
          owner: 'Kōvara',
        },
        {
          title: 'Connect CDK Drive',
          description: 'Waiting on store credentials for rooftop 4471',
          state: 'current',
          owner: 'Beacon Auto Group',
        },
        {
          title: 'Product pricing approved',
          description: 'Centurion Mutual term and deductible grid, $100 default',
          state: 'pending',
          owner: 'Compliance',
        },
        {
          title: 'Go live',
          description: 'First quote issued from the F&I menu',
          state: 'pending',
          owner: 'Dana Whitfield',
        },
      ]}
    />
  </div>
);

export const WizardHeader = () => (
  <div style={{ maxWidth: 820 }}>
    <OnboardingSteps
      orientation="horizontal"
      steps={[
        { title: 'Licensing', state: 'complete', owner: 'Kōvara' },
        { title: 'Agreement', state: 'complete', owner: 'Kōvara' },
        { title: 'Connect DMS', state: 'current', owner: 'Beacon Auto' },
        { title: 'Pricing', state: 'pending', owner: 'Compliance' },
        { title: 'Go live', state: 'pending', owner: 'D. Whitfield' },
      ]}
    />
  </div>
);

export const BlockedOnCompliance = () => (
  <div style={{ maxWidth: 560 }}>
    <OnboardingSteps
      steps={[
        {
          title: 'Branch roster imported',
          description: '18 member service reps loaded from Symitar',
          state: 'complete',
          owner: 'Kōvara',
        },
        {
          title: 'Connect Symitar core',
          description: 'Sandbox handshake succeeded; production keys pending',
          state: 'current',
          owner: 'Lakeshore Credit Union',
        },
        {
          title: 'Rate disclosure filing',
          description: 'Blocked until Harbor Point Assurance returns the approved Ohio disclosure form',
          state: 'blocked',
          owner: 'Harbor Point Assurance',
        },
        {
          title: 'Enable member quoting',
          description: 'Turns on once the filing clears',
          state: 'pending',
          owner: 'Priya Raman',
        },
      ]}
    />
  </div>
);

export const CreditUnionLaunch = () => (
  <div style={{ maxWidth: 560 }}>
    <Card
      title="Lakeshore Credit Union"
      subtitle="Onboarding · 2 of 5 complete"
      action={<IconButton icon={<Icon name="more-horizontal" />} label="Onboarding options" size="sm" />}
      footer={
        <Button variant="primary" size="sm">
          Request production keys
        </Button>
      }
    >
      <OnboardingSteps
        steps={[
          { title: 'Branch roster imported', description: '18 member service reps loaded', state: 'complete', owner: 'Kōvara' },
          { title: 'Compliance review', description: 'Lending disclosures matched to state filings', state: 'complete', owner: 'Kōvara' },
          { title: 'Connect Symitar core', description: 'Waiting on production service credentials', state: 'current', owner: 'Lakeshore Credit Union' },
          { title: 'Agent voice script approved', state: 'pending', owner: 'Priya Raman' },
          { title: 'Go live', description: 'First member quote from the branch queue', state: 'pending', owner: 'Dana Whitfield' },
        ]}
      />
    </Card>
  </div>
);

export const LaunchComplete = () => (
  <div style={{ maxWidth: 560 }}>
    <OnboardingSteps
      steps={[
        { title: 'Licensing verified', description: 'NIPR check cleared for OH', state: 'complete', owner: 'Kōvara' },
        { title: 'Service agreement signed', description: 'Countersigned 2 Sep by Fairview Service Center', state: 'complete', owner: 'Kōvara' },
        { title: 'Claims intake connected', description: 'FNOL routed to Luis Ferrer', state: 'complete', owner: 'Kōvara' },
        { title: 'Live', description: 'First repair authorization issued on claim #2210', state: 'complete', owner: 'Fairview Service Center' },
      ]}
    />
  </div>
);
