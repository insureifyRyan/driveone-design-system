import * as React from 'react';
import { cx } from '../utils/cx';
import { BrandMark } from './BrandMark';

export type LogoSize = 'sm' | 'md' | 'lg' | 'xl';
export type LogoVariant = 'lockup' | 'stacked' | 'wordmark' | 'mark';

/** The approved Kōvara positioning line. Use it verbatim — it is trademark-adjacent copy. */
export const KOVARA_TAGLINE = 'Agentic Infrastructure for finance and insurance';

const SIZES: Record<LogoSize, { mark: number; word: number; suffix: number; tm: number; tagline: number }> = {
  sm: { mark: 24, word: 19, suffix: 9, tm: 8, tagline: 10 },
  md: { mark: 32, word: 25, suffix: 11, tm: 9, tagline: 12 },
  lg: { mark: 44, word: 34, suffix: 14, tm: 11, tagline: 14 },
  xl: { mark: 64, word: 50, suffix: 20, tm: 15, tagline: 18 },
};

export interface LogoProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** `lockup` (mark + wordmark, default), `stacked` (mark above wordmark), `wordmark`, or `mark` alone. */
  variant?: LogoVariant;
  size?: LogoSize;
  /** Render the light-on-indigo treatment — white wordmark, white-core mark. */
  onBrand?: boolean;
  /** Show the positioning line under the wordmark. Pass `true` for the approved tagline, or your own string. */
  tagline?: boolean | string;
  /** Show the ™ after the wordmark. On by default — the Kōvara wordmark is always marked. */
  trademark?: boolean;
}

/**
 * The Kōvara AI logo lockup: facet mark, `kōvara` wordmark, superscript `AI`, and the ™.
 *
 * The ™ is part of the mark — leave `trademark` on unless you are placing the logo inside
 * running text that already carries the notice. Add `tagline` on first-impression surfaces
 * (login, marketing headers, email footers), not inside the app chrome.
 *
 * @example
 * <Logo size="lg" tagline />
 * @example
 * <Logo variant="lockup" size="sm" onBrand />
 */
export const Logo = React.forwardRef<HTMLDivElement, LogoProps>(function Logo(
  { variant = 'lockup', size = 'md', onBrand = false, tagline = false, trademark = true, className, ...rest },
  ref
) {
  const s = SIZES[size];
  const taglineText = typeof tagline === 'string' ? tagline : KOVARA_TAGLINE;

  const wordmark = (
    <span className="kv-logo__lockup">
      <span className="kv-logo__wordmark" style={{ fontSize: s.word }}>
        kōvara
      </span>
      <span className="kv-logo__suffix" style={{ fontSize: s.suffix, marginLeft: 2 }}>
        AI
      </span>
      {trademark ? (
        <span className="kv-logo__tm" style={{ fontSize: s.tm, marginLeft: 2 }} aria-hidden="true">
          ™
        </span>
      ) : null}
    </span>
  );

  const text =
    variant === 'mark' ? null : (
      <span style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: variant === 'stacked' ? 'center' : 'flex-start' }}>
        {wordmark}
        {tagline ? (
          <span className="kv-logo__tagline" style={{ fontSize: s.tagline }}>
            {taglineText}
          </span>
        ) : null}
      </span>
    );

  return (
    <div
      ref={ref}
      className={cx('kv-logo', variant === 'stacked' && 'kv-logo--stacked', onBrand && 'kv-logo--on-brand', className)}
      role="img"
      aria-label={`Kōvara AI${trademark ? '™' : ''}`}
      {...rest}
    >
      {variant === 'wordmark' ? null : <BrandMark size={s.mark} tone={onBrand ? 'on-brand' : 'color'} />}
      {text}
    </div>
  );
});
