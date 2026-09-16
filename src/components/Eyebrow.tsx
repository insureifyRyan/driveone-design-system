import * as React from 'react';
import { cx } from '../utils/cx';

export interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The label text. Rendered in caps — write it in sentence case. */
  children?: React.ReactNode;
  /** Drop the cyan rule before the text. */
  rule?: boolean;
  /** Light treatment for indigo or photographic backgrounds. */
  onBrand?: boolean;
}

/**
 * The small letterspaced label above a section heading, with the cyan rule — the
 * signature Kōvara section opener on marketing and overview pages.
 *
 * One per section, directly above the heading. It names the section's context
 * ("Kōvara portfolio", "Platform", "For developers"), never repeating the heading.
 *
 * @example
 * <Eyebrow>Kōvara portfolio</Eyebrow>
 * <h2>One team building the next generation of vehicle protection products.</h2>
 */
export const Eyebrow = React.forwardRef<HTMLSpanElement, EyebrowProps>(function Eyebrow(
  { children, rule = true, onBrand = false, className, ...rest },
  ref
) {
  return (
    <span ref={ref} className={cx('kv-eyebrow', onBrand && 'kv-eyebrow--on-brand', className)} {...rest}>
      {rule ? <span className="kv-eyebrow__rule" aria-hidden="true" /> : null}
      <span className="kv-eyebrow__text">{children}</span>
    </span>
  );
});
