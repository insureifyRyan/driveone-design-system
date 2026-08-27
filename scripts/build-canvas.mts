/**
 * Build design/DriveOneDirectAds.dc.html from the frame data.
 *
 *   node --experimental-strip-types scripts/build-canvas.mts
 *
 * The canvas is generated rather than hand written so the identical footer is
 * structurally identical, the disclosure comes from one constant, and the offer
 * facts rotate from one table. Editing the HTML by hand will be overwritten;
 * edit src/creative/ instead.
 */
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { FRAMES, carriesCta, type Frame } from '../src/creative/frames.ts';
import { renderFrame } from '../src/creative/render.ts';
import { frameUrl } from '../src/lib/destination.ts';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, 'design', 'DriveOneDirectAds.dc.html');

/** Gallery preview scale per placement, so a tall frame still fits on screen. */
const PREVIEW: Record<Frame['format'], number> = {
  feed: 0.62,
  square: 0.62,
  story: 0.35,
  reel: 0.35,
};

function card(f: Frame): string {
  const scale = PREVIEW[f.format];
  const w = Math.round(f.width * scale);
  const h = Math.round(f.height * scale);
  const url = carriesCta(f) ? frameUrl(f.id) : '';
  const inner = renderFrame(f, url).replace(
    /^<div data-do-ground/,
    `<div data-do-ground`,
  );
  // The canvas is scaled for the gallery; the exporter un-scales it before
  // screenshotting, so the transform here never reaches an exported PNG.
  const scaled = inner.replace(
    /position:relative;overflow:hidden/,
    `position:relative;overflow:hidden;transform:scale(${scale});transform-origin:top left`,
  );
  return `<div style="display:flex;flex-direction:column;gap:10px">
<div style="width:${w}px;height:${h}px;overflow:hidden;border-radius:12px;box-shadow:0 14px 34px rgba(14,27,44,0.18)">
${scaled}
</div>
<div style="font:700 16px/1.35 var(--font-body);color:#3A4657">${f.id} &#183; ${f.concept.name}${carriesCta(f) ? '' : ' (Reels, no in-image CTA)'}</div>
</div>`;
}

function section(title: string, note: string, frames: Frame[], id: string, minWidth: number): string {
  return `<div id="${id}" style="display:flex;align-items:baseline;gap:16px;margin:34px 0 6px;padding-bottom:12px;border-bottom:1px solid #C9D6DE">
<h2 style="font:800 20px/1 var(--font-display);letter-spacing:-0.02em;color:#0E1B2C;margin:0">${title}</h2>
<span style="font:400 14px/1.4 var(--font-body);color:#5B6B7A">${note}</span>
</div>
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(${minWidth}px,1fr));gap:36px;margin-top:24px">
${frames.map(card).join('\n')}
</div>`;
}

const A = FRAMES.filter((f) => f.id.startsWith('A'));
const B = FRAMES.filter((f) => f.id.startsWith('B'));
const OTHER = FRAMES.filter((f) => /^[SRV]/.test(f.id));

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<!-- @template name="DriveOne Direct Ads (IG / FB)" description="Twenty-three direct-to-consumer paid-social creatives across two directions and four placements." -->
<helmet>
<script src="./ds-base.js"></script>
<script src="./image-slot.js"></script>
<style>body{margin:0;background:#F2F6F8}</style>
<style>
/* Presentation lifts, applied at export. The hooks are structural
   (data-do-ground) so nothing lands on a frame where it would be wrong. */

/* Cyan reads flat printed straight onto Ink. A wide, low opacity bloom makes it
   luminous without lightening the glyphs. On the Cyan-Soft ground the accent is
   a block rather than type, so it must not get a text shadow. */
[data-do-ground="ink"] [data-do-accent] {
  text-shadow: 0 0 26px rgba(31, 191, 236, 0.38), 0 0 62px rgba(31, 191, 236, 0.15);
}

/* Give the CTA a body: a lit top edge and a cast shadow in its own hue, so it
   reads as a physical control rather than a coloured rectangle. Softer on the
   bright ground, where a heavy shadow would look dirty. */
[data-do-cta] {
  box-shadow:
    0 14px 34px rgba(31, 191, 236, 0.34),
    0 2px 6px rgba(14, 27, 44, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.45);
}
[data-do-ground="daylight"] [data-do-cta] {
  box-shadow:
    0 12px 26px rgba(14, 27, 44, 0.18),
    0 2px 5px rgba(14, 27, 44, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.30);
}

/* The drawn tracking still reads loose above 96px. */
[data-do-format="story"] h2, [data-do-format="reel"] h2 {
  letter-spacing: -0.044em;
}
</style>
</helmet>
<div style="padding:28px 32px 48px;font-family:var(--font-body)">
<div style="max-width:1720px;margin:0 auto">
<div style="font:700 13px/1 var(--font-display);letter-spacing:0.16em;text-transform:uppercase;color:#5B6B7A">DriveOne Direct &#183; Vehicle service contracts &#183; Paid social</div>
<h1 style="font:800 30px/1.1 var(--font-display);letter-spacing:-0.03em;color:#0E1B2C;margin:10px 0 6px">Direct-to-consumer ad set</h1>
<p style="font:400 15px/1.5 var(--font-body);color:#41505E;padding-top:14px;border-top:1px solid rgba(14,27,44,0.14);max-width:900px;margin:0">Twenty-three creatives: fourteen feed ads at 1080&#215;1350 (4:5) running seven concepts through two directions, three square at 1080&#215;1080, three Stories and three Reels at 1080&#215;1920. Twenty of them carry the same <b>Get your quote</b> CTA pointing at <b>www.driveonedirect.com</b> with per-ad UTMs; the three Reels cuts omit it on purpose, because Reels supplies its own CTA chrome. Feed and square shown at 62%, Stories and Reels at 35%. All export at true pixel size.</p>
<div style="display:flex;gap:20px;margin-top:14px"><a href="#dir-a" style="font:700 15px/1 var(--font-display);color:#1189B4;text-decoration:none">1 &#183; Ink (A1&#8211;A7)</a><a href="#dir-b" style="font:700 15px/1 var(--font-display);color:#1189B4;text-decoration:none">2 &#183; Daylight (B1&#8211;B7)</a><a href="#dir-c" style="font:700 15px/1 var(--font-display);color:#1189B4;text-decoration:none">3 &#183; Other placements</a></div>
${section('Direction A &#8212; Ink', 'Ink ground, cyan bloom behind a rendered part, hairline rules, one cyan accent phrase. Reads institutional.', A, 'dir-a', 670)}
${section('Direction B &#8212; Daylight', 'Cyan-Soft ground, Ink type, the accent phrase set as Ink inside a cyan block because cyan type on Cyan-Soft is illegible.', B, 'dir-b', 670)}
${section('Other placements', 'Square for right column and Marketplace, Stories above the 250px bottom reserve, Reels with no in-image CTA.', OTHER, 'dir-c', 400)}
</div>
</div>
</x-dc>
</body>
</html>
`;

writeFileSync(OUT, html);
console.log(`wrote ${OUT}`);
console.log(`${FRAMES.length} frames, ${FRAMES.filter(carriesCta).length} carrying a CTA`);
