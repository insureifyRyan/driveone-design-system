import * as React from 'react';
import { cx } from '../utils/cx';
import { Icon, type IconName } from './Icon';
import { IconButton } from './IconButton';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger' | 'brand';

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?: AlertTone;
  /** Short headline stating what happened. */
  title?: React.ReactNode;
  /** Body copy — what it means and what to do. */
  children?: React.ReactNode;
  /** Buttons under the body: the fix, the docs link. */
  actions?: React.ReactNode;
  /** Show a dismiss button and call this when it is pressed. */
  onDismiss?: () => void;
  /** Replace the default tone icon. */
  icon?: React.ReactNode;
}

const TONE_ICON: Record<AlertTone, IconName> = {
  info: 'info',
  success: 'check-circle',
  warning: 'alert-triangle',
  danger: 'x-circle',
  brand: 'sparkles',
};

/**
 * An inline, page-level message that stays until the condition clears — carrier
 * downtime, a rate change, an expiring credential. For transient confirmations use
 * `Toast`; for a blocking decision use `Modal`.
 *
 * @example
 * <Alert tone="warning" title="Carrier feed degraded" actions={<Button size="sm" variant="secondary">View status</Button>}>
 *   Centurion Mutual is returning rates slowly. Quotes may take up to 90 seconds.
 * </Alert>
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { tone = 'info', title, children, actions, onDismiss, icon, className, ...rest },
  ref
) {
  return (
    <div ref={ref} role="status" className={cx('kv-alert', `kv-alert--${tone}`, className)} {...rest}>
      <span className="kv-alert__icon">{icon ?? <Icon name={TONE_ICON[tone]} size={18} />}</span>
      <div className="kv-alert__content">
        {title ? <span className="kv-alert__title">{title}</span> : null}
        {children ? <div className="kv-alert__body">{children}</div> : null}
        {actions ? <div className="kv-alert__actions">{actions}</div> : null}
      </div>
      {onDismiss ? (
        <span className="kv-alert__dismiss">
          <IconButton icon={<Icon name="x" size={16} />} label="Dismiss" size="sm" onClick={onDismiss} />
        </span>
      ) : null}
    </div>
  );
});
