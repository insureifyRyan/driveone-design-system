import * as React from 'react';
import { cx } from '../utils/cx';

export type DeliveryState = 'ok' | 'retry' | 'failed';

export interface WebhookEventRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Event type in the platform's own vocabulary — `policy.bound`, `claim.updated`. */
  event: string;
  /** Destination URL or subscriber name. */
  target?: string;
  /** HTTP status of the delivery attempt. */
  status: number;
  state?: DeliveryState;
  /** Round-trip time, pre-formatted: "184ms". */
  latency?: string;
  /** When it fired: "2:14:08pm". */
  timestamp?: string;
  /** Attempt number, shown when greater than 1. */
  attempt?: number;
}

/**
 * One webhook delivery attempt. Integrators debug against this row, so it carries the
 * four things they actually need — event type, destination, HTTP status and latency —
 * and nothing else.
 *
 * Stack rows inside a `Card padding="none"` to build the deliveries log.
 *
 * @example
 * <WebhookEventRow event="policy.bound" target="https://beacon-auto.example.com/hooks/kovara" status={200} state="ok" latency="184ms" timestamp="2:14:08pm" />
 * @example
 * <WebhookEventRow event="claim.updated" target="https://lakeshore-cu.example.com/kovara" status={503} state="retry" latency="30.0s" attempt={3} />
 */
export const WebhookEventRow = React.forwardRef<HTMLDivElement, WebhookEventRowProps>(function WebhookEventRow(
  { event, target, status, state = 'ok', latency, timestamp, attempt, className, ...rest },
  ref
) {
  return (
    <div ref={ref} className={cx('kv-event', className)} {...rest}>
      <span className={cx('kv-event__status', `kv-event__status--${state}`)}>{status}</span>
      <div className="kv-event__main">
        <span className="kv-event__name">{event}</span>
        {target ? <span className="kv-event__target">{target}</span> : null}
      </div>
      <div className="kv-event__meta">
        {attempt && attempt > 1 ? <span>attempt {attempt}</span> : null}
        {latency ? <span className="kv-event__latency">{latency}</span> : null}
        {timestamp ? <span>{timestamp}</span> : null}
      </div>
    </div>
  );
});
