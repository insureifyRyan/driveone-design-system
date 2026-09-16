import * as React from 'react';
import { CallSummaryCard, Button } from '@kovara/design-system';

export const HandledByAgent = () => (
  <div style={{ maxWidth: 460 }}>
    <CallSummaryCard
      contact="Marcus Reyes"
      phone="(614) 555-0142"
      direction="inbound"
      duration="4:12"
      timestamp="Today 2:14pm"
      outcome="resolved"
      handledBy="agent"
      topics={['claim status', 'deductible']}
      summary="Caller asked where his transmission claim stood. Confirmed the estimate was approved, a $100 deductible applies, and Beacon Auto Service is authorized to begin work Thursday."
      actions={<Button variant="link" size="sm">Open transcript</Button>}
    />
  </div>
);

export const Escalated = () => (
  <div style={{ maxWidth: 460 }}>
    <CallSummaryCard
      contact="Priya Raman"
      phone="(216) 555-0119"
      direction="inbound"
      duration="7:48"
      timestamp="Today 11:02am"
      outcome="escalated"
      handledBy="agent"
      topics={['coverage dispute', 'cancellation']}
      summary="Caller disputed that her contract excludes the failed component and asked to cancel. Coverage language confirmed, refund quoted pro-rata. Routed to Dana Whitfield for a retention call."
      actions={<Button variant="secondary" size="sm">Assign adjuster</Button>}
    />
  </div>
);

export const OutboundFollowUp = () => (
  <div style={{ maxWidth: 460 }}>
    <CallSummaryCard
      contact="Beacon Auto Group"
      phone="(614) 555-0188"
      direction="outbound"
      duration="2:31"
      timestamp="Yesterday 4:40pm"
      outcome="scheduled"
      handledBy="agent"
      topics={['abandoned quote', 'F&I products']}
      summary="Followed up on three quotes abandoned at the payment step. Finance manager asked for a walkthrough of the new GAP pricing; callback booked for Thursday 10am."
    />
  </div>
);
