import * as React from 'react';
import { cx } from '../utils/cx';

export interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Product name — "Vista Warranty", "DriveOne Direct". */
  name: string;
  /** Market and audience, shown in caps: "B2B · Insurance agencies". */
  audience?: string;
  /** What it is, in one or two sentences. */
  description?: React.ReactNode;
  /** The product's own logo. Pass an `<img>` or a `BrandMark`. */
  logo?: React.ReactNode;
  /** Ships now, or on the roadmap. Drives the corner flag. */
  status?: 'live' | 'coming-soon';
  /** Override the flag text. */
  statusLabel?: string;
  /** The CTA — one `Button` for live products, a disabled one for roadmap entries. */
  action?: React.ReactNode;
}

/**
 * A product in the Kōvara portfolio, as the public site presents it: logo, market,
 * one-line pitch, and either a way in or a roadmap flag.
 *
 * Use it on portfolio and overview pages. Inside the app, a product a customer has
 * actually bought is a `PolicyRow` or a `Card` — this component is for presenting the
 * line-up, not for operating it.
 *
 * @example
 * <ProductCard
 *   name="Vista Warranty"
 *   audience="B2B · Insurance agencies"
 *   description="AI quoting and extended warranty for insurance agencies — same coverage as the dealer, about 60% less."
 *   status="live"
 *   action={<Button>Open Vista</Button>}
 * />
 */
export const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(function ProductCard(
  { name, audience, description, logo, status = 'live', statusLabel, action, className, ...rest },
  ref
) {
  return (
    <div ref={ref} className={cx('kv-product', className)} {...rest}>
      <div className="kv-product__head">
        <span className="kv-product__logo">{logo}</span>
        <span className={cx('kv-product__flag', status === 'live' ? 'kv-product__flag--live' : 'kv-product__flag--soon')}>
          {statusLabel ?? (status === 'live' ? 'Live' : 'Coming soon')}
        </span>
      </div>
      <div className="kv-product__titles">
        <span className="kv-product__name">{name}</span>
        {audience ? <span className="kv-product__audience">{audience}</span> : null}
      </div>
      {description ? <p className="kv-product__description">{description}</p> : null}
      {action ? <div className="kv-product__foot">{action}</div> : null}
    </div>
  );
});
