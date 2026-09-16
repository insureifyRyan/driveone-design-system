import * as React from 'react';
import { cx } from '../utils/cx';

export interface SkeletonProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** `text` for copy lines, `rect` for cards and charts, `circle` for avatars. */
  shape?: 'text' | 'rect' | 'circle';
  width?: number | string;
  height?: number | string;
  /** Repeat as N stacked lines — only meaningful for `text`. */
  lines?: number;
}

/**
 * Loading placeholder shaped like the content that is coming. Prefer it over a spinner
 * for lists and dashboards — carrier round-trips are slow enough that layout stability
 * matters more than a progress hint.
 *
 * @example
 * <Skeleton shape="text" lines={3} />
 */
export const Skeleton = React.forwardRef<HTMLSpanElement, SkeletonProps>(function Skeleton(
  { shape = 'text', width, height, lines = 1, className, style, ...rest },
  ref
) {
  const base = (key?: number, w?: number | string) => (
    <span
      key={key}
      className={cx('kv-skeleton', `kv-skeleton--${shape}`, className)}
      style={{ width: w ?? width ?? '100%', height, ...style }}
      aria-hidden="true"
      {...(key === undefined ? rest : {})}
    />
  );
  if (shape === 'text' && lines > 1) {
    return (
      <span ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }} {...rest}>
        {Array.from({ length: lines }, (_, i) => base(i, i === lines - 1 ? '65%' : undefined))}
      </span>
    );
  }
  return <span ref={ref as React.Ref<HTMLSpanElement>}>{base()}</span>;
});
