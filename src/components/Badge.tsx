import * as React from 'react';
import { cx } from '../utils/cx';

export type BadgeTone = 'neutral' | 'brand' | 'accent' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Color meaning. `accent` (cyan) marks anything the agent produced. */
  tone?: BadgeTone;
  /** Filled instead of tinted — for badges on dark chrome or that must win attention. */
  solid?: boolean;
  /** Fully rounded. Use for counts and labels; keep squared for classifications. */
  pill?: boolean;
  /** Small leading glyph. */
  icon?: React.ReactNode;
}

/**
 * A small classification label — coverage type, lead source, "AI drafted", counts.
 * For the lifecycle state of a quote, policy or claim, use `StatusPill` instead:
 * it carries the shared state vocabulary.
 *
 * @example
 * <Badge tone="accent" icon={<Icon name="sparkles" size={12} />}>AI drafted</Badge>
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { tone = 'neutral', solid = false, pill = false, icon, className, children, ...rest },
  ref
) {
  return (
    <span
      ref={ref}
      className={cx('kv-badge', `kv-badge--${tone}`, solid && 'kv-badge--solid', pill && 'kv-badge--pill', className)}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
});
