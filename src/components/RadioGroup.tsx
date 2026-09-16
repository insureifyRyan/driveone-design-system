import * as React from 'react';
import { cx } from '../utils/cx';

export interface RadioGroupProps extends Omit<React.FieldsetHTMLAttributes<HTMLFieldSetElement>, 'onChange'> {
  /** Question the options answer — rendered as the fieldset legend. */
  legend?: string;
  /** Lay the options out in a row. Use for two or three short options only. */
  orientation?: 'vertical' | 'horizontal';
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** `Radio` children sharing one `name`. */
  children?: React.ReactNode;
}

/**
 * Groups `Radio` options under one legend so screen readers announce the question
 * with each option. Use for term length, payment cadence, deductible tiers.
 *
 * @example
 * <RadioGroup legend="Deductible">
 *   <Radio name="ded" label="$100" defaultChecked />
 *   <Radio name="ded" label="$250" />
 * </RadioGroup>
 */
export const RadioGroup = React.forwardRef<HTMLFieldSetElement, RadioGroupProps>(function RadioGroup(
  { legend, orientation = 'vertical', hint, error, className, children, ...rest },
  ref
) {
  return (
    <fieldset
      ref={ref}
      className={cx('kv-field', className)}
      style={{ border: 'none', padding: 0, margin: 0, minWidth: 0 }}
      {...rest}
    >
      {legend ? <legend className="kv-radio-group__legend">{legend}</legend> : null}
      <div className={cx('kv-radio-group', orientation === 'horizontal' && 'kv-radio-group--horizontal')}>{children}</div>
      {error ? (
        <span className="kv-field__error" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="kv-field__hint">{hint}</span>
      ) : null}
    </fieldset>
  );
});
