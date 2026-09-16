import * as React from 'react';
import { cx } from '../utils/cx';

export type IconButtonVariant = 'ghost' | 'outline' | 'solid';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The glyph — pass an `<Icon />`. */
  icon: React.ReactNode;
  /** Required: icon-only controls have no visible text to announce. */
  label: string;
  variant?: IconButtonVariant;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * A square, icon-only control for dense chrome — table row actions, toolbar buttons,
 * dismiss affordances. `label` is mandatory and becomes the accessible name.
 *
 * @example
 * <IconButton icon={<Icon name="more-horizontal" />} label="Policy actions" />
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, variant = 'ghost', size = 'md', className, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cx('kv-icon-btn', `kv-icon-btn--${variant}`, `kv-icon-btn--${size}`, className)}
      {...rest}
    >
      {icon}
    </button>
  );
});
