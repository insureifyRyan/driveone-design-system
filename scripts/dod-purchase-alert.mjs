#!/usr/bin/env node
/**
 * DriveOne Direct purchase alert. Posts each new DTC purchase to Slack.
 *
 * The data comes from the Kovara production database (Supabase project
 * kovara-ai-production) via scripts/dod-purchases.sql. Metricbridge's kovara
 * mirror is not used: it lags status changes and missed most sales.
 *
 * This script does not query the database itself. The caller (the scheduled
 * Claude Routine, see docs/DOD-PURCHASE-ALERTS.md) runs the SQL through the
 * Supabase MCP, saves the result to a file and passes it in. Keeping the fetch
 * in the MCP and the dedupe and formatting here means no database credentials
 * live anywhere and the logic is testable offline.
 *
 * Two stages are alerted, once each per quote:
 *   checkout  status payment_pending / payment_status budco_initiated.
 *             The customer finished checkout and the Budco payment plan started.
 *   paid      status paid, payment_status completed, or payment_completed_at set.
 *
 * Test accounts (TEST_EMAILS plus DOD_TEST_EMAILS, TEST_PHONES, internal domains)
 * are never posted.
 *
 * Usage:
 *   node scripts/dod-purchase-alert.mjs --state <state.json> [--seed] [--dry-run] <rows.json>...
 *
 *   <rows.json>  The SQL result: a JSON array of rows, or the raw execute_sql
 *                output (the array is pulled out of the surrounding text).
 *   --seed       Record everything currently purchased as already alerted, post nothing.
 *   --dry-run    Print the Slack payloads, post nothing, leave the state file alone.
 *
 * Env: SLACK_DOD_PURCHASE_WEBHOOK, a Slack incoming webhook URL. Not needed for
 * --seed or --dry-run. DOD_TEST_EMAILS, optional, extra test addresses to skip.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// Internal test accounts. Extra ones come from DOD_TEST_EMAILS (comma separated) so
// staff personal addresses never land in the repo.
const TEST_EMAILS = new Set(
  ['john@cena.com', ...(process.env.DOD_TEST_EMAILS || '').split(',')]
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);
const TEST_PHONES = new Set(['5555555555', '0000000000', '1234567890']);
const TEST_DOMAINS = /@(kovara\.ai|insureify\.ai|insureify\.com|driveonedirect\.com|example\.com)$/i;

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const stateIdx = args.indexOf('--state');
if (stateIdx === -1 || !args[stateIdx + 1]) {
  console.error('Missing --state <file>.');
  process.exit(2);
}
const STATE_FILE = args[stateIdx + 1];
const SEED = flag('--seed');
const DRY = flag('--dry-run');
const inputs = args.filter((a, i) => !a.startsWith('--') && i !== stateIdx + 1);
if (!inputs.length) {
  console.error('Pass at least one file holding the dod-purchases.sql result.');
  process.exit(2);
}

const WEBHOOK = process.env.SLACK_DOD_PURCHASE_WEBHOOK;
if (!SEED && !DRY && !/^https:\/\/hooks\.slack\.com\//.test(WEBHOOK || '')) {
  console.error('SLACK_DOD_PURCHASE_WEBHOOK is not set to a Slack incoming webhook URL.');
  process.exit(2);
}

/* ---- load ------------------------------------------------------------ */
function parseRows(text) {
  try {
    const body = JSON.parse(text);
    if (Array.isArray(body)) return body;
    if (Array.isArray(body.data)) return body.data;
    if (typeof body.result === 'string') return parseRows(body.result);
  } catch {
    // Raw execute_sql output wraps the array in prose. Take the outermost array.
  }
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end < start) throw new Error('No JSON array of rows found.');
  return JSON.parse(text.slice(start, end + 1).replace(/\\"/g, '"'));
}

const quotes = new Map();
for (const file of inputs) {
  for (const q of parseRows(readFileSync(file, 'utf8'))) quotes.set(q.id, q);
}

const state = existsSync(STATE_FILE)
  ? JSON.parse(readFileSync(STATE_FILE, 'utf8'))
  : { alerted: {} };

/* ---- classify -------------------------------------------------------- */
function isTest(q) {
  const email = (q.email || '').trim().toLowerCase();
  const phone = String(q.phone || '').replace(/\D/g, '');
  return TEST_EMAILS.has(email) || TEST_PHONES.has(phone) || TEST_DOMAINS.test(email);
}

function stageOf(q) {
  if (q.status === 'paid' || q.payment_status === 'completed' || q.payment_completed_at) return 'paid';
  if (q.status === 'payment_pending' || q.payment_status === 'budco_initiated') return 'checkout';
  return null;
}

const usd = (n) =>
  n == null || n === '' ? 'n/a' : Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const day = (iso) => (iso ? String(iso).slice(0, 10) : 'n/a');
const clean = (s) => (s == null ? '' : String(s).trim());
const titleCase = (s) => clean(s).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const phoneFmt = (p) => {
  const d = String(p || '').replace(/\D/g, '');
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : clean(p) || 'n/a';
};

function payload(q, stage) {
  const title = stage === 'paid' ? 'DriveOne Direct purchase paid' : 'New DriveOne Direct purchase';
  const emoji = stage === 'paid' ? ':white_check_mark:' : ':tada:';
  const sub = stage === 'paid' ? 'Payment completed.' : 'Checkout finished. Budco payment plan started.';
  const name = titleCase(`${clean(q.first_name)} ${clean(q.last_name)}`) || 'Unknown customer';
  const place = [titleCase(q.city), clean(q.state).toUpperCase()].filter(Boolean).join(', ') || 'n/a';
  const vehicle = [q.year, clean(q.make), clean(q.model)].filter(Boolean).join(' ') || 'n/a';
  const pay = q.payment_method === 'financing' && q.payment_term
    ? `${q.payment_term} payments of ${usd(q.contract_price / q.payment_term)}, ${usd(q.down_payment)} down`
    : clean(q.payment_method) || 'n/a';
  const fields = [
    ['Customer', name],
    ['Location', place],
    ['Email', clean(q.email) || 'n/a'],
    ['Phone', phoneFmt(q.phone)],
    ['Vehicle', vehicle],
    ['Price', usd(q.contract_price)],
    ['Plan', clean(q.ascent_plan_name) || (q.contract_months ? `${q.contract_months} months` : 'n/a')],
    ['Payment', pay],
    ['Contract', `${q.contract_number || 'n/a'}${q.ascent_contract_number ? ` / ${q.ascent_contract_number}` : ''}`],
    ['Quote started', day(q.created_at)],
  ];
  return {
    text: `${emoji} ${title}: ${name}, ${usd(q.contract_price)}`,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: title, emoji: true } },
      { type: 'section', text: { type: 'mrkdwn', text: `${emoji} ${sub}` } },
      { type: 'section', fields: fields.map(([k, v]) => ({ type: 'mrkdwn', text: `*${k}*\n${v}` })) },
      { type: 'context', elements: [{ type: 'mrkdwn', text: `kovara-ai-production | quote ${q.id}` }] },
    ],
  };
}

/* ---- run ------------------------------------------------------------- */
const pending = [];
let tests = 0;
for (const q of quotes.values()) {
  const stage = stageOf(q);
  if (!stage) continue;
  if (isTest(q)) {
    tests++;
    continue;
  }
  const key = `${q.id}:${stage}`;
  if (state.alerted[key]) continue;
  pending.push({ q, stage, key });
}
pending.sort((a, b) => String(a.q.created_at || '').localeCompare(String(b.q.created_at || '')));

let posted = 0;
let failed = 0;
for (const { q, stage, key } of pending) {
  if (SEED) {
    state.alerted[key] = { contract: q.contract_number, at: new Date().toISOString(), seeded: true };
    continue;
  }
  const body = payload(q, stage);
  if (DRY) {
    console.log(JSON.stringify(body, null, 2));
    continue;
  }
  const res = await fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.ok) {
    state.alerted[key] = { contract: q.contract_number, at: new Date().toISOString() };
    posted++;
  } else {
    // Leave it out of state so the next run retries it.
    console.error(`Slack rejected ${q.contract_number}: ${res.status} ${await res.text()}`);
    failed++;
  }
}

if (!DRY) {
  state.updated_at = new Date().toISOString();
  mkdirSync(dirname(STATE_FILE), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n');
}

const verb = SEED ? 'seeded' : DRY ? 'would post' : 'posted';
console.log(
  `${quotes.size} rows read, ${tests} test skipped, ${pending.length} new, ` +
    `${SEED || DRY ? pending.length : posted} ${verb}, ${failed} failed.`,
);
process.exit(failed ? 1 : 0);
