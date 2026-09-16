/**
 * Tailwind preset for Kōvara product surfaces (Next.js apps included).
 *
 * The design system's own components are plain CSS — this preset is for the layout
 * and one-off styling you write *around* them, so your utilities resolve to the same
 * tokens the components use.
 *
 *   // tailwind.config.ts
 *   import kovara from '@kovara/design-system/tailwind-preset';
 *   export default { presets: [kovara], content: ['./app/**\/*.tsx'] };
 */
const preset = {
  theme: {
    extend: {
      colors: {
        indigo: {
          50: 'var(--kv-indigo-50)',
          100: 'var(--kv-indigo-100)',
          200: 'var(--kv-indigo-200)',
          300: 'var(--kv-indigo-300)',
          400: 'var(--kv-indigo-400)',
          500: 'var(--kv-indigo-500)',
          600: 'var(--kv-indigo-600)',
          700: 'var(--kv-indigo-700)',
          800: 'var(--kv-indigo-800)',
          900: 'var(--kv-indigo-900)',
          950: 'var(--kv-indigo-950)',
        },
        cyan: {
          400: 'var(--kv-cyan-400)',
          500: 'var(--kv-cyan-500)',
          700: 'var(--kv-cyan-700)',
        },
        peri: {
          300: 'var(--kv-peri-300)',
          400: 'var(--kv-peri-400)',
          500: 'var(--kv-peri-500)',
        },
        canvas: 'var(--kv-color-bg-canvas)',
        surface: 'var(--kv-color-bg-surface)',
        subtle: 'var(--kv-color-bg-subtle)',
        brand: 'var(--kv-color-bg-brand)',
        accent: 'var(--kv-color-bg-accent)',
      },
      textColor: {
        primary: 'var(--kv-color-text-primary)',
        secondary: 'var(--kv-color-text-secondary)',
        muted: 'var(--kv-color-text-muted)',
        brand: 'var(--kv-color-text-brand)',
      },
      borderColor: {
        DEFAULT: 'var(--kv-color-border)',
        subtle: 'var(--kv-color-border-subtle)',
        strong: 'var(--kv-color-border-strong)',
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--kv-radius-sm)',
        md: 'var(--kv-radius-md)',
        lg: 'var(--kv-radius-lg)',
        xl: 'var(--kv-radius-xl)',
        '2xl': 'var(--kv-radius-2xl)',
      },
      boxShadow: {
        xs: 'var(--kv-shadow-xs)',
        sm: 'var(--kv-shadow-sm)',
        md: 'var(--kv-shadow-md)',
        lg: 'var(--kv-shadow-lg)',
        xl: 'var(--kv-shadow-xl)',
      },
      spacing: {
        '2xs': 'var(--kv-space-2xs)',
        xs: 'var(--kv-space-xs)',
        sm: 'var(--kv-space-sm)',
        md: 'var(--kv-space-md)',
        lg: 'var(--kv-space-lg)',
        xl: 'var(--kv-space-xl)',
        '2xl': 'var(--kv-space-2xl)',
        '3xl': 'var(--kv-space-3xl)',
      },
    },
  },
};

export default preset;
