import * as React from 'react';
import { cx } from '../utils/cx';
import { Icon } from './Icon';
import { IconButton } from './IconButton';

export interface ApiKeyFieldProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onCopy'> {
  /** What this credential is for — "Production secret key", "Sandbox publishable key". */
  label?: string;
  /** The key. Shown masked unless `revealed`. */
  value: string;
  /** Number of trailing characters left visible when masked. */
  revealChars?: number;
  /** Render the key in the clear. Secret keys should default to masked. */
  revealed?: boolean;
  /** Environment chip — pass a `Badge`. */
  environment?: React.ReactNode;
  /** Creation or last-used line: "Created Mar 2 · Last used 4 min ago". */
  meta?: React.ReactNode;
  onReveal?: () => void;
  onCopyKey?: () => void;
  /** Extra actions — roll, revoke. */
  actions?: React.ReactNode;
}

/**
 * A credential, displayed the way credentials must be: masked by default, copyable
 * without selecting, and never silently truncated. Use it on the API keys screen and in
 * any embed/onboarding flow where an integrator collects their key.
 *
 * Secret keys should stay masked (`revealed` off) — reveal is an explicit user action.
 *
 * @example
 * <ApiKeyField label="Production secret key" value="kv_live_9f4c2a77bd1e4c8fa0b6" environment={<Badge tone="success">Live</Badge>} meta="Created Mar 2 · Last used 4 min ago" />
 */
export const ApiKeyField = React.forwardRef<HTMLDivElement, ApiKeyFieldProps>(function ApiKeyField(
  { label, value, revealChars = 4, revealed = false, environment, meta, onReveal, onCopyKey, actions, className, ...rest },
  ref
) {
  const masked = revealed ? value : `${value.slice(0, Math.min(8, value.length))}${'•'.repeat(12)}${value.slice(-revealChars)}`;
  return (
    <div ref={ref} className={cx('kv-key', className)} {...rest}>
      {label || environment ? (
        <div className="kv-key__meta" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: 'var(--kv-font-size-xs)', fontWeight: 600, color: 'var(--kv-color-text-primary)' }}>{label}</span>
          {environment}
        </div>
      ) : null}
      <div className="kv-key__row">
        <span className={cx('kv-key__value', !revealed && 'kv-key__value--masked')}>{masked}</span>
        <span className="kv-key__actions">
          <IconButton
            icon={<Icon name={revealed ? 'eye-off' : 'eye'} size={15} />}
            label={revealed ? 'Hide key' : 'Reveal key'}
            size="sm"
            onClick={onReveal}
          />
          <IconButton icon={<Icon name="clipboard" size={15} />} label="Copy key" size="sm" onClick={onCopyKey} />
          {actions}
        </span>
      </div>
      {meta ? <span className="kv-key__meta">{meta}</span> : null}
    </div>
  );
});
