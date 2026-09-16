import * as React from 'react';
import { cx } from '../utils/cx';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Icon } from './Icon';

export type CallDirection = 'inbound' | 'outbound';
export type CallOutcome = 'resolved' | 'escalated' | 'voicemail' | 'scheduled';

export interface CallSummaryCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Who was on the call. */
  contact: string;
  /** Phone number or channel, pre-formatted. */
  phone?: string;
  direction?: CallDirection;
  /** Call length, pre-formatted: "4:12". */
  duration?: string;
  /** When it happened: "Today 2:14pm". */
  timestamp?: string;
  /** The agent's summary of the call — two or three sentences at most. */
  summary: React.ReactNode;
  /** How it ended. Drives the outcome chip. */
  outcome?: CallOutcome;
  /** Detected topics — "coverage question", "claim status", "payment". */
  topics?: string[];
  /** Whether Kōvara Voice handled it or a person did. */
  handledBy?: 'agent' | 'human';
  /** Trailing actions — play recording, open transcript. */
  actions?: React.ReactNode;
}

const OUTCOME: Record<CallOutcome, { label: string; tone: 'success' | 'warning' | 'neutral' | 'accent' }> = {
  resolved: { label: 'Resolved', tone: 'success' },
  escalated: { label: 'Escalated', tone: 'warning' },
  voicemail: { label: 'Voicemail', tone: 'neutral' },
  scheduled: { label: 'Callback scheduled', tone: 'accent' },
};

/**
 * The record of one AI voice interaction: who called, what they wanted, how it ended.
 * This is the review surface for AI voice customer service — the summary is the agent's
 * own, so keep `handledBy` accurate; supervisors triage on it.
 *
 * @example
 * <CallSummaryCard contact="Marcus Reyes" phone="(614) 555-0142" direction="inbound"
 *   duration="4:12" timestamp="Today 2:14pm" outcome="resolved" handledBy="agent"
 *   topics={['claim status', 'deductible']}
 *   summary="Caller asked where his transmission claim stood. Confirmed the estimate was approved and a $100 deductible applies." />
 */
export const CallSummaryCard = React.forwardRef<HTMLDivElement, CallSummaryCardProps>(function CallSummaryCard(
  { contact, phone, direction = 'inbound', duration, timestamp, summary, outcome = 'resolved', topics, handledBy = 'agent', actions, className, ...rest },
  ref
) {
  const bars = [8, 14, 20, 11, 17, 23, 13, 9, 16, 21, 12, 7, 15, 19, 10];
  return (
    <div ref={ref} className={cx('kv-call', className)} {...rest}>
      <div className="kv-call__head">
        <Avatar name={contact} size="sm" tone={handledBy === 'agent' ? 'accent' : 'brand'} />
        <div className="kv-call__who">
          <span className="kv-call__name">{contact}</span>
          <span className="kv-call__line">
            <Icon name="phone" size={12} />
            {direction === 'inbound' ? 'Inbound' : 'Outbound'}
            {phone ? ` · ${phone}` : ''}
            {duration ? (
              <>
                {' · '}
                <span className="kv-call__duration">{duration}</span>
              </>
            ) : null}
            {timestamp ? ` · ${timestamp}` : ''}
          </span>
        </div>
        <Badge tone={OUTCOME[outcome].tone} pill>
          {OUTCOME[outcome].label}
        </Badge>
      </div>
      <div className="kv-call__wave" aria-hidden="true">
        {bars.map((h, i) => (
          <span key={i} className="kv-call__bar" style={{ height: h }} />
        ))}
      </div>
      <p className="kv-call__summary">{summary}</p>
      <div className="kv-call__tags">
        <Badge tone={handledBy === 'agent' ? 'accent' : 'neutral'} icon={handledBy === 'agent' ? <Icon name="sparkles" size={12} /> : <Icon name="user" size={12} />}>
          {handledBy === 'agent' ? 'Kōvara Voice' : 'Handled by agent'}
        </Badge>
        {topics?.map((t) => (
          <Badge key={t} tone="neutral" pill>
            {t}
          </Badge>
        ))}
        {actions}
      </div>
    </div>
  );
});
