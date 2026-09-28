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
const MANIFEST = read('email/dist/manifest.json');

const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);

const rows = MANIFEST.emails.filter((m) => m.step >= FROM && m.step <= TO).map((m) => {
  const html = readFileSync(join(ROOT, 'email/dist', `${m.slug}.html`), 'utf8');
  return `(${q(DEALER_ID)}, ${q(DECK.campaign.id)}, ${q(m.slug)}, ${m.step}, ${q(m.subject)}, ${q(m.subjectAlt)}, ${q(m.preheader)}, ${q(html)}, now())`;
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
