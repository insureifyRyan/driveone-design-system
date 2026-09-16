import * as React from 'react';
import { Textarea } from '@kovara/design-system';

export const ClaimNotes = () => (
  <div style={{ maxWidth: 460 }}>
    <Textarea
      label="Claim notes"
      rows={4}
      placeholder="What the insured reported…"
      hint="Visible to the adjuster and on the audit trail"
    />
  </div>
);

export const FilledNarrative = () => (
  <div style={{ maxWidth: 460 }}>
    <Textarea
      label="Adjuster narrative"
      rows={6}
      defaultValue={
        'Marcus Reyes reported a hard shift and a check-engine light at 41,280 miles. Fairview Service Center pulled P0741 and quoted a torque converter replacement at $1,842. Contract KV-4471-0098 is in force with a $100 deductible; Centurion Mutual authorization requested 05/15.'
      }
      hint="Luis Ferrer — last saved 2 minutes ago"
    />
  </div>
);

export const SizedToTheAnswer = () => (
  <div style={{ maxWidth: 460, display: 'grid', gap: 16 }}>
    <Textarea
      label="Cancellation reason"
      rows={3}
      placeholder="One or two sentences for the carrier file…"
      hint="3 rows — a short note"
    />
    <Textarea
      label="Instruction for the claims agent"
      rows={8}
      defaultValue={
        'Check the contract term and mileage band before you authorize. If the repair order exceeds $1,500, attach the teardown photos and route to Centurion Mutual for review rather than approving in-line.'
      }
      hint="8 rows — narrative the agent follows on every claim"
    />
  </div>
);

export const ErrorState = () => (
  <div style={{ maxWidth: 460 }}>
    <Textarea
      label="Coverage remarks"
      rows={4}
      required
      defaultValue="Approved."
      error="Add the failed component and the repair order number before submitting to Harbor Point Assurance"
    />
  </div>
);
