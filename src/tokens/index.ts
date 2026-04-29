/**
 * DriveOne Design System – Design Tokens
 *
 * Central source of truth for all design decisions.
 */

export const colors = {
  /** Brand */
  brandPrimary: '#0033A0',
  brandSecondary: '#00C2E0',
  brandAccent: '#FF6200',

  /** Neutrals */
  white: '#FFFFFF',
  grey50: '#F8F9FA',
  grey100: '#F1F3F5',
  grey200: '#E9ECEF',
  grey300: '#DEE2E6',
  grey400: '#CED4DA',
  grey500: '#ADB5BD',
  grey600: '#6C757D',
  grey700: '#495057',
  grey800: '#343A40',
  grey900: '#212529',
  black: '#000000',

  /** Semantic */
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  textInverse: '#FFFFFF',
  backgroundDefault: '#FFFFFF',
  backgroundSubtle: '#F8F9FA',
  borderDefault: '#DEE2E6',
  focusRing: '#0033A0',

  /** Status */
  success: '#28A745',
  warning: '#FFC107',
  error: '#DC3545',
  info: '#17A2B8',
} as const;

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
} as const;

export const typography = {
  fontFamilyBase: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontFamilyMono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",

  fontSizeXs: '0.75rem',
  fontSizeSm: '0.875rem',
  fontSizeMd: '1rem',
  fontSizeLg: '1.125rem',
  fontSizeXl: '1.25rem',
  fontSize2xl: '1.5rem',
  fontSize3xl: '1.875rem',
  fontSize4xl: '2.25rem',

  fontWeightRegular: '400',
  fontWeightMedium: '500',
  fontWeightSemibold: '600',
  fontWeightBold: '700',

  lineHeightTight: '1.25',
  lineHeightNormal: '1.5',
  lineHeightRelaxed: '1.75',

  letterSpacingTight: '-0.025em',
  letterSpacingNormal: '0',
  letterSpacingWide: '0.025em',
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  none: 'none',
} as const;

export const aspectRatios = {
  '16/9': '16 / 9',
  '4/3': '4 / 3',
  '1/1': '1 / 1',
  '9/16': '9 / 16',
  '21/9': '21 / 9',
} as const;

export const zIndex = {
  hide: -1,
  base: 0,
  raised: 10,
  dropdown: 100,
  overlay: 200,
  modal: 300,
  toast: 400,
  tooltip: 500,
} as const;

export const transitions = {
  durationFast: '100ms',
  durationBase: '200ms',
  durationSlow: '300ms',
  easingDefault: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easingIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easingOut: 'cubic-bezier(0, 0, 0.2, 1)',
} as const;

const tokens = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  aspectRatios,
  zIndex,
  transitions,
};

export default tokens;
