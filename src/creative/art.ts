/**
 * Vector art for the DriveOne Direct ad set.
 *
 * Everything here is drawn, not photographed. The design system asks for "a
 * real hero object: a device screen, a rendered part, or licensed photography"
 * and explicitly forbids salvaged crops from previous ads. No stock licence was
 * available for this build, so every hero is a rendered part in the three
 * colour system. Each one is a technical line drawing inside a circular port,
 * which keeps the set reading as one campaign.
 *
 * All art takes its colour from `currentColor` plus one accent, so a frame can
 * be recoloured for the ink ground or the Cyan-Soft ground without a second
 * asset. That is also how the mark solves the bright ground problem: the logo
 * spec reserves the rounded tile for app icons, so the mark cannot sit on a
 * white tile the way the Vista mark did. It is redrawn in Ink instead.
 */

export interface ArtColors {
  /** Line work and type colour on this ground. */
  fg: string;
  /** The single accent. Brand Cyan on ink, Brand Cyan on soft. */
  accent: string;
  /** Hairline / secondary structure. */
  rule: string;
}

/**
 * The DriveOne mark: a D whose counter is a right pointing arrow.
 * Tile-less by construction, single colour, so it inherits the ground.
 */
export function mark(size: number, color: string): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" aria-label="DriveOne" role="img" style="display:block;flex:none">
  <path fill-rule="evenodd" clip-rule="evenodd" fill="${color}" d="M14 12 H60 C96 12 112 33 112 60 C112 87 96 108 60 108 H14 Z M36 50 H62 V28 L98 60 L62 92 V70 H36 Z"/>
</svg>`;
}

const PORT = (inner: string, c: ArtColors, glow: boolean) => `
<svg width="520" height="520" viewBox="0 0 520 520" fill="none" role="img" style="display:block">
  <circle cx="260" cy="260" r="248" stroke="${c.rule}" stroke-width="2"/>
  <circle cx="260" cy="260" r="206" stroke="${c.rule}" stroke-width="2"/>
  ${glow ? `<circle cx="260" cy="260" r="150" fill="${c.accent}" opacity="0.10"/>` : ''}
  ${inner}
</svg>`;

/** A1 — the gauge that has run past the end of its marked zone. */
function gauge(c: ArtColors): string {
  const ticks: string[] = [];
  for (let i = 0; i <= 20; i += 1) {
    const a = (Math.PI * 0.78) + (i / 20) * (Math.PI * 1.44);
    const long = i % 5 === 0;
    const r1 = long ? 132 : 144;
    const r2 = 160;
    const x1 = 260 + Math.cos(a) * r1;
    const y1 = 260 + Math.sin(a) * r1;
    const x2 = 260 + Math.cos(a) * r2;
    const y2 = 260 + Math.sin(a) * r2;
    // The last quarter of the sweep is the part the factory warranty no longer covers.
    const col = i > 14 ? c.accent : c.fg;
    ticks.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${col}" stroke-width="${long ? 7 : 4}" stroke-linecap="round"/>`);
  }
  return PORT(`
    ${ticks.join('\n    ')}
    <path d="M141 200 A150 150 0 0 1 379 200" stroke="${c.rule}" stroke-width="3" fill="none"/>
    <path d="M260 260 L352 176" stroke="${c.accent}" stroke-width="12" stroke-linecap="round"/>
    <circle cx="260" cy="260" r="20" fill="${c.accent}"/>
    <circle cx="260" cy="260" r="34" stroke="${c.fg}" stroke-width="5"/>
    <rect x="196" y="320" width="128" height="46" rx="8" stroke="${c.fg}" stroke-width="5"/>
    <g fill="${c.fg}">
      <rect x="210" y="335" width="14" height="16" rx="2"/>
      <rect x="232" y="335" width="14" height="16" rx="2"/>
      <rect x="254" y="335" width="14" height="16" rx="2"/>
      <rect x="276" y="335" width="14" height="16" rx="2"/>
    </g>
    <rect x="296" y="335" width="14" height="16" rx="2" fill="${c.accent}"/>
  `, c, true);
}

/** A2 — meshing gear cluster. */
function gears(c: ArtColors): string {
  const teeth = (cx: number, cy: number, r: number, n: number, col: string, w: number) => {
    const out: string[] = [];
    for (let i = 0; i < n; i += 1) {
      const a = (i / n) * Math.PI * 2;
      const x1 = cx + Math.cos(a) * r;
      const y1 = cy + Math.sin(a) * r;
      const x2 = cx + Math.cos(a) * (r + 26);
      const y2 = cy + Math.sin(a) * (r + 26);
      out.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`);
    }
    return out.join('\n    ');
  };
  return PORT(`
    ${teeth(206, 224, 108, 16, c.fg, 15)}
    <circle cx="206" cy="224" r="108" stroke="${c.fg}" stroke-width="8"/>
    <circle cx="206" cy="224" r="44" stroke="${c.fg}" stroke-width="7"/>
    <circle cx="206" cy="224" r="14" fill="${c.fg}"/>
    ${teeth(346, 340, 68, 12, c.accent, 13)}
    <circle cx="346" cy="340" r="68" stroke="${c.accent}" stroke-width="8"/>
    <circle cx="346" cy="340" r="27" stroke="${c.accent}" stroke-width="6"/>
    <circle cx="346" cy="340" r="9" fill="${c.accent}"/>
  `, c, true);
}

/** A3 — a phone showing a three step checkout, no human on the other end. */
function phone(c: ArtColors): string {
  return PORT(`
    <rect x="164" y="86" width="192" height="348" rx="30" stroke="${c.fg}" stroke-width="8"/>
    <rect x="182" y="118" width="156" height="284" rx="12" stroke="${c.rule}" stroke-width="3"/>
    <rect x="232" y="98" width="56" height="8" rx="4" fill="${c.fg}"/>
    <rect x="200" y="140" width="86" height="12" rx="6" fill="${c.rule}"/>
    <g>
      <circle cx="212" cy="196" r="16" fill="${c.accent}"/>
      <rect x="240" y="188" width="80" height="10" rx="5" fill="${c.rule}"/>
      <circle cx="212" cy="248" r="16" fill="${c.accent}"/>
      <rect x="240" y="240" width="66" height="10" rx="5" fill="${c.rule}"/>
      <circle cx="212" cy="300" r="16" fill="${c.accent}"/>
      <rect x="240" y="292" width="74" height="10" rx="5" fill="${c.rule}"/>
    </g>
    <rect x="200" y="344" width="120" height="40" rx="20" fill="${c.accent}"/>
  `, c, true);
}

/** A4 — water pump impeller, the part nobody plans for. */
function impeller(c: ArtColors): string {
  const vanes: string[] = [];
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    const x1 = 260 + Math.cos(a) * 44;
    const y1 = 260 + Math.sin(a) * 44;
    const x2 = 260 + Math.cos(a + 0.5) * 128;
    const y2 = 260 + Math.sin(a + 0.5) * 128;
    vanes.push(`<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} Q ${(260 + Math.cos(a + 0.18) * 96).toFixed(1)} ${(260 + Math.sin(a + 0.18) * 96).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${i === 0 ? c.accent : c.fg}" stroke-width="13" stroke-linecap="round" fill="none"/>`);
  }
  return PORT(`
    <circle cx="260" cy="260" r="150" stroke="${c.fg}" stroke-width="8"/>
    ${vanes.join('\n    ')}
    <circle cx="260" cy="260" r="44" stroke="${c.fg}" stroke-width="8"/>
    <circle cx="260" cy="260" r="16" fill="${c.accent}"/>
    <g stroke="${c.rule}" stroke-width="5">
      <circle cx="260" cy="110" r="9"/><circle cx="410" cy="260" r="9"/>
      <circle cx="260" cy="410" r="9"/><circle cx="110" cy="260" r="9"/>
    </g>
  `, c, true);
}

/** A5 — a socket, the shop's tool rather than ours. */
function socket(c: ArtColors): string {
  const hex = (cx: number, cy: number, r: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      pts.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`);
    }
    return pts.join(' ');
  };
  return PORT(`
    <circle cx="260" cy="260" r="150" stroke="${c.fg}" stroke-width="9"/>
    <circle cx="260" cy="260" r="118" stroke="${c.rule}" stroke-width="4"/>
    <polygon points="${hex(260, 260, 92)}" stroke="${c.accent}" stroke-width="12" fill="none" stroke-linejoin="round"/>
    <polygon points="${hex(260, 260, 52)}" stroke="${c.rule}" stroke-width="4" fill="none" stroke-linejoin="round"/>
    <g stroke="${c.fg}" stroke-width="8" stroke-linecap="round">
      <line x1="260" y1="110" x2="260" y2="80"/>
      <line x1="410" y1="260" x2="440" y2="260"/>
      <line x1="260" y1="410" x2="260" y2="440"/>
      <line x1="110" y1="260" x2="80" y2="260"/>
    </g>
  `, c, true);
}

/** A6 — tow hook. */
function towHook(c: ArtColors): string {
  return PORT(`
    <g stroke="${c.rule}" stroke-width="7" fill="none">
      <ellipse cx="260" cy="104" rx="30" ry="20"/>
      <ellipse cx="260" cy="146" rx="30" ry="20"/>
    </g>
    <line x1="260" y1="166" x2="260" y2="216" stroke="${c.fg}" stroke-width="16" stroke-linecap="round"/>
    <circle cx="260" cy="234" r="26" stroke="${c.fg}" stroke-width="12" fill="none"/>
    <path d="M260 260 L260 322 C260 396 372 400 372 322 C372 300 356 292 344 300"
          stroke="${c.accent}" stroke-width="20" stroke-linecap="round" fill="none"/>
    <circle cx="344" cy="300" r="11" fill="${c.accent}"/>
  `, c, true);
}

/** A7 — a calendar with the thirtieth day ringed. */
function calendar(c: ArtColors): string {
  const cells: string[] = [];
  let n = 0;
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      n += 1;
      const x = 148 + col * 38;
      const y = 208 + row * 38;
      if (n === 30) {
        cells.push(`<circle cx="${x + 12}" cy="${y + 12}" r="19" fill="${c.accent}"/>`);
      } else if (n <= 30) {
        cells.push(`<rect x="${x + 3}" y="${y + 5}" width="18" height="14" rx="3" fill="${c.rule}"/>`);
      }
    }
  }
  return PORT(`
    <rect x="128" y="126" width="264" height="268" rx="22" stroke="${c.fg}" stroke-width="8"/>
    <line x1="128" y1="190" x2="392" y2="190" stroke="${c.fg}" stroke-width="6"/>
    <g stroke="${c.fg}" stroke-width="9" stroke-linecap="round">
      <line x1="192" y1="106" x2="192" y2="150"/>
      <line x1="328" y1="106" x2="328" y2="150"/>
    </g>
    ${cells.join('\n    ')}
  `, c, true);
}

export const HEROES = {
  gauge,
  gears,
  phone,
  impeller,
  socket,
  towHook,
  calendar,
} as const;

export type HeroKey = keyof typeof HEROES;

export function hero(key: HeroKey, c: ArtColors): string {
  return HEROES[key](c);
}
