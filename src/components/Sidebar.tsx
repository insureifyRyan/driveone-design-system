import * as React from 'react';
import { cx } from '../utils/cx';

export interface SidebarItem {
  /** Nav label. */
  label: string;
  /** Leading glyph — pass an `<Icon size={18} />`. */
  icon?: React.ReactNode;
  /** Destination. Renders an anchor when set, a button otherwise. */
  href?: string;
  /** Marks the current section. Exactly one item should be active. */
  active?: boolean;
  /** Count chip at the right edge — open claims, queued approvals. */
  badge?: string | number;
  onClick?: () => void;
}

export interface SidebarSection {
  /** Small caps heading above the group — "Operations", "Distribution", "Admin". */
  label?: string;
  items: SidebarItem[];
}

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  sections: SidebarSection[];
  /** Brand slot at the top — pass `<Logo size="sm" onBrand />` on the indigo tone. */
  brand?: React.ReactNode;
  /** Bottom slot — the account switcher, the signed-in user, a support link. */
  footer?: React.ReactNode;
  /** `indigo` (default) is the product's primary chrome; `light` suits embedded/partner UIs. */
  tone?: 'indigo' | 'light';
  /** Icon-only rail. Labels stay in the DOM for assistive tech. */
  collapsed?: boolean;
}

/**
 * The primary application rail. Kōvara's default chrome is the deep indigo tone, which
 * is what makes an app screen read as Kōvara at a glance — keep it unless you are
 * building an embedded or white-label surface.
 *
 * @example
 * <Sidebar
 *   brand={<Logo size="sm" onBrand />}
 *   sections={[{ label: 'Operations', items: [{ label: 'Quotes', icon: <Icon name="file-text" size={18} />, active: true, badge: 12 }] }]}
 * />
 */
export const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  { sections, brand, footer, tone = 'indigo', collapsed = false, className, ...rest },
  ref
) {
  return (
    <nav
      ref={ref}
      aria-label="Main"
      className={cx('kv-sidebar', tone === 'light' && 'kv-sidebar--light', collapsed && 'kv-sidebar--collapsed', className)}
      {...rest}
    >
      {brand ? <div className="kv-sidebar__brand">{brand}</div> : null}
      <div className="kv-sidebar__nav">
        {sections.map((section, si) => (
          <React.Fragment key={section.label ?? si}>
            {section.label && !collapsed ? <div className="kv-sidebar__section">{section.label}</div> : null}
            {section.items.map((item) => {
              const content = (
                <>
                  {item.icon ? <span className="kv-sidebar__icon">{item.icon}</span> : null}
                  <span className={cx('kv-sidebar__label', collapsed && 'kv-sr-only')}>{item.label}</span>
                  {item.badge !== undefined && !collapsed ? <span className="kv-sidebar__badge">{item.badge}</span> : null}
                </>
              );
              const classes = cx('kv-sidebar__item', item.active && 'kv-sidebar__item--active');
              return item.href ? (
                <a key={item.label} href={item.href} className={classes} aria-current={item.active ? 'page' : undefined}>
                  {content}
                </a>
              ) : (
                <button key={item.label} type="button" onClick={item.onClick} className={classes} aria-current={item.active ? 'page' : undefined}>
                  {content}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      {footer ? <div className="kv-sidebar__footer">{footer}</div> : null}
    </nav>
  );
});
