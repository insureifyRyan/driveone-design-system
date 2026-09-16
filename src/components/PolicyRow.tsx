import * as React from 'react';
import { cx } from '../utils/cx';
import { StatusPill, type StatusValue } from './StatusPill';
import { Avatar } from './Avatar';

export interface PolicyRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Insured, member or customer name. */
  holder: string;
  /** Contract identifier — rendered in the mono face. */
  policyNumber: string;
  /** What is covered — "2021 Ford F-150 · 62,400 mi", "Commercial GL". */
  subject?: string;
  /** Premium or payment, pre-formatted: "$118.40". */
  premium?: string;
  /** What the premium is per — "monthly", "per term". */
  cadence?: string;
  /** Lifecycle state. */
  status: StatusValue;
  /** Override the status label — "Expires in 6 days". */
  statusLabel?: string;
  /** Assigned producer or adjuster — shows as an avatar at the right. */
  owner?: string;
  /** Trailing slot — an overflow `Menu` or a chevron. */
  action?: React.ReactNode;
  /** Adds hover affordance; pair with `onClick`. */
  interactive?: boolean;
}

/**
 * A single contract in a list, denser than a card and richer than a table row. Use it
 * for policy, contract and account lists where the holder and status matter more than
 * column-by-column comparison; use `DataTable` when the columns are what is being scanned.
 *
 * @example
 * <PolicyRow holder="Marcus Reyes" policyNumber="KV-4471-0098" subject="2021 Ford F-150 · 62,400 mi"
 *   premium="$118.40" cadence="monthly" status="active" owner="Dana Whitfield" />
 */
export const PolicyRow = React.forwardRef<HTMLDivElement, PolicyRowProps>(function PolicyRow(
  { holder, policyNumber, subject, premium, cadence, status, statusLabel, owner, action, interactive = false, className, ...rest },
  ref
) {
  return (
    <div ref={ref} className={cx('kv-policy-row', interactive && 'kv-policy-row--interactive', className)} {...rest}>
      <div className="kv-policy-row__main">
        <span className="kv-policy-row__holder">{holder}</span>
        <span className="kv-policy-row__sub">
          <span className="kv-policy-row__number">{policyNumber}</span>
          {subject ? (
            <>
              <span className="kv-policy-row__dot" aria-hidden="true" />
              <span>{subject}</span>
            </>
          ) : null}
        </span>
      </div>
      {premium ? (
        <div className="kv-policy-row__premium">
          <div className="kv-policy-row__amount">{premium}</div>
          {cadence ? <div className="kv-policy-row__cadence">{cadence}</div> : null}
        </div>
      ) : null}
      <div className="kv-policy-row__end">
        <StatusPill status={status} label={statusLabel} />
        {owner ? <Avatar name={owner} size="xs" /> : null}
        {action}
      </div>
    </div>
  );
});
