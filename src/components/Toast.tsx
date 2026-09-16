import * as React from 'react';
import { cx } from '../utils/cx';
import { Icon, type IconName } from './Icon';
import { IconButton } from './IconButton';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export interface ToastProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?: ToastTone;
  /** What happened — past tense, specific: "Policy bound", "Quote sent". */
  title: React.ReactNode;
  /** One supporting line. Keep it short; toasts auto-dismiss. */
  children?: React.ReactNode;
  /** A single undo/view action. */
  action?: React.ReactNode;
  onDismiss?: () => void;
}

const TONE_ICON: Record<ToastTone, IconName> = {
  info: 'info',
  success: 'check-circle',
  warning: 'alert-triangle',
  danger: 'x-circle',
};

/**
 * A transient confirmation of something that already happened. Render toasts in a
 * fixed stack in the bottom-right; never put a required decision in one.
 *
 * @example
 * <Toast tone="success" title="Policy bound" action={<Button variant="link" size="sm">View policy</Button>}>
 *   KV-4471-0098 is in force as of today.
 * </Toast>
 */
export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(function Toast(
  { tone = 'info', title, children, action, onDismiss, className, ...rest },
  ref
) {
  return (
    <div ref={ref} role="status" aria-live="polite" className={cx('kv-toast', `kv-toast--${tone}`, className)} {...rest}>
      <span className="kv-toast__accent" aria-hidden="true" />
      <span className="kv-toast__icon">
        <Icon name={TONE_ICON[tone]} size={18} />
      </span>
      <div className="kv-toast__content">
        <span className="kv-toast__title">{title}</span>
        {children ? <span className="kv-toast__body">{children}</span> : null}
        {action}
      </div>
      {onDismiss ? <IconButton icon={<Icon name="x" size={14} />} label="Dismiss" size="sm" onClick={onDismiss} /> : null}
    </div>
  );
});
