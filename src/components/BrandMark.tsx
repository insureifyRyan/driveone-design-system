import * as React from 'react';
import { cx } from '../utils/cx';

export type BrandMarkTone = 'color' | 'on-brand' | 'mono' | 'inverse';

export interface BrandMarkProps extends Omit<React.SVGProps<SVGSVGElement>, 'children'> {
  /** Edge length in pixels. 24 in a top bar, 32–40 in a sidebar, 64+ on marketing surfaces. */
  size?: number;
  /**
   * `color` — full palette on a light surface (default).
   * `on-brand` — full palette with a white core, for indigo or photographic backgrounds.
   * `mono` — single indigo, for faxes, stamps and one-color print.
   * `inverse` — single white, for dark backgrounds where the facets would muddy.
   */
  tone?: BrandMarkTone;
  /** Accessible label. Omit when the mark sits next to the wordmark (then it is decorative). */
  title?: string;
}

const FACETS: Record<BrandMarkTone, { peri: string; cyan: string; core: string }> = {
  color: { peri: '#7b6cf6', cyan: '#17d7fb', core: '#271f72' },
  'on-brand': { peri: '#7b6cf6', cyan: '#17d7fb', core: '#ffffff' },
  mono: { peri: '#9089db', cyan: '#6a61c8', core: '#2e2a8c' },
  inverse: { peri: 'rgba(255,255,255,0.55)', cyan: 'rgba(255,255,255,0.8)', core: '#ffffff' },
};

/**
 * The Kōvara facet mark — three offset planes of the same peak, layered so the core
 * reads solid where they overlap. Use it alone as an app icon, avatar or favicon;
 * pair it with the wordmark via `Logo` anywhere the brand is being introduced.
 *
 * @example
 * <BrandMark size={32} title="Kōvara AI" />
 */
export const BrandMark = React.forwardRef<SVGSVGElement, BrandMarkProps>(function BrandMark(
  { size = 32, tone = 'color', title, className, ...rest },
  ref
) {
  const f = FACETS[tone];
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={cx('kv-brandmark', className)}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <polygon points="25,17 5,55 45,55" fill={f.peri} />
      <polygon points="38,9 18,47 58,47" fill={f.cyan} />
      <polygon points="32,14 12,52 52,52" fill={f.core} />
    </svg>
  );
});
