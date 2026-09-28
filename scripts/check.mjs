#!/usr/bin/env node
/**
 * Pre-send guard. Run before every campaign launch and in CI.
 * Fails on the things that are expensive to discover in a customer inbox.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'email/dist');
const deck = JSON.parse(readFileSync(join(ROOT, 'email/copy/campaign.json'), 'utf8'));
const dealer = JSON.parse(readFileSync(join(ROOT, 'brand/dealers/bob-johnson.json'), 'utf8'));

const fail = [];
const warn = [];

/* ---- brand voice rules ---------------------------------------------- */
const deckStr = JSON.stringify(deck);
if (/[—–]/.test(deckStr)) fail.push('Copy contains an em dash or en dash. House rule forbids both.');
if (/!/.test(deckStr)) fail.push('Copy contains an exclamation point. The Red Bull register does not use them.');

// Never call the DriveOne product a warranty. "factory warranty" and
// "manufacturer warranty" are legitimate references to the customer's own coverage.
for (const e of deck.emails) {
  const body = [e.headline, e.subhead, ...e.body, e.benefitStrip, e.ps || ''].join(' ');
  const hits = [...body.matchAll(/\b(\w+)\s+warrant(y|ies)\b/gi)].map((m) => m[0].toLowerCase());
  for (const h of hits) {
    if (!/(factory|manufacturer|vehicle's extended|extended)/.test(h)) {
      fail.push(`Email ${e.step}: "${h}" reads as calling the DriveOne product a warranty.`);
    }
  }
}

/* ---- structural rules ------------------------------------------------ */
const files = readdirSync(DIST).filter((f) => f.endsWith('.html'));
if (files.length !== deck.emails.length) fail.push(`Built ${files.length} templates but the deck has ${deck.emails.length}. Run npm run build.`);

const ALLOWED_TAGS = new Set([
  'first_name', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'vehicle_mileage',
  'last_ro_date', 'last_ro_services', 'advisor_name', 'quote_url',
  'unsubscribe_url', 'preferences_url',
]);

for (const f of files) {
  const html = readFileSync(join(DIST, f), 'utf8');
  const kb = Buffer.byteLength(html) / 1024;

  if (kb > 100) fail.push(`${f} is ${kb.toFixed(1)}KB. Gmail clips above 102KB.`);
  if (!/unsubscribe_url/.test(html)) fail.push(`${f} has no unsubscribe link. CAN-SPAM requires one.`);
  if (!/vsc_|vehicle service contract/i.test(html) && !/service contract/i.test(html)) warn.push(`${f} never uses the phrase "vehicle service contract".`);
  if (!/<title>/.test(html)) warn.push(`${f} has no title element.`);

  for (const tag of new Set([...html.matchAll(/\{\{([a-z_]+)\}\}/g)].map((m) => m[1]))) {
    if (!ALLOWED_TAGS.has(tag)) fail.push(`${f} uses unknown merge tag {{${tag}}}. The scheduler will throw on it.`);
  }
}

/* ---- launch blockers -------------------------------------------------- */
const dealerStr = JSON.stringify(dealer);
if (/REPLACE-ME/.test(dealerStr)) warn.push('Dealer file still contains REPLACE-ME asset URLs. Not sendable yet.');
if (/PLACEHOLDER/.test(dealerStr)) warn.push('Dealer file still contains PLACEHOLDER values (address, phone, colors). Not sendable yet.');

/* ---- report ----------------------------------------------------------- */
for (const w of warn) console.log('  WARN  ' + w);
for (const f of fail) console.log('  FAIL  ' + f);
console.log(`\n${files.length} templates checked. ${fail.length} failures, ${warn.length} warnings.`);
process.exit(fail.length ? 1 : 0);
