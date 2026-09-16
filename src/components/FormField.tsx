import * as React from 'react';
import { cx } from '../utils/cx';

export interface FormFieldProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Visible label text. */
  label?: string;
  /** `id` of the control this labels. */
  htmlFor?: string;
  /** Helper text under the control — units, formats, where the value comes from. */
  hint?: React.ReactNode;
  /** Error message. When set, it replaces the hint and turns the field red. */
  error?: React.ReactNode;
  /** Mark the field required (adds the red asterisk). */
  required?: boolean;
  /** Mark the field optional explicitly — useful on forms that are mostly required. */
  optional?: boolean;
  /** The control: a `TextField`, `Select`, a date picker, anything. */
  children?: React.ReactNode;
}

/**
 * Label + hint + error scaffolding for any control. `TextField`, `Textarea` and `Select`
 * already use it internally — reach for `FormField` directly when you are wrapping a
 * third-party control (a carrier date picker, a VIN scanner) and still want Kōvara's
 * label treatment and error semantics.
 *
 * @example
 * <FormField label="Effective date" htmlFor="eff" hint="Coverage starts at 12:01am local time">
 *   <input id="eff" type="date" className="kv-input kv-input--md" />
 * </FormField>
 */
export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(function FormField(
  { label, htmlFor, hint, error, required, optional, className, children, ...rest },
  ref
) {
  return (
    <div ref={ref} className={cx('kv-field', className)} {...rest}>
      {label ? (
        <label className="kv-field__label" htmlFor={htmlFor}>
          {label}
          {required ? <span className="kv-field__required" aria-hidden="true">*</span> : null}
          {optional && !required ? <span className="kv-field__optional">(optional)</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <span className="kv-field__error" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="kv-field__hint">{hint}</span>
      ) : null}
    </div>
  );
});
