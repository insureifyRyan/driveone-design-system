import * as React from 'react';
import { cx } from '../utils/cx';

export interface DescriptionItem {
  /** Field name — "Policy number", "Effective date", "Deductible". */
  term: string;
  /** Field value. Pre-formatted; pass a node for pills and links. */
  description: React.ReactNode;
  /** Render the value in the mono face — identifiers, VINs, amounts in tables. */
  mono?: boolean;
}

export interface DescriptionListProps extends React.HTMLAttributes<HTMLDListElement> {
  items: DescriptionItem[];
  /** Column count. Two reads best inside a `Card`; three on a full-width detail page. */
  columns?: 1 | 2 | 3;
}

/**
 * Read-only field/value pairs — the summary block on a policy, quote or claim detail page.
 * Use it instead of a disabled form: these values are facts, not inputs.
 *
 * @example
 * <DescriptionList columns={2} items={[{ term: 'Policy number', description: 'KV-4471-0098', mono: true }]} />
 */
export const DescriptionList = React.forwardRef<HTMLDListElement, DescriptionListProps>(function DescriptionList(
  { items, columns = 2, className, ...rest },
  ref
) {
  return (
    <dl
      ref={ref}
      className={cx('kv-dl', columns === 2 && 'kv-dl--two-col', columns === 3 && 'kv-dl--three-col', className)}
      {...rest}
    >
      {items.map((item) => (
        <div className="kv-dl__item" key={item.term}>
          <dt className="kv-dl__term">{item.term}</dt>
          <dd className={cx('kv-dl__desc', item.mono && 'kv-dl__desc--mono')}>{item.description}</dd>
        </div>
      ))}
    </dl>
  );
});
