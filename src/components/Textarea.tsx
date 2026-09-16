import * as React from 'react';
import { cx } from '../utils/cx';
import { FormField } from './FormField';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
}

/**
 * Multi-line text — adjuster notes, coverage remarks, the instruction you give an agent.
 * Resizes vertically only, so it never breaks a form's column.
 *
 * @example
 * <Textarea label="Claim notes" rows={4} placeholder="What the insured reported…" />
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, id, className, required, rows = 4, ...rest },
  ref
) {
  const reactId = React.useId();
  const fieldId = id ?? `kv-textarea-${reactId}`;
  return (
    <FormField label={label} htmlFor={fieldId} hint={hint} error={error} required={required}>
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cx('kv-input', 'kv-textarea', error && 'kv-input--invalid', className)}
        {...rest}
      />
    </FormField>
  );
});
