import * as React from 'react';
import { cx } from '../utils/cx';

export interface TabItem {
  /** Stable id passed back by `onValueChange`. */
  id: string;
  label: React.ReactNode;
  /** Count chip after the label — "Open 12". */
  count?: number | string;
  disabled?: boolean;
}

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: TabItem[];
  /** Controlled selection. */
  value?: string;
  /** Initial selection when uncontrolled. Defaults to the first item. */
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  /** `underline` for page-level sections, `pills` for filtering a single list. */
  variant?: 'underline' | 'pills';
  /** Panel content for the active tab. */
  children?: React.ReactNode;
}

/**
 * Switches between views of the same subject — a policy's Coverage / Documents /
 * Activity, or a list's Open / Bound / Expiring filters. Tab labels are nouns.
 *
 * @example
 * <Tabs items={[{ id: 'open', label: 'Open', count: 12 }, { id: 'bound', label: 'Bound' }]}>
 *   <DataTable columns={columns} rows={rows} />
 * </Tabs>
 */
export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { items, value, defaultValue, onValueChange, variant = 'underline', className, children, ...rest },
  ref
) {
  const [internal, setInternal] = React.useState(defaultValue ?? items[0]?.id);
  const active = value ?? internal;
  const select = (id: string) => {
    if (value === undefined) setInternal(id);
    onValueChange?.(id);
  };
  return (
    <div ref={ref} className={cx('kv-tabs', variant === 'pills' && 'kv-tabs--pills', className)} {...rest}>
      <div className="kv-tabs__list" role="tablist">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === active}
            disabled={item.disabled}
            onClick={() => select(item.id)}
            className={cx('kv-tabs__tab', item.id === active && 'kv-tabs__tab--active')}
          >
            {item.label}
            {item.count !== undefined ? <span className="kv-tabs__count">{item.count}</span> : null}
          </button>
        ))}
      </div>
      {children ? (
        <div className="kv-tabs__panel" role="tabpanel">
          {children}
        </div>
      ) : null}
    </div>
  );
});
