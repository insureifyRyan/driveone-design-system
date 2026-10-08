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
  '07-scorecard.json',
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

  // No metric row may claim engagement. Open and click tracking are off on the
  // sending domain and the Resend webhook carries bounced/complained only, so
  // such a row would read 0 every week and be taken for a dead campaign.
  const labelled = out[0].json.html.match(/<td[^>]*>\s*(Opened|Clicked|Open rate|Click rate|Delivered)/i);
  assert(!labelled, `scorecard shows a "${labelled && labelled[1]}" row for something nothing measures`);

  const to = JSON.parse((nodeNamed(wf, 'Send Scorecard').parameters.jsonBody
    .match(/to:\s*(\[[^\]]*\])/) || [])[1] || '[]');
  assert(to.length > 0 && to.every((a) => /@/.test(a)), 'scorecard has no recipient');

  return `${refs.size} metrics, all selected; ${to.length} recipient(s)`;
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
