import * as React from 'react';
import { cx } from '../utils/cx';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Text beside the box. */
  label?: React.ReactNode;
  /** Secondary line under the label — what selecting this actually does. */
  hint?: React.ReactNode;
  /** Partially-selected state, for "select all" headers over a filtered list. */
  indeterminate?: boolean;
}

/**
 * Checkbox for independent choices — coverage add-ons, notification channels,
 * row selection in a `DataTable`.
 *
 * @example
 * <Checkbox label="Attach roadside assistance" hint="Adds $4.10/mo to the contract" defaultChecked />
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, hint, indeterminate = false, className, disabled, id, ...rest },
  ref
) {
  const reactId = React.useId();
  const fieldId = id ?? `kv-checkbox-${reactId}`;
  const innerRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);
  React.useEffect(() => {
    if (innerRef.current) innerRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label htmlFor={fieldId} className={cx('kv-check', disabled && 'kv-check--disabled', className)}>
      <input
        ref={innerRef}
        id={fieldId}
        type="checkbox"
        disabled={disabled}
        className="kv-check__control kv-check__control--box"
        {...rest}
      />
      {label || hint ? (
        <span className="kv-check__text">
          {label ? <span className="kv-check__label">{label}</span> : null}
          {hint ? <span className="kv-check__hint">{hint}</span> : null}
        </span>
      ) : null}
    </label>
  );
});
