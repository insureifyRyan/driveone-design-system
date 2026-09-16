import * as React from 'react';
import { cx } from '../utils/cx';
import { Badge } from './Badge';
import { Icon } from './Icon';

export interface QuoteCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Carrier, lender or administrator offering the product. */
  carrier: string;
  /** Product name — "Platinum Vehicle Service Contract", "GAP", "Commercial Auto". */
  product: string;
  /** Price, pre-formatted with its currency: "$118.40". */
  price: string;
  /** What the price is per — "/mo", "per term", "one-time". */
  term?: string;
  /** Short chips under the price — term length, deductible, mileage cap. */
  meta?: string[];
  /** Coverage bullets. Keep to four or fewer — this is a comparison card. */
  features?: string[];
  /** Highlights this option with the brand ribbon. Use for the agent's recommendation. */
  recommended?: boolean;
  /** Ribbon text. Defaults to "Recommended". */
  ribbonLabel?: string;
  /** Marks the quote as produced by Kōvara rather than keyed in by a person. */
  aiGenerated?: boolean;
  /** Action row — the accept/send buttons. */
  actions?: React.ReactNode;
}

/**
 * One priced option in a comparison set — the core unit of quoting and product sales.
 * Render two to four side by side and mark at most one `recommended`; that ribbon is
 * how Kōvara's recommendation is distinguished from raw carrier output.
 *
 * @example
 * <QuoteCard
 *   carrier="Centurion Mutual" product="Platinum Vehicle Service Contract"
 *   price="$118.40" term="/mo" recommended aiGenerated
 *   meta={['36 months', '$100 deductible']}
 *   features={['Powertrain + electronics', 'Nationwide claims', 'Transferable']}
 *   actions={<Button fullWidth>Send to customer</Button>}
 * />
 */
export const QuoteCard = React.forwardRef<HTMLDivElement, QuoteCardProps>(function QuoteCard(
  { carrier, product, price, term, meta, features, recommended = false, ribbonLabel = 'Recommended', aiGenerated = false, actions, className, ...rest },
  ref
) {
  return (
    <div ref={ref} className={cx('kv-quote', recommended && 'kv-quote--recommended', className)} {...rest}>
      {recommended ? <div className="kv-quote__ribbon">{ribbonLabel}</div> : null}
      <div className="kv-quote__head">
        <div className="kv-quote__carrier">
          <span className="kv-quote__carrier-name">{carrier}</span>
          <span className="kv-quote__product">{product}</span>
        </div>
        {aiGenerated ? (
          <Badge tone="accent" icon={<Icon name="sparkles" size={12} />}>
            AI rated
          </Badge>
        ) : null}
      </div>
      <div className="kv-quote__price">
        <span className="kv-quote__amount">{price}</span>
        {term ? <span className="kv-quote__term">{term}</span> : null}
      </div>
      {meta?.length ? (
        <div className="kv-quote__meta">
          {meta.map((m) => (
            <Badge key={m} tone="neutral" pill>
              {m}
            </Badge>
          ))}
        </div>
      ) : null}
      {features?.length ? (
        <ul className="kv-quote__features">
          {features.map((f) => (
            <li key={f} className="kv-quote__feature">
              <span className="kv-quote__feature-check">
                <Icon name="check" size={14} strokeWidth={2.25} />
              </span>
              {f}
            </li>
          ))}
        </ul>
      ) : null}
      {actions ? <div className="kv-quote__foot">{actions}</div> : null}
    </div>
  );
});
