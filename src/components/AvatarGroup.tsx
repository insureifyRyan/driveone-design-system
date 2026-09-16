import * as React from 'react';
import { cx } from '../utils/cx';
import { Avatar, type AvatarSize } from './Avatar';

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** People or organizations, in display order. */
  people: Array<{ name: string; src?: string }>;
  /** How many to show before collapsing into a +N chip. */
  max?: number;
  size?: AvatarSize;
}

/**
 * Overlapping avatars for a shared thing — the producers on an account, the adjusters
 * on a claim, the dealers on a program. Collapses past `max` into a +N chip.
 *
 * @example
 * <AvatarGroup people={[{ name: 'Dana Whitfield' }, { name: 'Marcus Reyes' }]} max={4} size="sm" />
 */
export const AvatarGroup = React.forwardRef<HTMLSpanElement, AvatarGroupProps>(function AvatarGroup(
  { people, max = 4, size = 'sm', className, ...rest },
  ref
) {
  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;
  const tones = ['brand', 'accent', 'secondary'] as const;
  return (
    <span ref={ref} className={cx('kv-avatar-group', className)} {...rest}>
      {shown.map((p, i) => (
        <Avatar key={p.name} name={p.name} src={p.src} size={size} tone={tones[i % tones.length]} />
      ))}
      {overflow > 0 ? (
        <span className={cx('kv-avatar', `kv-avatar--${size}`, 'kv-avatar-group__overflow')} aria-label={`${overflow} more`}>
          +{overflow}
        </span>
      ) : null}
    </span>
  );
});
