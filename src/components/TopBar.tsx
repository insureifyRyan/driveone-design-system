import * as React from 'react';
import { cx } from '../utils/cx';

export interface TopBarProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** Page or workspace name at the left. */
  title?: React.ReactNode;
  /** Left slot before the title — a collapse toggle, a workspace switcher. */
  start?: React.ReactNode;
  /** Center slot — usually a `SearchInput`. */
  center?: React.ReactNode;
  /** Right slot — notifications, the agent status, the user `Avatar`. */
  end?: React.ReactNode;
}

/**
 * The application header above the content column: workspace identity on the left,
 * global search in the middle, account and alerts on the right.
 *
 * @example
 * <TopBar title="Quotes" center={<SearchInput placeholder="Search…" shortcut="⌘K" />} end={<Avatar name="Dana Whitfield" size="sm" />} />
 */
export const TopBar = React.forwardRef<HTMLElement, TopBarProps>(function TopBar(
  { title, start, center, end, className, ...rest },
  ref
) {
  return (
    <header ref={ref} className={cx('kv-topbar', className)} {...rest}>
      <div className="kv-topbar__start">
        {start}
        {title ? <span className="kv-topbar__title">{title}</span> : null}
      </div>
      {center ? <div className="kv-topbar__center">{center}</div> : null}
      <div className="kv-topbar__end">{end}</div>
    </header>
  );
});
