import * as React from 'react';
import { cx } from '../utils/cx';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * `primary` — the one committing action on a screen (Bind policy, Send quote).
   * `secondary` — supporting actions next to a primary.
   * `accent` — cyan; reserve for agentic actions the AI performs (Generate, Autofill).
   * `ghost` — low-emphasis actions in toolbars and table rows.
   * `danger` — destructive and irreversible (Cancel policy, Delete workflow).
   * `link` — inline navigation that must look like text.
   */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Swap the label for a spinner and block interaction. */
  loading?: boolean;
  /** Stretch to the container's width — forms on mobile, card footers. */
  fullWidth?: boolean;
  /** Icon before the label. Pass an `<Icon />`. */
  leadingIcon?: React.ReactNode;
  /** Icon after the label — chevrons, external-link marks. */
  trailingIcon?: React.ReactNode;
}

/**
 * The Kōvara button. One primary action per screen region; everything else steps down
 * to `secondary` or `ghost`. Use `accent` (cyan) only where the agent is doing the work,
 * so users learn that cyan means "Kōvara acts".
 *
 * @example
 * <Button variant="primary" leadingIcon={<Icon name="sparkles" />}>Generate quote</Button>
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    leadingIcon,
    trailingIcon,
    disabled,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx('kv-btn', `kv-btn--${variant}`, `kv-btn--${size}`, fullWidth && 'kv-btn--block', className)}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : leadingIcon ? <span className="kv-btn__affix">{leadingIcon}</span> : null}
      {children}
      {trailingIcon && !loading ? <span className="kv-btn__affix">{trailingIcon}</span> : null}
    </button>
  );
});
