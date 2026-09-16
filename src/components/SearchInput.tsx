import * as React from 'react';
import { cx } from '../utils/cx';
import { Icon } from './Icon';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  size?: 'sm' | 'md' | 'lg';
  /** Accessible name. Defaults to "Search". */
  label?: string;
  /** Keyboard hint rendered at the right edge, e.g. "⌘K". */
  shortcut?: string;
}

/**
 * The search control used in the top bar and above every list — policies, quotes,
 * claims, dealers. Label-less by design; the magnifier and placeholder carry the meaning.
 *
 * @example
 * <SearchInput placeholder="Search policies, VINs, claim IDs…" shortcut="⌘K" />
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { size = 'md', label = 'Search', shortcut, className, placeholder = 'Search…', ...rest },
  ref
) {
  return (
    <span className="kv-input-wrap" style={{ width: '100%' }}>
      <span className="kv-input-wrap__affix kv-input-wrap__affix--start">
        <Icon name="search" size={16} />
      </span>
      <input
        ref={ref}
        type="search"
        aria-label={label}
        placeholder={placeholder}
        className={cx('kv-input', `kv-input--${size}`, 'kv-input--has-start', shortcut && 'kv-input--has-end', className)}
        {...rest}
      />
      {shortcut ? (
        <span className="kv-input-wrap__affix kv-input-wrap__affix--end" style={{ fontFamily: 'var(--kv-font-mono)', fontSize: 11 }}>
          {shortcut}
        </span>
      ) : null}
    </span>
  );
});
