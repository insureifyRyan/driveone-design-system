#!/usr/bin/env node
/**
 * DriveOne Direct purchase alert. Posts each new DTC purchase to Slack.
 *
 * The data comes from the Metricbridge MCP (source `kovara` = driveonedirect.com),
 * so this script does not call Metricbridge itself. The caller (the scheduled
 * Claude Routine, see docs/DOD-PURCHASE-ALERTS.md) saves the raw get_quotes
 * responses to JSON files and passes them in. Keeping the fetch in the MCP and
 * the dedupe and formatting here means the Routine prompt stays tiny and the
 * logic is testable without an MCP.
 *
 * Two stages are alerted, once each per quote:
 *   checkout  status payment_pending / payment_status budco_initiated.
 *             The customer finished checkout and the Budco payment plan started.
 *   paid      status paid, payment_status completed, or payment_completed_at set.
 *
 * Usage:
 *   node scripts/dod-purchase-alert.mjs --state <state.json> [--seed] [--dry-run] <quotes.json>...
 *
 *   --seed     Record everything currently purchased as already alerted, post nothing.
 *   --dry-run  Print the Slack payloads, post nothing, leave the state file alone.
 *
 * Env: SLACK_DOD_PURCHASE_WEBHOOK, a Slack incoming webhook URL. Not needed for
 * --seed or --dry-run.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

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
  console.error('Pass at least one Metricbridge get_quotes JSON file.');
  process.exit(2);
}

const WEBHOOK = process.env.SLACK_DOD_PURCHASE_WEBHOOK;
if (!SEED && !DRY && !/^https:\/\/hooks\.slack\.com\//.test(WEBHOOK || '')) {
  console.error('SLACK_DOD_PURCHASE_WEBHOOK is not set to a Slack incoming webhook URL.');
  process.exit(2);
}

/* ---- load ------------------------------------------------------------ */
const quotes = new Map();
for (const file of inputs) {
  const body = JSON.parse(readFileSync(file, 'utf8'));
  for (const q of body.data ?? body) {
    if (q.source && q.source !== 'kovara') continue; // DTC only, never the dealer channel
    quotes.set(q.hub_id, q);
  }
}

const state = existsSync(STATE_FILE)
  ? JSON.parse(readFileSync(STATE_FILE, 'utf8'))
  : { alerted: {} };

/* ---- classify -------------------------------------------------------- */
function stageOf(q) {
  if (q.status === 'paid' || q.payment_status === 'completed' || q.payment_completed_at) return 'paid';
  if (q.status === 'payment_pending' || q.payment_status === 'budco_initiated') return 'checkout';
  return null;
}

const usd = (n) =>
  n == null ? 'n/a' : Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const day = (iso) => (iso ? iso.slice(0, 10) : 'n/a');

function payload(q, stage) {
  const title = stage === 'paid'
    ? ':white_check_mark: DriveOne Direct purchase paid'
    : ':tada: New DriveOne Direct purchase';
  const sub = stage === 'paid'
    ? 'Payment completed.'
    : 'Checkout finished. Budco payment plan started.';
  const pay = q.payment_method === 'financing' && q.payment_term
    ? `Financing, ${q.payment_term} payments of ${usd(q.contract_price / q.payment_term)}`
    : q.payment_method || 'n/a';
  const fields = [
    ['Contract', q.contract_number || 'n/a'],
    ['Price', usd(q.contract_price)],
    ['Term', q.contract_months ? `${q.contract_months} months` : 'n/a'],
    ['Payment', pay],
    ['Customer ID', q.source_customer_id || 'n/a'],
    ['Quote started', day(q.created_at)],
  ];
  return {
    text: `${title}: ${q.contract_number} ${usd(q.contract_price)}`,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: title.replace(/^:\S+: /, ''), emoji: true } },
      { type: 'section', text: { type: 'mrkdwn', text: `${title.split(' ')[0]} ${sub}` } },
      {
        type: 'section',
        fields: fields.map(([k, v]) => ({ type: 'mrkdwn', text: `*${k}*\n${v}` })),
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `Metricbridge kovara | quote ${q.source_quote_id}` }],
      },
    ],
  };
}

/* ---- run ------------------------------------------------------------- */
const pending = [];
for (const q of quotes.values()) {
  const stage = stageOf(q);
  if (!stage) continue;
  const key = `${q.hub_id}:${stage}`;
  if (state.alerted[key]) continue;
  pending.push({ q, stage, key });
}
pending.sort((a, b) => (a.q.created_at || '').localeCompare(b.q.created_at || ''));

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
console.log(`${quotes.size} quotes read, ${pending.length} new, ${SEED || DRY ? pending.length : posted} ${verb}, ${failed} failed.`);
process.exit(failed ? 1 : 0);
