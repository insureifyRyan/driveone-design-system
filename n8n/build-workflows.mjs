#!/usr/bin/env node
/**
 * Generates importable n8n workflow JSON from the same copy deck the emails are
 * built from, so the send cadence can never drift out of sync with the creative.
 *
 * Design note, and the reason this is not one long Wait-node chain:
 * a 60 day drip built on Wait nodes dies on every n8n restart, upgrade or
 * redeploy, and cannot be re-targeted once a contact is mid-flight. This uses a
 * durable state machine instead. Enrollment rows hold `next_send_at`, an hourly
 * scheduler picks up whatever is due, and exits are event driven. Restart n8n
 * mid-campaign and nothing is lost.
 *
 *   01-intake.json      DMS repair order feed  ->  eligibility  ->  enrollment row
 *   02-scheduler.json   hourly  ->  whatever is due  ->  send  ->  advance state
 *   03-events.json      purchase / unsubscribe / bounce  ->  exit + suppress
 *   04-error-handler.json  any failure  ->  alert, never silent
 *
 * Config is read through `$vars`, not `$env`. n8n Cloud blocks environment
 * variables outright: an expression reading `$env` there returns "access to env
 * vars denied" rather than a value, so a campaign wired to `$env` fails on every
 * send and every price. `$vars` is the supported mechanism on Cloud, and it
 * keeps the sending address and the API key out of this repo, which is the other
 * reason to prefer it over inlining the values here.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DECK = JSON.parse(readFileSync(join(ROOT, 'email/copy/campaign.json'), 'utf8'));
const DEALER = JSON.parse(readFileSync(join(ROOT, 'brand/dealers/bob-johnson.json'), 'utf8'));
const OFFER = JSON.parse(readFileSync(join(ROOT, 'brand/offer.json'), 'utf8'));

const SCHEDULE = DECK.emails.map((e) => ({ step: e.step, day: e.sendDay, slug: e.slug, subject: e.subject, subjectAlt: e.subjectAlt }));
const LAST_STEP = SCHEDULE.length;

/* --------------------------------------------------------------- builders */

let seq = 0;
const nid = (name) => 'n' + String(++seq).padStart(3, '0') + '-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function node(name, type, typeVersion, position, parameters, extra = {}) {
  return { parameters, id: nid(name), name, type: 'n8n-nodes-base.' + type, typeVersion, position, ...extra };
}

/** Linear connection helper. Pass arrays for branching nodes: chain(a, [bTrue, bFalse]). */
function connect(pairs) {
  const connections = {};
  for (const [from, to] of pairs) {
    const outputs = Array.isArray(to) ? to : [to];
    connections[from] = {
      main: outputs.map((target) =>
        target === null ? [] : (Array.isArray(target) ? target : [target]).map((t) => ({ node: t, type: 'main', index: 0 }))
      ),
    };
  }
  return connections;
}

function workflow(name, nodes, connections, extra = {}) {
  return {
    name,
    nodes,
    connections,
    active: false,
    settings: { executionOrder: 'v1', saveManualExecutions: true, callerPolicy: 'workflowsFromSameOwner', ...(extra.settings || {}) },
    pinData: {},
    tags: [{ name: 'driveone-vsc' }, { name: 'dealer:' + DEALER.id }],
  };
}

function pgNode(name, position, query, replacement, options = {}) {
  return node(name, 'postgres', 2.5, position, {
    operation: 'executeQuery',
    query,
    options: {
      queryReplacement: replacement,
      // n8n defaults queryBatching to "single": one execution for ALL incoming
      // items, using only the first item's replacements. Every other item is
      // silently discarded. On a node fed one item that is invisible; on a node
      // fed forty-five it is a disaster, and this campaign has five of the
      // latter. Left at the default, Advance State would have advanced one
      // enrolment and left the rest to be re-claimed and re-sent the same
      // email, Log Send would have logged one send so the daily cap
      // undercounted, and the bounce handler would have suppressed one address
      // out of a batch. Found when a pricing run rated 100 vehicles and wrote
      // exactly one price.
      //
      // "independently" rather than "transaction" on purpose: these writes
      // record things that already happened out in the world. An email that
      // was sent cannot be unsent by a rollback, so one bad row must not
      // discard the record of ninety-nine good ones.
      queryBatching: 'independently',
      ...options,
    },
  }, { credentials: { postgres: { id: 'REPLACE_PG_CRED_ID', name: 'DriveOne Postgres' } } });
}

const codeNode = (name, position, jsCode) =>
  node(name, 'code', 2, position, { jsCode });

const setNode = (name, position, assignments) =>
  node(name, 'set', 3.4, position, {
    assignments: {
      assignments: assignments.map((a, i) => ({ id: 'a' + i, name: a[0], value: a[1], type: a[2] || 'string' })),
    },
    options: {},
  });

const ifNode = (name, position, conditions) =>
  node(name, 'if', 2.2, position, {
    conditions: {
      options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
      conditions,
      combinator: 'and',
    },
    looseTypeValidation: true,
    options: {},
  });

// n8n keys each filter condition by id. The value is arbitrary, but it must be
// stable: a random one per build makes every rebuild a diff, and makes it look
// like the workflow changed when only the id did.
const condId = (left, operator, right) =>
  'c' + createHash('sha1').update(String(left) + '|' + operator + '|' + String(right))
    .digest('hex').slice(0, 6);

const cond = (left, operator, right, type = 'string') => ({
  id: condId(left, operator, right),
  leftValue: left,
  rightValue: right,
  operator: { type, operation: operator, ...(operator === 'true' || operator === 'false' ? { singleValue: true } : {}) },
});

/* ============================================================ 1. INTAKE == */

// The repair order data, the customers, the vehicles and the magic links all live
// in the same Supabase Postgres as the enrollment state. So intake is not a DMS
// webhook plus a normalizer plus a rules engine: it is one atomic statement that
// selects the eligible service customers and inserts enrollments, deduped by the
// unique constraint. Nothing to parse, nothing to drift.
const INTAKE_SQL = [
  'insert into vsc_enrollment (',
  '  dealer_id, campaign_id, customer_key, email, first_name,',
  '  vin, ro_number, ro_closed_date, vehicle_year, vehicle_make, vehicle_model,',
  '  vehicle_mileage, advisor_name, garaging_state,',
  '  status, current_step, next_send_at, quote_url, quote_id',
  ')',
  'select',
  '  $1, $2,',
  "  encode(sha256(($1 || ':' || lower(trim(c.email)))::bytea), 'hex'),",
  '  lower(trim(c.email)), c.first_name,',
  '  cv.vin,',
  '  -- the service drive creates one quote per visit, so the quote IS the visit record',
  '  q.id::text, q.created_at::date,',
  '  cv.year::text, cv.make, cv.model, cv.mileage,',
  '  q.service_advisor_id, c.state,',
  "  'active', 0, now(),",
  '  -- No link is built here. The quote API returns the real customer facing',
  '  -- links, so pricing fills quote_url and a locally guessed URL never exists.',
  '  null,',
  '  q.id',
  'from quotes q',
  'join customers c           on c.id  = q.customer_id',
  'join customer_vehicles cv  on cv.id = q.customer_vehicle_id',
  
  'where q.partner_id = $3::uuid',
  '  -- The whole premise of the campaign: no coverage on file. This is the',
  '  -- filter that matters, and payment_status is not a substitute for it.',
  '  -- Every service drive quote is pending, so that predicate excludes nobody;',
  '  -- it only ever meant "has not bought from us", which is a different thing.',
  '  -- Written as = false rather than coalesce(..., false): a null is unknown,',
  '  -- not "no coverage", and an unknown is not worth a complaint.',
  '  and c.has_existing_warranty = false',
  '  -- anyone who already bought is not a prospect',
  "  and q.payment_status = 'pending'",
  "  and q.created_at > now() - ($4 || ' days')::interval",
  '  -- contactable',
  "  and c.email is not null and c.email <> ''",
  '  and c.opted_out = false',
  '  and coalesce(c.email_bounced, false)    = false',
  '  and coalesce(c.email_complained, false) = false',

  '  -- Not a customer. The service drive carries internal records alongside',
  '  -- real ones: fleet rows, PDI entries, test rows, the group\'s other',
  '  -- rooftops, and rival dealers who took a trade. Thirteen of the first',
  '  -- 132 enrolled were one of these, two of them competing dealerships,',
  '  -- which is a phone call nobody at the store wants to take.',
  "  and c.first_name !~* '(bob ?johnson|widrick|caprara|fleet|test|pdi|auto sales|motors)'",
  '  -- Placeholder addresses. These are worse than bounces: noemail@gmail.com',
  '  -- and ask@gmail.com are real accounts belonging to strangers, so a send',
  '  -- costs a complaint on a domain that is still earning its reputation.',
  "  and lower(trim(c.email)) !~ '^(noemail|no|ask|test|tomtest|none|na)@'",
  "  and lower(trim(c.email)) !~ '@(no|a|abc|noemail|none|test)\\.(com|net|org)$'",
  '  -- the dealership\'s own staff do not need the pitch',
  "  and lower(trim(c.email)) !~ '@bobjohnsonauto\\.com$'",

  '  -- VSCs are not sold in California',
  "  and upper(coalesce(c.state, '')) <> 'CA'",

  '  -- eligibility ceilings',
  '  -- ceiling tracks the rate card: above it we cannot quote, so we do not email',
  '  and cv.mileage is not null and cv.mileage <= $5',
  '  and cv.year >= extract(year from now())::int - 12',
  '  -- campaign level do-not-contact, which outlives any single enrollment',
  '  and not exists (',
  '    select 1 from vsc_suppression s',
  '    where s.dealer_id = $1',
  "      and s.customer_key = encode(sha256(($1 || ':' || lower(trim(c.email)))::bytea), 'hex')",
  '  )',
  '-- Freshest visits first, capped at the cohort size. Two reasons.',
  '-- Relevance: someone who was in last week remembers the visit, and the email',
  '-- refers to it by date. Volume: the backlog is a one time wall, and the daily',
  '-- send cap only chops that wall into consecutive days at the ceiling rather',
  '-- than making it a drip. Capping the cohort is what actually lowers volume,',
  '-- because total sends are cohort size times ten however slowly you feed it.',
  '-- Already enrolled rows conflict and cost nothing, so the window simply',
  '-- advances as new service visits arrive.',
  'order by q.created_at desc',
  'limit $6',
  '-- Idempotent. Re-running the sweep enrolls only people who are not enrolled yet.',
  'on conflict (dealer_id, campaign_id, customer_key) do nothing',
  'returning id, email, ro_closed_date, next_send_at;',
].join('\n');

const intakeNodes = [
  node('Hourly Intake Sweep', 'scheduleTrigger', 1.2, [-620, 0], {
    rule: { interval: [{ field: 'cronExpression', expression: '23 * * * *' }] },
  }),

  setNode('Campaign Config', [-380, 0], [
    ['dealer_id', DEALER.id],
    ['campaign_id', DECK.campaign.id],
    ['partner_id', DEALER.supabase.partner_id],
    ['window_days', String(DEALER.supabase.intake_window_days)],
    ['max_mileage', String(DEALER.supabase.max_mileage)],
    ['cohort_limit', String(DEALER.supabase.initial_cohort)],
  ]),

  pgNode('Enroll Eligible Service Customers', [-120, 0], INTAKE_SQL,
    '={{ $json.dealer_id }}, {{ $json.campaign_id }}, {{ $json.partner_id }}, {{ $json.window_days }}, {{ $json.max_mileage }}, {{ $json.cohort_limit }}'),

  node('Enrolled', 'noOp', 1, [140, 0], {}),
];

const intakeConnections = connect([
  ['Hourly Intake Sweep', 'Campaign Config'],
  ['Campaign Config', 'Enroll Eligible Service Customers'],
  ['Enroll Eligible Service Customers', 'Enrolled'],
]);

writeFileSync(join(ROOT, 'n8n/workflows/01-intake.json'),
  JSON.stringify(workflow('DriveOne VSC 01 Intake (' + DEALER.dealer.displayName + ')', intakeNodes, intakeConnections), null, 2));

console.log('built 01-intake.json');


/* ========================================================= 2. SCHEDULER == */

const SEND_GATE_CODE = [
  '// Decides whether this hour is a send moment and how many may go out in it.',
  '// Runs before the claim so an out of window hour costs one cheap check rather',
  '// than a wasted database lease.',
  '',
  'const CFG = ' + JSON.stringify({
    timezone: DEALER.sending.timezone,
    dailyCap: DEALER.sending.dailyCap,
    days: DEALER.sending.days,
    hours: DEALER.sending.hours,
    maxPerRun: DEALER.sending.maxPerRun,
  }, null, 2) + ';',
  '',
  'const now = new Date();',
  'const parts = new Intl.DateTimeFormat("en-US", {',
  '  timeZone: CFG.timezone, weekday: "short", hour: "numeric", hour12: false,',
  '  year: "numeric", month: "2-digit", day: "2-digit",',
  '}).formatToParts(now).reduce((a, p) => (a[p.type] = p.value, a), {});',
  '',
  'const DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };',
  'const weekday = DOW[parts.weekday];',
  'const hour = parseInt(parts.hour, 10) % 24;',
  '',
  'if (!CFG.days.includes(weekday)) return [];',
  'if (!CFG.hours.includes(hour)) return [];',
  '',
  '// Start of the dealer local day, as an instant the database can compare against.',
  '// Offset is derived rather than hardcoded so daylight saving is handled.',
  'const localNoon = new Date(parts.year + "-" + parts.month + "-" + parts.day + "T12:00:00Z");',
  'const shown = new Date(localNoon.toLocaleString("en-US", { timeZone: CFG.timezone }));',
  'const offsetMs = localNoon.getTime() - shown.getTime();',
  'const dayStart = new Date(localNoon.getTime() - (12 * 3600 * 1000) + offsetMs);',
  '',
  '// Spread whatever is left for today across the hours still to come, so a',
  '// backlog drains smoothly instead of arriving as one spike on a warmed domain.',
  'const hoursLeft = CFG.hours.filter((h) => h >= hour).length || 1;',
  'const perRun = Math.min(CFG.maxPerRun, Math.max(1, Math.ceil(CFG.dailyCap / hoursLeft)));',
  '',
  'return [{ json: {',
  '  dealer_id: ' + JSON.stringify(DEALER.id) + ',',
  '  campaign_id: ' + JSON.stringify(DECK.campaign.id) + ',',
  '  day_start: dayStart.toISOString(),',
  '  daily_cap: CFG.dailyCap,',
  '  per_run: perRun,',
  '} }];',
].join('\n');

const CLAIM_SQL = [
  '-- Atomic lease. Claims up to 200 due rows and pushes next_send_at two hours',
  '-- out in the same statement, so two scheduler runs can never double send and a',
  '-- crashed run retries instead of stranding the contact.',
  'update vsc_enrollment e',
  "set next_send_at = now() + interval '2 hours', updated_at = now()",
  'where e.id in (',
  '  select id from vsc_enrollment',
  "  where status = 'active'",
  '    and next_send_at <= now()',
  '    and dealer_id = $1',
  '    and campaign_id = $2',
  '    -- suppression is re-checked here, not just at intake, because someone can',
  '    -- unsubscribe on day 11 of a 60 day campaign',
  '    and not exists (',
  '      select 1 from vsc_suppression s',
  '      where s.dealer_id = vsc_enrollment.dealer_id',
  '        and s.customer_key = vsc_enrollment.customer_key',
  '    )',
  '    -- never claim a row that cannot produce a complete email',
  '    and monthly_payment is not null',
  '    and quote_url is not null',
  '    -- and never a link that has already expired. Better a missed send than',
  '    -- a Buy now button that goes nowhere; pricing refreshes these and the',
  '    -- row comes back on the next sweep.',
  "    and (quote_expires_at is null or quote_expires_at > now() + interval '30 minutes')",
  '    -- give up eventually. Without a ceiling one undeliverable address is',
  '    -- claimed, fails and is re-claimed every run for sixty days, taking a',
  '    -- slot from someone reachable each time.',
  '    and send_attempts < 5',
  '  order by next_send_at',
  '  -- The daily cap is applied here, inside the same statement that leases the',
  '  -- rows, so two scheduler runs racing cannot jointly exceed it.',
  '  limit least(',
  '    $3::int,',
  '    greatest(0, $4::int - (',
  '      select count(*) from vsc_send_log',
  '      where dealer_id = $1 and campaign_id = $2 and sent_at >= $5::timestamptz',
  '    ))',
  '  )',
  '  for update skip locked',
  ')',
  'returning e.*;',
].join('\n');

const PREPARE_SEND_CODE = [
  'const SCHEDULE = ' + JSON.stringify(SCHEDULE, null, 2) + ';',
  'const LAST_STEP = ' + LAST_STEP + ';',
  '',
  '// Timing and throughput are decided by Send Window Gate before the claim, so',
  '// this step is only about turning a claimed row into a renderable email.',
  '',
  "const crypto = require('crypto');",
  '',
  "const fmtMoney = (v) => (v === null || v === undefined || v === '') ? null",
  '  : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(v));',
  '',
  '// Whole dollar amounts lose the cents. The monthly figure keeps them because',
  '// that is the number the customer is agreeing to and it has to be exact.',
  '// The contract total is a reference figure sitting in small type under it,',
  '// and "$3,364 total" is easier to hold in your head than "$3,364.00 total".',
  '// A total that genuinely has cents still shows them.',
  "const fmtWhole = (v) => (v === null || v === undefined || v === '') ? null",
  '  : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD",',
  '      maximumFractionDigits: Number(v) % 1 === 0 ? 0 : 2 }).format(Number(v));',
  '',
  '// Names arrive from the DMS in block capitals: 129 of the first 132 enrolled',
  '// were like this. "ERIC, one thing was missing from your file" reads as a',
  '// broken mail merge, which is the exact impression a note written as if from',
  '// the service drive cannot afford. Only recased when the source is entirely',
  '// upper case, so a name someone typed properly is never mangled, and McBride',
  "// and O'Brien survive the round trip.",
  'const properName = (s) => {',
  '  const t = String(s == null ? "" : s).trim();',
  '  if (!t || t !== t.toUpperCase()) return t;',
  '  return t.toLowerCase()',
  '    .replace(/(^|[\\s\'\\-])([a-z])/g, (m, sep, ch) => sep + ch.toUpperCase())',
  "    .replace(/\\bMc([a-z])/g, (m, ch) => 'Mc' + ch.toUpperCase());",
  '};',
  '',
  '// The DMS stores a RAM 1500 with a model of "1500" and nothing else, so a',
  '// subject reading "{{vehicle_model}} math, briefly" arrives as "1500 math,',
  '// briefly" and a body line becomes "your 1500". 24 of the first 150 enrolled',
  '// are RAM 1500s, so that is one in six people getting a subject line that',
  '// reads like a typo. Prefixing the make only when the model is bare digits',
  '// fixes every usage at once, and the copy never prints the make on its own,',
  '// so "RAM RAM 1500" cannot happen. Makes of three characters or fewer keep',
  '// their capitals, because GMC and BMW are not Gmc and Bmw.',
  'const vehicleLabel = (make, model) => {',
  '  const mo = String(model == null ? "" : model).trim();',
  '  const mk = String(make == null ? "" : make).trim();',
  '  if (!mo) return "your vehicle";',
  '  if (!/^[0-9]+$/.test(mo) || !mk) return mo;',
  '  return (mk.length <= 3 ? mk.toUpperCase() : properName(mk)) + " " + mo;',
  '};',
  '',
  '// Coverage is ADDITIVE from the day the policy is bought: the term and the',
  '// mileage are added on top of where the car is today, not measured back to',
  '// its in-service date. So this reads as "more", never as a ceiling.',
  '// A null is unknown, not unlimited, so it falls back to a neutral line rather',
  '// than claiming a benefit we cannot prove.',
  'const coverageLabel = (miles, months) => {',
  '  const n = Number(miles);',
  '  const m = Number(months);',
  '  const milePart = (miles === null || miles === undefined || !isFinite(n) || n <= 0) ? null',
  '    : (n >= 999999 ? "unlimited miles" : n.toLocaleString("en-US") + " more miles");',
  '  const monthPart = (!isFinite(m) || m <= 0) ? null : m + " more months";',
  '  if (monthPart && milePart) return monthPart + ", " + milePart;',
  '  if (milePart)  return milePart;',
  '  if (monthPart) return monthPart;',
  '  return "Coverage shown on your quote";',
  '};',
  '',
  'const out = [];',
  '',
  'for (const item of $input.all()) {',
  '  const r = item.json;',
  '',
  '  // An email that shows a blank or wrong price is worse than an email not sent.',
  '  // The enrollment row is priced by the same engine that prices quotes; if that',
  '  // has not happened yet, skip and pick it up on a later sweep.',
  '  if (r.monthly_payment === null || r.monthly_payment === undefined) continue;',
  '  if (!r.quote_url) continue;  // a Buy now button must have somewhere to go',
  '',
  '  const nextStep = (r.current_step || 0) + 1;',
  '  if (nextStep > LAST_STEP) continue;',
  '',
  '  const plan = SCHEDULE.find((s) => s.step === nextStep);',
  '  if (!plan) continue;',
  '',
  '  // Deterministic subject line split. Same contact always gets the same arm,',
  '  // so results stay readable across the whole 60 days.',
  "  const bucket = parseInt(crypto.createHash('md5').update(r.customer_key + ':' + nextStep).digest('hex').slice(0, 2), 16);",
  "  const variant = bucket % 2 === 0 ? 'a' : 'b';",
  '  const subject = variant === "a" ? plan.subject : plan.subjectAlt;',
  '',
  '  // Compute the real next_send_at from enrolment date, not from "now", so a',
  '  // delayed run never compresses or stretches the rest of the cadence.',
  '  const created = new Date(r.created_at);',
  '  const following = SCHEDULE.find((s) => s.step === nextStep + 1);',
  '  const nextSendAt = following',
  '    ? new Date(created.getTime() + following.day * 86400000)',
  '    : null;',
  '  if (nextSendAt) {',
  '    // Never sooner than three days from now, whatever the enrolment date says.',
  '    //',
  '    // Every step is dated from created_at so that a delayed run cannot',
  '    // compress the cadence. That is right while the campaign is running and',
  '    // catastrophic on the day it starts, because a contact enrolled weeks',
  '    // before launch has steps 1, 2 and 3 all dated in the past. Nothing in',
  '    // the claim stops a row being re-claimed the moment it is advanced, so',
  '    // they arrive in three consecutive hourly runs. Three marketing emails',
  '    // in three hours is the fastest way to turn someone who would have',
  '    // bought into a spam complaint, and the daily cap does not catch it:',
  '    // the cap counts sends across the campaign, not per person.',
  '    //',
  '    // Three days is the tightest real gap in the cadence (d0 to d3), so the',
  '    // floor can never make the sequence faster than it was designed to be.',
  '    // It only ever slows a backlog down.',
  '    const MIN_GAP_DAYS = 3;',
  '',
  '    // Normalise the hour BEFORE comparing against the floor, and build the',
  '    // floor at the same hour. Clamping raw timestamps and then setting the',
  '    // hour lets the hour change move a date back under the floor by up to a',
  '    // day: a send computed for Friday 23:00 became Friday 14:00, which was',
  '    // below a floor of Friday 23:00, so it was rejected and pushed a full',
  '    // week to the next window day. That alone turned a 3 day gap into 7.',
  '    // 14:00 UTC is 10:00 in America/New_York, inside the morning window and',
  '    // safely clear of both ends of it either side of a daylight saving shift.',
  '    nextSendAt.setUTCHours(14, 0, 0, 0);',
  '    const floor = new Date(Date.now());',
  '    floor.setUTCHours(14, 0, 0, 0);',
  '    floor.setUTCDate(floor.getUTCDate() + MIN_GAP_DAYS);',
  '    if (nextSendAt.getTime() < floor.getTime()) nextSendAt.setTime(floor.getTime());',
  '',
  '    // Move the send onto the nearest day in the window, not the next one.',
  '    //',
  '    // Weekends are excluded, so many target dates have to move. How they',
  '    // move decides whether the deck ships intact.',
  '    //',
  '    // Searching forward only, which is the obvious implementation, destroys',
  '    // the cadence. Pin a contact to one weekday and every gap becomes',
  '    // exactly seven days, because a 3 day gap and an 8 day gap both land on',
  '    // the same next occurrence of that weekday. The deck says 3,4,5,6,7,7,',
  '    // 8,8,12 and what shipped was 7,7,7,7,7,7,7,7,7: email 2 was written to',
  '    // arrive three days after the visit and arrived eight days after, and a',
  '    // 60 day campaign quietly became 64. Nothing errored, which is why it',
  '    // survived a volume simulation that only ever measured peak daily load.',
  '    //',
  '    // Searching outward keeps the shape. A Friday target falls back to',
  '    // Thursday rather than waiting until Tuesday, so the gap stays close to',
  '    // what was written. It still spreads the load, which was the original',
  '    // point: Fri and Sat fall back to Thu, Sun and Mon push forward to Tue,',
  '    // so the four days outside the window divide between two days inside it',
  '    // instead of all draining into Tuesday.',
  '    //',
  '    // The hash only breaks ties now, so the choice stays deterministic: the',
  '    // same contact and step always resolve to the same date however often',
  '    // the sweep runs.',
  // Compiled from the dealer file, never written twice. It was hardcoded here
  // as [2,3,4] while the config said something else, so widening the window in
  // config changed the Send Window Gate and left the scheduling arithmetic
  // untouched - the same silent disagreement between config and behaviour that
  // this whole section exists to fix.
  '    const WINDOW_DAYS = ' + JSON.stringify(DEALER.sending.days) + ';',
  '    const tieBreak = parseInt(crypto.createHash("md5").update(r.customer_key + ":dow").digest("hex").slice(0, 4), 16) % 2 === 0 ? -1 : 1;',
  '    let snapped = null;',
  '    for (let delta = 0; delta <= 6 && snapped === null; delta++) {',
  '      const dirs = delta === 0 ? [0] : [tieBreak, -tieBreak];',
  '      for (const dir of dirs) {',
  '        const cand = new Date(nextSendAt.getTime() + dir * delta * 86400000);',
  '        if (!WINDOW_DAYS.includes(cand.getUTCDay())) continue;',
  '        // Falling back must never breach the floor, or a backlog would',
  '        // land earlier than the three day minimum it was just given.',
  '        if (cand.getTime() < floor.getTime()) continue;',
  '        snapped = cand;',
  '        break;',
  '      }',
  '    }',
  '    if (snapped) nextSendAt.setTime(snapped.getTime());',
  '  }',
  '',
  '  out.push({',
  '    json: {',
  '      enrollment_id: r.id,',
  '      dealer_id: r.dealer_id,',
  '      campaign_id: r.campaign_id,',
  '      customer_key: r.customer_key,',
  '      step: nextStep,',
  '      slug: plan.slug,',
  '      variant,',
  '      subject,',
  '      is_last_step: nextStep >= LAST_STEP,',
  '      next_send_at: nextSendAt ? nextSendAt.toISOString() : null,',
  '      merge: {',
  '        first_name: properName(r.first_name) || "there",',
  '        vehicle_year: r.vehicle_year || "",',
  '        vehicle_make: r.vehicle_make || "",',
  '        vehicle_model: vehicleLabel(r.vehicle_make, r.vehicle_model),',
  '        vehicle_mileage: r.vehicle_mileage ? Number(r.vehicle_mileage).toLocaleString("en-US") : "",',
  '        monthly_payment: fmtMoney(r.monthly_payment),',
  '        down_payment: fmtMoney(r.down_payment),',
  '        coverage_label: coverageLabel(r.coverage_miles, r.contract_months),',
  '        payment_term: r.payment_term === null || r.payment_term === undefined ? "" : String(r.payment_term),',
  '        contract_price: fmtWhole(r.contract_price),',
  '        last_ro_date: r.ro_closed_date',
  '          ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(r.ro_closed_date))',
  '          : "your last visit",',
  '        advisor_name: r.advisor_name || "",',
  '        // The API owns this URL. Append tracking only, never rebuild it.',
  '        quote_url: r.quote_url + (r.quote_url.indexOf("?") === -1 ? "?" : "&") + "step=" + nextStep + "&" + ' + JSON.stringify(DEALER.campaign.utm) + ',',
  '        unsubscribe_url: $vars.UNSUBSCRIBE_URL_BASE + "?k=" + r.customer_key + "&d=" + r.dealer_id,',
  '        preferences_url: $vars.PREFERENCES_URL_BASE + "?k=" + r.customer_key + "&d=" + r.dealer_id,',
  '      },',
  '    },',
  '  });',
  '}',
  '',
  'return out;',
].join('\n');

const RENDER_CODE = [
  '// Merge tag substitution. The templates ship with offer facts already baked in',
  '// by email/build.mjs, so only recipient level tags remain here.',
  '',
  '// Paired by position, NOT by $itemIndex. A Code node runs once for all items,',
  '// so $itemIndex does not advance with the loop: it is fixed, and',
  '// itemMatching($itemIndex) hands back item zero on every pass. Here that',
  '// would have rendered all forty five emails in a batch from the first',
  '// recipient\'s data and sent one person\'s name, price and quote link to',
  '// forty four strangers. Caught in the pricing sweep, where the same mistake',
  '// pointed 100 rating results at a single enrolment row.',
  '// Load Template returns one row per input item in order, so index i lines up.',
  'const prep = $(\'Prepare Send\').all();',
  'const rows = $input.all();',
  'if (prep.length !== rows.length) {',
  '  throw new Error("Prepare Send produced " + prep.length + " items but Load Template returned " + rows.length + ". Positional pairing is no longer safe, so nothing is sent.");',
  '}',
  '',
  'const out = [];',
  'for (let i = 0; i < rows.length; i++) {',
  '  const item = rows[i];',
  '  const prepared = prep[i].json;',
  '  let html = item.json.html || "";',
  '  // The subject is merged too. It used to be passed through untouched, which',
  '  // meant step 1 variant A went out reading literally',
  '  // "{{first_name}}, one thing was missing from your file" to half the cohort:',
  '  // a perfect email behind the one line that proves nobody checked. Four',
  '  // subject variants across steps 1, 2 and 9 carry tags.',
  '  let subject = String(prepared.subject == null ? "" : prepared.subject);',
  '',
  '  if (typeof html !== "string" || html.length < 500) {',
  '    throw new Error("No template row for step " + prepared.step + " (" + prepared.slug + "). Run npm run publish:templates.");',
  '  }',
  '',
  '  for (const [k, v] of Object.entries(prepared.merge)) {',
  '    const tag = "{{" + k + "}}";',
  '    const val = String(v == null ? "" : v);',
  '    html    = html.split(tag).join(val);',
  '    subject = subject.split(tag).join(val);',
  '  }',
  '',
  '  const leftover = (html + "\\n" + subject).match(/\\{\\{[a-z_]+\\}\\}/g);',
  '  if (leftover) {',
  '    // Fail loudly. A merge tag reaching a customer inbox is worse than a missed send.',
  '    throw new Error("Unresolved merge tags in step " + prepared.step + ": " + [...new Set(leftover)].join(", "));',
  '  }',
  '  if (!subject.trim()) {',
  '    throw new Error("Empty subject for step " + prepared.step + " (" + prepared.slug + ").");',
  '  }',
  '',
  '  out.push({ json: { ...prepared, subject, html } });',
  '}',
  'return out;',
].join('\n');

const schedulerNodes = [
  node('Every Hour', 'scheduleTrigger', 1.2, [-620, 0], {
    rule: { interval: [{ field: 'cronExpression', expression: '7 * * * *' }] },
  }),

  codeNode('Send Window Gate', [-400, 0], SEND_GATE_CODE),

  pgNode('Claim Due Enrollments', [-180, 0], CLAIM_SQL,
    '={{ $json.dealer_id }}, {{ $json.campaign_id }}, {{ $json.per_run }}, {{ $json.daily_cap }}, {{ $json.day_start }}'),

  ifNode('Anything Due?', [40, 0], [cond('={{ $json.id }}', 'exists', '', 'string')]),

  codeNode('Prepare Send', [260, -100], PREPARE_SEND_CODE),

  pgNode('Load Template', [480, -100],
    [
      '-- Templates live in the same database as the enrolment state, published by',
      '-- npm run publish:templates. Reading them here rather than fetching them over',
      '-- HTTPS removes the need for public hosting, a deployment protection carve',
      '-- out, and a base URL in config, and removes a failure mode: a template that',
      '-- could not be loaded used to mean a failed send.',
      'select html from vsc_email_template',
      'where dealer_id = $1 and campaign_id = $2 and slug = $3;',
    ].join('\n'),
    '={{ $json.dealer_id }}, {{ $json.campaign_id }}, {{ $json.slug }}'),

  codeNode('Render Merge Tags', [700, -100], RENDER_CODE),

  // Sends through Resend rather than the dealership's own mailbox over SMTP.
  //
  // The dealership does not permit SMTP access and authenticates its own
  // systems with OAuth against Microsoft, so the original design of sending
  // from their warmed mailbox is not available. Resend signs as the domain
  // with DKIM instead, so mail still comes from bobjohnsonauto.com, the
  // reputation still accrues to the dealership, and Reply-To still lands in
  // their inbox. What is lost is the copy in their Sent Items.
  //
  // What is gained is worth naming. Bounces and complaints arrive as webhooks
  // rather than as mail to be parsed out of an inbox, which deletes the IMAP
  // watcher and the most fragile part of this system. And an HTTP call can set
  // headers, which the SMTP node could not, so List-Unsubscribe finally works.
  node('Send via Resend', 'httpRequest', 4.2, [920, -100], {
    method: 'POST',
    url: 'https://api.resend.com/emails',
    authentication: 'genericCredentialType',
    genericAuthType: 'httpHeaderAuth',
    sendBody: true,
    specifyBody: 'json',
    // itemMatching($itemIndex) is correct HERE and wrong inside a Code node:
    // node parameters are evaluated once per item, so $itemIndex is this item.
    jsonBody: '={{ JSON.stringify({'
      + ' from: $vars.SEND_FROM,'
      + ' to: [ $("Claim Due Enrollments").itemMatching($itemIndex).json.email ],'
      + ' reply_to: $vars.SEND_REPLY_TO,'
      + ' subject: $json.subject,'
      + ' html: $json.html,'
      // One click unsubscribe, which Google and Yahoo expect from bulk senders
      // and which the SMTP node could never provide. The Edge Function already
      // only acts on POST, so it satisfies List-Unsubscribe-Post as written.
      + ' headers: {'
      + ' "List-Unsubscribe": "<" + $json.merge.unsubscribe_url + ">",'
      + ' "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"'
      + ' } }) }}',
    options: {
      // Resend allows two requests a second. A run of 45 fired at once would be
      // rate limited, and a 429 here reads as a failed send rather than as
      // back pressure, so the pace is set deliberately instead.
      batching: { batch: { batchSize: 2, batchInterval: 1100 } },
    },
  }, {
    credentials: { httpHeaderAuth: { id: 'REPLACE_RESEND_CRED_ID', name: 'Resend API' } },
    onError: 'continueErrorOutput', retryOnFail: true, maxTries: 3, waitBetweenTries: 5000,
  }),

  pgNode('Log Send', [1140, -200],
    [
      'insert into vsc_send_log (enrollment_id, dealer_id, campaign_id, step, subject, variant, provider_message_id)',
      'values ($1, $2, $3, $4, $5, $6, $7)',
      '-- vsc_send_log_once makes a retry after a partial failure safe.',
      'on conflict (enrollment_id, step) do nothing;',
    ].join('\n'),
    "={{ $('Render Merge Tags').itemMatching($itemIndex).json.enrollment_id }}, {{ $('Render Merge Tags').itemMatching($itemIndex).json.dealer_id }}, {{ $('Render Merge Tags').itemMatching($itemIndex).json.campaign_id }}, {{ $('Render Merge Tags').itemMatching($itemIndex).json.step }}, {{ $('Render Merge Tags').itemMatching($itemIndex).json.subject }}, {{ $('Render Merge Tags').itemMatching($itemIndex).json.variant }}, {{ $json.id }}"),

  pgNode('Advance State', [1360, -200],
    [
      'update vsc_enrollment',
      'set current_step = $2,',
      '    last_sent_at = now(),',
      '    updated_at  = now(),',
      "    status      = case when $3::boolean then 'completed' else 'active' end,",
      '    -- a completed row parks far in the future rather than being deleted,',
      '    -- so reporting and re-entry logic still have something to read',
      "    next_send_at = coalesce($4::timestamptz, now() + interval '100 years')",
      'where id = $1;',
    ].join('\n'),
    "={{ $('Render Merge Tags').itemMatching($itemIndex).json.enrollment_id }}, {{ $('Render Merge Tags').itemMatching($itemIndex).json.step }}, {{ $('Render Merge Tags').itemMatching($itemIndex).json.is_last_step }}, {{ $('Render Merge Tags').itemMatching($itemIndex).json.next_send_at }}"),

  // A send that failed used to land on a no-op, which meant the run finished
  // GREEN with zero emails out. A dead campaign looked exactly like a quiet
  // one: the cron ticking hourly, every execution a green tick, and nobody
  // finding out until someone asked why there were no replies. Every failed
  // send now leaves a trace in the row and then takes the run down, so it
  // reaches the error workflow and the Slack alert.
  pgNode('Record Send Failure', [1140, 0],
    [
      '-- The claim already pushed next_send_at two hours out, so a transient',
      '-- failure retries on its own. This is about leaving evidence, and about',
      '-- giving up eventually: five failures and the row stops being claimed,',
      '-- the same ceiling pricing uses, so one poisoned address cannot occupy',
      '-- a slot in every run forever.',
      'update vsc_enrollment',
      'set send_attempts       = send_attempts + 1,',
      '    send_error          = left($2, 500),',
      '    last_send_error_at  = now(),',
      '    updated_at          = now()',
      'where id = $1;',
    ].join('\n'),
    "={{ $('Render Merge Tags').itemMatching($itemIndex).json.enrollment_id }}, {{ $json.error || 'unknown Resend failure' }}"),

  codeNode('Fail Loudly', [1360, 0], [
    '// Turns a swallowed send failure into a red execution. n8n routes send',
    '// errors to this branch instead of stopping the run, which is right for',
    '// the other items in the batch but wrong for the run as a whole: without',
    '// this throw the workflow reports success having sent nothing.',
    'const failures = $input.all();',
    'const reasons = [...new Set(failures.map((f) => String((f.json && f.json.error) || "unknown")))];',
    'throw new Error(',
    '  failures.length + " of this run\'s sends failed and were not delivered. " +',
    '  "Reasons: " + reasons.join(" | ") + ". " +',
    '  "The rows carry send_error and will retry in two hours, up to five attempts."',
    ');',
  ].join('\n')),

  node('Nothing Due', 'noOp', 1, [260, 140], {}),
];

const schedulerConnections = connect([
  ['Every Hour', 'Send Window Gate'],
  ['Send Window Gate', 'Claim Due Enrollments'],
  ['Claim Due Enrollments', 'Anything Due?'],
  ['Anything Due?', ['Prepare Send', 'Nothing Due']],
  ['Prepare Send', 'Load Template'],
  ['Load Template', 'Render Merge Tags'],
  ['Render Merge Tags', 'Send via Resend'],
  ['Send via Resend', ['Log Send', 'Record Send Failure']],
  ['Log Send', 'Advance State'],
  ['Record Send Failure', 'Fail Loudly'],
]);

writeFileSync(join(ROOT, 'n8n/workflows/02-scheduler.json'),
  JSON.stringify(workflow('DriveOne VSC 02 Scheduler (' + DEALER.dealer.displayName + ')', schedulerNodes, schedulerConnections), null, 2));

console.log('built 02-scheduler.json');

/* ============================================================ 3. EVENTS == */

const CLASSIFY_CODE = [
  '// ===================================================================',
  '// One map for every way a contact can leave the campaign. Adding a new',
  '// provider or a new exit signal means adding a line here, not rewiring.',
  '// Accepts DriveOne checkout events, Resend delivery events, and raw strings.',
  '// ===================================================================',
  '',
  'const EVENTS = {',
  "  // DriveOne checkout and CRM",
  "  'vsc.purchased':      { exit: 'purchased',    suppress: false },",
  "  'vsc.quote_started':  { exit: null,           suppress: false },",
  "  'vehicle.sold':       { exit: 'vehicle_sold', suppress: false },",
  "  'customer.has_vsc':   { exit: 'has_vsc',      suppress: false },",
  "  'manual.exit':        { exit: 'manual',       suppress: false },",
  '',
  '  // Preference and consent',
  "  'email.unsubscribed': { exit: 'unsubscribed', suppress: true },",
  "  'unsubscribe':        { exit: 'unsubscribed', suppress: true },",
  '',
  '  // Resend webhook event names',
  "  'email.bounced':      { exit: 'bounced',      suppress: true },",
  "  'email.complained':   { exit: 'complained',   suppress: true },",
  "  'email.delivery_delayed': { exit: null,       suppress: false },",
  '};',
  '',
  'const out = [];',
  'for (const item of $input.all()) {',
  '  const p = item.json.body || item.json;',
  '',
  '  const type = String(p.type || p.event || p.event_type || "").trim().toLowerCase();',
  '  const rule = EVENTS[type];',
  '',
  '  // A bounce is not automatically permanent. Resend passes the underlying',
  '  // classification through as data.bounce.type: Permanent, Transient or',
  '  // Undetermined. Transient is a full mailbox or a greylisting server, and',
  '  // suppressing on one would burn a good address over a condition that clears',
  '  // by itself. Only Permanent ends the relationship. A bounce that arrives',
  '  // without a classification is treated as permanent, which is what the old',
  '  // IMAP watcher produced and what a hand posted event will look like.',
  '  const bounceType = String(p.data?.bounce?.type || p.bounce?.type || "").trim().toLowerCase();',
  '  const soft = type === "email.bounced" && bounceType !== "" && bounceType !== "permanent";',
  '',
  '  // customer_key is preferred. Fall back to hashing whatever email we were given.',
  "  const crypto = require('crypto');",
  // item.json.params, not $json.params. This Code node runs once for all items,
  // and $json is only bound in run-once-per-item mode: reading it here is a
  // ReferenceError that takes down every event, valid ones included.
  '  const dealer_id = p.dealer_id || p.dealer || item.json.params?.dealer || "' + DEALER.id + '";',
  '  const email = (p.email || p.data?.to?.[0] || p.to || "").toString().trim().toLowerCase();',
  '  const customer_key = p.customer_key',
  '    || (email ? crypto.createHash("sha256").update(dealer_id + ":" + email).digest("hex") : null);',
  '',
  '  out.push({',
  '    json: {',
  '      received_type: type,',
  '      known: !!rule,',
  '      actionable: !!(rule && rule.exit && customer_key && !soft),',
  '      exit_reason: rule ? rule.exit : null,',
  '      suppress: rule ? !!rule.suppress && !soft : false,',
  '      soft_bounce: soft,',
  '      bounce_type: bounceType || null,',
  '      dealer_id,',
  '      customer_key,',
  '      email,',
  '      campaign_id: p.campaign_id || "' + DECK.campaign.id + '",',
  '    },',
  '  });',
  '}',
  'return out;',
].join('\n');

// Resend signs its webhooks with Svix. Svix signs with an HMAC over the exact
// bytes it sent and puts the result in svix-signature; it cannot be told to
// send an Authorization header instead. So the header auth credential that
// guards the internal endpoint is unsatisfiable here, and the choice is to
// either drop authentication for Resend or verify the signature.
//
// This verifies. That is not a grudging compromise: a shared header proves only
// that the caller knows a string that sits in two configs and travels in every
// request, while a signature proves the body arrived unmodified from someone
// holding a key that never leaves either end. It is the stronger control.
//
// It fails closed, in every direction. A missing secret, a missing header, a
// signature that does not verify, or a timestamp outside the replay window all
// throw before a single statement reaches the database. An open endpoint that
// writes to a suppression list is an invitation to have your campaign quietly
// emptied by anyone who guesses the URL.
const VERIFY_RESEND_CODE = [
  "const crypto = require('crypto');",
  '',
  'const secret = $vars.RESEND_WEBHOOK_SECRET;',
  'if (!secret) {',
  '  throw new Error(',
  '    "RESEND_WEBHOOK_SECRET is not set in n8n Variables, so this webhook cannot be " +',
  '    "verified. Refusing the request rather than trusting it."',
  '  );',
  '}',
  '// Svix signing secrets are base64 behind a whsec_ prefix. The prefix is not',
  '// part of the key, and leaving it on produces a signature that never matches.',
  "const key = Buffer.from(String(secret).replace(/^whsec_/, ''), 'base64');",
  '',
  '// Five minutes, which is what Svix itself uses. Long enough to survive clock',
  '// skew, short enough that a captured request is not replayable tomorrow.',
  'const TOLERANCE_SECONDS = 300;',
  '',
  'const items = $input.all();',
  'const out = [];',
  '',
  'for (let i = 0; i < items.length; i++) {',
  '  const item = items[i];',
  '  const headers = item.json.headers || {};',
  '',
  "  const id = headers['svix-id'] || headers['webhook-id'];",
  "  const timestamp = headers['svix-timestamp'] || headers['webhook-timestamp'];",
  "  const signature = headers['svix-signature'] || headers['webhook-signature'];",
  '  if (!id || !timestamp || !signature) {',
  '    throw new Error(',
  '      "Missing Svix signature headers. This endpoint accepts signed Resend " +',
  '      "webhooks only; internal events go to the /vsc/events endpoint instead."',
  '    );',
  '  }',
  '',
  '  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));',
  '  if (!Number.isFinite(age) || age > TOLERANCE_SECONDS) {',
  '    throw new Error(',
  '      "Webhook timestamp is " + age + "s from now, outside the " +',
  '      TOLERANCE_SECONDS + "s replay window. Rejected."',
  '    );',
  '  }',
  '',
  '  // The signature covers the bytes as sent. Parsing the body and serialising',
  '  // it again would produce a different byte string over whitespace alone and',
  '  // fail in a way that looks exactly like an attack, which is the whole',
  '  // reason the webhook node above is set to rawBody.',
  '  let raw;',
  '  const inline = item.binary && item.binary.data && item.binary.data.data;',
  '  if (inline) {',
  "    raw = Buffer.from(inline, 'base64').toString('utf8');",
  "  } else if (typeof item.json.body === 'string') {",
  '    raw = item.json.body;',
  '  } else if (this.helpers && this.helpers.getBinaryDataBuffer) {',
  '    // Binary stored outside the item, which is what happens when n8n is',
  '    // configured to keep binary data on disk or in S3 rather than in memory.',
  "    raw = (await this.helpers.getBinaryDataBuffer(i, 'data')).toString('utf8');",
  '  } else {',
  '    throw new Error(',
  '      "Raw request body is missing. The webhook node needs options.rawBody " +',
  '      "set to true, or the signature cannot be checked."',
  '    );',
  '  }',
  '',
  "  const expected = crypto.createHmac('sha256', key)",
  "    .update(id + '.' + timestamp + '.' + raw).digest('base64');",
  '',
  '  // The header carries a space separated list of versioned signatures so that',
  '  // a key can be rotated without dropping deliveries. Any one matching is a',
  '  // pass; only v1 exists today.',
  "  const offered = String(signature).split(' ')",
  "    .map((part) => part.split(',')[1])",
  '    .filter(Boolean);',
  '',
  '  const expectedBuf = Buffer.from(expected);',
  '  const ok = offered.some((candidate) => {',
  '    const buf = Buffer.from(candidate);',
  '    // Length checked first because timingSafeEqual throws on a mismatch',
  '    // rather than returning false.',
  '    return buf.length === expectedBuf.length && crypto.timingSafeEqual(buf, expectedBuf);',
  '  });',
  '  if (!ok) {',
  '    throw new Error("Svix signature did not verify. Body rejected untouched.");',
  '  }',
  '',
  '  // Shaped like the other webhook node\'s output, so Classify Event does not',
  '  // need to know which door the event came in by.',
  '  out.push({',
  '    json: {',
  '      body: JSON.parse(raw),',
  '      headers,',
  "      params: { dealer: '" + DEALER.id + "' },",
  '      verified: true,',
  '    },',
  '  });',
  '}',
  '',
  'return out;',
].join('\n');

const eventsNodes = [
  node('Campaign Event Webhook', 'webhook', 2, [-620, 0], {
    httpMethod: 'POST',
    path: 'vsc/events/:dealer',
    authentication: 'headerAuth',
    responseMode: 'responseNode',
    options: {},
  }, { webhookId: 'vsc-events-' + DEALER.id, credentials: { httpHeaderAuth: { id: 'REPLACE_EVENT_AUTH_CRED_ID', name: 'Campaign Event Shared Secret' } } }),

  // A static path, not the ':dealer' form the internal endpoint uses. n8n
  // prepends the node's webhookId to any path containing a dynamic segment,
  // which produces a URL with a uuid buried in the middle of it. That is fine
  // for something we configure ourselves and awkward for something a third
  // party has to be given, so this one reads plainly.
  node('Resend Event Webhook', 'webhook', 2, [-620, 240], {
    httpMethod: 'POST',
    path: 'vsc/resend/' + DEALER.id,
    // Not an oversight. The next node verifies the Svix signature, which is a
    // stronger check than the header credential could be. See VERIFY_RESEND_CODE.
    authentication: 'none',
    responseMode: 'responseNode',
    options: { rawBody: true },
  }, { webhookId: 'vsc-resend-' + DEALER.id }),

  codeNode('Verify Resend Signature', [-400, 240], VERIFY_RESEND_CODE),

  codeNode('Classify Event', [-400, 0], CLASSIFY_CODE),

  ifNode('Actionable?', [-180, 0], [cond('={{ $json.actionable }}', 'true', '', 'boolean')]),

  pgNode('Exit Enrollment', [40, -100],
    [
      'update vsc_enrollment',
      "set status = 'exited',",
      '    exit_reason = $3,',
      '    updated_at = now(),',
      '    -- park it rather than delete it so attribution survives',
      "    next_send_at = now() + interval '100 years'",
      'where dealer_id = $1',
      '  and customer_key = $2',
      "  and status = 'active'",
      'returning id, email, current_step, exit_reason;',
    ].join('\n'),
    '={{ $json.dealer_id }}, {{ $json.customer_key }}, {{ $json.exit_reason }}'),

  ifNode('Needs Suppression?', [260, -100], [cond("={{ $('Classify Event').itemMatching($itemIndex).json.suppress }}", 'true', '', 'boolean')]),

  pgNode('Add To Suppression List', [480, -200],
    [
      'insert into vsc_suppression (dealer_id, customer_key, reason)',
      'values ($1, $2, $3)',
      '-- Suppression is permanent and idempotent. First reason wins.',
      'on conflict (dealer_id, customer_key) do nothing;',
    ].join('\n'),
    "={{ $('Classify Event').itemMatching($itemIndex).json.dealer_id }}, {{ $('Classify Event').itemMatching($itemIndex).json.customer_key }}, {{ $('Classify Event').itemMatching($itemIndex).json.exit_reason }}"),

  node('Acknowledge', 'respondToWebhook', 1.1, [700, 0], {
    respondWith: 'json',
    responseBody: '={{ JSON.stringify({ ok: true, type: $(\'Classify Event\').first().json.received_type, known: $(\'Classify Event\').first().json.known }) }}',
    options: { responseCode: 200 },
  }),

  node('Ignored (unknown or non-exit event)', 'noOp', 1, [40, 140], {}),
];

const eventsConnections = connect([
  ['Campaign Event Webhook', 'Classify Event'],
  ['Resend Event Webhook', 'Verify Resend Signature'],
  ['Verify Resend Signature', 'Classify Event'],
  ['Classify Event', 'Actionable?'],
  ['Actionable?', ['Exit Enrollment', 'Ignored (unknown or non-exit event)']],
  ['Exit Enrollment', 'Needs Suppression?'],
  ['Needs Suppression?', ['Add To Suppression List', 'Acknowledge']],
  ['Add To Suppression List', 'Acknowledge'],
  ['Ignored (unknown or non-exit event)', 'Acknowledge'],
]);

writeFileSync(join(ROOT, 'n8n/workflows/03-events.json'),
  JSON.stringify(workflow('DriveOne VSC 03 Events (' + DEALER.dealer.displayName + ')', eventsNodes, eventsConnections), null, 2));

console.log('built 03-events.json');

/* ===================================================== 4. ERROR HANDLER == */

const ERROR_CODE = [
  'const e = $input.first().json;',
  'const wf = e.workflow || {};',
  'const err = e.execution || {};',
  '',
  'const lines = [',
  '  "DriveOne VSC campaign failure",',
  '  "Workflow: " + (wf.name || "unknown"),',
  '  "Node: " + (err.lastNodeExecuted || "unknown"),',
  '  "Message: " + ((err.error && err.error.message) || "no message"),',
  '  "Execution: " + (err.url || err.id || "n/a"),',
  '  "Time: " + new Date().toISOString(),',
  '].join("\\n");',
  '',
  'return [{ json: { text: lines } }];',
].join('\n');

const errorNodes = [
  node('On Any Workflow Error', 'errorTrigger', 1, [-400, 0], {}),
  codeNode('Format Alert', [-180, 0], ERROR_CODE),
  node('Alert Slack', 'httpRequest', 4.2, [40, 0], {
    method: 'POST',
    url: '={{ $vars.SLACK_ALERT_WEBHOOK }}',
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={{ JSON.stringify({ text: $json.text }) }}',
    options: {},
  }),
];

writeFileSync(join(ROOT, 'n8n/workflows/04-error-handler.json'),
  JSON.stringify(workflow('DriveOne VSC 04 Error Handler', errorNodes, connect([
    ['On Any Workflow Error', 'Format Alert'],
    ['Format Alert', 'Alert Slack'],
  ])), null, 2));

console.log('built 04-error-handler.json');
console.log('\nCadence compiled from campaign.json: ' + SCHEDULE.map((s) => 'd' + s.day).join(', '));


/* =========================================================== 5. PRICING == */

// The rating API is the only authoritative price. The local vsc_rate_* tables
// reproduce their own export exactly (Chevrolet low/60/30 => 61.31, down 96.80,
// markup 0) but do NOT reproduce live quotes: a real Chevrolet priced at 2442
// against a card price of 2099, and the deltas are not constant across quotes.
// Something in the API (vehicle class, VIN attributes, a newer rate version)
// moves the number, so the campaign asks rather than computes.
const CLAIM_UNPRICED_SQL = [
  '-- Lease unpriced rows the same way the scheduler leases due rows, so two',
  '-- pricing runs cannot call the rating API for the same enrollment at once.',
  'update vsc_enrollment e',
  "set priced_at = now()",
  'where e.id in (',
  '  select id from vsc_enrollment',
  "  where status = 'active'",
  '    -- Unpriced, OR priced but carrying a link that is about to die. The',
  '    -- quote API mints seven day tokens and this campaign runs sixty days,',
  '    -- so a link written once is dead by email 3. Refreshing two days out',
  '    -- keeps every Buy now button live without hammering the API.',
  '    and (monthly_payment is null',
  "     or (quote_expires_at is not null and quote_expires_at < now() + interval '2 days'))",
  '    and dealer_id = $1 and campaign_id = $2',
  "    and (priced_at is null or priced_at < now() - interval '1 hour')",
  '  order by created_at',
  '  limit 100',
  '  for update skip locked',
  ')',
  'returning e.id, e.quote_id, e.vin, e.vehicle_mileage;',
].join('\n');

const MAP_RATING_CODE = [
  '// GET /api/partners/quotes/{quote_id} returns the whole quote: customer,',
  '// vehicle, the embedded rating, and the customer facing links. We take the',
  '// cheapest genuinely financed option and the best available link.',
  '',
  '// Every item must carry every key Store Price references, including the ones',
  '// that do not apply to it. n8n resolves queryReplacement into a positional',
  '// array, and a key that is undefined on the item is dropped rather than sent',
  '// as null, which silently shortens the array and shifts every parameter after',
  '// it. The first live pricing run died on "there is no parameter $17" because a',
  '// successful rating has no failure reason to report. Spreading this blank',
  '// first means a branch can only ever get the shape right.',
  'const BLANK = {',
  '  enrollment_id: null, failed: false, monthly: null, down: null, price: null,',
  '  term: null, months: null, coverage_miles: null, plan_name: null,',
  '  policy_name: null, vehicle_class: null, rate_id: null, reason: null,',
  '  quote_url: null, short_link: null, quote_link: null, guided_purchase_link: null,',
  '  quote_expires_at: null,',
  '};',
  '',
  '// Paired by position, NOT by $itemIndex. A Code node runs once for all items,',
  '// so $itemIndex is fixed rather than the loop counter, and',
  '// itemMatching($itemIndex) returns item zero every pass. That is exactly how',
  '// a sweep rated 100 different vehicles correctly and then wrote all 100',
  '// results onto one enrolment: a Camry at 113,000 miles and a Durango at',
  '// 73,000 ended up with identical prices to the cent. Get Quote preserves',
  '// input order one for one, so index i is the right enrolment.',
  '// The links the quote API hands back are not permanent. guided_purchase_link',
  '// is a JWT and quote_link carries a Clerk sign-in token, and both are minted',
  '// with a seven day life while this campaign runs for sixty. A link stored',
  '// once at pricing time is dead by email 3, so eight of the ten would have',
  '// carried a Buy now button that goes nowhere. Reading the expiry out of the',
  '// token lets pricing refresh a row before it dies and lets the scheduler',
  '// refuse to send a dead one.',
  'const tokenExpiry = (link) => {',
  '  try {',
  '    const m = String(link || "").match(/eyJ[A-Za-z0-9_-]+\\.([A-Za-z0-9_-]+)/);',
  '    if (!m) return null;',
  '    const claims = JSON.parse(Buffer.from(m[1], "base64url").toString());',
  '    return claims && claims.exp ? new Date(claims.exp * 1000).toISOString() : null;',
  '  } catch (e) {',
  '    // An unreadable token is treated as unknown rather than as expired, so a',
  '    // change in link format degrades to current behaviour instead of halting',
  '    // every send.',
  '    return null;',
  '  }',
  '};',
  '',
  '  '.trimEnd() + 'const claimed = $("Claim Unpriced Enrolments").all();',
  'const quotes = $input.all();',
  'if (claimed.length !== quotes.length) {',
  '  throw new Error("Claimed " + claimed.length + " enrolments but Get Quote returned " + quotes.length + ". Positional pairing is no longer safe, so no price is written.");',
  '}',
  '',
  'const out = [];',
  'for (let i = 0; i < quotes.length; i++) {',
  '  const q = quotes[i].json || {};',
  '  const enrolment = claimed[i].json;',
  '  const options = (q.rating && Array.isArray(q.rating.quote_options)) ? q.rating.quote_options : [];',
  '',
  '  // guided_purchase_link is the buy flow, so it is what a Buy now button wants.',
  '  // Fall back to the short link, then the plain quote link.',
  '  const link = q.guided_purchase_link || q.short_link || q.quote_link || null;',
  '',
  '  const financed = options.filter((o) =>',
  '    Number(o.financing_term) > 0 &&',
  '    Number(o.monthly_payment) > 0 &&',
  '    Number(o.quote_price) > 0',
  '  );',
  '',
  '  if (financed.length === 0 || !link) {',
  '    // No real financed option, or nowhere to send them. Either way this row',
  '    // stays unpriced and the scheduler will not touch it, so nobody receives',
  '    // a blank price or a button that goes nowhere.',
  '    out.push({ json: {',
  '      ...BLANK,',
  '      enrollment_id: enrolment.id,',
  '      failed: true,',
  '      reason: (financed.length === 0',
  '        ? "no financed quote_options (" + options.length + " returned)"',
  '        : "no customer facing link on the quote payload"),',
  '    } });',
  '    continue;',
  '  }',
  '',
  '  financed.sort((a, b) => Number(a.monthly_payment) - Number(b.monthly_payment));',
  '  const best = financed[0];',
  '',
  '  out.push({ json: {',
  '    ...BLANK,',
  '    enrollment_id:  enrolment.id,',
  '    failed:         false,',
  '    reason:         null,',
  '    monthly:        Number(best.monthly_payment),',
  '    down:           Number(best.down_payment),',
  '    price:          Number(best.quote_price),',
  '    term:           Number(best.financing_term),',
  '    months:         Number(best.contract_term),',
  '    coverage_miles: best.coverage_miles === undefined ? null : Number(best.coverage_miles),',
  '    plan_name:      best.plan_name || null,',
  '    policy_name:    best.policy_name || null,',
  '    vehicle_class:  (q.rating && q.rating.vehicle_class) || q.vehicle_class || null,',
  '    rate_id:        best.rate_id === undefined ? null : Number(best.rate_id),',
  '    quote_url:            link,',
  '    short_link:           q.short_link || null,',
  '    quote_link:           q.quote_link || null,',
  '    guided_purchase_link: q.guided_purchase_link || null,',
  '    quote_expires_at:     tokenExpiry(link),',
  '  } });',
  '}',
  'return out;',
].join('\n');

const pricingNodes = [
  node('Price Sweep', 'scheduleTrigger', 1.2, [-680, 0], {
    rule: { interval: [{ field: 'cronExpression', expression: '41 * * * *' }] },
  }),

  setNode('Campaign Config', [-450, 0], [
    ['dealer_id', DEALER.id],
    ['campaign_id', DECK.campaign.id],
  ]),

  pgNode('Claim Unpriced Enrolments', [-220, 0], CLAIM_UNPRICED_SQL,
    '={{ $json.dealer_id }}, {{ $json.campaign_id }}'),

  node('Get Quote', 'httpRequest', 4.2, [10, 0], {
    method: 'GET',
    // One call returns the rating and the customer facing links together, which
    // is why no short link base URL is configured anywhere: a locally built URL
    // could disagree with what checkout actually serves.
    url: '={{ $vars.QUOTE_API_BASE || "https://www.getelevatewarranty.com/api/partners" }}/quotes/{{ $json.quote_id }}',
    sendHeaders: true,
    headerParameters: {
      parameters: [
        { name: 'x-captured-api-key', value: '={{ $vars.RATING_API_KEY }}' },
        { name: 'Accept', value: 'application/json' },
      ],
    },
    options: { response: { response: { neverError: false } } },
  }, { retryOnFail: true, maxTries: 3, waitBetweenTries: 4000, onError: 'continueErrorOutput' }),

  codeNode('Map Rating To Enrolment', [240, -110], MAP_RATING_CODE),

  pgNode('Store Price', [470, -110],
    [
      '-- $2 is the failure flag. A failed rating records the reason and bumps the',
      '-- attempt counter; it never writes a price, so an unpriced row simply stays',
      '-- invisible to the scheduler.',
      'update vsc_enrollment',
      "set monthly_payment   = case when $2::boolean then monthly_payment else $3::numeric end,",
      "    down_payment      = case when $2::boolean then down_payment    else $4::numeric end,",
      "    contract_price    = case when $2::boolean then contract_price  else $5::numeric end,",
      "    payment_term      = case when $2::boolean then payment_term    else $6::integer end,",
      "    contract_months   = case when $2::boolean then contract_months else $7::integer end,",
      "    coverage_miles    = case when $2::boolean then coverage_miles  else $8::integer end,",
      "    plan_name         = case when $2::boolean then plan_name       else $9 end,",
      "    policy_name       = case when $2::boolean then policy_name     else $10 end,",
      "    vehicle_class     = case when $2::boolean then vehicle_class   else $11 end,",
      "    rate_id           = case when $2::boolean then rate_id         else $12::integer end,",
      '    pricing_attempts  = pricing_attempts + case when $2::boolean then 1 else 0 end,',
      '    quote_url            = case when $2::boolean then quote_url            else $14 end,',
      '    short_link           = case when $2::boolean then short_link           else $15 end,',
      '    quote_link           = case when $2::boolean then quote_link           else $16 end,',
      '    guided_purchase_link = case when $2::boolean then guided_purchase_link else $17 end,',
  '    quote_expires_at     = case when $2::boolean then quote_expires_at     else $18::timestamptz end,',
      '    pricing_error     = case when $2::boolean then $13 else null end,',
      '    priced_at         = now(),',
      '    updated_at        = now()',
      'where id = $1;',
    ].join('\n'),
    '={{ $json.enrollment_id }}, {{ $json.failed }}, {{ $json.monthly }}, {{ $json.down }}, {{ $json.price }}, {{ $json.term }}, {{ $json.months }}, {{ $json.coverage_miles }}, {{ $json.plan_name }}, {{ $json.policy_name }}, {{ $json.vehicle_class }}, {{ $json.rate_id }}, {{ $json.reason }}, {{ $json.quote_url }}, {{ $json.short_link }}, {{ $json.quote_link }}, {{ $json.guided_purchase_link }}, {{ $json.quote_expires_at }}'),

  node('Rating Failed (stays unpriced, retried later)', 'noOp', 1, [240, 110], {}),
];

writeFileSync(join(ROOT, 'n8n/workflows/05-pricing.json'),
  JSON.stringify(workflow('DriveOne VSC 05 Pricing (' + DEALER.dealer.displayName + ')', pricingNodes, connect([
    ['Price Sweep', 'Campaign Config'],
    ['Campaign Config', 'Claim Unpriced Enrolments'],
    ['Claim Unpriced Enrolments', 'Get Quote'],
    ['Get Quote', ['Map Rating To Enrolment', 'Rating Failed (stays unpriced, retried later)']],
    ['Map Rating To Enrolment', 'Store Price'],
  ])), null, 2));

console.log('built 05-pricing.json');


/* =========================================== 6. BOUNCE WATCHER (RETIRED) == */

// There was a sixth workflow here. It logged into the sending mailbox over
// IMAP, read the delivery status notifications back out with a pile of regular
// expressions, and posted them to the exit endpoint. It existed for one reason:
// SMTP gives you no webhooks, so a bounce arrives as ordinary mail and there is
// nowhere else to learn about it.
//
// Sending moved to Resend, which reports bounces and complaints as signed
// events, so the guesswork is gone. 03-events.json now has a second webhook
// that takes them directly. Parsing English out of a mail server's apology was
// always the most fragile thing in this system and it is a relief to delete it.
//
// `git log -- n8n/workflows/06-bounce-watcher.json` has it, if SMTP ever
// returns.

