import * as React from 'react';
import { WorkflowRunCard, Card, Button, IconButton, Icon } from '@kovara/design-system';

export const RunningAutomation = () => (
  <div style={{ maxWidth: 480 }}>
    <WorkflowRunCard
      name="Abandoned quote follow-up"
      trigger="Webhook · dealer.quote.abandoned"
      state="running"
      steps={5}
      completedSteps={3}
      duration="42s"
      recordsProcessed={18}
      action={<IconButton icon={<Icon name="more-horizontal" />} label="Run actions" size="sm" />}
    />
  </div>
);

export const RunStates = () => (
  <div style={{ display: 'grid', gap: 16, maxWidth: 480 }}>
    <WorkflowRunCard
      name="Nightly carrier sync"
      trigger="Schedule · 06:00 daily"
      state="queued"
      steps={4}
      completedSteps={0}
    />
    <WorkflowRunCard
      name="Abandoned quote follow-up"
      trigger="Webhook · dealer.quote.abandoned"
      state="running"
      steps={5}
      completedSteps={3}
      duration="42s"
      recordsProcessed={18}
    />
    <WorkflowRunCard
      name="Policy renewal outreach"
      trigger="Schedule · 07:30 weekdays"
      state="succeeded"
      steps={4}
      completedSteps={4}
      duration="1m 12s"
      recordsProcessed={241}
    />
    <WorkflowRunCard
      name="Symitar loan payoff reconciliation"
      trigger="Webhook · core.loan.payoff"
      state="failed"
      steps={5}
      completedSteps={2}
      failedStep={2}
      duration="18s"
      recordsProcessed={7}
    />
  </div>
);

export const FailedRunWithRetry = () => (
  <div style={{ maxWidth: 480 }}>
    <WorkflowRunCard
      name="Centurion rating refresh"
      trigger="Manual · Dana Whitfield"
      state="failed"
      steps={6}
      completedSteps={3}
      failedStep={3}
      duration="9s"
      recordsProcessed={52}
      action={
        <Button variant="secondary" size="sm">
          Retry from step 4
        </Button>
      }
    />
  </div>
);

export const QueuedBehindSchedule = () => (
  <div style={{ maxWidth: 480 }}>
    <WorkflowRunCard
      name="CDK deal jacket import"
      trigger="Schedule · every 15 min"
      state="queued"
      steps={4}
      completedSteps={0}
      action={
        <Button variant="ghost" size="sm">
          Run now
        </Button>
      }
    />
  </div>
);

export const AutomationActivityFeed = () => (
  <div style={{ maxWidth: 560 }}>
    <Card
      title="Automation activity"
      subtitle="Beacon Auto Group · last 30 minutes"
      action={<IconButton icon={<Icon name="more-horizontal" />} label="Feed options" size="sm" />}
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <WorkflowRunCard
          name="Abandoned quote follow-up"
          trigger="Webhook · dealer.quote.abandoned"
          state="running"
          steps={5}
          completedSteps={3}
          duration="42s"
          recordsProcessed={18}
        />
        <WorkflowRunCard
          name="F&I product eligibility check"
          trigger="Webhook · dms.deal.created"
          state="succeeded"
          steps={3}
          completedSteps={3}
          duration="6s"
          recordsProcessed={4}
        />
        <WorkflowRunCard
          name="Lakeshore member lead enrichment"
          trigger="Schedule · 06:00 daily"
          state="failed"
          steps={4}
          completedSteps={1}
          failedStep={1}
          duration="22s"
          recordsProcessed={63}
        />
      </div>
    </Card>
  </div>
);
