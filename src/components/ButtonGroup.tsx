import * as React from 'react';
import { cx } from '../utils/cx';

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `Button` or `IconButton` children — they are joined into one seam-free control. */
  children?: React.ReactNode;
  /** Accessible name for the set, e.g. "Quote view". */
  label?: string;
}

/**
 * Joins related buttons into a single segmented control — view switchers, date ranges,
 * a split action. Give every child the same `variant` and `size`, or the seam looks wrong.
 *
 * @example
 * <ButtonGroup label="Pipeline view">
 *   <Button variant="secondary" size="sm">Quotes</Button>
 *   <Button variant="secondary" size="sm">Policies</Button>
 * </ButtonGroup>
 */
export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
  { children, label, className, ...rest },
  ref
) {
  return (
    <div ref={ref} role="group" aria-label={label} className={cx('kv-btn-group', className)} {...rest}>
      {children}
    </div>
  );
});
