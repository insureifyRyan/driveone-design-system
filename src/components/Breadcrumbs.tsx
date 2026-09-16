import * as React from 'react';
import { cx } from '../utils/cx';

export interface BreadcrumbItem {
  label: string;
  /** Omit on the last item — the current page is not a link. */
  href?: string;
}

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  /** Character between crumbs. */
  separator?: string;
}

/**
 * Shows where a detail page sits — Policies › KV-4471-0098 › Claim #2210. Use it on
 * any screen reached by drilling in; skip it on top-level dashboards.
 *
 * @example
 * <Breadcrumbs items={[{ label: 'Policies', href: '/policies' }, { label: 'KV-4471-0098' }]} />
 */
export const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(function Breadcrumbs(
  { items, separator = '/', className, ...rest },
  ref
) {
  return (
    <nav ref={ref} aria-label="Breadcrumb" className={cx('kv-breadcrumbs', className)} {...rest}>
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={item.label}>
            {item.href && !last ? (
              <a href={item.href} className="kv-breadcrumbs__item">
                {item.label}
              </a>
            ) : (
              <span className={cx('kv-breadcrumbs__item', last && 'kv-breadcrumbs__item--current')} aria-current={last ? 'page' : undefined}>
                {item.label}
              </span>
            )}
            {!last ? (
              <span className="kv-breadcrumbs__sep" aria-hidden="true">
                {separator}
              </span>
            ) : null}
          </React.Fragment>
        );
      })}
    </nav>
  );
});
