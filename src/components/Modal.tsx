import * as React from 'react';
import { cx } from '../utils/cx';
import { Icon } from './Icon';
import { IconButton } from './IconButton';

export interface ModalProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Whether the dialog is rendered. */
  open?: boolean;
  /** Dialog heading — name the decision, not the screen. */
  title?: React.ReactNode;
  /** One line of context under the title. */
  description?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Action row, primary last. */
  footer?: React.ReactNode;
  /** Called by the close button and the scrim. */
  onClose?: () => void;
  /** Hide the × — for dialogs that require an explicit choice. */
  hideCloseButton?: boolean;
  children?: React.ReactNode;
}

/**
 * A focused decision on top of the page — bind confirmation, cancel-policy warning,
 * a short form. Anything longer than a few fields belongs in a `Drawer` or its own page.
 *
 * This component renders inline (no portal) so it composes in any layout; place it at
 * the root of your page tree when you need it above everything.
 *
 * @example
 * <Modal open title="Bind this quote?" description="This issues the contract and charges the dealer account."
 *   footer={<><Button variant="secondary">Cancel</Button><Button>Bind policy</Button></>}>
 *   Centurion Mutual · 36 months · $1,842 total
 * </Modal>
 */
export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(function Modal(
  { open = false, title, description, size = 'md', footer, onClose, hideCloseButton = false, className, children, ...rest },
  ref
) {
  if (!open) return null;
  return (
    <div className="kv-overlay" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className={cx('kv-modal', `kv-modal--${size}`, className)}
        onClick={(e) => e.stopPropagation()}
        {...rest}
      >
        {title || !hideCloseButton ? (
          <div className="kv-modal__header">
            <div className="kv-modal__titles">
              {title ? <h2 className="kv-modal__title">{title}</h2> : null}
              {description ? <span className="kv-modal__description">{description}</span> : null}
            </div>
            {!hideCloseButton ? <IconButton icon={<Icon name="x" size={16} />} label="Close" size="sm" onClick={onClose} /> : null}
          </div>
        ) : null}
        <div className="kv-modal__body">{children}</div>
        {footer ? <div className="kv-modal__footer">{footer}</div> : null}
      </div>
    </div>
  );
});
