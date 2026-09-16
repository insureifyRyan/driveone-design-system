import * as React from 'react';
import { cx } from '../utils/cx';
import { Badge } from './Badge';
import { Icon } from './Icon';

export type RunState = 'queued' | 'running' | 'succeeded' | 'failed';

export interface WorkflowRunCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The automation's name — "Abandoned quote follow-up", "Nightly carrier sync". */
  name: string;
  /** What started this run — "Webhook · dealer.quote.abandoned", "Schedule · 06:00". */
  trigger?: string;
  state?: RunState;
  /** Total steps in the workflow. */
  steps?: number;
  /** How many have finished. Drives the step bar. */
  completedSteps?: number;
  /** Index (0-based) of the step that failed, if any. */
  failedStep?: number;
  /** Elapsed or total duration, pre-formatted: "1m 12s". */
  duration?: string;
  /** Records touched — leads enriched, policies synced. */
  recordsProcessed?: number;
  /** Trailing slot — a `Menu`, a re-run `Button`. */
  action?: React.ReactNode;
}

const STATE_TONE = {
  queued: 'neutral',
  running: 'accent',
  succeeded: 'success',
  failed: 'danger',
} as const;

const STATE_LABEL: Record<RunState, string> = {
  queued: 'Queued',
  running: 'Running',
  succeeded: 'Succeeded',
  failed: 'Failed',
};

/**
 * One execution of an automated workflow — the unit of the AI workflow automation
 * surface. Shows what ran, how far it got, and what it touched, so an operator can
 * tell a slow run from a stuck one without opening logs.
 *
 * @example
 * <WorkflowRunCard name="Abandoned quote follow-up" trigger="Webhook · dealer.quote.abandoned"
 *   state="running" steps={5} completedSteps={3} duration="42s" recordsProcessed={18} />
 */
export const WorkflowRunCard = React.forwardRef<HTMLDivElement, WorkflowRunCardProps>(function WorkflowRunCard(
  { name, trigger, state = 'running', steps = 4, completedSteps = 0, failedStep, duration, recordsProcessed, action, className, ...rest },
  ref
) {
  return (
    <div ref={ref} className={cx('kv-run', `kv-run--${state}`, className)} {...rest}>
      <div className="kv-run__head">
        <div className="kv-run__titles">
          <span className="kv-run__name">{name}</span>
          {trigger ? <span className="kv-run__trigger">{trigger}</span> : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge tone={STATE_TONE[state]} pill icon={state === 'running' ? <Icon name="zap" size={12} /> : undefined}>
            {STATE_LABEL[state]}
          </Badge>
          {action}
        </div>
      </div>
      <div className="kv-run__steps" aria-label={`${completedSteps} of ${steps} steps complete`}>
        {Array.from({ length: steps }, (_, i) => (
          <span
            key={i}
            className={cx(
              'kv-run__step',
              failedStep === i && 'kv-run__step--failed',
              failedStep !== i && i < completedSteps && 'kv-run__step--done',
              failedStep !== i && i === completedSteps && state === 'running' && 'kv-run__step--active'
            )}
          />
        ))}
      </div>
      <div className="kv-run__meta">
        <span className="kv-run__metric">
          <Icon name="check-circle" size={13} />
          <strong>
            {completedSteps}/{steps}
          </strong>{' '}
          steps
        </span>
        {duration ? (
          <span className="kv-run__metric">
            <Icon name="clock" size={13} />
            <strong>{duration}</strong>
          </span>
        ) : null}
        {recordsProcessed !== undefined ? (
          <span className="kv-run__metric">
            <Icon name="grid" size={13} />
            <strong>{recordsProcessed}</strong> records
          </span>
        ) : null}
      </div>
    </div>
  );
});
