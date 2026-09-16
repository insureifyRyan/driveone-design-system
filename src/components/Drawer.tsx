import * as React from 'react';
import { cx } from '../utils/cx';
import { Icon } from './Icon';
import { IconButton } from './IconButton';

export interface DrawerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  open?: boolean;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Which edge it slides from. Right is the default for detail panels. */
  side?: 'right' | 'left';
  size?: 'sm' | 'md' | 'lg';
  footer?: React.ReactNode;
  onClose?: () => void;
  children?: React.ReactNode;
}

/**
 * A side panel for detail and multi-field work that must keep the list behind it in
 * view — inspecting a quote from the pipeline, editing a workflow step, reviewing a
 * call transcript. Use `Modal` when the user must decide before anything else happens.
 *
 * @example
 * <Drawer open title="Quote KV-Q-8841" description="Centurion Mutual · 36 months"
 *   footer={<Button fullWidth>Send to customer</Button>}>
 *   <DescriptionList items={items} columns={1} />
 * </Drawer>
 */
export const Drawer = React.forwardRef<HTMLDivElement, DrawerProps>(function Drawer(
  { open = false, title, description, side = 'right', size = 'md', footer, onClose, className, children, ...rest },
  ref
) {
  if (!open) return null;
  return (
    <div className={cx('kv-drawer-overlay', `kv-drawer-overlay--${side}`)} onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className={cx('kv-drawer', `kv-drawer--${size}`, className)}
        onClick={(e) => e.stopPropagation()}
        {...rest}
      >
        <div className="kv-drawer__header">
          <div>
            {title ? <h2 className="kv-drawer__title">{title}</h2> : null}
            {description ? <span className="kv-drawer__description">{description}</span> : null}
          </div>
          <IconButton icon={<Icon name="x" size={16} />} label="Close" size="sm" onClick={onClose} />
        </div>
        <div className="kv-drawer__body">{children}</div>
        {footer ? <div className="kv-drawer__footer">{footer}</div> : null}
      </div>
    </div>
  );
});
