import * as React from 'react';
import { Toast, Button } from '@kovara/design-system';

const noop = () => {};

export const PolicyBound = () => (
  <div style={{ maxWidth: 460 }}>
    <Toast
      tone="success"
      title="Policy bound"
      onDismiss={noop}
      action={<Button variant="link" size="sm">View policy</Button>}
    >
      KV-4471-0098 is in force as of today.
    </Toast>
  </div>
);

export const Tones = () => (
  <div style={{ display: 'grid', gap: 12, maxWidth: 460 }}>
    <Toast tone="info" title="Quote sent to Marcus Reyes" onDismiss={noop} action={<Button variant="link" size="sm">View quote</Button>}>
      KV-Q-8841 was emailed and texted from Beacon Auto Group.
    </Toast>
    <Toast tone="success" title="Policy bound" onDismiss={noop} action={<Button variant="link" size="sm">View policy</Button>}>
      KV-4471-0098 is in force as of today.
    </Toast>
    <Toast tone="warning" title="Rating fell back to Ridgeline Specialty" onDismiss={noop} action={<Button variant="link" size="sm">See why</Button>}>
      Centurion Mutual timed out after 90 seconds.
    </Toast>
    <Toast tone="danger" title="Remittance to Harbor Point failed" onDismiss={noop} action={<Button variant="link" size="sm">Retry</Button>}>
      3 contracts were not transmitted. Nothing was charged.
    </Toast>
  </div>
);

export const BottomRightStack = () => (
  <div style={{ display: 'grid', gap: 12, justifyItems: 'end', maxWidth: 460 }}>
    <Toast tone="success" title="Claim #2210 assigned" onDismiss={noop} action={<Button variant="link" size="sm">Open claim</Button>}>
      Luis Ferrer is now the adjuster of record.
    </Toast>
    <Toast tone="info" title="Draft saved" onDismiss={noop} action={<Button variant="link" size="sm">Undo</Button>}>
      Quote KV-Q-8841 will stay editable for 30 days.
    </Toast>
    <Toast tone="success" title="Synced to CDK Drive" onDismiss={noop}>
      148 contracts written to Beacon Auto Group.
    </Toast>
  </div>
);

export const TitleOnly = () => (
  <div style={{ display: 'grid', gap: 12, maxWidth: 460 }}>
    <Toast tone="success" title="Contract emailed to Marcus Reyes" onDismiss={noop} />
    <Toast tone="info" title="Symitar member lookup refreshed" onDismiss={noop} />
  </div>
);
