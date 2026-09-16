import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts', 'tailwind-preset': 'src/tailwind-preset.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: false,
  clean: false,
  treeshake: true,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  outDir: 'dist',
});
