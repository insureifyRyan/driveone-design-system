import * as React from 'react';
import { cx } from '../utils/cx';
import { Icon } from './Icon';

export type TimelineState = 'done' | 'active' | 'pending' | 'blocked';

export interface TimelineEvent {
  /** What happened — "FNOL received", "Estimate reviewed", "Payment issued". */
  title: string;
  /** Detail line: what was decided, what is waiting. */
  description?: React.ReactNode;
  /** When — pre-formatted: "Today 9:41am", "Mar 12". */
  timestamp?: string;
  /** Who or what did it. Prefix agent actions with "Kōvara" so automation is legible. */
  actor?: string;
  state?: TimelineState;
}

export interface ClaimTimelineProps extends React.HTMLAttributes<HTMLOListElement> {
  events: TimelineEvent[];
}

/**
 * The chronological record of a claim, application or onboarding case — what happened,
 * when, and whether a person or the agent did it. Always name the actor: the audit trail
 * is the product in AI-assisted claims.
 *
 * @example
 * <ClaimTimeline events={[
 *   { title: 'FNOL received', timestamp: 'Mar 12, 8:02am', actor: 'Kōvara Voice', state: 'done' },
 *   { title: 'Coverage verified', timestamp: 'Mar 12, 8:03am', actor: 'Kōvara', state: 'done' },
 *   { title: 'Adjuster review', description: 'Assigned to Dana Whitfield', state: 'active' },
 * ]} />
 */
export const ClaimTimeline = React.forwardRef<HTMLOListElement, ClaimTimelineProps>(function ClaimTimeline(
  { events, className, ...rest },
  ref
) {
  return (
    <ol ref={ref} className={cx('kv-timeline', className)} {...rest}>
      {events.map((event, i) => {
        const state = event.state ?? 'pending';
        const last = i === events.length - 1;
        return (
          <li className="kv-timeline__item" key={`${event.title}-${i}`}>
            <div className="kv-timeline__rail">
              <span className={cx('kv-timeline__node', `kv-timeline__node--${state}`)}>
                <Icon
                  name={state === 'done' ? 'check' : state === 'blocked' ? 'x' : state === 'active' ? 'clock' : 'minus'}
                  size={14}
                  strokeWidth={2.25}
                />
              </span>
              {!last ? <span className="kv-timeline__line" /> : null}
            </div>
            <div className="kv-timeline__content">
              <div className="kv-timeline__head">
                <span className="kv-timeline__title">{event.title}</span>
                {event.timestamp ? <span className="kv-timeline__time">{event.timestamp}</span> : null}
              </div>
              {event.description ? <span className="kv-timeline__body">{event.description}</span> : null}
              {event.actor ? (
                <span className="kv-timeline__actor">
                  <Icon name={event.actor.toLowerCase().includes('kōvara') ? 'sparkles' : 'user'} size={12} />
                  {event.actor}
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
});
