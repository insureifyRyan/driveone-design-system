import * as React from 'react';
import { cx } from '../utils/cx';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
}

/**
 * One option in a mutually exclusive set. Always give every `Radio` in a set the same
 * `name`, and prefer wrapping them in `RadioGroup` so the set gets a legend.
 *
 * @example
 * <Radio name="term" label="36 months" hint="Most common for used vehicles" defaultChecked />
 */
export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, hint, className, disabled, id, ...rest },
  ref
) {
  const reactId = React.useId();
  const fieldId = id ?? `kv-radio-${reactId}`;
  return (
    <label htmlFor={fieldId} className={cx('kv-check', disabled && 'kv-check--disabled', className)}>
      <input ref={ref} id={fieldId} type="radio" disabled={disabled} className="kv-check__control kv-check__control--circle" {...rest} />
      {label || hint ? (
        <span className="kv-check__text">
          {label ? <span className="kv-check__label">{label}</span> : null}
          {hint ? <span className="kv-check__hint">{hint}</span> : null}
        </span>
      ) : null}
    </label>
  );
});
