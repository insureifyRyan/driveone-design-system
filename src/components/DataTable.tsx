import * as React from 'react';
import { cx } from '../utils/cx';

export interface DataTableColumn<T> {
  /** Unique key. Used as the React key and as the default value accessor. */
  key: string;
  /** Column heading. */
  header: React.ReactNode;
  /** Cell renderer. Without it, the cell renders `row[key]`. */
  render?: (row: T, rowIndex: number) => React.ReactNode;
  /** Right-align and tabular-figure the column — premiums, counts, percentages. */
  numeric?: boolean;
  /** Render cells in the mono face — policy numbers, VINs, claim IDs. */
  mono?: boolean;
  /** Fixed column width, e.g. `120` or `'20%'`. */
  width?: number | string;
}

export interface DataTableProps<T> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  /** Stable row key. Defaults to the row index. */
  getRowId?: (row: T, index: number) => string;
  /** `compact` for dense operational lists; `comfortable` (default) for review screens. */
  density?: 'comfortable' | 'compact';
  /** Zebra striping — helps on wide tables with many numeric columns. */
  striped?: boolean;
  /** Row hover highlight. On by default; turn off for static report tables. */
  hoverable?: boolean;
  /** Footer line under the table — totals, "Showing 20 of 348". */
  caption?: React.ReactNode;
  /** Rendered instead of the body when `rows` is empty. Pass an `EmptyState`. */
  empty?: React.ReactNode;
  /** Makes rows clickable — pair with a detail drawer or a route. */
  onRowClick?: (row: T, index: number) => void;
}

/**
 * The workhorse list view: policies, quotes, claims, workflow runs, dealer accounts.
 * Columns are declared, not hand-written as `<td>`s, so alignment and mono treatment
 * stay consistent everywhere the same data appears.
 *
 * Put it inside a `Card` with `padding="none"` when it needs a title bar.
 *
 * @example
 * <DataTable
 *   columns={[
 *     { key: 'policy', header: 'Policy', mono: true },
 *     { key: 'premium', header: 'Premium', numeric: true },
 *     { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
 *   ]}
 *   rows={rows}
 * />
 */
export function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  getRowId,
  density = 'comfortable',
  striped = false,
  hoverable = true,
  caption,
  empty,
  onRowClick,
  className,
  ...rest
}: DataTableProps<T>) {
  return (
    <div className={cx('kv-table-wrap', className)} {...rest}>
      <div className="kv-table-scroll">
        <table
          className={cx(
            'kv-table',
            density === 'compact' && 'kv-table--compact',
            striped && 'kv-table--striped',
            hoverable && 'kv-table--hover'
          )}
        >
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={cx(col.numeric && 'kv-table__cell--numeric')}
                  scope="col"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && empty ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: 0 }}>
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={getRowId ? getRowId(row, i) : i}
                  onClick={onRowClick ? () => onRowClick(row, i) : undefined}
                  style={onRowClick ? { cursor: 'pointer' } : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cx(col.numeric && 'kv-table__cell--numeric', col.mono && 'kv-table__cell--mono')}
                    >
                      {col.render ? col.render(row, i) : (row[col.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {caption ? <div className="kv-table__caption">{caption}</div> : null}
    </div>
  );
}
