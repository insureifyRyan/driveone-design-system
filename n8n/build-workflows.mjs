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
 */
import { readFileSync, writeFileSync } from 'node:fs';
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
    options: { queryReplacement: replacement, ...options },
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

const cond = (left, operator, right, type = 'string') => ({
  id: 'c' + Math.random().toString(36).slice(2, 8),
  leftValue: left,
  rightValue: right,
  operator: { type, operation: operator, ...(operator === 'true' || operator === 'false' ? { singleValue: true } : {}) },
});

/* ============================================================ 1. INTAKE == */

const DMS_MAPPING_CODE = [
  '// ===================================================================',
  '// THE ONLY NODE YOU EDIT WHEN THE DMS CHANGES.',
  '// Every downstream node reads the canonical shape produced here, so a new',
  '// DMS, a renamed field, or a second dealer group means editing this map and',
  '// nothing else. Add a new key per DMS and set DMS below.',
  '// ===================================================================',
  '',
  "const DMS = $env.DMS_VENDOR || 'generic';",
  '',
  'const MAPPINGS = {',
  '  generic: {',
  "    email: ['customer_email', 'email', 'Email'],",
  "    first_name: ['customer_first_name', 'first_name', 'FirstName'],",
  "    vin: ['vin', 'VIN', 'vehicle_vin'],",
  "    ro_number: ['ro_number', 'repair_order_number', 'RONumber'],",
  "    ro_closed_date: ['ro_closed_date', 'closed_date', 'CloseDate'],",
  "    vehicle_year: ['vehicle_year', 'year', 'ModelYear'],",
  "    vehicle_make: ['vehicle_make', 'make', 'Make'],",
  "    vehicle_model: ['vehicle_model', 'model', 'Model'],",
  "    vehicle_mileage: ['odometer', 'mileage', 'Odometer'],",
  "    last_ro_services: ['services', 'op_codes_description', 'ServiceDescription'],",
  "    advisor_name: ['advisor', 'service_advisor', 'AdvisorName'],",
  "    garaging_state: ['state', 'customer_state', 'State'],",
  "    has_vsc: ['has_service_contract', 'vsc_on_file', 'ServiceContractFlag'],",
  '  },',
  '  // Add cdk / reynolds / tekion / dealertrack blocks here as they come online.',
  '  // They inherit nothing, so a wrong key in one never breaks another.',
  '};',
  '',
  'const MAP = MAPPINGS[DMS] || MAPPINGS.generic;',
  '',
  'function pick(row, keys) {',
  '  for (const k of keys) {',
  "    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') return row[k];",
  '  }',
  '  return null;',
  '}',
  '',
  'const truthy = (v) => {',
  '  if (v === null) return false;',
  '  const s = String(v).trim().toLowerCase();',
  "  return s === 'true' || s === 'y' || s === 'yes' || s === '1';",
  '};',
  '',
  'const out = [];',
  '',
  'for (const item of $input.all()) {',
  '  // A DMS may post a single RO or an array under any of these keys.',
  '  const payload = item.json;',
  '  const rows = Array.isArray(payload) ? payload',
  '    : Array.isArray(payload.body) ? payload.body',
  '    : Array.isArray(payload.repair_orders) ? payload.repair_orders',
  '    : [payload.body || payload];',
  '',
  '  for (const row of rows) {',
  '    const rec = {};',
  '    for (const [canonical, keys] of Object.entries(MAP)) rec[canonical] = pick(row, keys);',
  '',
  "    rec.email = rec.email ? String(rec.email).trim().toLowerCase() : null;",
  '    rec.has_vsc = truthy(rec.has_vsc);',
  '    rec.vehicle_mileage = rec.vehicle_mileage === null ? null : parseInt(String(rec.vehicle_mileage).replace(/[^0-9]/g, ""), 10) || null;',
  "    rec.garaging_state = rec.garaging_state ? String(rec.garaging_state).trim().toUpperCase().slice(0, 2) : null;",
  '',
  '    // Stable identity. Same customer + same dealer always hashes the same,',
  '    // which is what makes re-running the whole feed harmless.',
  "    const crypto = require('crypto');",
  "    rec.dealer_id = " + JSON.stringify(DEALER.id) + ';',
  "    rec.campaign_id = " + JSON.stringify(DECK.campaign.id) + ';',
  '    rec.customer_key = rec.email',
  "      ? crypto.createHash('sha256').update(rec.dealer_id + ':' + rec.email).digest('hex')",
  '      : null;',
  '',
  '    rec._raw_keys = Object.keys(row).length;',
  '    out.push({ json: rec });',
  '  }',
  '}',
  '',
  'return out;',
].join('\n');

const ELIGIBILITY_CODE = [
  '// Eligibility gate. Every rule is declarative and returns a reason string,',
  '// so a rejected contact is always explainable rather than silently dropped.',
  '',
  'const CONFIG = {',
  '  maxRoAgeDays: 30,        // only recent service visits feel relevant',
  '  maxMileage: 125000,      // above this most tiers are unavailable',
  '  minModelYear: new Date().getFullYear() - 12,',
  '  excludedStates: ' + JSON.stringify(OFFER.excluded_states) + ',  // VSCs are not sold in CA',
  '};',
  '',
  'const RULES = [',
  "  [(r) => !!r.email, 'no_email'],",
  "  [(r) => /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(r.email || ''), 'invalid_email'],",
  "  [(r) => !r.has_vsc, 'already_has_vsc'],",
  "  [(r) => !!r.vin, 'no_vin'],",
  "  [(r) => !CONFIG.excludedStates.includes(r.garaging_state), 'excluded_state'],",
  '  [(r) => r.vehicle_mileage === null || r.vehicle_mileage <= CONFIG.maxMileage, "over_mileage"],',
  '  [(r) => !r.vehicle_year || parseInt(r.vehicle_year, 10) >= CONFIG.minModelYear, "too_old"],',
  '  [(r) => {',
  '    if (!r.ro_closed_date) return false;',
  '    const closed = new Date(r.ro_closed_date);',
  '    if (isNaN(closed)) return false;',
  '    const ageDays = (Date.now() - closed.getTime()) / 86400000;',
  '    return ageDays >= 0 && ageDays <= CONFIG.maxRoAgeDays;',
  '  }, "ro_too_old"],',
  '];',
  '',
  'const out = [];',
  'for (const item of $input.all()) {',
  '  const r = item.json;',
  '  let reason = null;',
  '  for (const [test, why] of RULES) {',
  '    let ok = false;',
  '    try { ok = test(r); } catch (e) { ok = false; }',
  '    if (!ok) { reason = why; break; }',
  '  }',
  '  out.push({ json: { ...r, eligible: reason === null, ineligible_reason: reason } });',
  '}',
  'return out;',
].join('\n');

const SCHEDULE_CODE = [
  '// Cadence lives in email/copy/campaign.json and is compiled in here by',
  '// n8n/build-workflows.mjs. Change sendDay there, regenerate, re-import.',
  'const SCHEDULE = ' + JSON.stringify(SCHEDULE.map((s) => ({ step: s.step, day: s.day })), null, 2) + ';',
  '',
  'const firstDelayDays = SCHEDULE[0].day;',
  'const out = [];',
  'for (const item of $input.all()) {',
  '  const r = item.json;',
  '  const base = new Date();',
  '  const next = new Date(base.getTime() + firstDelayDays * 86400000);',
  '  // Land the first send at 10:00 local rather than whenever the RO closed.',
  '  next.setHours(10, 0, 0, 0);',
  '  if (next < base) next.setTime(base.getTime() + 60 * 60 * 1000);',
  '  out.push({ json: { ...r, enrolled_at: base.toISOString(), next_send_at: next.toISOString(), schedule: SCHEDULE } });',
  '}',
  'return out;',
].join('\n');

const intakeNodes = [
  node('DMS Repair Order Webhook', 'webhook', 2, [-620, 0], {
    httpMethod: 'POST',
    path: 'dms/repair-orders/' + DEALER.id,
    authentication: 'headerAuth',
    responseMode: 'lastNode',
    options: {},
  }, { webhookId: 'dms-ro-' + DEALER.id, credentials: { httpHeaderAuth: { id: 'REPLACE_DMS_AUTH_CRED_ID', name: 'DMS Webhook Shared Secret' } } }),

  node('Nightly DMS Pull (fallback)', 'scheduleTrigger', 1.2, [-620, 200], {
    rule: { interval: [{ field: 'cronExpression', expression: '0 5 * * *' }] },
  }),

  node('Fetch Closed ROs', 'httpRequest', 4.2, [-400, 200], {
    method: 'GET',
    url: '={{ $env.DMS_API_BASE }}/repair-orders?status=closed&since={{ $now.minus(2, "days").toISO() }}',
    authentication: 'genericCredentialType',
    genericAuthType: 'httpHeaderAuth',
    options: { response: { response: { neverError: false } } },
  }, { credentials: { httpHeaderAuth: { id: 'REPLACE_DMS_API_CRED_ID', name: 'DMS API' } } }),

  codeNode('Normalize RO Payload', [-160, 100], DMS_MAPPING_CODE),
  codeNode('Apply Eligibility Rules', [60, 100], ELIGIBILITY_CODE),

  ifNode('Eligible?', [280, 100], [cond('={{ $json.eligible }}', 'true', '', 'boolean')]),

  pgNode('Check Suppression List', [500, 0],
    'select 1 as suppressed from vsc_suppression where dealer_id = $1 and customer_key = $2 limit 1;',
    '={{ $json.dealer_id }}, {{ $json.customer_key }}',
    { }),

  ifNode('Not Suppressed?', [720, 0], [cond('={{ $items().length === 0 || !$json.suppressed }}', 'true', '', 'boolean')]),

  codeNode('Compute First Send Time', [940, -100], SCHEDULE_CODE),

  pgNode('Upsert Enrollment', [1160, -100],
    [
      'insert into vsc_enrollment (',
      '  dealer_id, campaign_id, customer_key, email, first_name,',
      '  vin, ro_number, ro_closed_date, vehicle_year, vehicle_make, vehicle_model,',
      '  vehicle_mileage, last_ro_services, advisor_name, garaging_state,',
      '  status, current_step, next_send_at, quote_url',
      ') values (',
      '  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,',
      "  'active', 0, $16, $17",
      ')',
      '-- Idempotent by construction. Replaying the same RO feed changes nothing.',
      'on conflict (dealer_id, campaign_id, customer_key) do nothing',
      'returning id, email, next_send_at;',
    ].join('\n'),
    '={{ $json.dealer_id }}, {{ $json.campaign_id }}, {{ $json.customer_key }}, {{ $json.email }}, {{ $json.first_name }}, {{ $json.vin }}, {{ $json.ro_number }}, {{ $json.ro_closed_date }}, {{ $json.vehicle_year }}, {{ $json.vehicle_make }}, {{ $json.vehicle_model }}, {{ $json.vehicle_mileage }}, {{ $json.last_ro_services }}, {{ $json.advisor_name }}, {{ $json.garaging_state }}, {{ $json.next_send_at }}, {{ $env.QUOTE_URL_BASE }}/{{ $json.dealer_id }}/quote?vin={{ $json.vin }}&k={{ $json.customer_key }}'),

  node('Enrolled', 'noOp', 1, [1380, -100], {}),
  node('Skipped (logged, not enrolled)', 'noOp', 1, [940, 220], {}),
];

const intakeConnections = connect([
  ['DMS Repair Order Webhook', 'Normalize RO Payload'],
  ['Nightly DMS Pull (fallback)', 'Fetch Closed ROs'],
  ['Fetch Closed ROs', 'Normalize RO Payload'],
  ['Normalize RO Payload', 'Apply Eligibility Rules'],
  ['Apply Eligibility Rules', 'Eligible?'],
  ['Eligible?', ['Check Suppression List', 'Skipped (logged, not enrolled)']],
  ['Check Suppression List', 'Not Suppressed?'],
  ['Not Suppressed?', ['Compute First Send Time', 'Skipped (logged, not enrolled)']],
  ['Compute First Send Time', 'Upsert Enrollment'],
  ['Upsert Enrollment', 'Enrolled'],
]);

writeFileSync(join(ROOT, 'n8n/workflows/01-intake.json'),
  JSON.stringify(workflow('DriveOne VSC 01 Intake (' + DEALER.dealer.displayName + ')', intakeNodes, intakeConnections), null, 2));

console.log('built 01-intake.json');


/* ========================================================= 2. SCHEDULER == */

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
  '  order by next_send_at',
  '  limit 200',
  '  for update skip locked',
  ')',
  'returning e.*;',
].join('\n');

const PREPARE_SEND_CODE = [
  'const SCHEDULE = ' + JSON.stringify(SCHEDULE, null, 2) + ';',
  'const LAST_STEP = ' + LAST_STEP + ';',
  '',
  '// Dealer local send window. Outside it we simply emit nothing; the two hour',
  '// lease from the claim query expires and the row is picked up in the next',
  '// window. No extra state, no queue to drain.',
  "const TZ = $env.DEALER_TZ || 'America/New_York';",
  'const WINDOW_START = 9;',
  'const WINDOW_END = 19;',
  '',
  'const localHour = parseInt(',
  "  new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', hour12: false }).format(new Date()),",
  '  10',
  ');',
  'const inWindow = localHour >= WINDOW_START && localHour < WINDOW_END;',
  '',
  'if (!inWindow) return [];',
  '',
  "const crypto = require('crypto');",
  'const out = [];',
  '',
  'for (const item of $input.all()) {',
  '  const r = item.json;',
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
  '  if (nextSendAt) nextSendAt.setHours(10, 0, 0, 0);',
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
  '        first_name: r.first_name || "there",',
  '        vehicle_year: r.vehicle_year || "",',
  '        vehicle_make: r.vehicle_make || "",',
  '        vehicle_model: r.vehicle_model || "your vehicle",',
  '        vehicle_mileage: r.vehicle_mileage ? Number(r.vehicle_mileage).toLocaleString("en-US") : "",',
  '        last_ro_date: r.ro_closed_date',
  '          ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(r.ro_closed_date))',
  '          : "your last visit",',
  '        last_ro_services: r.last_ro_services || "Service visit",',
  '        advisor_name: r.advisor_name || "",',
  '        quote_url: (r.quote_url || "") + "&step=" + nextStep + "&" + ' + JSON.stringify(DEALER.campaign.utm) + ',',
  '        unsubscribe_url: $env.UNSUBSCRIBE_URL_BASE + "?k=" + r.customer_key + "&d=" + r.dealer_id,',
  '        preferences_url: $env.PREFERENCES_URL_BASE + "?k=" + r.customer_key + "&d=" + r.dealer_id,',
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
  'const out = [];',
  'for (const item of $input.all()) {',
  '  const prepared = $(\'Prepare Send\').itemMatching(item.pairedItem ? item.pairedItem.item : 0).json;',
  '  let html = item.json.data || item.json.body || "";',
  '',
  '  if (typeof html !== "string" || html.length < 500) {',
  '    throw new Error("Template fetch returned no usable HTML for step " + prepared.step + " (" + prepared.slug + ")");',
  '  }',
  '',
  '  for (const [k, v] of Object.entries(prepared.merge)) {',
  '    html = html.split("{{" + k + "}}").join(String(v == null ? "" : v));',
  '  }',
  '',
  '  const leftover = html.match(/\\{\\{[a-z_]+\\}\\}/g);',
  '  if (leftover) {',
  '    // Fail loudly. A merge tag reaching a customer inbox is worse than a missed send.',
  '    throw new Error("Unresolved merge tags in step " + prepared.step + ": " + [...new Set(leftover)].join(", "));',
  '  }',
  '',
  '  out.push({ json: { ...prepared, html } });',
  '}',
  'return out;',
].join('\n');

const schedulerNodes = [
  node('Every Hour', 'scheduleTrigger', 1.2, [-620, 0], {
    rule: { interval: [{ field: 'cronExpression', expression: '7 * * * *' }] },
  }),

  setNode('Campaign Config', [-400, 0], [
    ['dealer_id', DEALER.id],
    ['campaign_id', DECK.campaign.id],
  ]),

  pgNode('Claim Due Enrollments', [-180, 0], CLAIM_SQL,
    '={{ $json.dealer_id }}, {{ $json.campaign_id }}'),

  ifNode('Anything Due?', [40, 0], [cond('={{ $json.id }}', 'exists', '', 'string')]),

  codeNode('Prepare Send', [260, -100], PREPARE_SEND_CODE),

  node('Fetch Template HTML', 'httpRequest', 4.2, [480, -100], {
    method: 'GET',
    url: '={{ $env.TEMPLATE_BASE_URL }}/{{ $json.slug }}.html',
    sendHeaders: true,
    headerParameters: {
      parameters: [
        // Only needed while the templates sit behind Vercel Deployment Protection.
        // Harmless when empty, e.g. once they are served from an unprotected custom
        // domain. See docs/N8N-SETUP.md, Hosting the templates.
        { name: 'x-vercel-protection-bypass', value: '={{ $env.VERCEL_BYPASS_TOKEN || "" }}' },
      ],
    },
    options: { response: { response: { responseFormat: 'text', outputPropertyName: 'data' } } },
  }, { retryOnFail: true, maxTries: 3, waitBetweenTries: 3000 }),

  codeNode('Render Merge Tags', [700, -100], RENDER_CODE),

  node('Send via Resend', 'httpRequest', 4.2, [920, -100], {
    method: 'POST',
    url: 'https://api.resend.com/emails',
    sendHeaders: true,
    headerParameters: {
      parameters: [
        { name: 'Authorization', value: '=Bearer {{ $env.RESEND_API_KEY }}' },
        { name: 'Idempotency-Key', value: '={{ $json.enrollment_id }}-{{ $json.step }}' },
      ],
    },
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={{ JSON.stringify({\n'
      + '  from: $env.SEND_FROM,\n'
      + '  reply_to: $env.SEND_REPLY_TO,\n'
      + '  to: [$(\'Claim Due Enrollments\').itemMatching($itemIndex).json.email],\n'
      + '  subject: $json.subject,\n'
      + '  html: $json.html,\n'
      + '  headers: {\n'
      + '    "List-Unsubscribe": "<" + $json.merge.unsubscribe_url + ">, <mailto:" + $env.UNSUBSCRIBE_MAILBOX + ">",\n'
      + '    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"\n'
      + '  },\n'
      + '  tags: [\n'
      + '    { name: "campaign", value: $json.campaign_id },\n'
      + '    { name: "dealer", value: $json.dealer_id },\n'
      + '    { name: "step", value: String($json.step) },\n'
      + '    { name: "variant", value: $json.variant }\n'
      + '  ]\n'
      + '}) }}',
    options: { response: { response: { neverError: false } } },
  }, { onError: 'continueErrorOutput', retryOnFail: true, maxTries: 3, waitBetweenTries: 5000 }),

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

  node('Send Failed', 'noOp', 1, [1140, 0], {}),
  node('Nothing Due', 'noOp', 1, [260, 140], {}),
];

const schedulerConnections = connect([
  ['Every Hour', 'Campaign Config'],
  ['Campaign Config', 'Claim Due Enrollments'],
  ['Claim Due Enrollments', 'Anything Due?'],
  ['Anything Due?', ['Prepare Send', 'Nothing Due']],
  ['Prepare Send', 'Fetch Template HTML'],
  ['Fetch Template HTML', 'Render Merge Tags'],
  ['Render Merge Tags', 'Send via Resend'],
  ['Send via Resend', ['Log Send', 'Send Failed']],
  ['Log Send', 'Advance State'],
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
  '  // customer_key is preferred. Fall back to hashing whatever email we were given.',
  "  const crypto = require('crypto');",
  '  const dealer_id = p.dealer_id || p.dealer || $json.params?.dealer || "' + DEALER.id + '";',
  '  const email = (p.email || p.data?.to?.[0] || p.to || "").toString().trim().toLowerCase();',
  '  const customer_key = p.customer_key',
  '    || (email ? crypto.createHash("sha256").update(dealer_id + ":" + email).digest("hex") : null);',
  '',
  '  out.push({',
  '    json: {',
  '      received_type: type,',
  '      known: !!rule,',
  '      actionable: !!(rule && rule.exit && customer_key),',
  '      exit_reason: rule ? rule.exit : null,',
  '      suppress: rule ? !!rule.suppress : false,',
  '      dealer_id,',
  '      customer_key,',
  '      email,',
  '      campaign_id: p.campaign_id || "' + DECK.campaign.id + '",',
  '    },',
  '  });',
  '}',
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
    url: '={{ $env.SLACK_ALERT_WEBHOOK }}',
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
