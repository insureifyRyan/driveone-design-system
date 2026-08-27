/**
 * Export the ad creatives from the design canvas at true pixel size.
 *
 *   node --experimental-strip-types scripts/export-ads.mts
 *
 * Renders design/DriveOneDirectAds.dc.html in Chromium, strips the gallery
 * chrome, un-scales each canvas and screenshots it. Run `npm run canvas:build`
 * first, or use `npm run ads:export`, which does both.
 *
 * Needs a Chromium: `npx playwright install chromium`, or set CHROMIUM_PATH to
 * one that is already on disk.
 *
 * Fonts: the canvas pulls Inter Tight and Inter from Google Fonts, which is all
 * a normal machine needs. If ads/fonts/ contains the woff2 files, they are
 * injected instead, for building somewhere with no access to
 * fonts.googleapis.com. Without either, the export falls back to a system face
 * and is NOT usable.
 */
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

/**
 * Supersampling factor. 1 gives the spec's true pixel size (1080 wide); 2 gives
 * a 2x master, which is what Meta wants uploaded: it downsamples better than we
 * can, and the extra pixels show on a high-DPI phone.
 *
 * Unlike the Vista set, nothing here caps sharpness. Every mark and every hero
 * object is vector drawn in the canvas itself, so there is no raster asset to
 * upscale past its native resolution. 2x, 3x and 4x are all clean.
 */
const SCALE = Number(process.env.EXPORT_SCALE ?? 1);
const SOURCE = join(ROOT, 'design', 'DriveOneDirectAds.dc.html');
const OUT = SCALE === 1 ? join(ROOT, 'ads') : join(ROOT, 'ads', `${SCALE}x`);
const FONT_DIR = join(ROOT, 'ads', 'fonts');

/**
 * Held back from the launch set. Empty today. Add a frame id here rather than
 * deleting it from the canvas, so a frame that is not ready stays reviewable.
 */
const EXCLUDED = new Set<string>([]);

function localFontCss(): string {
  if (!existsSync(FONT_DIR)) return '';
  return readdirSync(FONT_DIR)
    .filter((file) => file.endsWith('.woff2'))
    .map((file) => {
      const weight = /-(\d{3})-/.exec(file)?.[1] ?? '400';
      const family = file.startsWith('inter-tight') ? 'Inter Tight' : 'Inter';
      return `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};font-display:block;src:url("file://${join(FONT_DIR, file)}") format("woff2");}`;
    })
    .join('\n');
}

/** Every ad canvas is a div with an explicit 1080px width, scaled down for the gallery. */
const COLLECT = () => {
  const LABEL = /^([ABSRVP]\d)\s*[·—-]\s*(.+)$/;
  const frames: { index: number; width: number; height: number; id: string | null; label: string | null }[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  let node: Node | null = walker.currentNode;
  while (node) {
    const el = node as Element;
    const style = el.getAttribute?.('style') ?? '';
    if (/width:\s*1080px/.test(style)) {
      const height = Number(/height:\s*(\d+)px/.exec(style)?.[1] ?? 0);
      frames.push({ index: frames.length, width: 1080, height, id: null, label: null });
    } else if (el.children?.length === 0 && frames.length) {
      const match = LABEL.exec((el.textContent ?? '').trim());
      const current = frames[frames.length - 1];
      if (match && !current.id) {
        current.id = match[1];
        current.label = (el.textContent ?? '').trim();
      }
    }
    node = walker.nextNode();
  }
  return frames;
};

/**
 * Safe-area check, run on the isolated canvas.
 *
 * Every canvas sets its own bottom padding, and for the vertical placements
 * that padding IS the reserve: 250px on Stories, 420px on Reels, where the
 * platform's own chrome sits. If the content column outgrows the canvas it
 * silently spills into that band and nothing about the PNG says so. This
 * measures the deepest laid-out child against the padding box and fails the
 * export rather than shipping a frame with its disclosure under the Reels CTA.
 */
const MEASURE = () => {
  const el = document.querySelector('[data-do-frame]') as HTMLElement | null;
  if (!el) return null;
  const style = getComputedStyle(el);
  const reserve = parseFloat(style.paddingBottom) || 0;
  const top = el.getBoundingClientRect().top;
  let deepest = 0;
  for (const child of [...el.children]) {
    const box = (child as HTMLElement).getBoundingClientRect();
    // The bloom and the bleeding hero are absolutely positioned decoration.
    if (getComputedStyle(child as HTMLElement).position === 'absolute') continue;
    deepest = Math.max(deepest, box.bottom - top);
  }
  return { deepest: Math.round(deepest), limit: Math.round(el.offsetHeight - reserve), reserve: Math.round(reserve) };
};

/** Pull one canvas out of the gallery, un-scaled, alone on the page. */
const ISOLATE = (index: number) => {
  const canvases = [...document.querySelectorAll('div')].filter((d) =>
    /width:\s*1080px/.test(d.getAttribute('style') ?? ''),
  );
  const el = canvases[index];
  if (!el) return false;
  document.body.querySelectorAll('style, link[rel="stylesheet"]').forEach((n) => document.head.appendChild(n));
  el.style.transform = 'none';
  el.style.position = 'absolute';
  el.style.top = '0';
  el.style.left = '0';
  document.body.appendChild(el);
  [...document.body.children].forEach((child) => { if (child !== el) child.remove(); });
  document.body.setAttribute('style', 'margin:0;padding:0;background:#ffffff');
  document.documentElement.setAttribute('style', 'margin:0;padding:0');
  return true;
};

mkdirSync(OUT, { recursive: true });
const fontCss = localFontCss();
console.log(fontCss ? 'using local fonts from ads/fonts' : 'using Google Fonts (needs network)');
console.log(`exporting at ${SCALE}x -> ${OUT}`);

// CHROMIUM_PATH lets this run where a browser is already installed at a known
// location instead of Playwright's own download (CI images, sandboxes).
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--force-color-profile=srgb', '--disable-lcd-text'],
});
const page = await browser.newPage({
  viewport: { width: 1600, height: 1200 },
  deviceScaleFactor: SCALE,
});

/**
 * Rendering hints applied to every frame.
 *
 * `antialiased` turns off subpixel AA, which is what you want for an image that
 * will be composited on unknown backgrounds — subpixel fringing survives the
 * export as coloured edges. `geometricPrecision` stops Chromium rounding glyph
 * advances to whole pixels, so tracked display type keeps its intended spacing
 * instead of drifting.
 */
const RENDER_HINTS = `
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: geometricPrecision;
  }
  img { image-rendering: high-quality; }
`;

async function load(): Promise<void> {
  await page.goto(`file://${SOURCE}`, { waitUntil: 'load' });
  if (fontCss) await page.addStyleTag({ content: fontCss });
  await page.addStyleTag({ content: RENDER_HINTS });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
}

await load();
const frames = await page.evaluate(COLLECT);
console.log(`${frames.length} canvases found`);

const exported: { id: string; width: number; height: number; label: string; file: string; cta: boolean }[] = [];
const overflows: string[] = [];

for (const frame of frames) {
  if (!frame.id) continue;
  if (EXCLUDED.has(frame.id)) {
    console.log(`skip ${frame.id}, excluded from the launch set`);
    continue;
  }

  await load();
  if (!(await page.evaluate(ISOLATE, frame.index))) continue;
  await page.setViewportSize({ width: frame.width, height: Math.min(frame.height, 4000) });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);

  const fit = await page.evaluate(MEASURE);
  if (fit && fit.deepest > fit.limit) {
    overflows.push(`${frame.id}: content runs ${fit.deepest - fit.limit}px past the safe area (content ${fit.deepest}, limit ${fit.limit}, reserve ${fit.reserve})`);
  }
  await page.screenshot({
    path: join(OUT, `${frame.id}.png`),
    clip: { x: 0, y: 0, width: frame.width, height: frame.height },
  });

  exported.push({
    id: frame.id,
    width: frame.width * SCALE,
    height: frame.height * SCALE,
    label: frame.label ?? '',
    file: `${frame.id}.png`,
    // Reels carry no CTA, so the monthly destination check skips them.
    cta: !frame.id.startsWith('V'),
  });
  console.log(`exported ${frame.id}  ${frame.width * SCALE}×${frame.height * SCALE}`);
}

writeFileSync(join(OUT, 'frames.json'), JSON.stringify(exported, null, 2) + '\n');
await browser.close();
console.log(`\n${exported.length} creatives written to ${OUT}`);

if (overflows.length) {
  console.error(`\n${overflows.length} frame(s) overflow their safe area:`);
  for (const line of overflows) console.error(`  ${line}`);
  process.exit(1);
}
console.log('all frames fit inside their safe areas');
