/**
 * Pins the compliance copy and asserts the artwork cannot drift away from it.
 *
 * The Vista build learned this the expensive way: the design handoff named no
 * obligor and placed the administrator in the wrong city, and nothing caught it
 * until someone read the contract. Here the disclosure lives in one constant,
 * the canvas is generated from it, and these tests fail if the two separate.
 *
 *   npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AD_DISCLOSURE,
  REELS_SHORT_DISCLOSURE,
  ADMINISTRATOR,
  INSURER,
  STATE_ENTITIES,
  QUALIFIERS,
} from '../src/lib/compliance.ts';
import { FRAMES, carriesCta } from '../src/creative/frames.ts';
import { renderFrame } from '../src/creative/render.ts';
import { frameUrl } from '../src/lib/destination.ts';

const rendered = new Map(FRAMES.map((f) => [f.id, renderFrame(f, carriesCta(f) ? frameUrl(f.id) : '')]));
const allHtml = [...rendered.values()].join('\n');

// ---------------------------------------------------------------------------
// Entity records, transcribed from AAS VSC 1 11-2022
// ---------------------------------------------------------------------------

test('administrator is named in full, with the contract address', () => {
  assert.equal(ADMINISTRATOR.name, 'Ascent Administration Services, LLC');
  assert.equal(ADMINISTRATOR.address, '360 South Smith Road, Tempe, Arizona 85281');
  assert.equal(ADMINISTRATOR.city, 'Tempe, AZ');
  assert.equal(ADMINISTRATOR.phone, '866-660-7003');
});

test('Old Republic insures the obligor, and is not itself the obligor outside Florida', () => {
  assert.equal(INSURER.name, 'Old Republic Insurance Company');
  assert.match(AD_DISCLOSURE, /insured under a contractual liability insurance policy issued by Old Republic Insurance Company/);
  assert.doesNotMatch(AD_DISCLOSURE, /obligor: Old Republic/);
});

test('the three states with different parties are recorded', () => {
  assert.equal(STATE_ENTITIES.CA?.[0]?.name, 'Old Republic Insured Automotive Services, Inc.');
  assert.equal(STATE_ENTITIES.CA?.[0]?.license, '0C79822');
  assert.equal(STATE_ENTITIES.FL?.[0]?.name, 'Minnehoma Automobile Association, Inc.');
  assert.equal(STATE_ENTITIES.FL?.[1]?.role, 'obligor');
  assert.equal(STATE_ENTITIES.NY?.[0]?.name, 'ORIAS Warranty Services');
});

test('the disclosure carries the contract front-page wording', () => {
  assert.match(AD_DISCLOSURE, /not insurance, a warranty, or a guarantee/);
  assert.match(AD_DISCLOSURE, /administrator and obligor vary by state/);
  assert.match(AD_DISCLOSURE, /Available in all states except California/);
});

test('agent-recruitment language from the Vista block is gone', () => {
  assert.doesNotMatch(AD_DISCLOSURE, /[Pp]roducer license/);
  assert.doesNotMatch(allHtml, /book of business|AMS|agency|producer/i);
});

// ---------------------------------------------------------------------------
// The block reaches every surface that needs it
// ---------------------------------------------------------------------------

test('every CTA-bearing frame carries the full disclosure verbatim', () => {
  const ctaFrames = FRAMES.filter(carriesCta);
  assert.equal(ctaFrames.length, 20);
  for (const f of ctaFrames) {
    assert.ok(
      rendered.get(f.id)!.includes(AD_DISCLOSURE),
      `${f.id} is missing the disclosure block`,
    );
  }
});

test('Reels carry the short line, no CTA and no destination URL', () => {
  const reels = FRAMES.filter((f) => !carriesCta(f));
  assert.equal(reels.length, 3);
  for (const f of reels) {
    const html = rendered.get(f.id)!;
    assert.ok(html.includes(REELS_SHORT_DISCLOSURE), `${f.id} is missing the short line`);
    assert.ok(!html.includes('data-do-cta'), `${f.id} must not carry an in-image CTA`);
    assert.ok(!html.includes('driveonedirect.com?'), `${f.id} must not carry a tracked URL`);
    assert.ok(!html.includes(AD_DISCLOSURE), `${f.id} should use the short line, not the block`);
  }
});

test('disclosures render at 20px and are never the lowest contrast on the surface', () => {
  for (const f of FRAMES) {
    const html = rendered.get(f.id)!;
    assert.match(html, /font:400 20px\/1\.38 var\(--font-body\)/, `${f.id} disclosure is not at 20px`);
  }
  // Legal sits at 0.82/0.80 alpha; body secondary sits at 0.72/0.68.
  assert.ok(!allHtml.includes('color:rgba(255,255,255,0.5)'));
});

test('each frame carries the qualifier for the claim it makes', () => {
  for (const f of FRAMES) {
    const html = rendered.get(f.id)!;
    for (const key of f.concept.qualifiers) {
      assert.ok(html.includes(QUALIFIERS[key]), `${f.id} is missing the ${key} qualifier`);
    }
  }
});

test('the repair-cost claim is dated on the creative that makes it', () => {
  for (const f of FRAMES) {
    const html = rendered.get(f.id)!;
    if (/\$6,165 to \$6,685/.test(html)) {
      assert.match(html, /August 2026/, `${f.id} states a repair cost without dating it`);
    }
  }
});

// ---------------------------------------------------------------------------
// Claims that are not in the contract must not appear
// ---------------------------------------------------------------------------

test('no claim appears that the executed contract does not support', () => {
  // None of these occur anywhere in AAS VSC 1 11-2022. See docs/claims-audit.md.
  const unsupported = [
    /diminished value/i,
    /openbay/i,
    /protection plus/i,
    /ASE.?certified/i,
    /tire and wheel/i,
    /paintless dent/i,
    /key.?remote replacement/i,
  ];
  for (const pattern of unsupported) {
    assert.doesNotMatch(allHtml, pattern, `unsupported claim present: ${pattern}`);
  }
});

test('no payment plan, 0% or credit language anywhere', () => {
  // Ryan's call: Meta's Credit special ad category would restrict targeting and
  // the claim is not worth it on prospecting.
  for (const pattern of [/payment plan/i, /\b0%/, /no credit check/i, /financ/i, /\bloan\b/i, /\bAPR\b/]) {
    assert.doesNotMatch(allHtml, pattern, `credit language present: ${pattern}`);
  }
});

test('the product is never called a warranty', () => {
  // "warranty" may appear only where it refers to the factory warranty the
  // buyer no longer has.
  const allowed = [
    'AFTER THE FACTORY WARRANTY',
    'The warranty ended.',
    'not insurance, a warranty, or a guarantee',
  ];
  let stripped = allHtml;
  for (const phrase of allowed) stripped = stripped.split(phrase).join('');
  assert.doesNotMatch(stripped, /warrant/i, 'the product is described as a warranty somewhere');
});

test('no competitor or third-party brand is named, and no testimonial or rating', () => {
  for (const pattern of [/carshield/i, /endurance/i, /carchex/i, /\bstar rating/i, /reviews?\b/i, /testimonial/i]) {
    assert.doesNotMatch(allHtml, pattern, `forbidden reference: ${pattern}`);
  }
  // Quest Towing and Old Republic are named because the contract names them as
  // included providers, not as competitors.
  assert.match(allHtml, /Quest Towing Services/);
});

test('no em dashes or en dashes anywhere in the creative', () => {
  assert.doesNotMatch(allHtml, /[–—]/, 'an em dash or en dash reached the artwork');
});

// ---------------------------------------------------------------------------
// Attribution
// ---------------------------------------------------------------------------

test('every CTA frame has its own utm_content and they are all distinct', () => {
  const contents = new Set<string>();
  for (const f of FRAMES.filter(carriesCta)) {
    const html = rendered.get(f.id)!;
    assert.ok(html.includes(`utm_content=${f.id}`), `${f.id} is missing its own utm_content`);
    contents.add(f.id);
  }
  assert.equal(contents.size, 20);
});

test('frame ids stay in the shape the exporter and {{ad.name}} both need', () => {
  for (const f of FRAMES) {
    assert.match(f.id, /^[ABSRV]\d$/, `${f.id} will not survive the exporter label regex`);
  }
});

test('every frame points at the DriveOne Direct quote page, never Kovara', () => {
  assert.doesNotMatch(allHtml, /kovara/i);
  for (const f of FRAMES.filter(carriesCta)) {
    assert.ok(rendered.get(f.id)!.includes('https://www.driveonedirect.com?'));
  }
});
