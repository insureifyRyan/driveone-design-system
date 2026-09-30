#!/usr/bin/env node
/**
 * Publishes the built templates into Postgres so the scheduler can read them
 * over the connection it already holds.
 *
 * This replaced fetching them over HTTPS. That fetch needed public hosting, a
 * deployment protection carve out, and a base URL in config, and it could fail
 * at send time. A row in the same database can do none of those things.
 *
 * Emits SQL on stdout. Apply it with the Supabase MCP, psql, or the dashboard:
 *   node scripts/publish-templates.mjs > /tmp/templates.sql
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

const DEALER_ID = process.argv[2] || 'bob-johnson';
// Optional step range, e.g. `node scripts/publish-templates.mjs bob-johnson 1 3`.
// The whole set is a couple of hundred KB of SQL, which is more than some
// clients will take in one statement, so it can be applied in slices.
const FROM = Number(process.argv[3] || 1);
const TO   = Number(process.argv[4] || 99);
const D = read(`brand/dealers/${DEALER_ID}.json`);
const DECK = read('email/copy/campaign.json');
// Read from THIS dealer's build directory, never a shared one. The publisher
// takes a dealer id and the builder takes a dealer id, and when they disagreed
// the publisher silently wrote whichever dealership was built last into the
// dealer_id it was given. A guard here rather than a convention, because the
// failure mode is a customer receiving another dealership's branding.
const DIST = `email/dist/${DEALER_ID}`;
const MANIFEST = read(`${DIST}/manifest.json`);
if (MANIFEST.dealer !== DEALER_ID) {
  throw new Error(
    `${DIST}/manifest.json was built for "${MANIFEST.dealer}" but this is publishing ` +
    `"${DEALER_ID}". Run: node email/build.mjs ${DEALER_ID}`
  );
}

// The campaign id comes from the DEALER file, falling back to the deck only for
// a dealer file predating the field. The deck is shared across every rooftop and
// its `campaign.id` is Bob Johnson's, so reading it here stamped every
// dealership with bj_postro_vsc_2026.
//
// That is not cosmetic. n8n/build-workflows.mjs already resolves it this way, so
// Ferrario's scheduler queries vsc_email_template for
// (ferrario-ford, ff_postro_vsc_2026) while the publisher inserted
// (ferrario-ford, bj_postro_vsc_2026). The rows exist, the ids do not match, and
// the lookup returns nothing. Nothing errors at build, nothing errors at publish,
// and the md5 checksum in docs/ADDING-A-DEALERSHIP.md still passes because it
// compares html bytes and never looks at campaign_id.
const CAMPAIGN_ID = (D.campaign && D.campaign.id) || DECK.campaign.id;

// The manifest records the id the templates were built under. If it disagrees
// with the dealer file, the build is stale and publishing it would write rows
// the scheduler cannot find. Same class of guard as the dealer mismatch above,
// and the same reason: the failure is silent everywhere else.
if (MANIFEST.campaign && MANIFEST.campaign !== CAMPAIGN_ID) {
  throw new Error(
    `${DIST}/manifest.json was built under campaign "${MANIFEST.campaign}" but the dealer ` +
    `file says "${CAMPAIGN_ID}". Run: node email/build.mjs ${DEALER_ID}`
  );
}

const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);

const rows = MANIFEST.emails.filter((m) => m.step >= FROM && m.step <= TO).map((m) => {
  const html = readFileSync(join(ROOT, DIST, `${m.slug}.html`), 'utf8');
  return `(${q(DEALER_ID)}, ${q(CAMPAIGN_ID)}, ${q(m.slug)}, ${m.step}, ${q(m.subject)}, ${q(m.subjectAlt)}, ${q(m.preheader)}, ${q(html)}, now())`;
});

process.stdout.write(
  'insert into vsc_email_template\n' +
  '  (dealer_id, campaign_id, slug, step, subject_a, subject_b, preheader, html, updated_at)\n' +
  'values\n' + rows.join(',\n') + '\n' +
  'on conflict (dealer_id, campaign_id, slug) do update set\n' +
  '  step = excluded.step, subject_a = excluded.subject_a, subject_b = excluded.subject_b,\n' +
  '  preheader = excluded.preheader, html = excluded.html, updated_at = now();\n'
);
process.stderr.write(`Publishing ${rows.length} templates for ${DEALER_ID} (steps ${FROM} to ${TO})\n`);
