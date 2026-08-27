/**
 * Frame renderer. One function per placement, one shared footer, so the four
 * parts of the approved look are structural rather than copied per frame:
 * depth, a real hero object, a structured content column, and an identical
 * footer.
 *
 * Ground handling is the one place this system departs from Vista, and it is
 * deliberate.
 *
 * Vista put its mark on a white tile over bright grounds. The DriveOne logo
 * spec reserves the rounded tile for app icons, so that route is closed. Both
 * problems it solved are instead solved by recolouring:
 *
 *   - the mark is drawn in Ink on the Cyan-Soft ground and in white on Ink,
 *   - the accented headline phrase is Brand Cyan type on Ink, but on Cyan-Soft
 *     it becomes Ink type inside a Brand Cyan block. Brand Cyan text on
 *     Cyan-Soft is roughly 1.9:1 and unreadable; Ink on Brand Cyan is about
 *     7:1. Same three colours, opposite arrangement.
 */
import { mark, hero, type ArtColors } from './art.ts';
import { AD_DISCLOSURE, REELS_SHORT_DISCLOSURE, QUALIFIERS, TRUST_LINE } from '../lib/compliance.ts';
import { carriesCta, type Frame } from './frames.ts';

const CYAN = '#1FBFEC';
const INK = '#0E1B2C';
const SOFT = '#E8F8FE';

interface Ground {
  bg: string;
  fg: string;
  secondary: string;
  rule: string;
  legal: string;
  accent: string;
  /** Cyan type is only legible as type on the ink ground. */
  accentAsBlock: boolean;
  markColor: string;
  bloom: string;
}

const GROUNDS: Record<'ink' | 'daylight', Ground> = {
  ink: {
    bg: INK,
    fg: '#FFFFFF',
    secondary: 'rgba(255,255,255,0.72)',
    rule: 'rgba(255,255,255,0.16)',
    legal: 'rgba(255,255,255,0.82)',
    accent: CYAN,
    accentAsBlock: false,
    markColor: '#FFFFFF',
    bloom: 'rgba(31,191,236,0.22)',
  },
  daylight: {
    bg: SOFT,
    fg: INK,
    secondary: 'rgba(14,27,44,0.68)',
    rule: 'rgba(14,27,44,0.14)',
    legal: 'rgba(14,27,44,0.80)',
    accent: CYAN,
    accentAsBlock: true,
    markColor: INK,
    bloom: 'rgba(31,191,236,0.30)',
  },
};

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const artColors = (g: Ground): ArtColors => ({ fg: g.fg, accent: g.accent, rule: g.rule });

/** The bloom that stops a flat field reading as unfinished. */
function bloom(g: Ground, x: string, y: string, size: number): string {
  return `<div aria-hidden="true" style="position:absolute;${y};${x};width:${size}px;height:${size}px;background:radial-gradient(closest-side,${g.bloom},transparent 72%);pointer-events:none"></div>`;
}

/**
 * Display size steps down on the long headlines. A headline that runs to four
 * lines at 84px stops reading as a headline, and on the Cyan-Soft ground the
 * accent block turns into a ragged stack of coloured boxes.
 */
export function displaySize(f: Frame, base: number): number {
  const chars = (f.concept.headlineLead + f.concept.headlineAccent).replace(/\n/g, '').length;
  if (chars > 48) return Math.round(base * 0.80);
  if (chars > 34) return Math.round(base * 0.90);
  return base;
}

function headline(f: Frame, g: Ground, size: number, maxWidth: number | null): string {
  const lead = esc(f.concept.headlineLead).replace(/\n/g, '<br>');
  const accent = esc(f.concept.headlineAccent).replace(/\n/g, '<br>');
  const width = maxWidth ? `max-width:${maxWidth}px;` : '';
  const leading = g.accentAsBlock ? 1.16 : 0.98;
  const accentMarkup = g.accentAsBlock
    ? `<span data-do-accent style="background:${g.accent};color:${INK};padding:0.04em 0.16em;margin:0 -0.04em;border-radius:8px;box-decoration-break:clone;-webkit-box-decoration-break:clone">${accent}</span>`
    : `<span data-do-accent style="color:${g.accent}">${accent}</span>`;
  return `<h2 style="font:800 ${size}px/${leading} var(--font-display);letter-spacing:-0.038em;color:${g.fg};margin:0;${width}">${lead}${accentMarkup}</h2>`;
}

function eyebrow(f: Frame, g: Ground): string {
  return `<div style="font:600 20px/1 var(--font-body);letter-spacing:0.18em;text-transform:uppercase;color:${g.secondary};min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(f.concept.eyebrow)}</div>`;
}

/**
 * The carrier line. Vista used the Old Republic wordmark; this set uses type.
 * The mark is Old Republic's trademark and there is no record of a use grant
 * covering DriveOne Direct, so the claim is made in words until there is one.
 */
function trustPill(g: Ground): string {
  return `<span style="flex:none;font:600 19px/1 var(--font-body);letter-spacing:0.08em;text-transform:uppercase;color:${g.fg};border:2px solid ${g.accent};border-radius:999px;padding:13px 22px;white-space:nowrap">${TRUST_LINE}</span>`;
}

function featureRows(f: Frame, g: Ground, count: number): string {
  const icon = g.accentAsBlock
    ? `<span style="flex:none;width:56px;height:56px;border-radius:50%;background:${g.accent};display:inline-flex;align-items:center;justify-content:center;font:800 26px/1 var(--font-display);color:${INK}">&#10003;</span>`
    : `<span style="flex:none;width:56px;height:56px;border-radius:50%;border:3px solid ${g.accent};display:inline-flex;align-items:center;justify-content:center;font:800 26px/1 var(--font-display);color:${g.accent}">&#10003;</span>`;
  return f.concept.rows
    .slice(0, count)
    .map(
      (row, i) => `<div style="display:flex;align-items:center;gap:24px;padding:20px 0;${i === 0 ? '' : `border-top:1px solid ${g.rule};`}">
  ${icon}
  <div style="min-width:0">
    <div style="font:700 30px/1.18 var(--font-display);letter-spacing:-0.018em;color:${g.fg}">${esc(row.title)}</div>
    <div style="font:400 23px/1.32 var(--font-body);color:${g.secondary};margin-top:5px">${esc(row.sub)}</div>
  </div>
</div>`,
    )
    .join('\n');
}

function strip(f: Frame, g: Ground): string {
  return `<div style="font:600 23px/1.3 var(--font-body);color:${g.fg};background:${g.accentAsBlock ? 'rgba(31,191,236,0.22)' : 'rgba(31,191,236,0.14)'};border-left:4px solid ${g.accent};padding:16px 22px;border-radius:0 10px 10px 0">${esc(f.concept.strip)}</div>`;
}

/**
 * Claim specific qualifiers. These sit next to their claim rather than in the
 * footer block, which is the rule that survived from the Vista build.
 */
function qualifiers(f: Frame, g: Ground): string {
  const text = f.concept.qualifiers.map((k) => QUALIFIERS[k]).join(' ');
  return `<div style="font:400 19px/1.35 var(--font-body);color:${g.secondary};margin-top:14px">${esc(text)}</div>`;
}

function logoLockup(g: Ground, scale = 1): string {
  const s = (n: number) => Math.round(n * scale);
  return `<div style="display:inline-flex;flex-direction:column;gap:${s(9)}px">
  <div style="display:flex;align-items:center;gap:${s(14)}px">
    ${mark(s(54), g.markColor)}
    <span style="font:800 ${s(46)}px/0.9 var(--font-display);letter-spacing:-0.032em;color:${g.fg}">DriveOne<span style="font-weight:500;color:${g.accentAsBlock ? INK : g.accent};margin-left:${s(9)}px">Direct</span></span>
  </div>
  <span style="font:600 ${s(15)}px/1 var(--font-body);letter-spacing:0.22em;text-transform:uppercase;color:${g.secondary};white-space:nowrap">Extended Service Contract</span>
</div>`;
}

function ctaPill(f: Frame, g: Ground, url: string): string {
  return `<a data-do-cta href="${url}" style="display:inline-flex;align-items:center;gap:16px;background:${g.accent};color:${INK};font:800 32px/1 var(--font-display);letter-spacing:-0.018em;padding:25px 38px;border-radius:999px;text-decoration:none;white-space:nowrap">${esc(f.concept.cta)}<span style="font:700 33px/1">&#8594;</span></a>`;
}

function legal(g: Ground): string {
  return `<div style="font:400 20px/1.38 var(--font-body);color:${g.legal};padding-top:14px;border-top:1px solid ${g.rule}"><b style="font-weight:700">www.driveonedirect.com</b> &#183; ${esc(AD_DISCLOSURE)}</div>`;
}

/** Logo left, cyan CTA pill right, then the disclosure. Identical on every CTA frame. */
function footer(f: Frame, g: Ground, url: string): string {
  return `<div style="display:flex;flex-direction:column;gap:18px;position:relative">
  <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:24px">
    ${logoLockup(g)}
    ${ctaPill(f, g, url)}
  </div>
  ${legal(g)}
</div>`;
}

function canvasOpen(f: Frame, g: Ground, padding: string): string {
  return `<div data-do-ground="${f.direction}" data-do-format="${f.format}" data-do-frame="${f.id}" style="width:${f.width}px;height:${f.height}px;background:${g.bg};position:relative;overflow:hidden;display:flex;flex-direction:column;padding:${padding};color:${g.fg}">`;
}

// ---------------------------------------------------------------------------
// Placements
// ---------------------------------------------------------------------------

function feed(f: Frame, g: Ground, url: string): string {
  // The hero sits below the headline band, not beside it. A 23 character word
  // at display size needs the full 912px column, and sharing the row with a
  // 400px object was forcing two and three word orphan lines.
  return `${canvasOpen(f, g, '60px 84px 52px')}
${bloom(g, 'right:-200px', 'top:300px', 800)}
<div aria-hidden="true" style="position:absolute;top:430px;right:-70px;width:360px;height:360px;color:${g.fg}">
  <div style="width:520px;height:520px;transform:scale(0.692);transform-origin:top left">${hero(f.concept.hero, artColors(g))}</div>
</div>
<div style="display:flex;justify-content:space-between;align-items:center;gap:24px;position:relative">
  ${eyebrow(f, g)}
  ${trustPill(g)}
</div>
<div style="flex:1;display:flex;flex-direction:column;justify-content:center;position:relative">
  ${headline(f, g, displaySize(f, 84), null)}
  <p style="font:400 28px/1.42 var(--font-body);color:${g.secondary};margin:24px 0 0;max-width:640px">${esc(f.concept.support)}</p>
  <div style="height:1px;background:${g.rule};margin:36px 0 4px;max-width:660px"></div>
  <div style="max-width:660px">
    ${featureRows(f, g, 3)}
    <div style="margin-top:20px">${strip(f, g)}</div>
    ${qualifiers(f, g)}
  </div>
</div>
${footer(f, g, url)}
</div>`;
}

function square(f: Frame, g: Ground, url: string): string {
  return `${canvasOpen(f, g, '56px 76px 48px')}
${bloom(g, 'right:-200px', 'top:-70px', 700)}
<div aria-hidden="true" style="position:absolute;top:84px;right:-64px;width:330px;height:330px;color:${g.fg}">
  <div style="width:520px;height:520px;transform:scale(0.635);transform-origin:top left">${hero(f.concept.hero, artColors(g))}</div>
</div>
<div style="position:relative">${eyebrow(f, g)}</div>
<div style="flex:1;display:flex;flex-direction:column;justify-content:center;position:relative">
  ${headline(f, g, displaySize(f, 68), 560)}
  <div style="height:1px;background:${g.rule};margin:30px 0 2px"></div>
  ${featureRows(f, g, 2)}
  ${qualifiers(f, g)}
</div>
${footer(f, g, url)}
</div>`;
}

/** Stories keep everything above the 250px bottom reserve. */
function story(f: Frame, g: Ground, url: string): string {
  return `${canvasOpen(f, g, '120px 84px 250px')}
${bloom(g, 'right:-220px', 'top:120px', 860)}
<div style="position:relative">${eyebrow(f, g)}</div>
<div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:26px;position:relative">
  <div style="width:360px;height:360px;color:${g.fg};align-self:center">
    <div style="width:520px;height:520px;transform:scale(0.692);transform-origin:top left">${hero(f.concept.hero, artColors(g))}</div>
  </div>
  ${headline(f, g, displaySize(f, 78), null)}
  <p style="font:400 29px/1.4 var(--font-body);color:${g.secondary};margin:0">${esc(f.concept.support)}</p>
  <div style="height:1px;background:${g.rule}"></div>
  ${featureRows(f, g, 3)}
  ${qualifiers(f, g)}
</div>
${footer(f, g, url)}
</div>`;
}

/**
 * Reels carry no in image CTA, because Reels supplies its own and covers the
 * bottom third with profile chrome. They carry the short legal line instead of
 * the block, which is exactly why a Reels cut must never run with a truncated
 * caption: the caption is where the full disclosure lives.
 */
function reel(f: Frame, g: Ground): string {
  return `${canvasOpen(f, g, '230px 84px 420px')}
${bloom(g, 'right:-200px', 'top:220px', 820)}
<div style="position:relative">${eyebrow(f, g)}</div>
<div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:30px;position:relative">
  <div style="width:340px;height:340px;color:${g.fg};align-self:center">
    <div style="width:520px;height:520px;transform:scale(0.654);transform-origin:top left">${hero(f.concept.hero, artColors(g))}</div>
  </div>
  ${headline(f, g, displaySize(f, 80), null)}
  <p style="font:400 30px/1.4 var(--font-body);color:${g.secondary};margin:0">${esc(f.concept.support)}</p>
  <div style="height:1px;background:${g.rule}"></div>
  ${featureRows(f, g, 2)}
  ${qualifiers(f, g)}
</div>
<div style="display:flex;flex-direction:column;gap:16px;position:relative">
  ${logoLockup(g)}
  <div style="font:400 20px/1.38 var(--font-body);color:${g.legal};padding-top:12px;border-top:1px solid ${g.rule}">${esc(REELS_SHORT_DISCLOSURE)}</div>
</div>
</div>`;
}

export function renderFrame(f: Frame, url: string): string {
  const g = GROUNDS[f.direction];
  if (f.format === 'feed') return feed(f, g, url);
  if (f.format === 'square') return square(f, g, url);
  if (f.format === 'story') return story(f, g, url);
  return reel(f, g);
}

export { carriesCta };
