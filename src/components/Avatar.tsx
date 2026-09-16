import * as React from 'react';
import { cx } from '../utils/cx';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';
export type AvatarTone = 'brand' | 'accent' | 'secondary';

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Full name — used for the accessible label and for deriving initials. */
  name: string;
  /** Photo URL. Falls back to initials when absent. */
  src?: string;
  size?: AvatarSize;
  /** Tint of the initials fallback. Vary it across a list so people are distinguishable. */
  tone?: AvatarTone;
  /** Square with rounded corners — use for organizations (dealers, carriers, credit unions). */
  square?: boolean;
  /** Override the derived initials. */
  initials?: string;
}

const toInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('');

/**
 * A person or organization avatar. Falls back to initials on the brand tints, so a list
 * of producers or insureds never shows broken images.
 *
 * @example
 * <Avatar name="Dana Whitfield" size="sm" />
 * @example
 * <Avatar name="Centurion Mutual" square tone="accent" />
 */
export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { name, src, size = 'md', tone = 'brand', square = false, initials, className, ...rest },
  ref
) {
  return (
    <span
      ref={ref}
      title={name}
      aria-label={name}
      role="img"
      className={cx('kv-avatar', `kv-avatar--${size}`, tone !== 'brand' && `kv-avatar--${tone}`, square && 'kv-avatar--square', className)}
      {...rest}
    >
      {src ? <img src={src} alt="" /> : (initials ?? toInitials(name))}
    </span>
  );
});
