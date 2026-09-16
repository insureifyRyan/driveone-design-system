import * as React from 'react';
import { cx } from '../utils/cx';

/** The shared lifecycle vocabulary across quotes, policies, claims and workflow runs. */
export type StatusValue =
  | 'draft'
  | 'quoted'
  | 'in-review'
  | 'pending'
  | 'bound'
  | 'active'
  | 'expiring'
  | 'lapsed'
  | 'declined';

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Lifecycle state. Drives both the color and the default label. */
  status: StatusValue;
  /** Override the label text while keeping the status color — e.g. "Bound 4/12". */
  label?: string;
}

const LABELS: Record<StatusValue, string> = {
  draft: 'Draft',
  quoted: 'Quoted',
  'in-review': 'In review',
  pending: 'Pending',
  bound: 'Bound',
  active: 'Active',
  expiring: 'Expiring',
  lapsed: 'Lapsed',
  declined: 'Declined',
};

/**
 * The single source of truth for lifecycle state across the product. Always use it for
 * quote, policy, claim and run status so green always means in-force and amber always
 * means time-sensitive — never re-color a `Badge` to fake a status.
 *
 * @example
 * <StatusPill status="bound" />
 * @example
 * <StatusPill status="expiring" label="Expires in 6 days" />
 */
export const StatusPill = React.forwardRef<HTMLSpanElement, StatusPillProps>(function StatusPill(
  { status, label, className, ...rest },
  ref
) {
  return (
    <span ref={ref} className={cx('kv-status', `kv-status--${status}`, className)} {...rest}>
      <span className="kv-status__dot" aria-hidden="true" />
      {label ?? LABELS[status]}
    </span>
  );
});
