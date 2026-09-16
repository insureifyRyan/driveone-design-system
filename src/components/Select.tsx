import * as React from 'react';
import { cx } from '../utils/cx';
import { FormField } from './FormField';
import { Icon } from './Icon';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'children'> {
  label?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Options to render. Pass `children` instead when you need `<optgroup>`s. */
  options?: SelectOption[];
  /** Placeholder shown as a disabled first option. */
  placeholder?: string;
  children?: React.ReactNode;
}

/**
 * Native select with Kōvara's field chrome — the right control for a bounded list
 * (carrier, coverage term, state, dealership). For long or searchable lists, use a
 * combobox pattern built on `TextField` + `Menu` instead.
 *
 * @example
 * <Select label="Carrier" options={[{ label: 'Centurion Mutual', value: 'cm' }]} placeholder="Select a carrier" />
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, size = 'md', options, placeholder, id, className, required, children, defaultValue, ...rest },
  ref
) {
  const reactId = React.useId();
  const fieldId = id ?? `kv-select-${reactId}`;
  return (
    <FormField label={label} htmlFor={fieldId} hint={hint} error={error} required={required}>
      <span className="kv-select-wrap">
        <select
          ref={ref}
          id={fieldId}
          required={required}
          defaultValue={defaultValue ?? (placeholder ? '' : undefined)}
          aria-invalid={error ? true : undefined}
          className={cx('kv-input', 'kv-select', `kv-input--${size}`, error && 'kv-input--invalid', className)}
          {...rest}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options?.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
          {children}
        </select>
        <span className="kv-select-wrap__chevron">
          <Icon name="chevron-down" size={16} />
        </span>
      </span>
    </FormField>
  );
});
