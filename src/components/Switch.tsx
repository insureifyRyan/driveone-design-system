import * as React from 'react';
import { cx } from '../utils/cx';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Text beside the switch. */
  label?: React.ReactNode;
  size?: 'sm' | 'md';
  /** Put the label before the control — used in settings rows where the control right-aligns. */
  labelPosition?: 'end' | 'start';
}

/**
 * An immediate on/off toggle — it takes effect the moment it flips, with no Save step.
 * Use it for automation switches (auto-follow-up, AI voice answering, carrier sync).
 * If the change needs confirming, use a `Checkbox` in a form instead.
 *
 * @example
 * <Switch label="Let Kōvara follow up on abandoned quotes" defaultChecked />
 */
export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, size = 'md', labelPosition = 'end', className, disabled, id, ...rest },
  ref
) {
  const reactId = React.useId();
  const fieldId = id ?? `kv-switch-${reactId}`;
  const text = label ? <span className="kv-switch__label">{label}</span> : null;
  return (
    <label
      htmlFor={fieldId}
      className={cx('kv-switch', size === 'sm' && 'kv-switch--sm', disabled && 'kv-switch--disabled', className)}
    >
      {labelPosition === 'start' ? text : null}
      <input ref={ref} id={fieldId} type="checkbox" role="switch" disabled={disabled} className="kv-switch__control" {...rest} />
      {labelPosition === 'end' ? text : null}
    </label>
  );
});
