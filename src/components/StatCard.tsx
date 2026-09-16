import * as React from 'react';
import { cx } from '../utils/cx';
import { Icon } from './Icon';

export type StatTrend = 'up' | 'down' | 'flat';

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** What is being measured — "Quotes issued", "Attach rate", "Calls handled". */
  label: string;
  /** The headline number, pre-formatted: "1,284", "$48.2k", "31%". */
  value: React.ReactNode;
  /** Change versus the comparison window, pre-formatted: "+12.4%". */
  delta?: string;
  /** Which way the delta points. `up` is green, `down` red, `flat` grey. */
  trend?: StatTrend;
  /** Names the comparison window — "vs. last 30 days". */
  caption?: React.ReactNode;
  /** Icon in the top-right tile. Pass an `<Icon />`. */
  icon?: React.ReactNode;
}

/**
 * A single KPI on a dashboard — the row of tiles above the fold. Pre-format `value`
 * and `delta` at the call site; the component never does math or locale formatting.
 *
 * For a metric where down is good (handle time, manual touches), pass `trend="down"`
 * only when the direction really is bad — the color is the judgement, not the arrow.
 *
 * @example
 * <StatCard label="Quotes issued" value="1,284" delta="+18.2%" trend="up" caption="vs. last 30 days" icon={<Icon name="file-text" size={18} />} />
 */
export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(function StatCard(
  { label, value, delta, trend = 'flat', caption, icon, className, ...rest },
  ref
) {
  return (
    <div ref={ref} className={cx('kv-stat', className)} {...rest}>
      <div className="kv-stat__head">
        <span className="kv-stat__label">{label}</span>
        {icon ? <span className="kv-stat__icon">{icon}</span> : null}
      </div>
      <span className="kv-stat__value">{value}</span>
      {delta || caption ? (
        <div className="kv-stat__foot">
          {delta ? (
            <span className={cx('kv-stat__delta', `kv-stat__delta--${trend}`)}>
              <Icon name={trend === 'down' ? 'trending-down' : trend === 'up' ? 'trending-up' : 'minus'} size={14} />
              {delta}
            </span>
          ) : null}
          {caption ? <span className="kv-stat__caption">{caption}</span> : null}
        </div>
      ) : null}
    </div>
  );
});
