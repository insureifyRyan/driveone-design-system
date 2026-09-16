import * as React from 'react';
import { cx } from '../utils/cx';

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** What is not here yet — "No open claims". */
  title: React.ReactNode;
  /** Why it is empty and what fills it. */
  description?: React.ReactNode;
  /** Icon tile above the title. Pass an `<Icon size={22} />`. */
  icon?: React.ReactNode;
  /** The action that resolves the emptiness — usually one primary button. */
  actions?: React.ReactNode;
  /** Drop the dashed frame — use when already inside a `Card` or table body. */
  plain?: boolean;
}

/**
 * The zero state of a list or panel. Always say what will appear here and give the one
 * action that makes it appear — an empty screen with no next step reads as broken.
 *
 * @example
 * <EmptyState icon={<Icon name="file-text" size={22} />} title="No open quotes" description="Quotes your team starts will show up here." actions={<Button>New quote</Button>} />
 */
export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { title, description, icon, actions, plain = false, className, ...rest },
  ref
) {
  return (
    <div ref={ref} className={cx('kv-empty', plain && 'kv-empty--plain', className)} {...rest}>
      {icon ? <span className="kv-empty__icon">{icon}</span> : null}
      <span className="kv-empty__title">{title}</span>
      {description ? <span className="kv-empty__body">{description}</span> : null}
      {actions ? <div className="kv-empty__actions">{actions}</div> : null}
    </div>
  );
});
