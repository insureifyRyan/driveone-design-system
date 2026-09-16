import * as React from 'react';
import { cx } from '../utils/cx';

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg';
  /** Accessible label announced while work is in flight. */
  label?: string;
}

/**
 * Indeterminate activity indicator. It inherits `currentColor`, so it reads correctly
 * inside any button or on any surface without extra props.
 *
 * @example
 * <Spinner size="md" label="Rating quote" />
 */
export const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = 'md', label, className, ...rest },
  ref
) {
  return (
    <span ref={ref} role="status" aria-live="polite" className={cx('kv-spinner', `kv-spinner--${size}`, className)} {...rest}>
      {label ? <span className="kv-sr-only">{label}</span> : null}
    </span>
  );
});
