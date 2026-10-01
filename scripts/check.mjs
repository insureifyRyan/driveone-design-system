#!/usr/bin/env node
/**
 * Pre-send guard. Run before every campaign launch and in CI.
 * Fails on the things that are expensive to discover in a customer inbox.
 *
 *   node scripts/check.mjs <dealer>            build-time: unfinished setup warns
 *   node scripts/check.mjs <dealer> --launch   pre-send: unfinished setup fails
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Dealer comes from argv, like every other command in this repo. It was
// hardcoded to bob-johnson while the dist path was shared, so running the
// pre-send guard on a second dealership checked the wrong build against the
// wrong brand file, and passed.
// First non-flag argument, so `check.mjs --launch ferrario-ford` and
// `check.mjs ferrario-ford --launch` mean the same thing. Reading argv[2]
// positionally made the flag itself look like a dealer id, and the resulting
// ENOENT on brand/dealers/--launch.json is a confusing way to learn that.
const DEALER_ID = process.argv.slice(2).find((a) => !a.startsWith('-')) || 'bob-johnson';
const DIST = join(ROOT, 'email/dist', DEALER_ID);
const deck = JSON.parse(readFileSync(join(ROOT, 'email/copy/campaign.json'), 'utf8'));
const dealer = JSON.parse(readFileSync(join(ROOT, `brand/dealers/${DEALER_ID}.json`), 'utf8'));

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
  'last_ro_date', 'advisor_name', 'quote_url', 'monthly_payment', 'down_payment', 'coverage_label', 'payment_term', 'contract_price',
  'unsubscribe_url', 'preferences_url',
]);

for (const f of files) {
  const html = readFileSync(join(DIST, f), 'utf8');
  const kb = Buffer.byteLength(html) / 1024;

  if (kb > 100) fail.push(`${f} is ${kb.toFixed(1)}KB. Gmail clips above 102KB.`);
  if (!/unsubscribe_url/.test(html)) fail.push(`${f} has no unsubscribe link. CAN-SPAM requires one.`);
  // The price is the whole point of the redesign: it must be visible without a click.
  if (!/monthly_payment/.test(html)) fail.push(`${f} never shows {{monthly_payment}}. The price must be visible without clicking.`);
  // Advertising a monthly figure without the number of payments is the classic
  // truth-in-advertising failure, so the guard refuses to let it ship.
  if (/monthly_payment/.test(html) && !/payment_term/.test(html)) fail.push(`${f} shows a monthly price with no payment term.`);
  if (!/Advertisement/.test(html)) fail.push(`${f} is not identified as an advertisement, which CAN-SPAM requires absent prior affirmative consent.`);
  if (!/vsc_|vehicle service contract/i.test(html) && !/service contract/i.test(html)) warn.push(`${f} never uses the phrase "vehicle service contract".`);
  if (!/<title>/.test(html)) warn.push(`${f} has no title element.`);

  for (const tag of new Set([...html.matchAll(/\{\{([a-z_]+)\}\}/g)].map((m) => m[1]))) {
    if (!ALLOWED_TAGS.has(tag)) fail.push(`${f} uses unknown merge tag {{${tag}}}. The scheduler will throw on it.`);
  }
}

/* ---- launch blockers -------------------------------------------------- */
// Dealer files mark unknowns three ways: Bob Johnson's predate Ferrario's and
// say PLACEHOLDER or REPLACE-ME where Ferrario says NEEDS CONFIRMATION. The
// guard used to test for the first two as bare substrings of the whole file,
// which named no field and missed the third idiom entirely, so Ferrario's
// missing postal address raised nothing at all. One walk, all three markers,
// and report the paths, because "something is unconfirmed" is not actionable.
const MARKER = /NEEDS CONFIRMATION|PLACEHOLDER|REPLACE-ME/i;
const unconfirmed = [];
(function walk(node, path) {
  if (typeof node === 'string') {
    if (MARKER.test(node)) unconfirmed.push(path);
    return;
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      // $comment, $note and the like carry prose ABOUT the unknowns rather than
      // being unknowns themselves. Counting them double-reports every field.
      if (k.startsWith('$') || /Note$/.test(k)) continue;
      walk(v, path ? `${path}.${k}` : k);
    }
  }
})(dealer, '');

if (unconfirmed.length) {
  warn.push(`Dealer file has ${unconfirmed.length} unconfirmed field(s): ${unconfirmed.join(', ')}. Not sendable yet.`);
}

// A dealership still being set up is expected to have unconfirmed fields, so
// those stay warnings and `npm run build` stays green while the brand sheet is
// chased. Pass --launch for the pre-send gate, where the same gaps are hard
// failures: the footer postal address is a CAN-SPAM requirement, not a polish
// item, and a reply-to nobody reads is how a campaign written as though the
// service drive sent it becomes a dead end for the customer who answers it.
const LAUNCH = process.argv.includes('--launch');
if (LAUNCH) {
  const REQUIRED_TO_SEND = [
    ['contact.addressLine1', 'CAN-SPAM requires a real postal address in the footer.'],
    ['contact.addressLine2', 'CAN-SPAM requires a real postal address in the footer.'],
    ['contact.servicePhone', 'The footer prints a customer-facing service number.'],
    ['contact.replyTo', 'Replies have to reach a human at the dealership.'],
    ['campaign.quoteUrlBase', 'Every CTA in all ten emails points at this.'],
    ['sending.fromAddress', 'Nothing can send without a verified From address.'],
  ];
  for (const [f, why] of REQUIRED_TO_SEND) {
    if (unconfirmed.includes(f)) fail.push(`${f} is unconfirmed. ${why}`);
  }
}

// The From address has to live on the domain the dealer file nominates. These
// are two fields and they drifted apart the moment they existed: the address is
// what Resend authenticates and the domain is what gets the DNS records, so a
// mismatch is a verified domain that never sends.
if (dealer.sending && dealer.sending.fromAddress && dealer.sending.fromDomain) {
  const at = String(dealer.sending.fromAddress).split('@')[1];
  if (at && at !== dealer.sending.fromDomain) {
    fail.push(`sending.fromAddress is on "${at}" but sending.fromDomain is "${dealer.sending.fromDomain}". ` +
      `The DNS records go on fromDomain, so these have to agree.`);
  }
}

/* ---- report ----------------------------------------------------------- */
for (const w of warn) console.log('  WARN  ' + w);
for (const f of fail) console.log('  FAIL  ' + f);
console.log(`\n${files.length} templates checked. ${fail.length} failures, ${warn.length} warnings.`);
process.exit(fail.length ? 1 : 0);
