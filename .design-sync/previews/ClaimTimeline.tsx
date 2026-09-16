import * as React from 'react';
import { ClaimTimeline, Card } from '@kovara/design-system';

export const AssistedClaim = () => (
  <div style={{ maxWidth: 600 }}>
    <ClaimTimeline
      events={[
        {
          title: 'FNOL received',
          description: 'Inbound call from Marcus Reyes, transcript attached',
          timestamp: 'Mar 12, 8:02am',
          actor: 'Kōvara Voice',
          state: 'done',
        },
        {
          title: 'Coverage verified',
          description: 'Contract KV-4471-0098 in force; $100 deductible applies',
          timestamp: 'Mar 12, 8:03am',
          actor: 'Kōvara',
          state: 'done',
        },
        {
          title: 'Repair facility assigned',
          description: 'Fairview Service Center accepted the tow-in',
          timestamp: 'Mar 12, 8:41am',
          actor: 'Kōvara Workflow',
          state: 'done',
        },
        {
          title: 'Estimate review',
          description: 'Fairview quoted $3,410 for transmission replacement',
          timestamp: 'Mar 12, 9:15am',
          actor: 'Luis Ferrer',
          state: 'active',
        },
        {
          title: 'Payment authorization',
          description: 'Releases funds to Fairview Service Center',
          actor: 'Dana Whitfield',
          state: 'pending',
        },
      ]}
    />
  </div>
);

export const BlockedOnDocuments = () => (
  <div style={{ maxWidth: 600 }}>
    <ClaimTimeline
      events={[
        {
          title: 'FNOL received',
          description: 'Submitted through the Beacon Auto Group portal',
          timestamp: 'Mar 9, 4:12pm',
          actor: 'Kōvara',
          state: 'done',
        },
        {
          title: 'Coverage verified',
          description: 'Contract KV-4471-0126 in force through Harbor Point Assurance',
          timestamp: 'Mar 9, 4:12pm',
          actor: 'Kōvara',
          state: 'done',
        },
        {
          title: 'Maintenance records requested',
          description: 'Two reminders sent to Priya Raman; nothing received in 6 days',
          timestamp: 'Mar 15, 9:00am',
          actor: 'Kōvara Voice',
          state: 'blocked',
        },
        {
          title: 'Adjuster review',
          description: 'Held until service history is on file',
          actor: 'Luis Ferrer',
          state: 'pending',
        },
      ]}
    />
  </div>
);

export const HandledEndToEnd = () => (
  <div style={{ maxWidth: 600 }}>
    <Card variant="accent" title="Claim #2210" subtitle="Closed in 41 minutes with no adjuster touch">
      <ClaimTimeline
        events={[
          {
            title: 'FNOL received',
            description: 'Windshield replacement, no injuries reported',
            timestamp: 'Today 9:41am',
            actor: 'Kōvara Voice',
            state: 'done',
          },
          {
            title: 'Coverage verified',
            description: 'Glass endorsement on KV-4471-0098; $0 deductible',
            timestamp: 'Today 9:42am',
            actor: 'Kōvara',
            state: 'done',
          },
          {
            title: 'Estimate matched to schedule',
            description: '$418 against the Centurion Mutual glass schedule',
            timestamp: 'Today 9:58am',
            actor: 'Kōvara',
            state: 'done',
          },
          {
            title: 'Payment issued',
            description: 'ACH to Fairview Service Center, reference 2210-01',
            timestamp: 'Today 10:22am',
            actor: 'Kōvara Workflow',
            state: 'done',
          },
        ]}
      />
    </Card>
  </div>
);

export const DealerOnboarding = () => (
  <div style={{ maxWidth: 600 }}>
    <Card title="Beacon Auto Group" subtitle="Onboarding started Mar 4">
      <ClaimTimeline
        events={[
          {
            title: 'Application received',
            description: '4 rooftops, F&I menu enabled',
            timestamp: 'Mar 4, 11:20am',
            actor: 'Priya Raman',
            state: 'done',
          },
          {
            title: 'Licensing verified',
            description: 'Ohio dealer license and surety bond confirmed',
            timestamp: 'Mar 5, 8:07am',
            actor: 'Kōvara',
            state: 'done',
          },
          {
            title: 'CDK Drive connected',
            description: 'Deal push tested against 3 sample deals',
            timestamp: 'Mar 6, 2:44pm',
            actor: 'Kōvara Workflow',
            state: 'done',
          },
          {
            title: 'Carrier appointment',
            description: 'Centurion Mutual paperwork with the underwriting desk',
            timestamp: 'Mar 11, 10:15am',
            actor: 'Dana Whitfield',
            state: 'active',
          },
          {
            title: 'F&I training session',
            description: 'Scheduled once the appointment clears',
            actor: 'Dana Whitfield',
            state: 'pending',
          },
        ]}
      />
    </Card>
  </div>
);
