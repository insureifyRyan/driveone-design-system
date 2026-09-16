import * as React from 'react';
import { cx } from '../utils/cx';
import { FormField } from './FormField';

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: React.ReactNode;
  /** Error message — also sets `aria-invalid` and the red treatment. */
  error?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Adornment inside the left edge — a currency mark, a search glyph. */
  startAdornment?: React.ReactNode;
  /** Adornment inside the right edge — units, a clear button. */
  endAdornment?: React.ReactNode;
  /** Render the value in the mono face. Use for VINs, policy numbers and contract IDs. */
  mono?: boolean;
  /** Stretch to the container width. On by default — forms are column layouts. */
  fullWidth?: boolean;
}

/**
 * Single-line text input with Kōvara's label, hint and error scaffolding built in.
 * Set `mono` for machine identifiers (VIN, policy number, claim ID) so digits align
 * and transcription errors are visible.
 *
 * @example
 * <TextField label="VIN" mono placeholder="1HGCM82633A004352" hint="17 characters" />
 */
export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, size = 'md', startAdornment, endAdornment, mono, fullWidth = true, id, className, required, disabled, ...rest },
  ref
) {
  const reactId = React.useId();
  const fieldId = id ?? `kv-input-${reactId}`;

  return (
    <FormField
      label={label}
      htmlFor={fieldId}
      hint={hint}
      error={error}
      required={required}
      style={fullWidth ? { width: '100%' } : undefined}
    >
      <span className="kv-input-wrap">
        {startAdornment ? <span className="kv-input-wrap__affix kv-input-wrap__affix--start">{startAdornment}</span> : null}
        <input
          ref={ref}
          id={fieldId}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          className={cx(
            'kv-input',
            `kv-input--${size}`,
            startAdornment && 'kv-input--has-start',
            endAdornment && 'kv-input--has-end',
            error && 'kv-input--invalid',
            mono && 'kv-input--mono',
            className
          )}
          {...rest}
        />
        {endAdornment ? <span className="kv-input-wrap__affix kv-input-wrap__affix--end">{endAdornment}</span> : null}
      </span>
    </FormField>
  );
});
