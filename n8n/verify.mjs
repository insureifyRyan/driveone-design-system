#!/usr/bin/env node
/**
 * Asserts behaviour, not shape, on the generated workflows.
 *
 * Every check here exists because the bug it catches actually shipped. None of
 * them are hypothetical, and the comments say which failure each one is for, so
 * a future reader can tell a real invariant from a superstition.
 *
 * The pattern behind all of them is worth naming, because it is the pattern
 * behind most of the mistakes in this project: it is easy to verify that a
 * change was APPLIED and much harder to verify that it produced the RIGHT
 * BEHAVIOUR. `update_workflow` returning success, a credential existing in the
 * list, a node carrying the parameter you set - all of those can be true while
 * the campaign does the wrong thing to a real customer. The weekday spreading
 * was measured against the metric it was meant to improve (peak daily volume,
 * which it did improve) and never against the thing it silently broke (the gap
 * between two emails to one person). So these checks read the OUTPUT of the
 * generated code rather than its text wherever they possibly can.
 *
 *   node n8n/verify.mjs
 *
 * Exits non-zero on any failure, so it can gate a commit.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

// The generated Code nodes call require('crypto'). This file is ESM, so it has
// no require of its own; hand them a real one rather than a stub, or the test
// exercises a different hashing function than production does.
const nodeRequire = createRequire(pathToFileURL(import.meta.url));

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DECK = JSON.parse(readFileSync(join(ROOT, 'email/copy/campaign.json'), 'utf8'));

// Verify a specific dealer's build. Defaults to bob-johnson to match the
// generator, and takes the same argument so `verify ferrario-ford` checks
// Ferrario's cadence rather than silently re-checking someone else's.
const DEALER_ID = process.argv[2] || 'bob-johnson';
const load = (f) => JSON.parse(readFileSync(join(ROOT, 'n8n/workflows', DEALER_ID, f), 'utf8'));
const WORKFLOWS = ['01-intake.json', '02-scheduler.json', '03-events.json',
  '04-error-handler.json', '05-pricing.json'].map((f) => ({ file: f, wf: load(f) }));

const results = [];
const check = (name, fn) => {
  try {
    const detail = fn();
    results.push({ name, ok: true, detail });
  } catch (e) {
    results.push({ name, ok: false, detail: e.message });
  }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const nodesOf = (wf) => wf.nodes;
const nodeNamed = (wf, name) => wf.nodes.find((n) => n.name === name);
const codeNodes = () => WORKFLOWS.flatMap(({ file, wf }) =>
  nodesOf(wf).filter((n) => n.type === 'n8n-nodes-base.code').map((n) => ({ file, node: n })));
const pgNodes = () => WORKFLOWS.flatMap(({ file, wf }) =>
  nodesOf(wf).filter((n) => n.type === 'n8n-nodes-base.postgres').map((n) => ({ file, node: n })));

/* ------------------------------------------------------- cadence behaviour */

// Runs Prepare Send the way production does: once per send, with the clock at
// the moment that send happens. Evaluating all ten steps at a single instant
// looks like a reasonable test and is not one - every step lands on the same
// date, which reads as a catastrophic bug and is only the harness.
function simulateCadence({ enrolledDaysAgo, seed }) {
  const code = nodeNamed(load('02-scheduler.json'), 'Prepare Send').parameters.jsCode;
  const realNow = Date.now;
  const key = createHash('sha256').update(seed).digest('hex');
  const created = new Date(realNow() - enrolledDaysAgo * 86400000).toISOString();

  let step = 0;
  // Start on a 14:00 UTC slot, because that is when production sends. Starting
  // at the wall clock makes the first gap a fractional number of days and
  // reports a violation that cannot happen in the real schedule.
  const first = new Date(realNow());
  first.setUTCHours(14, 0, 0, 0);
  if (first.getTime() < realNow()) first.setUTCDate(first.getUTCDate() + 1);
  let clock = first.getTime();
  const sends = [];
  try {
    for (let i = 0; i < 12; i++) {
      Date.now = () => clock;
      const row = {
        id: 'sim', dealer_id: 'd', campaign_id: 'c', customer_key: key, created_at: created,
        current_step: step, monthly_payment: 49, quote_url: 'https://example.test/q',
        first_name: 'Ann', vehicle_make: 'RAM', vehicle_model: '1500',
        coverage_miles: 50000, contract_months: 36, payment_term: 36,
      };
      const out = new Function('$input', '$vars', 'require', code)(
        { all: () => [{ json: row }] },
        { UNSUBSCRIBE_URL_BASE: 'https://u', PREFERENCES_URL_BASE: 'https://p' },
        nodeRequire,
      );
      Date.now = realNow;
      if (!out.length) break;
      const j = out[0].json;
      sends.push({ step: j.step, at: new Date(clock) });
      step = j.step;
      if (!j.next_send_at) break;
      clock = new Date(j.next_send_at).getTime();
    }
  } finally {
    Date.now = realNow;
  }
  return sends;
}

const DECK_DAYS = DECK.emails.map((e) => e.sendDay);
const DECK_GAPS = DECK_DAYS.slice(1).map((d, i) => d - DECK_DAYS[i]);

check('cadence matches the copy deck', () => {
  // WHY: the weekday spreading pinned every contact to a single weekday, so
  // every target date was pushed forward to that day's next occurrence and
  // gaps of 3, 4, 5 and 8 days all collapsed to exactly 7. The deck said one
  // thing and the campaign did another, which is precisely the drift this
  // generator's header promises cannot happen.
  // Measured against the deck's ABSOLUTE day numbers, not the gaps between
  // them. The deck says "email 5 on day 18", so landing on day 17 is one day
  // of drift; comparing consecutive gaps instead counts that same day twice,
  // once as a short gap and once as a long one, and reports double the error
  // that exists.
  //
  // Tolerance is 3 days because that is the floor the calendar imposes, not a
  // number chosen to make this pass. A 3 day gap from a Wednesday lands on a
  // Saturday, and the nearest sending days are Friday, which is 2 days out and
  // under the minimum gap, or Tuesday at 6. Any window that excludes weekends
  // has holes like that. The regression this guards against was drift of 10.
  const TOLERANCE_DAYS = 3;
  let worst = 0;
  let shipped = [];
  for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
    const sends = simulateCadence({ enrolledDaysAgo: 0, seed });
    assert(sends.length === DECK_DAYS.length,
      `seed ${seed} sent ${sends.length} of ${DECK_DAYS.length} steps`);
    const days = sends.map((s) => Math.round((s.at - sends[0].at) / 86400000));
    const drift = days.map((d, i) => Math.abs(d - DECK_DAYS[i]));
    if (Math.max(...drift) > worst) { worst = Math.max(...drift); shipped = days; }
  }
  assert(worst <= TOLERANCE_DAYS,
    `deck days ${DECK_DAYS.join(',')} but ships ${shipped.join(',')} (worst drift ${worst}d)`);
  return `worst drift ${worst}d across 6 contacts`;
});

check('a stale backlog cannot unspool as a burst', () => {
  // WHY: steps are dated from created_at, so a contact enrolled weeks before
  // launch has several steps dated in the past and receives them in
  // consecutive hourly runs. The daily cap does not catch this: it counts
  // sends across the campaign, not per person.
  const sends = simulateCadence({ enrolledDaysAgo: 45, seed: 'cadence-stale' });
  assert(sends.length > 1, 'simulation produced no second send');
  const gaps = sends.slice(1).map((s, i) => (s.at - sends[i].at) / 86400000);
  const min = Math.min(...gaps);
  assert(min >= 3, `two emails only ${min.toFixed(1)} days apart for a stale enrolment`);
  return `min gap ${min.toFixed(1)}d across ${sends.length} sends`;
});

check('one batch, one recipient per email', () => {
  // WHY: this is the worst thing this system can do, and it has happened twice.
  // A Code node runs once for ALL items, so $itemIndex does not advance with
  // the loop; itemMatching($itemIndex) returns item zero on every pass. A run
  // of forty five sends then renders forty five copies of the first
  // recipient's name, price and checkout link and mails them to strangers.
  // Found once in the pricing sweep, where a Camry at 113,000 miles and a
  // Durango at 73,000 came back with identical prices to the cent.
  //
  // Nothing about that fails loudly, which is exactly why it needs a test:
  // every email renders, every send succeeds, and the damage is only visible
  // to the people who received someone else's quote.
  const wf = load('02-scheduler.json');
  const prepCode = nodeNamed(wf, 'Prepare Send').parameters.jsCode;
  const renderCode = nodeNamed(wf, 'Render Merge Tags').parameters.jsCode;

  const people = [
    { first_name: 'KEVIN',  make: 'RAM',    model: '1500',  miles: 149999, pay: '177.54' },
    { first_name: 'maria',  make: 'Toyota', model: 'Camry', miles: 41200,  pay: '62.10' },
    { first_name: 'OBRIEN', make: 'GMC',    model: '2500',  miles: 98000,  pay: '210.00' },
  ];
  const rows = people.map((p, i) => ({
    id: 'row' + i, dealer_id: 'd', campaign_id: 'c',
    customer_key: createHash('sha256').update('k' + i).digest('hex'),
    created_at: new Date().toISOString(), current_step: 0,
    first_name: p.first_name, vehicle_year: '2019', vehicle_make: p.make,
    vehicle_model: p.model, vehicle_mileage: p.miles, monthly_payment: p.pay,
    down_payment: '100', contract_price: '3000', payment_term: 18,
    contract_months: 36, coverage_miles: 45000, ro_closed_date: '2026-09-14',
    quote_url: 'https://example.test/q' + i,
  }));

  const prepared = new Function('$input', '$vars', 'require', prepCode)(
    { all: () => rows.map((r) => ({ json: r })) },
    { UNSUBSCRIBE_URL_BASE: 'https://u', PREFERENCES_URL_BASE: 'https://p' },
    nodeRequire);
  assert(prepared.length === rows.length,
    `Prepare Send turned ${rows.length} rows into ${prepared.length}`);

  // A marker makes extraction exact. Reading fields by their position among
  // HTML tags is how the first two attempts at this test reported a crossover
  // that was not there.
  const tpl = '<html>' + 'x'.repeat(600) +
    '[F]{{first_name}}|{{vehicle_model}}|{{monthly_payment}}|{{quote_url}}[/F]</html>';
  const out = new Function('$input', '$', renderCode)(
    { all: () => prepared.map(() => ({ json: { html: tpl } })) },
    () => ({ all: () => prepared, itemMatching: (i) => prepared[i] }));

  assert(out.length === rows.length,
    `${rows.length} recipients in, ${out.length} emails out`);

  const crossed = [];
  out.forEach((o, i) => {
    const [name, model, pay, url] = o.json.html.match(/\[F\](.*?)\[\/F\]/)[1].split('|');
    const want = people[i];
    const nameOk = name.toLowerCase().replace(/[^a-z]/g, '') ===
                   want.first_name.toLowerCase().replace(/[^a-z]/g, '');
    // The link carries tracking params, so match the path rather than the tail.
    const linkOk = url.includes('/q' + i + '?') || url.endsWith('/q' + i);
    if (!nameOk || pay !== '$' + want.pay || !linkOk || !model.includes(want.model)) {
      crossed.push(`item ${i}: wanted ${want.first_name}/${want.model}/$${want.pay}/q${i}, ` +
                   `got ${name}/${model}/${pay}/${url.split('/').pop().split('?')[0]}`);
    }
  });
  assert(crossed.length === 0,
    `a recipient received another person's data. ${crossed.join('; ')}`);
  return `${rows.length} distinct recipients, name, vehicle, price and link all stayed put`;
});

/* --------------------------------------------------------- code node hygiene */

check('every Code node parses', () => {
  for (const { file, node } of codeNodes()) {
    // Wrapped in an async function because that is what n8n does, and because
    // the signature verifier legitimately uses top level await. Checking with
    // a bare `new Function` reports valid code as broken.
    try { new Function(`return (async () => {${node.parameters.jsCode}})`); }
    catch (e) { throw new Error(`${file} / ${node.name}: ${e.message}`); }
  }
  return `${codeNodes().length} nodes`;
});

check('no Code node reads $json', () => {
  // WHY: Classify Event read $json.params, which is bound only in
  // run-once-per-item mode. Every event would have died on a ReferenceError
  // before reaching the database - valid ones included.
  const bad = codeNodes()
    .filter(({ node }) => node.parameters.mode !== 'runOnceForEachItem')
    .filter(({ node }) => /(^|[^.\w])\$json\b/.test(node.parameters.jsCode))
    .map(({ file, node }) => `${file} / ${node.name}`);
  assert(bad.length === 0, `$json is undefined in these: ${bad.join('; ')}`);
  return `${codeNodes().length} nodes clean`;
});

/* ------------------------------------------------------------ postgres nodes */

check('every Postgres node batches independently', () => {
  // WHY: n8n defaults queryBatching to "single" - one execution for ALL items
  // using only the first item's replacements, silently discarding the rest.
  // Found when a pricing run rated 100 vehicles and wrote exactly one price.
  const bad = pgNodes()
    .filter(({ node }) => node.parameters?.options?.queryBatching !== 'independently')
    .map(({ file, node }) => `${file} / ${node.name}`);
  assert(bad.length === 0, `default batching would drop items: ${bad.join('; ')}`);
  return `${pgNodes().length} nodes`;
});

check('SQL placeholders match the replacement count', () => {
  // WHY: an undefined key is DROPPED from queryReplacement rather than sent as
  // null, which shortens the positional array and shifts every parameter after
  // it. The first live pricing run died on "there is no parameter $17".
  const problems = [];
  for (const { file, node } of pgNodes()) {
    const sql = node.parameters.query || '';
    const repl = node.parameters?.options?.queryReplacement || '';
    const highest = Math.max(0, ...[...sql.matchAll(/\$(\d+)/g)].map((m) => Number(m[1])));
    const supplied = (repl.match(/\{\{/g) || []).length;
    if (highest === 0 && supplied === 0) continue;
    if (highest !== supplied) {
      problems.push(`${file} / ${node.name}: SQL wants $${highest}, replacement supplies ${supplied}`);
    }
  }
  assert(problems.length === 0, problems.join('; '));
  return `${pgNodes().length} nodes`;
});

/* -------------------------------------------------------------------- report */

const pad = Math.max(...results.map((r) => r.name.length));
let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name.padEnd(pad)}  ${r.detail}`);
}
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
