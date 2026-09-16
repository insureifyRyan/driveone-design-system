import * as React from 'react';
import { cx } from '../utils/cx';

export type ProgressTone = 'brand' | 'accent' | 'success' | 'warning' | 'danger';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current value. */
  value: number;
  /** Maximum. Defaults to 100. */
  max?: number;
  /** Label above the track — "Attach rate", "Documents received". */
  label?: React.ReactNode;
  /** Value text at the right of the label row — pass "62%" or "18 of 24". */
  valueText?: React.ReactNode;
  tone?: ProgressTone;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * A determinate bar for a ratio or a completion — attach rate against goal, documents
 * received, onboarding completeness. For unknown-duration work use `Spinner`.
 *
 * @example
 * <Progress label="Warranty attach rate" value={31} valueText="31% of 40% goal" tone="accent" />
 */
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { value, max = 100, label, valueText, tone = 'brand', size = 'md', className, ...rest },
  ref
) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div ref={ref} className={cx('kv-progress', size !== 'md' && `kv-progress--${size}`, className)} {...rest}>
      {label || valueText ? (
        <div className="kv-progress__head">
          {label ? <span className="kv-progress__label">{label}</span> : <span />}
          {valueText ? <span className="kv-progress__value">{valueText}</span> : null}
        </div>
      ) : null}
      <div
        className="kv-progress__track"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={typeof label === 'string' ? label : undefined}
      >
        <div className={cx('kv-progress__bar', tone !== 'brand' && `kv-progress__bar--${tone}`)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
});
