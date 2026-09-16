import * as React from 'react';
import { cx } from '../utils/cx';

export interface MenuItem {
  /** Row label. */
  label: string;
  /** Leading glyph. */
  icon?: React.ReactNode;
  /** Keyboard hint at the right edge, e.g. "⌘E". */
  shortcut?: string;
  /** Red treatment for destructive rows. */
  danger?: boolean;
  disabled?: boolean;
  /** Renders an anchor instead of a button. */
  href?: string;
  onSelect?: () => void;
}

export interface MenuGroup {
  /** Small caps heading above the rows. */
  label?: string;
  items: MenuItem[];
}

export interface MenuProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Rows, optionally grouped with dividers between groups. */
  groups: MenuGroup[];
  /** The control that opens the menu — usually an `IconButton` or a `Button`. */
  trigger?: React.ReactNode;
  /** Render open. Controlled when set; the component manages its own state otherwise. */
  open?: boolean;
  defaultOpen?: boolean;
  /** Which edge the panel aligns to. */
  align?: 'start' | 'end';
}

/**
 * The overflow / actions menu behind a `…` button — row actions on a policy, export
 * options, account switching. Destructive rows go last, in their own group, with `danger`.
 *
 * @example
 * <Menu
 *   trigger={<IconButton icon={<Icon name="more-horizontal" />} label="Policy actions" />}
 *   groups={[{ items: [{ label: 'View documents', icon: <Icon name="file-text" size={16} /> }] },
 *            { items: [{ label: 'Cancel policy', danger: true }] }]}
 * />
 */
export const Menu = React.forwardRef<HTMLDivElement, MenuProps>(function Menu(
  { groups, trigger, open, defaultOpen = false, align = 'start', className, ...rest },
  ref
) {
  const [internal, setInternal] = React.useState(defaultOpen);
  const isOpen = open ?? internal;

  const panel = (
    <div className={cx('kv-menu', className)} role="menu" {...rest}>
      {groups.map((group, gi) => (
        <React.Fragment key={group.label ?? gi}>
          {gi > 0 ? <hr className="kv-menu__divider" /> : null}
          {group.label ? <div className="kv-menu__label">{group.label}</div> : null}
          {group.items.map((item) =>
            item.href ? (
              <a key={item.label} href={item.href} role="menuitem" className={cx('kv-menu__item', item.danger && 'kv-menu__item--danger')}>
                {item.icon}
                {item.label}
                {item.shortcut ? <span className="kv-menu__shortcut">{item.shortcut}</span> : null}
              </a>
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={item.onSelect}
                className={cx('kv-menu__item', item.danger && 'kv-menu__item--danger')}
              >
                {item.icon}
                {item.label}
                {item.shortcut ? <span className="kv-menu__shortcut">{item.shortcut}</span> : null}
              </button>
            )
          )}
        </React.Fragment>
      ))}
    </div>
  );

  if (!trigger) return <div ref={ref}>{panel}</div>;

  return (
    <div ref={ref} className="kv-menu-root">
      <span onClick={() => (open === undefined ? setInternal((v) => !v) : undefined)}>{trigger}</span>
      {isOpen ? <div className={cx('kv-menu-root__panel', `kv-menu-root__panel--${align}`)}>{panel}</div> : null}
    </div>
  );
});
