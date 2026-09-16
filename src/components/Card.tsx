import * as React from 'react';
import { cx } from '../utils/cx';

export type CardVariant = 'default' | 'flat' | 'raised' | 'accent';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Card heading. Omit for a bare container. */
  title?: React.ReactNode;
  /** One line under the title — a count, a timestamp, a scope. */
  subtitle?: React.ReactNode;
  /** Top-right slot: an `IconButton`, a `Button`, a filter `Select`. */
  action?: React.ReactNode;
  /** Bottom bar, right-aligned — put the card's actions here. */
  footer?: React.ReactNode;
  variant?: CardVariant;
  /** Body padding. `none` when the body is a `DataTable` or a full-bleed chart. */
  padding?: 'default' | 'compact' | 'none';
  /** Add hover affordance — use when the whole card navigates somewhere. */
  interactive?: boolean;
}

/**
 * The standard content container: every dashboard panel, detail section and form block
 * sits in one. `variant="accent"` adds the cyan top rule — reserve it for panels the
 * agent owns (AI recommendations, automated activity).
 *
 * @example
 * <Card title="Open quotes" subtitle="Updated 4 minutes ago" action={<IconButton icon={<Icon name="more-horizontal" />} label="Options" />}>
 *   <DataTable columns={columns} rows={rows} />
 * </Card>
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { title, subtitle, action, footer, variant = 'default', padding = 'default', interactive = false, className, children, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={cx(
        'kv-card',
        variant !== 'default' && `kv-card--${variant}`,
        interactive && 'kv-card--interactive',
        className
      )}
      {...rest}
    >
      {title || action ? (
        <div className="kv-card__header">
          <div className="kv-card__titles">
            {title ? <h3 className="kv-card__title">{title}</h3> : null}
            {subtitle ? <span className="kv-card__subtitle">{subtitle}</span> : null}
          </div>
          {action ? <div className="kv-card__action">{action}</div> : null}
        </div>
      ) : null}
      <div className={cx('kv-card__body', padding !== 'default' && `kv-card__body--${padding}`)}>{children}</div>
      {footer ? <div className="kv-card__footer">{footer}</div> : null}
    </div>
  );
});
