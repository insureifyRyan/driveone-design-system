import * as React from 'react';
import { Alert, Button } from '@kovara/design-system';

const noop = () => {};

export const CarrierFeedDegraded = () => (
  <div style={{ maxWidth: 720 }}>
    <Alert
      tone="warning"
      title="Carrier feed degraded"
      onDismiss={noop}
      actions={
        <>
          <Button size="sm" variant="secondary">View carrier status</Button>
          <Button size="sm" variant="ghost">Retry rating</Button>
        </>
      }
    >
      Centurion Mutual is returning rates slowly. Quotes may take up to 90 seconds, and
      Ridgeline Specialty is being used as the fallback rater.
    </Alert>
  </div>
);

export const Tones = () => (
  <div style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
    <Alert tone="info" title="Rate change effective Apr 1">
      Harbor Point Assurance is republishing its VSC rate cards. Quotes issued before Apr 1 stay honored for 30 days.
    </Alert>
    <Alert tone="success" title="Policy KV-4471-0098 bound">
      Centurion Mutual confirmed the contract and the remittance was queued to Beacon Auto Group.
    </Alert>
    <Alert tone="warning" title="Producer license expires in 6 days">
      Dana Whitfield&apos;s Texas license lapses Mar 22. New quotes will be blocked until it is renewed.
    </Alert>
    <Alert tone="danger" title="Centurion Rating API credential rejected">
      11% of rating calls failed in the last hour. Re-authenticate the integration to resume quoting.
    </Alert>
    <Alert tone="brand" title="Kōvara drafted 14 renewal quotes">
      Every expiring policy in the Lakeshore Credit Union book has a draft quote waiting for your review.
    </Alert>
  </div>
);

export const CompactNotices = () => (
  <div style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
    <Alert tone="info" title="Salesforce sync paused for maintenance until 6:00 PM CT." />
    <Alert tone="success" title="CDK Drive deal jacket import finished — 148 contracts." />
    <Alert tone="warning" title="3 claims are missing a repair estimate." onDismiss={noop} />
  </div>
);

export const ComplianceHold = () => (
  <div style={{ maxWidth: 720 }}>
    <Alert
      tone="danger"
      title="Compliance hold on quote KV-Q-8841"
      onDismiss={noop}
      actions={
        <>
          <Button size="sm" variant="danger">Open compliance review</Button>
          <Button size="sm" variant="secondary">Message Priya Raman</Button>
        </>
      }
    >
      The disclosure packet for Marcus Reyes was signed before the rate was locked. Kōvara cannot
      send this contract to Harbor Point Assurance until a compliance reviewer clears the hold.
    </Alert>
  </div>
);
