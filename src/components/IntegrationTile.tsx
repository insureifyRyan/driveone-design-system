import * as React from 'react';
import { cx } from '../utils/cx';
import { Icon } from './Icon';
import { StatusPill } from './StatusPill';

export interface IntegrationTileProps extends React.HTMLAttributes<HTMLDivElement> {
  /** System name — "Centurion Mutual Rating API", "CDK Drive", "Symitar". */
  name: string;
  /** What flows across the connection. */
  description?: React.ReactNode;
  /** Logo URL. Falls back to the first letters on the brand tint. */
  logoSrc?: string;
  /** Connection state: `active` connected, `pending` authorizing, `lapsed` credentials expired. */
  status?: 'active' | 'pending' | 'lapsed' | 'draft';
  /** Override the status text — "Syncing", "Rate limited". */
  statusLabel?: string;
  /** Last successful exchange: "Synced 4 min ago". */
  lastSync?: string;
  /** Direction of data flow. */
  direction?: 'inbound' | 'outbound' | 'bidirectional';
  /** Right-hand slot — Connect / Configure button or a `Menu`. */
  action?: React.ReactNode;
}

/**
 * One connected system in the integrations surface — the carriers, DMS, core banking
 * and CRM platforms Kōvara wires together. Always show `lastSync`: for a connector,
 * "when did this last actually work" is the only status anyone trusts.
 *
 * @example
 * <IntegrationTile name="CDK Drive" description="Deal jackets and F&I product sales"
 *   status="active" lastSync="Synced 4 min ago" direction="bidirectional"
 *   action={<Button variant="secondary" size="sm">Configure</Button>} />
 */
export const IntegrationTile = React.forwardRef<HTMLDivElement, IntegrationTileProps>(function IntegrationTile(
  { name, description, logoSrc, status = 'active', statusLabel, lastSync, direction = 'bidirectional', action, className, ...rest },
  ref
) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  const arrow = direction === 'inbound' ? 'arrow-down' : direction === 'outbound' ? 'arrow-up' : 'plug';
  return (
    <div ref={ref} className={cx('kv-integration', className)} {...rest}>
      <span className="kv-integration__logo">{logoSrc ? <img src={logoSrc} alt="" /> : initials}</span>
      <div className="kv-integration__body">
        <div className="kv-integration__head">
          <span className="kv-integration__name">{name}</span>
          <StatusPill status={status} label={statusLabel} />
        </div>
        {description ? <span className="kv-integration__description">{description}</span> : null}
        <div className="kv-integration__meta">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Icon name={arrow} size={12} />
            {direction === 'bidirectional' ? 'Two-way' : direction === 'inbound' ? 'Inbound' : 'Outbound'}
          </span>
          {lastSync ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icon name="clock" size={12} />
              {lastSync}
            </span>
          ) : null}
        </div>
      </div>
      {action ? <div className="kv-integration__action">{action}</div> : null}
    </div>
  );
});
