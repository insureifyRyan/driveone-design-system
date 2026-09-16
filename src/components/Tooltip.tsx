import * as React from 'react';
import { cx } from '../utils/cx';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'content'> {
  /** Tip text. One short sentence — never the only place information exists. */
  content: React.ReactNode;
  placement?: TooltipPlacement;
  /** Render it open. Use for previews and for tips pinned during a walkthrough. */
  open?: boolean;
  /** The trigger — a button, an icon, a truncated value. */
  children: React.ReactNode;
}

/**
 * Hover/focus explanation for a control whose label had to stay short — a metric
 * definition, a truncated carrier name, an icon-only action.
 *
 * @example
 * <Tooltip content="Share of eligible deals with a service contract attached">
 *   <IconButton icon={<Icon name="info" />} label="About attach rate" size="sm" />
 * </Tooltip>
 */
export const Tooltip = React.forwardRef<HTMLSpanElement, TooltipProps>(function Tooltip(
  { content, placement = 'top', open, children, className, ...rest },
  ref
) {
  const [hovered, setHovered] = React.useState(false);
  const visible = open ?? hovered;
  return (
    <span
      ref={ref}
      className={cx('kv-tooltip-root', className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      {...rest}
    >
      {children}
      {visible ? (
        <span role="tooltip" className={cx('kv-tooltip', `kv-tooltip--${placement}`)}>
          {content}
        </span>
      ) : null}
    </span>
  );
});
