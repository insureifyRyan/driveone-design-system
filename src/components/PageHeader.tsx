import * as React from 'react';
import { cx } from '../utils/cx';

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The page's name. */
  title: React.ReactNode;
  /** One line on what the page is for or what state it is in. */
  description?: React.ReactNode;
  /** A `Breadcrumbs` above the title. */
  breadcrumbs?: React.ReactNode;
  /** Status chip beside the title — a `StatusPill` or `Badge`. */
  meta?: React.ReactNode;
  /** Page-level actions, primary last. */
  actions?: React.ReactNode;
  /** Row under the header — usually `Tabs`. */
  children?: React.ReactNode;
}

/**
 * The top of every content page: breadcrumbs, title, status, and the page's actions.
 * Keeps heading size and action alignment identical across the product.
 *
 * @example
 * <PageHeader
 *   breadcrumbs={<Breadcrumbs items={[{ label: 'Policies', href: '#' }, { label: 'KV-4471-0098' }]} />}
 *   title="KV-4471-0098"
 *   meta={<StatusPill status="active" />}
 *   actions={<Button>Endorse policy</Button>}
 * />
 */
export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(function PageHeader(
  { title, description, breadcrumbs, meta, actions, className, children, ...rest },
  ref
) {
  return (
    <div ref={ref} className={cx('kv-page-header', className)} {...rest}>
      {breadcrumbs}
      <div className="kv-page-header__row">
        <div className="kv-page-header__titles">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 className="kv-page-header__title">{title}</h1>
            {meta}
          </div>
          {description ? <p className="kv-page-header__description">{description}</p> : null}
        </div>
        {actions ? <div className="kv-page-header__actions">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
});
