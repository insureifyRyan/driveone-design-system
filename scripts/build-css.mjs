/**
 * Kōvara design system — stylesheet build.
 *
 * Emits two stylesheets from src/styles/:
 *   dist/kovara.css            full sheet for apps: @font-face + tokens + base + components
 *   dist/kovara-components.css same sheet WITHOUT @font-face, for tooling that ships
 *                              fonts separately (design-sync's cssEntry)
 * and copies the self-hosted woff2 files to dist/fonts/.
 */
import { mkdir, readFile, writeFile, readdir, copyFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const styles = join(root, 'src', 'styles');
const dist = join(root, 'dist');

const TOKENS = ['palette.css', 'typography.css', 'layout.css', 'theme.css'];
const COMPONENTS = [
  'brand.css',
  'actions.css',
  'forms.css',
  'data.css',
  'feedback.css',
  'navigation.css',
  'overlay.css',
  'platform.css',
];

const banner = `/*!
 * Kōvara AI Design System v${JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).version}
 * Agentic infrastructure for insurance and financial services.
 * Tokens are CSS custom properties prefixed --kv-; component classes are prefixed .kv-.
 */\n`;

async function readAll(dir, files) {
  const out = [];
  for (const f of files) out.push(`/* ── ${f} ── */\n` + (await readFile(join(dir, f), 'utf8')).trim());
  return out.join('\n\n');
}

const tokens = await readAll(join(styles, 'tokens'), TOKENS);
const base = (await readFile(join(styles, 'base.css'), 'utf8')).trim();
const components = await readAll(join(styles, 'components'), COMPONENTS);
const fonts = (await readFile(join(styles, 'fonts.css'), 'utf8')).trim();

const core = [tokens, base, components].join('\n\n') + '\n';

await rm(join(dist, 'fonts'), { recursive: true, force: true });
await mkdir(join(dist, 'fonts'), { recursive: true });
await writeFile(join(dist, 'kovara.css'), banner + fonts + '\n\n' + core);
await writeFile(join(dist, 'kovara-components.css'), banner + core);

let copied = 0;
for (const file of await readdir(join(styles, 'fonts'))) {
  if (!file.endsWith('.woff2')) continue;
  await copyFile(join(styles, 'fonts', file), join(dist, 'fonts', file));
  copied += 1;
}

console.log(`css: dist/kovara.css + dist/kovara-components.css, ${copied} font files`);
