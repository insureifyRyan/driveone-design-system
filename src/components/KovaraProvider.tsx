import * as React from 'react';
import { cx } from '../utils/cx';

export type KovaraTheme = 'light' | 'dark';

export interface KovaraProviderProps {
  /** Theme applied to everything inside. Light is the product default. */
  theme?: KovaraTheme;
  /** Stretch the root to the full viewport height — use for app shells. */
  fullHeight?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const ThemeContext = React.createContext<KovaraTheme>('light');

/**
 * Root wrapper for every Kōvara surface. It applies the design system's base
 * typography, canvas color and box-sizing, and sets the theme every component
 * reads its colors from.
 *
 * Wrap your app (or any isolated Kōvara region) in it exactly once per theme:
 * components rendered outside a `KovaraProvider` fall back to the host page's
 * fonts and colors and will look unbranded.
 *
 * @example
 * <KovaraProvider theme="light" fullHeight>
 *   <AppShell />
 * </KovaraProvider>
 */
export const KovaraProvider = ({
  theme = 'light',
  fullHeight = false,
  className,
  style,
  children,
}: KovaraProviderProps) => (
  <ThemeContext.Provider value={theme}>
    <div
      className={cx('kv-root', className)}
      data-kv-theme={theme}
      style={fullHeight ? { minHeight: '100vh', ...style } : style}
    >
      {children}
    </div>
  </ThemeContext.Provider>
);

/** Read the theme of the nearest `KovaraProvider`. */
export const useKovaraTheme = (): KovaraTheme => React.useContext(ThemeContext);
