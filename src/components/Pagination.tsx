import * as React from 'react';
import { cx } from '../utils/cx';
import { Icon } from './Icon';

export interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current page, 1-based. */
  page: number;
  /** Total number of pages. */
  pageCount: number;
  /** Total row count, for the "Showing … of N" summary. */
  totalItems?: number;
  /** Rows per page, for the summary. */
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

const pagesToShow = (page: number, count: number): Array<number | 'gap'> => {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const out: Array<number | 'gap'> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(count - 1, page + 1);
  if (start > 2) out.push('gap');
  for (let p = start; p <= end; p += 1) out.push(p);
  if (end < count - 1) out.push('gap');
  out.push(count);
  return out;
};

/**
 * Page control under a `DataTable`. Carrier-backed lists are paged server-side, so this
 * is presentational — it reports the requested page and nothing else.
 *
 * @example
 * <Pagination page={3} pageCount={18} totalItems={348} pageSize={20} />
 */
export const Pagination = React.forwardRef<HTMLDivElement, PaginationProps>(function Pagination(
  { page, pageCount, totalItems, pageSize = 20, onPageChange, className, ...rest },
  ref
) {
  const first = (page - 1) * pageSize + 1;
  const last = totalItems ? Math.min(page * pageSize, totalItems) : page * pageSize;
  return (
    <div ref={ref} className={cx('kv-pagination', className)} {...rest}>
      {totalItems !== undefined ? (
        <span className="kv-pagination__summary">
          Showing <strong>{first}</strong>–<strong>{last}</strong> of <strong>{totalItems}</strong>
        </span>
      ) : (
        <span className="kv-pagination__summary">
          Page <strong>{page}</strong> of <strong>{pageCount}</strong>
        </span>
      )}
      <div className="kv-pagination__pages">
        <button
          type="button"
          className="kv-pagination__page"
          disabled={page <= 1}
          aria-label="Previous page"
          onClick={() => onPageChange?.(page - 1)}
        >
          <Icon name="chevron-left" size={16} />
        </button>
        {pagesToShow(page, pageCount).map((p, i) =>
          p === 'gap' ? (
            <span key={`gap-${i}`} className="kv-pagination__ellipsis">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={cx('kv-pagination__page', p === page && 'kv-pagination__page--active')}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onPageChange?.(p)}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          className="kv-pagination__page"
          disabled={page >= pageCount}
          aria-label="Next page"
          onClick={() => onPageChange?.(page + 1)}
        >
          <Icon name="chevron-right" size={16} />
        </button>
      </div>
    </div>
  );
});
