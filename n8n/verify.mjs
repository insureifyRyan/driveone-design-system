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
import { readFileSync, readdirSync } from 'node:fs';
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
  '04-error-handler.json', '05-pricing.json', '06-commercial-review.json',
  '07-scorecard.json', '08-sales-alert.json', '09-sms-send.json',
  '10-sms-nurture.json', '11-sms-inbound.json',
].map((f) => ({ file: f, wf: load(f) }));

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

check('a dry run cannot advance anybody', () => {
  // WHY: DRY_RUN redirects every recipient to one inbox so a full run can be
  // read before anyone outside sees it. If the state writes were still reached,
  // that convenience would mark forty five real customers as having received
  // email 1 they never got, and they would silently resume at email 2. The
  // damage would be invisible until someone asked why nobody got the first one.
  //
  // So this asserts the shape rather than trusting a comment: the send node
  // must reach the log through the gate, never directly.
  const wf = load('02-scheduler.json');
  const conns = wf.connections;

  const send = conns['Send via Resend'];
  assert(send, 'Send via Resend has no outgoing connections');
  const success = send.main[0].map((c) => c.node);
  assert(!success.includes('Log Send'),
    'Send via Resend reaches Log Send directly, so a dry run would advance real customers');
  assert(success.includes('Dry Run?'),
    `Send via Resend should reach the dry run gate first, goes to ${success.join(', ')}`);

  const gate = conns['Dry Run?'];
  assert(gate, 'the Dry Run? gate has no outgoing connections');
  const [whenDry, whenLive] = gate.main.map((b) => b.map((c) => c.node));
  assert(!whenDry.includes('Log Send') && !whenDry.includes('Advance State'),
    `the dry run branch writes state: ${whenDry.join(', ')}`);
  assert(whenLive.includes('Log Send'),
    `the live branch must log the send, goes to ${whenLive.join(', ')}`);

  // And the send body has to actually honour the variable, or the gate is
  // guarding a redirect that never happens.
  const body = nodeNamed(wf, 'Send via Resend').parameters.jsonBody;
  assert(/\$vars\.DRY_RUN\s*\|\|/.test(body),
    'the recipient is not redirected when DRY_RUN is set');
  assert(body.includes('DRY RUN ->'),
    'the subject does not name the intended recipient, so a dry run is unreadable');
  return 'send -> gate -> log, dry branch writes nothing';
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
  //
  // Strip comments before testing. A node that correctly uses $input.all() and
  // explains WHY in a comment mentioning $json was failing this, which is the
  // same trap as matching a SQL comment: the check must read what the code
  // does, not what it says about itself.
  const stripped = (js) => js
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  const bad = codeNodes()
    .filter(({ node }) => node.parameters.mode !== 'runOnceForEachItem')
    .filter(({ node }) => /(^|[^.\w])\$json\b/.test(stripped(node.parameters.jsCode)))
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

check('the cohort caps total enrolment, not one run', () => {
  // WHY: intake runs hourly, is idempotent, and took `limit $6` straight from
  // initial_cohort. That caps a single RUN. With 1,244 eligible and a cohort of
  // 350 the sweep enrolled 350 in the first hour, 350 in the second, and the
  // whole eligible population before lunch - 12,440 sends at ~366/day against a
  // 200 cap, which is the exact outcome the cohort is documented as preventing.
  // Nothing errors: every row is genuinely eligible and the conflict clause
  // makes re-runs free. The only symptom is a send volume pinned at the ceiling
  // for weeks, discovered long after the enrolment that caused it.
  //
  // Assert the subtraction is present rather than that the SQL merely has a
  // limit, because the broken version had a limit too.
  const intake = WORKFLOWS.find(({ file }) => file === '01-intake.json');
  assert(intake, '01-intake.json not found');
  const node = nodesOf(intake.wf).find((n) =>
    n.type === 'n8n-nodes-base.postgres' && /insert into vsc_enrollment/i.test(n.parameters.query || ''));
  assert(node, 'no enrolment insert found in 01-intake.json');

  const sql = node.parameters.query.replace(/^\s*--.*$/gm, '');
  assert(/limit\s+greatest\s*\(/i.test(sql),
    'intake limit is not clamped with greatest(); a bare limit caps one run, not the campaign');
  assert(/select\s+count\(\*\)\s+from\s+vsc_enrollment/i.test(sql),
    'intake limit does not subtract rows already enrolled, so the hourly sweep will enrol the entire eligible population');
  assert(/where\s+dealer_id\s*=\s*\$1\s+and\s+campaign_id\s*=\s*\$2/i.test(sql),
    'the already-enrolled count is not scoped to this dealer and campaign');
  return 'limit subtracts already-enrolled, scoped to dealer and campaign';
});

check('a raised cohort actually fills', () => {
  // WHY: the subtraction above is necessary and was not sufficient, and the two
  // failures look identical from outside - a sweep that reports success and
  // inserts nothing.
  //
  // `limit cohort - enrolled` was applied to the raw candidate rows, and nothing
  // in the WHERE clause excluded people already enrolled. They were dropped at
  // the very end by `on conflict do nothing`, which is far too late: the slot had
  // already been spent. Worse, the ordering is freshest-visit-first and the
  // previous cohort was taken freshest-first too, so the already-enrolled are
  // exactly the rows at the top of the list. Every slot at the front of the queue
  // went to someone already in the campaign.
  //
  // Measured against Ferrario's live data at the first ramp step, cohort 30 -> 90:
  // the budget is 61, the 61 freshest candidates contain all 30 rows belonging to
  // the 29 already enrolled, so 31 new people are enrolled and the total reaches
  // 60 rather than 90. The next sweep computes a budget of 30, the 30 freshest
  // candidates are all already enrolled, and it inserts zero. The ramp stalls at
  // roughly double its first step and stays there for good.
  //
  // The second leak is duplicate quotes. A customer with two service visits in
  // the window is two candidate rows, counts twice against the budget, and
  // inserts once. initial_cohort is denominated in PEOPLE, so the candidate set
  // has to be too.
  //
  // This check is structural: it asserts the exclusion happens before the limit
  // rather than after it, because that ordering is the whole fix and it cannot be
  // read off a row count. The behavioural proof is a read-only query against the
  // live database, which returned 60 under the old SQL and 90 under this one.
  const intake = WORKFLOWS.find(({ file }) => file === '01-intake.json');
  assert(intake, '01-intake.json not found');
  const node = nodesOf(intake.wf).find((n) =>
    n.type === 'n8n-nodes-base.postgres' && /insert into vsc_enrollment/i.test(n.parameters.query || ''));
  assert(node, 'no enrolment insert found in 01-intake.json');

  const sql = node.parameters.query.replace(/^\s*--.*$/gm, '');

  // One row per person, so the budget counts people and not visits.
  assert(/distinct\s+on\s*\(\s*customer_key\s*\)/i.test(sql),
    'intake does not collapse candidates to one row per customer_key, so a customer with two visits spends two cohort slots and fills one');

  // The already-enrolled must be filtered out of the candidate set itself.
  const antiJoin = /not\s+exists\s*\(\s*select\s+1\s+from\s+vsc_enrollment\b/i.exec(sql);
  assert(antiJoin,
    'intake never excludes already-enrolled customers from the candidate set; it relies on ON CONFLICT, which discards them only after they have spent a cohort slot');

  // ...and it must come BEFORE the limit. After it, it does nothing.
  const limitAt = sql.search(/\blimit\s+greatest\s*\(/i);
  assert(limitAt !== -1, 'no clamped limit found');
  assert(antiJoin.index < limitAt,
    'the already-enrolled exclusion appears after the limit, so the limit is still spent on rows that are then discarded');

  // ON CONFLICT stays, as the race guard between two concurrent sweeps.
  assert(/on\s+conflict\s*\([^)]*\)\s*do\s+nothing/i.test(sql),
    'the conflict guard was removed; two concurrent sweeps could now double-enrol');

  return 'already-enrolled excluded before the limit, candidates deduped per person';
});

check('a held commercial row can never be sent', () => {
  // WHY: a corporate owned vehicle is rated with a commercial surcharge, and
  // nothing in this engine can apply one - 05 reads a price that was set
  // upstream and never rates anything. So a suspected business must not be
  // quoted the consumer monthly: an email showing less than checkout charges is
  // a price claim, the same failure the never-price-locally rule exists to stop.
  //
  // The hold works only because of a coincidence that is easy to break: the
  // scheduler's claim is scoped to status = 'active', so any other status is
  // invisible to it. Nobody wrote that as a safety mechanism, so nobody would
  // think twice about widening the claim to 'active','paused' one day and
  // silently releasing every held row into a send. This check makes the
  // coincidence load bearing.
  const intake = WORKFLOWS.find(({ file }) => file === '01-intake.json');
  const sched  = WORKFLOWS.find(({ file }) => file === '02-scheduler.json');
  assert(intake && sched, '01-intake.json or 02-scheduler.json not found');

  const intakeSql = nodesOf(intake.wf).find((n) =>
    n.type === 'n8n-nodes-base.postgres' && /insert into vsc_enrollment/i.test(n.parameters.query || '')
  ).parameters.query;
  assert(/held_commercial/.test(intakeSql),
    'intake no longer holds suspected businesses, so a corporate vehicle would be quoted a consumer price');

  // The detector must be anchored. An unanchored term matches inside surnames:
  // "temple" inside STEMPLE, "inc" inside INCE, "ranch" inside RANCHER. Holding a
  // real customer is not a harmless false positive - they silently stop receiving
  // the campaign until someone reads a review queue.
  const terms = intakeSql.match(/\\m[a-z. \\]+\\M/g) || [];
  assert(terms.length >= 10, `expected an anchored commercial term list, found ${terms.length}`);

  const claim = nodesOf(sched.wf).find((n) =>
    n.type === 'n8n-nodes-base.postgres' && /update vsc_enrollment/i.test(n.parameters.query || '')
  ).parameters.query;
  const statuses = [...claim.matchAll(/status\s*=\s*'([a-z_]+)'/gi)].map((m) => m[1]);
  assert(statuses.length > 0, 'the claim no longer filters on status at all, so held rows would be sent');
  const sendable = [...new Set(statuses)];
  assert(sendable.length === 1 && sendable[0] === 'active',
    `the claim sends statuses [${sendable.join(', ')}]; only 'active' may be sent or held_commercial leaks into a send`);
  assert(!/status\s+in\s*\(/i.test(claim),
    'the claim uses status IN (...), which can admit a held status; keep it as a single equality');

  return `hold emitted, ${terms.length} anchored terms, claim restricted to 'active'`;
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

check('no webhook path collides with another dealership', () => {
  // WHY: n8n enforces a unique webhook path across ACTIVE workflows. The
  // internal events path was the literal 'vsc/events/:dealer' for every
  // dealership the engine built, so the first rooftop to go live claimed it and
  // every later one could create 03 Events but never activate it. Activating 03
  // is what makes bounces, complaints and unsubscribes reach vsc_suppression,
  // so the failure mode is a second dealership that looks fully built and
  // quietly honours no opt-outs.
  //
  // Nothing in a single-dealer build can see this, which is why it needs a
  // cross-dealer check: read every dealer file, rebuild the path each one
  // would claim, and refuse a duplicate.
  const dealerDir = join(ROOT, 'brand/dealers');
  const seen = new Map();
  const clashes = [];
  for (const f of readdirSync(dealerDir).filter((n) => n.endsWith('.json'))) {
    const d = JSON.parse(readFileSync(join(dealerDir, f), 'utf8'));
    const id = d.id || f.replace(/\.json$/, '');
    const paths = [
      (d.campaign && d.campaign.eventsWebhookPath) || ('vsc/events/' + id),
      'vsc/resend/' + id,
    ];
    for (const path of paths) {
      if (seen.has(path)) clashes.push(`${path} claimed by both ${seen.get(path)} and ${id}`);
      else seen.set(path, id);
    }
  }
  assert(clashes.length === 0, clashes.join('; '));
  return `${seen.size} paths across ${new Set(seen.values()).size} dealerships`;
});

check('a subject never greets a name we do not have', () => {
  // WHY: Ferrario's feed carries 50 records whose first_name is the literal
  // string "First" and last_name "Last" - real people with real emails and real
  // vehicles whose names were never captured. They cluster in the newest quotes,
  // so freshest-first intake pulled 28 of them into the first cohort of 29, and
  // step 1 variant A went out as "First, one thing was missing from your file".
  //
  // Nothing errored, which is the point. "First" is a non-empty string, so the
  // || "there" fallback never fired, and the unresolved-merge-tag guard saw a
  // tag that had been resolved - just resolved to garbage. Only a human reading
  // the dry-run subject lines caught it.
  const code = nodeNamed(load('02-scheduler.json'), 'Prepare Send').parameters.jsCode;
  const base = {
    id: 'x', dealer_id: 'd', campaign_id: 'c', current_step: 0,
    created_at: new Date().toISOString(), monthly_payment: 129, down_payment: 50,
    contract_price: 3364, payment_term: 36, contract_months: 36, coverage_miles: 50000,
    vehicle_year: '2019', vehicle_make: 'Ford', vehicle_model: 'Escape',
    vehicle_mileage: 72000, quote_url: 'https://example.test/q', ro_closed_date: '2026-09-20',
  };
  const unusable = ['First', 'Last', 'CUSTOMER', 'unknown', 'n/a', 'none', 'null', 'test', '', null];
  const rows = [];
  unusable.forEach((n, i) => {
    // Several keys per name so both arms of the deterministic split are hit.
    for (let k = 0; k < 8; k++) rows.push({ ...base, customer_key: 'k' + i + '_' + k, first_name: n });
  });

  const out = new Function('$input', '$vars', 'require', code)(
    { all: () => rows.map((r) => ({ json: r })) }, {}, nodeRequire);

  const greeted = out.filter((o) => /\{\{first_name\}\}/.test(o.json.subject));
  assert(greeted.length === 0,
    `${greeted.length} of ${out.length} subjects ask for a name the record does not have`);
  const named = out.filter((o) => o.json.merge.first_name !== 'there');
  assert(named.length === 0,
    `merge first_name should fall back to "there", got: ${[...new Set(named.map((o) => o.json.merge.first_name))].join(', ')}`);
  return `${out.length} unusable-name rows, none greeted`;
});

check('the scorecard cannot report a number it never read', () => {
  // WHY: a scorecard fails silently. If the SQL stops returning a column the
  // composer reads - renamed, dropped, typo'd - the row does not error, it
  // renders as 0 or blank, and a weekly email showing "Purchases: 0" is
  // indistinguishable from a true zero. Nobody chases a number that looks
  // plausible. So every r.<field> the composer touches must be a column the
  // query actually names.
  const wf = load('07-scorecard.json');
  const sql = nodeNamed(wf, 'Gather Numbers').parameters.query;
  const code = nodeNamed(wf, 'Compose Scorecard').parameters.jsCode;

  const aliases = new Set([...sql.matchAll(/\bas\s+([a-z_][a-z0-9_]*)\s*(?=[,;])/gi)].map((m) => m[1]));
  const refs = new Set([...code.matchAll(/\br\.([a-z_][a-z0-9_]*)/g)].map((m) => m[1]));
  const missing = [...refs].filter((f) => !aliases.has(f));
  assert(missing.length === 0,
    `composer reads ${missing.join(', ')}, which the query does not select`);

  // And it must actually render from those columns rather than throw.
  const row = {};
  for (const a of aliases) row[a] = 3;
  const out = new Function('$input', '$vars', 'require', code)(
    { first: () => ({ json: row }), all: () => [{ json: row }] }, {}, nodeRequire);
  assert(out.length === 1 && out[0].json.html && out[0].json.subject, 'composer produced no email');

  // Opens stay off the report. Open tracking is deliberately disabled (Apple
  // Mail pre-fetches images, so the figure measures the client as much as the
  // reader), so an "Opened" row could only ever read 0 and be taken for a dead
  // campaign. Delivered and Clicked ARE allowed now that vsc_email_event
  // records them - and the field check above is what keeps them honest.
  const opens = out[0].json.html.match(/<td[^>]*>\s*(Opened|Open rate)\b/i);
  assert(!opens, `scorecard shows an "${opens && opens[1]}" row, but open tracking is off so it can only read 0`);

  // Engagement counts must be scoped by the send log, not by vsc_email_event's
  // own dealer_id. A Resend webhook is account-wide: every message the account
  // sends hits this endpoint, and an unlabelled event defaults to this dealer.
  // Unjoined, the first live day read 23 delivered against 14 real sends.
  const engagement = sql.match(/from vsc_email_event[\s\S]*?(?=\)\s*as\s)/g) || [];
  assert(engagement.length > 0, 'no engagement subquery found');
  engagement.forEach((q, i) => {
    assert(/join vsc_send_log/.test(q) && /l\.dealer_id = \$1/.test(q) && /l\.campaign_id = \$2/.test(q),
      `engagement subquery ${i + 1} does not join vsc_send_log on dealer and campaign, so it counts other campaigns' mail`);
  });

  const to = JSON.parse((nodeNamed(wf, 'Send Scorecard').parameters.jsonBody
    .match(/to:\s*(\[[^\]]*\])/) || [])[1] || '[]');
  assert(to.length > 0 && to.every((a) => /@/.test(a)), 'scorecard has no recipient');

  return `${refs.size} metrics, all selected; ${to.length} recipient(s)`;
});

check('a cohort does not all land on one timestamp', () => {
  // WHY: this is the bug that got to production. The day snapping was correct
  // and nobody had spread the CLOCK, so every advance wrote the same hour and a
  // whole cohort arrived as one block - 29 live rows sat at exactly
  // Tue 13 Oct 10:00, the entire weekend backlog pointed at one hour of one
  // morning. Every existing check passed: the per-person gap was right, the
  // cadence was right, the daily total was right. Only the hour histogram
  // showed it, and nothing was looking at the hour histogram.
  const code = nodeNamed(load('02-scheduler.json'), 'Prepare Send').parameters.jsCode;
  const created = new Date(Date.now() - 3 * 86400000).toISOString();
  const base = {
    id: 'x', dealer_id: 'd', campaign_id: 'c', current_step: 1,
    created_at: created, first_name: 'Eric', monthly_payment: 129, down_payment: 50,
    contract_price: 3364, payment_term: 36, contract_months: 36, coverage_miles: 50000,
    vehicle_year: '2019', vehicle_make: 'Ford', vehicle_model: 'Escape',
    vehicle_mileage: 72000, quote_url: 'https://example.test/q', ro_closed_date: '2026-09-20',
  };
  // One cohort: same enrolment date, same step, different people. Exactly the
  // shape that produced the pile-up.
  const rows = Array.from({ length: 90 }, (_, i) => ({ ...base, customer_key: 'cohort_' + i }));
  const out = new Function('$input', '$vars', 'require', code)(
    { all: () => rows.map((r) => ({ json: r })) }, {}, nodeRequire);

  const times = out.map((o) => o.json.next_send_at).filter(Boolean);
  assert(times.length >= 50, `expected a cohort to be scheduled, got ${times.length}`);

  const hours = new Set(times.map((t) => new Date(t).getUTCHours()));
  assert(hours.size >= 3,
    `a 90 person cohort landed on ${hours.size} distinct hour(s); it needs to fan out across the window`);

  const perHour = {};
  for (const t of times) {
    const k = new Date(t).toISOString().slice(0, 13);
    perHour[k] = (perHour[k] || 0) + 1;
  }
  const worst = Math.max(...Object.values(perHour));
  const ceiling = Math.ceil(times.length / 3);
  assert(worst <= ceiling,
    `${worst} of ${times.length} sends share one hour (limit ${ceiling}); that is the pile-up, not a spread`);

  // And the whole point of seeding on the contact: a person's own gaps must
  // still be whole days, or spreading the cohort would quietly breach the
  // three day minimum between two emails to the same human.
  const again = new Function('$input', '$vars', 'require', code)(
    { all: () => rows.map((r) => ({ json: r })) }, {}, nodeRequire);
  assert(JSON.stringify(again.map((o) => o.json.next_send_at)) === JSON.stringify(times),
    'scheduling is not deterministic: the same cohort produced different times on a second run');

  return `${times.length} sends across ${hours.size} hours, worst hour ${worst}`;
});

check('intake never makes a new cohort due on arrival', () => {
  // WHY: next_send_at = now() is harmless for one row a day and wrong for a
  // cohort raise. 30 to 90 inserted 60 rows all due at once, which at maxPerRun
  // is two hours of solid sending on a warming subdomain, and it had to be
  // unwound by hand. The ramp has to be a property of the insert.
  const sql = nodeNamed(load('01-intake.json'), 'Enroll Eligible Service Customers').parameters.query;
  const cols = /insert into vsc_enrollment\s*\(([\s\S]*?)\)/.exec(sql);
  assert(cols, 'could not find the enrolment insert');
  const idx = cols[1].split(',').map((c) => c.trim()).indexOf('next_send_at');
  assert(idx >= 0, 'insert does not write next_send_at');

  assert(/\bslots\b/.test(sql) && /row_number\(\) over \(order by ts\)/.test(sql),
    'intake does not deal new rows onto precomputed send slots');
  assert(!/\bend,\s*0,\s*now\(\)/.test(sql),
    'intake still inserts next_send_at = now(), so a cohort raise is due the instant it lands');
  // The slots must exclude days the window is shut, or rows land on a Saturday
  // and queue into Monday's first hour, which is the same pile-up by a different
  // route.
  assert(/extract\(dow from d\) = any\(array\[/.test(sql),
    'slots are not restricted to days the send window is open');
  assert(/where ts > now\(\)/.test(sql),
    'slots are not filtered to the future, so a past slot would be due on arrival');
  return 'new rows are dealt onto future in-window slots';
});

check('no node reads $env', () => {
  // WHY: workflow 04 sat mute for days because its deployed Alert Slack node
  // read {{ $env.SLACK_ALERT_WEBHOOK }}. n8n Cloud sets
  // N8N_BLOCK_ENV_ACCESS_IN_NODE, so the expression dies with "access to env
  // vars denied" before any request is made. It fails as a silent expression
  // error on the node, not as a visible misconfiguration, and no amount of
  // fixing the variable helps. Config comes from $vars.
  const offenders = [];
  for (const { file, wf } of WORKFLOWS) {
    for (const n of wf.nodes) {
      const blob = JSON.stringify(n.parameters || {});
      if (/\$env\b/.test(blob)) offenders.push(`${file}:${n.name}`);
    }
  }
  assert(offenders.length === 0,
    `$env is blocked on n8n Cloud and fails silently; use $vars. Found in: ${offenders.join(', ')}`);
  return `${WORKFLOWS.length} workflows clean`;
});

check('a sale can never be announced twice', () => {
  // WHY: a duplicate "New VSC sale" in Slack is worse than a missed one. It
  // makes the channel untrustworthy, and nobody can tell a real second sale
  // from a repeat. The insert has to BE the claim: announce only the rows this
  // run actually inserted, so two sweeps racing cannot both win the same quote.
  const sql = nodeNamed(load('08-sales-alert.json'), 'Claim New Sales').parameters.query;

  assert(/insert into vsc_sale_announced/.test(sql), 'does not record what it announced');
  assert(/on conflict \(quote_id\) do nothing/.test(sql),
    'no conflict guard, so two concurrent sweeps can both announce the same sale');
  assert(/returning quote_id/.test(sql) && /from claimed/.test(sql),
    'does not select from the rows its own insert won, so the claim is not atomic');
  // Selecting straight from quotes would announce rows another run just took.
  assert(!/from quotes q\s*\n\s*(left )?join claimed/i.test(sql),
    'drives the announcement from quotes rather than from claimed');

  const url = nodeNamed(load('08-sales-alert.json'), 'Post Sale To Slack').parameters.url;
  assert(/\$vars\.SLACK_ALERT_WEBHOOK/.test(url), 'sales alert does not post to the Slack webhook variable');
  return 'insert is the claim, guarded by the quote_id primary key';
});

check('an SMS body fits one segment and names the store', () => {
  // WHY: a plain SMS over 160 GSM-7 characters is silently split and billed as
  // two, and carriers treat multi-segment marketing traffic worse. The limit is
  // easy to blow by one word while editing, and nothing downstream complains,
  // so the first sign is the bill. Measured against the LONGEST vehicle model
  // in the live cohort rather than a short one, because the merge tag is what
  // pushes a body over: "Grand Cherokee" costs eight characters more than
  // "Escape" and that was the difference on message 3.
  const deck = JSON.parse(readFileSync(join(ROOT, 'email/copy/campaign.json'), 'utf8'));
  assert(Array.isArray(deck.sms) && deck.sms.length, 'the deck carries no SMS copy');

  // Worst case the live data can produce, not a convenient example.
  const worst = { model: 'Grand Cherokee', payment: '$136.39', url: 'https://do1.co/a7x9k2' };
  const render = (body, dealerName) => body
    .replace(/\{\{dealer_name\}\}/g, dealerName)
    .replace(/\{\{vehicle_year\}\}/g, '2019')
    .replace(/\{\{vehicle_model\}\}/g, worst.model)
    .replace(/\{\{monthly_payment\}\}/g, worst.payment)
    .replace(/\{\{payment_term\}\}/g, '36')
    .replace(/\{\{quote_url\}\}/g, worst.url);

  // The deck is SHARED across rooftops, so the body has to fit the longest
  // dealer name any of them has, not the one being verified. "Bob Johnson Auto
  // Group" is nine characters longer than "Ferrario Ford", which was the whole
  // difference: message 3 passed on Ferrario and came out one character over on
  // Bob Johnson. Verifying one rooftop now catches an overflow on any of them.
  const allDealers = readdirSync(join(ROOT, 'brand/dealers'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(ROOT, 'brand/dealers', f), 'utf8')));
  const names = allDealers.map((d) => (d.dealer && (d.dealer.displayName || d.dealer.name)) || d.id);
  const dealerName = names.reduce((a, b) => (b.length > a.length ? b : a));

  // The dealer whose name is actually used for the branding assertions is the
  // one being verified; the length test uses the longest above.
  const thisDealer = allDealers.find((d) => d.id === DEALER_ID) || {};
  const thisName = (thisDealer.dealer && (thisDealer.dealer.displayName || thisDealer.dealer.name)) || DEALER_ID;
  const lengths = [];
  for (const s of deck.sms) {
    const text = render(s.body, dealerName);

    // Unresolved merge tag: it would go out as literal braces.
    const leftover = text.match(/\{\{[a-z_]+\}\}/g);
    assert(!leftover, `SMS ${s.step} has unresolved merge tags: ${leftover && leftover.join(', ')}`);

    // DEALER BRANDED. Sendblue sends from a bare number with no branded sender
    // ID, so naming the store in the opening words IS the branding, and it is
    // what stops a text from an unknown number reading as spam.
    assert(render(s.body, thisName).slice(0, 40).includes(thisName),
      `SMS ${s.step} does not name the dealer up front: "${render(s.body, thisName).slice(0, 40)}"`);
    // Never send as DriveOne on this channel: it is the dealer's customer.
    assert(!/\bDriveOne\b/.test(text), `SMS ${s.step} says DriveOne; this channel is the dealership`);

    // MMS carries a much larger text allowance, so the 160 rule is for SMS only.
    if (!s.media) {
      assert(text.length <= 160,
        `SMS ${s.step} is ${text.length} chars with "${worst.model}", over one segment`);
    }
    lengths.push(`${s.step}:${text.length}${s.media ? 'mms' : ''}`);
  }

  // Opt-out on the first and last message. CTIA wants it on the first plus
  // periodic reminders; with three messages that is the first and the last.
  const first = deck.sms[0], last = deck.sms[deck.sms.length - 1];
  for (const s of [first, last]) {
    assert(/\bSTOP\b/.test(s.body), `SMS ${s.step} carries no STOP instruction`);
  }

  // The cadence must stay far sparser than the email one. Ten texts in sixty
  // days earns opt-outs, carrier filtering, and an angry dealer.
  assert(deck.sms.length <= 4,
    `${deck.sms.length} texts is too many against a 60 day sequence`);
  const days = deck.sms.map((s) => s.sendDay);
  for (let i = 1; i < days.length; i++) {
    assert(days[i] - days[i - 1] >= 10,
      `SMS ${deck.sms[i].step} is only ${days[i] - days[i - 1]} days after the previous one`);
  }

  return `${deck.sms.length} texts, days ${days.join('/')}, chars ${lengths.join(' ')}`;
});

check('a late enrolment gets one text, not the whole backlog', () => {
  // WHY: the schedule is a list of day offsets, so the obvious implementation
  // picks "the next unsent step whose day has passed". For somebody enrolled
  // late, or paused and resumed, that is step 1 today, step 2 tomorrow, step 3
  // the day after: three texts in three days to a person who has had none. On
  // email that is clumsy. On SMS it is an opt-out, a carrier complaint, and a
  // dealer asking what we are doing to their customers. The rule is therefore
  // the HIGHEST due step, so a late joiner lands where the sequence actually
  // is. This runs the real node code rather than asserting on its text.
  const code = nodeNamed(load('10-sms-nurture.json'), 'Render Text').parameters.jsCode;
  const run = (rows) => new Function('$input', code)(
    { all: () => rows.map((r) => ({ json: r })) });

  const base = {
    customer_id: 1, phone_e164: '+15551234567', quote_url: 'https://do1.co/a7x9k2',
    monthly_payment: 136.39, payment_term: 36,
    vehicle_year: 2019, vehicle_model: 'ESCAPE', sms_step_sent: 0,
  };
  const aged = (days) => new Date(Date.now() - days * 86400000).toISOString();

  // Nothing is due on day 0: the first text is day 5.
  assert(run([{ ...base, created_at: aged(0) }]).length === 0,
    'a brand new enrolment is texted immediately');

  // Day 6, nothing sent: step 1.
  const day6 = run([{ ...base, created_at: aged(6) }]);
  assert(day6.length === 1 && day6[0].json.step === 1, 'step 1 is not due on day 6');

  // Day 6 with step 1 already sent: nothing until day 21.
  assert(run([{ ...base, created_at: aged(6), sms_step_sent: 1 }]).length === 0,
    'a step is re-sent after it has already gone');

  // THE CASE THIS CHECK EXISTS FOR. Day 55, nothing ever sent. One text, and it
  // is the one the sequence is actually at, not step 1 of 3.
  const late = run([{ ...base, created_at: aged(55) }]);
  assert(late.length === 1, `a late enrolment produced ${late.length} texts in one run`);
  assert(late[0].json.step === 3,
    `a late enrolment got step ${late[0].json.step}; it should join at the current step`);

  // Merge tags resolve, and the shouting DMS model is recased.
  const body = day6[0].json.body;
  assert(!/\{\{[a-z_]+\}\}/.test(body), `unresolved merge tag went out: ${body}`);
  assert(body.includes('Escape') && !body.includes('ESCAPE'), `model not recased: ${body}`);
  assert(body.includes('$136.39'), `price not formatted as money: ${body}`);

  // A row with no vehicle model is dropped rather than sent with a hole in it.
  assert(run([{ ...base, created_at: aged(6), vehicle_model: '' }]).length === 0,
    'a row with no vehicle model is still texted');
  // A row with no quote link would leave the body ending in nothing.
  assert(run([{ ...base, created_at: aged(6), quote_url: '' }]).length === 0,
    'a row with no checkout link is still texted');

  // MMS only where the deck asks. Step 1 carries the dealer logo; step 3 must not.
  assert(day6[0].json.media_url, 'step 1 is meant to carry the dealer logo as MMS');
  assert(!late[0].json.media_url, 'step 3 is sending as MMS; only the first text should');

  return 'highest due step only, tags resolved, incomplete rows dropped';
});

check('a STOP reply is recognised and silences every campaign', () => {
  // WHY: this is the highest-consequence code in the SMS layer. A STOP that is
  // not recognised keeps texting someone who told us to stop, at $500 to $1,500
  // a message, on the dealer's own customer list. And the failure is INVISIBLE:
  // a handler that matches nothing looks exactly like a week where nobody opted
  // out. An earlier version of this classifier derived the customer's number by
  // taking "whichever number is not ours", which with no rooftop number yet
  // configured made every opt-out ambiguous and suppressed NOBODY. Runs the
  // real node code against Sendblue's documented message shape.
  const wf = load('11-sms-inbound.json');
  const code = nodeNamed(wf, 'Classify Inbound').parameters.jsCode;
  // Feed it the way n8n does: one item per message, each wrapped in .json.
  // Returns the unwrapped payloads: the node emits n8n's { json: ... } envelope.
  const run = (messages) => new Function('$input', code)(
    { all: () => messages.map((m) => ({ json: m })) }).map((o) => o.json);

  const inbound = (content, extra = {}) => ({
    is_outbound: false, content,
    from_number: '+15551234567', number: '+19998887777',
    message_handle: 'msg_in_1', date_created: '2026-10-13T12:00:00Z', ...extra,
  });

  // The words people actually send, in the casings they actually use.
  for (const word of ['STOP', 'stop', 'Stop', 'STOP.', 'unsubscribe', 'CANCEL',
    'end', 'quit', 'opt out', 'remove me', 'stopall']) {
    const [r] = run([inbound(word)]);
    assert(r && r.kind === 'stop', `"${word}" was classified as ${r && r.kind}, not stop`);
    assert(r.phone_e164 === '+15551234567',
      `"${word}" resolved the wrong number: ${r.phone_e164}`);
  }

  // A sentence CONTAINING stop is not an opt-out. Matching as a substring would
  // opt out the person who wrote the second one, which is the opposite of what
  // they asked for.
  for (const phrase of ['please do not stop sending these, they are useful',
    'can you stop by the shop tomorrow', 'I will stop in on Friday']) {
    const [r] = run([inbound(phrase)]);
    assert(r && r.kind === 'reply', `"${phrase}" was treated as an opt-out`);
  }

  // An ordinary reply is kept, not silently dropped: somebody has to read it.
  const [reply] = run([inbound('how much for two years?')]);
  assert(reply.kind === 'reply' && reply.body, 'a real reply is discarded');

  // Outbound traffic becomes a status update, never a suppression.
  const [st] = run([{ is_outbound: true, message_handle: 'msg_out_9', status: 'DELIVERED' }]);
  assert(st.kind === 'status' && st.message_handle === 'msg_out_9',
    'an outbound message is not turned into a status update');
  const outStop = run([{ is_outbound: true, content: 'STOP', message_handle: 'x', status: 'SENT' }]);
  assert(outStop.every((r) => r.kind !== 'stop'),
    'a message WE sent containing the word STOP suppressed the customer');

  // Unknown direction is left alone rather than guessed at.
  assert(run([{ content: 'STOP', message_handle: 'y' }]).length === 0,
    'a message with no direction flag is acted on');

  // Where the number genuinely cannot be resolved, it is flagged for a human
  // instead of silently dropped.
  const [amb] = run([inbound('STOP', { from_number: null, number: null })]);
  assert(amb.kind === 'stop_ambiguous', 'an unresolvable opt-out is not flagged');

  // The write must be idempotent, because the sweep re-reads after a failed run.
  const sql = nodeNamed(wf, 'Suppress And Record').parameters.query;
  assert(/on conflict \(phone_e164\) do nothing/i.test(sql),
    'suppression is not idempotent, so a re-read errors instead of no-opping');
  assert(/update sms_consent[\s\S]*revoked_at = now\(\)/i.test(sql),
    'a STOP does not revoke the consent row, leaving live consent beside a suppression');
  // Suppression must not sit behind a branch that a status update can divert.
  const feeds = Object.entries(wf.connections)
    .filter(([, c]) => JSON.stringify(c).includes('Suppress And Record'))
    .map(([from]) => from);
  assert(feeds.length === 1 && feeds[0] === 'Classify Inbound',
    `suppression is fed by ${feeds.join(', ')}, not directly by the classifier`);

  return 'stop words matched whole-string, number resolved, writes idempotent';
});

check('no text can leave without passing every gate', () => {
  // WHY: an email to the wrong person is an annoyance. A text to someone who
  // never consented, or who already replied STOP, is a statutory claim at
  // $500 to $1,500 PER MESSAGE, and because the list is Ferrario's, the
  // dealer is exposed alongside us. The gates therefore cannot live in a
  // chain of If nodes that a later edit can route around: the INSERT is the
  // gate, the HTTP node is fed by the insert and nothing else, and this
  // asserts that shape rather than the presence of the words.
  const wf = load('09-sms-send.json');
  const sql = nodeNamed(wf, 'Gate And Log').parameters.query;
  const code = sql.replace(/--[^\n]*/g, '');

  // The four conditions, each checked for what it actually does.
  // \b on every table name, learned the hard way: without it, renaming the
  // table to sms_suppression_DISABLED left this check green, because the
  // pattern matched the prefix. A check that passes on a disabled gate is
  // worse than no check, since it is the thing people trust instead of looking.
  assert(/not exists\s*\(\s*select 1 from sms_suppression\b/i.test(code),
    'a phone that replied STOP can still be texted');
  assert(/exists\s*\(\s*select 1 from sms_consent\b[\s\S]*?revoked_at is null/i.test(code),
    'does not require a live consent row for this number');
  assert(/from phone_line_type\b[\s\S]*?line_type\s*=\s*'mobile'/i.test(code),
    'does not require the number to be a mobile, so texts go to landlines');
  assert(/extract\(hour from \(now\(\) at time zone/i.test(code),
    'no quiet-hours check, so a text can land at 3am');
  assert(/sms_send_log\b[\s\S]*?sent_at\s*>=/i.test(code),
    'no per-day cap, so two campaigns can each text the same person');

  // Suppression must be checked, and it must not be reachable only via some
  // branch: it belongs in the same statement as the insert.
  assert(/insert into sms_send_log\b/i.test(code), 'the gate does not write the log row');
  assert(/returning/i.test(code), 'the gate returns nothing, so the send is not fed by it');
  assert(/\bsms_suppression\b/.test(code) &&
    code.search(/\bsms_suppression\b/) < code.search(/insert into sms_send_log\b/i),
    'the insert is not gated by the suppression check');

  // The send must be fed by the gate's output. If anything else feeds the HTTP
  // node, the gate is decorative.
  const feeds = Object.entries(wf.connections)
    .filter(([, c]) => JSON.stringify(c).includes('Send Via Sendblue'))
    .map(([from]) => from);
  assert(feeds.length === 1, `the Sendblue node is fed by ${feeds.length} nodes: ${feeds.join(', ')}`);
  assert(feeds[0] === 'Allowed?', `the Sendblue node is fed by ${feeds[0]}, not the gate`);

  // Credentials through $vars. $env is blocked inside nodes on n8n Cloud and
  // returns the string "access to env vars denied" rather than failing.
  const http = nodeNamed(wf, 'Send Via Sendblue').parameters;
  const headers = JSON.stringify(http.headerParameters);
  assert(/\$vars\.SENDBLUE_API_KEY_ID/.test(headers) && /\$vars\.SENDBLUE_API_SECRET/.test(headers),
    'Sendblue credentials are not read from $vars');
  assert(!/sb-api-secret-key["\s:]+[A-Za-z0-9_-]{12,}/.test(headers),
    'an API secret looks hardcoded into the workflow');

  // A provider failure has to correct the row the gate already wrote, or the
  // log claims a send that never happened and the daily cap blocks the retry.
  assert(nodeNamed(wf, 'Record Send Failure'), 'no failure path, so a failed send still reads as sent');
  assert((wf.connections['Send Via Sendblue'].main[1] || [])
    .some((t) => t.node === 'Record Send Failure'),
    'the failure path is not wired to the HTTP error output');

  return 'suppression, consent, mobile, quiet hours and daily cap, all inside the insert';
});

check('only a service drive account reaches the service drive channel', () => {
  // WHY: 08 shipped announcing every completed sale on the platform. The
  // reasoning was that Ferrario had sold nothing yet, so a scoped alert would
  // be silent with no way to tell working from broken - which traded the
  // channel's whole meaning for my convenience in testing it. 278 of the 280
  // completed sales are BHPH across 26 stores, so "every sale" is really "other
  // people's business", and the first live message put a 321 Drive sale, a
  // buy-here-pay-here account, in front of the service drive team.
  const sql = nodeNamed(load('08-sales-alert.json'), 'Claim New Sales').parameters.query;

  // Assert against what the query DOES, not what it says about itself: the
  // header comment names the two scopes that were wrong, and matching on that
  // prose would fail a correct query. Strip SQL comments first.
  const code = sql.replace(/--[^\n]*/g, '');

  // partner_type is NOT the test. Nine partners carry a service-drive type and
  // only the ones with a dealer file are on this campaign, so scoping on the
  // type would hand the channel LYNX Automotive, Empire Toyota and Mark Allen
  // Tulsa. The roster has to be explicit partner ids.
  assert(!/partner_type/.test(code),
    'scopes on partner_type, which includes service drive stores that are not on this campaign');

  // The scope has to bind where rows are CLAIMED. Filtering only in the final
  // select would still consume the claim limit on out-of-scope rows and bury
  // them in the ledger, so widening the scope later would skip them.
  const fresh = /with fresh as \(([\s\S]*?)\n\),/.exec(code);
  assert(fresh, 'cannot find the claim CTE to check what it scopes');
  assert(/q\.partner_id = any\(array\[/.test(fresh[1]),
    'the claim is not pinned to a roster of partner ids');

  // Every rooftop whose file says live must actually be in the built query.
  // This is the trap for flipping campaign.live and forgetting that 08 is
  // shared, built once, and carries the ids in its SQL.
  const dealers = readdirSync(join(ROOT, 'brand/dealers'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(ROOT, 'brand/dealers', f), 'utf8')));
  const live = dealers.filter((d) => d.campaign && d.campaign.live === true);
  assert(live.length > 0, 'no rooftop is marked campaign.live, so the channel can never speak');
  for (const d of live) {
    const pid = d.supabase && d.supabase.partner_id;
    assert(pid, `${d.id} is live but has no supabase.partner_id`);
    assert(fresh[1].includes(pid),
      `${d.id} is campaign.live but its partner id is not in the built query; rebuild 08`);
  }
  // And a rooftop that is NOT live must not be in there.
  for (const d of dealers.filter((x) => !(x.campaign && x.campaign.live === true))) {
    const pid = d.supabase && d.supabase.partner_id;
    if (pid) {
      assert(!fresh[1].includes(pid),
        `${d.id} is not live but its sales would be announced`);
    }
  }

  // A campaign-driven sale belongs here whatever store its quote hangs off.
  assert(/from vsc_enrollment e where e\.quote_id = q\.id/.test(fresh[1]),
    'an enrolled customer who bought could be filtered out by the roster');

  return `roster: ${live.map((d) => d.id).join(', ')}, plus any enrolled buyer`;
});

check('every announced sale names the dealer', () => {
  // WHY: the first live sale message went to the channel with no dealer on it.
  // The query asked for partners.business_name and the composer had a line for
  // it, so both halves looked right; the read was blocked by RLS on partners
  // and the left join quietly returned null. Then the fallback text said
  // "Dealer not on the quote", which was false - the quote had a partner - and
  // cost a day of looking at the wrong table. A sale nobody can attribute to a
  // store is not reportable, so this asserts the name renders, that shouting
  // DMS names and company suffixes survive, and that the two ways it can go
  // missing are told apart in the message itself.
  const wf = load('08-sales-alert.json');
  const sql = nodeNamed(wf, 'Claim New Sales').parameters.query;

  assert(/business_name/.test(sql), 'the claim query never asks for the dealer name');
  assert(/q\.partner_id is not null as has_partner/.test(sql),
    'cannot tell a quote with no dealer from a dealer row it failed to read');
  // The contract prefix is the administrator's series, not the store. Reading a
  // dealer out of it is how a 321 Drive sale got reported as Elko Volkswagen.
  assert(!/contract_number[^\n]*as dealer/.test(sql),
    'derives the dealer from the contract number, which names the administrator');

  const code = nodeNamed(wf, 'Compose Sale Message').parameters.jsCode;
  const run = (rows) => new Function('$input', '$vars', 'require', code)(
    { all: () => rows.map((r) => ({ json: r })) }, {}, nodeRequire)[0].json.text;

  const base = {
    sold_at: '2026-10-10T18:01:55Z', contract_number: 'ELKOV0106999',
    contract_price: 2729, payment_total_amount: 2729, payment_term: 18,
    first_name: 'Tonya M ', last_name: 'Pyle', has_partner: true,
    vehicle_year: 2019, vehicle_make: 'FORD', vehicle_model: 'Fusion',
    vehicle_mileage: 141894,
  };

  const plain = run([{ ...base, dealer: '321 Drive' }]);
  assert(plain.includes('321 Drive'), 'the dealer name does not reach the message');

  // "112 AUTO SALES" must not stay shouting, and "LLC" must not become "Llc".
  const shouty = run([{ ...base, dealer: '112 AUTO SALES' }]);
  assert(shouty.includes('112 Auto Sales'), `block capitals not recased: ${shouty.split('\n')[2]}`);
  const suffixed = run([{ ...base, dealer: 'ALPHA AUTO GROUP LLC' }]);
  assert(suffixed.includes('Alpha Auto Group LLC'),
    `company suffix mangled: ${suffixed.split('\n')[2]}`);

  // The two failure modes have to read differently, and neither may blame the
  // quote when the quote is not at fault.
  const blocked = run([{ ...base, dealer: null, has_partner: true }]);
  const absent = run([{ ...base, dealer: null, has_partner: false }]);
  assert(/unreadable/.test(blocked), 'an unreadable dealer row is not flagged as a permissions problem');
  assert(!/unreadable/.test(absent) && /no dealer/.test(absent),
    'a quote with no partner is reported as a permissions problem');
  assert(blocked !== absent, 'both ways of losing the dealer produce the same message');

  // Attribution must name the store, not its slug.
  const attributed = run([{ ...base, dealer: '321 Drive', campaign_dealer: 'ferrario-ford', campaign_step: 2 }]);
  assert(attributed.includes('Ferrario Ford'),
    'the campaign line shows the slug rather than the dealer name');
  assert(!/\(ferrario-ford,/.test(attributed), 'raw slug left in the campaign line');

  return 'dealer name renders, recases, and fails loudly in the right direction';
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
