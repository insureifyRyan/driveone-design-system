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
  '  status, current_step, next_send_at, quote_url',
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
  "  $3 || '/' || sl.short_code",
  'from quotes q',
  'join customers c           on c.id  = q.customer_id',
  'join customer_vehicles cv  on cv.id = q.customer_vehicle_id',
  'join quote_short_links sl  on sl.quote_id = q.id',
  'where q.partner_id = $4::uuid',
  '  -- anyone who already bought is not a prospect',
  "  and q.payment_status = 'pending'",
  "  and q.created_at > now() - ($5 || ' days')::interval",
  '  -- contactable',
  "  and c.email is not null and c.email <> ''",
  '  and c.opted_out = false',
  '  and coalesce(c.email_bounced, false)    = false',
  '  and coalesce(c.email_complained, false) = false',
  '  -- VSCs are not sold in California',
  "  and upper(coalesce(c.state, '')) <> 'CA'",
  '  -- eligibility ceilings',
  '  -- ceiling tracks the rate card: above it we cannot quote, so we do not email',
  '  and cv.mileage is not null and cv.mileage <= $6',
  '  and cv.year >= extract(year from now())::int - 12',
  '  -- campaign level do-not-contact, which outlives any single enrollment',
  '  and not exists (',
  '    select 1 from vsc_suppression s',
  '    where s.dealer_id = $1',
  "      and s.customer_key = encode(sha256(($1 || ':' || lower(trim(c.email)))::bytea), 'hex')",
  '  )',
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
  ]),

  pgNode('Enroll Eligible Service Customers', [-120, 0], INTAKE_SQL,
    '={{ $json.dealer_id }}, {{ $json.campaign_id }}, {{ $env.SHORT_LINK_BASE_URL }}, {{ $json.partner_id }}, {{ $json.window_days }}, {{ $json.max_mileage }}'),

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
  '',
  "const fmtMoney = (v) => (v === null || v === undefined || v === '') ? null",
  '  : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(v));',
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
  '        monthly_payment: fmtMoney(r.monthly_payment),',
  '        down_payment: fmtMoney(r.down_payment),',
  '        coverage_label: coverageLabel(r.coverage_miles, r.contract_months),',
  '        last_ro_date: r.ro_closed_date',
  '          ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(r.ro_closed_date))',
  '          : "your last visit",',
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
  '    and monthly_payment is null',
  '    and dealer_id = $1 and campaign_id = $2',
  "    and (priced_at is null or priced_at < now() - interval '1 hour')",
  '  order by created_at',
  '  limit 100',
  '  for update skip locked',
  ')',
  'returning e.id, e.vin, e.vehicle_mileage, e.vehicle_year, e.vehicle_make, e.vehicle_model;',
].join('\n');

const MAP_RATING_CODE = [
  '// Rating API response:',
  '//   { make, mileage, vehicle_class, quote_options: [ { contract_term,',
  '//     financing_term, quote_price, monthly_payment, down_payment,',
  '//     financed_amount, coverage_miles, plan_name, policy_name,',
  '//     bracket_name, rate_id } ] }',
  '//',
  '// We want the lowest monthly the customer can actually finance. Options with',
  '// financing_term 0 are pay in full, and any option quoting 0 is not a real',
  '// price, so both are discarded rather than shown as a bargain.',
  '',
  'const out = [];',
  'for (const item of $input.all()) {',
  '  const res = item.json || {};',
  '  const enrolment = $("Claim Unpriced Enrolments").itemMatching($itemIndex).json;',
  '  const options = Array.isArray(res.quote_options) ? res.quote_options : [];',
  '',
  '  const financed = options.filter((o) =>',
  '    Number(o.financing_term) > 0 &&',
  '    Number(o.monthly_payment) > 0 &&',
  '    Number(o.quote_price) > 0',
  '  );',
  '',
  '  if (financed.length === 0) {',
  '    // No real financed option. Common for a vehicle outside the rate card,',
  '    // for example above the top mileage bracket. Leave it unpriced: the',
  '    // scheduler skips unpriced rows, so nobody is emailed a blank or a zero.',
  '    out.push({ json: {',
  '      enrollment_id: enrolment.id,',
  '      failed: true,',
  '      reason: "no financed quote_options returned (" + options.length + " option(s), " +',
  '              (res.vehicle_class || "no class") + ", " + (res.make || "no make") + ")",',
  '    } });',
  '    continue;',
  '  }',
  '',
  '  financed.sort((a, b) => Number(a.monthly_payment) - Number(b.monthly_payment));',
  '  const best = financed[0];',
  '',
  '  out.push({ json: {',
  '    enrollment_id:  enrolment.id,',
  '    failed:         false,',
  '    monthly:        Number(best.monthly_payment),',
  '    down:           Number(best.down_payment),',
  '    price:          Number(best.quote_price),',
  '    term:           Number(best.financing_term),',
  '    months:         Number(best.contract_term),',
  '    coverage_miles: best.coverage_miles === undefined ? null : Number(best.coverage_miles),',
  '    plan_name:      best.plan_name || null,',
  '    policy_name:    best.policy_name || null,',
  '    vehicle_class:  res.vehicle_class || null,',
  '    rate_id:        best.rate_id === undefined ? null : Number(best.rate_id),',
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

  node('Get Rating', 'httpRequest', 4.2, [10, 0], {
    method: 'POST',
    url: '={{ $env.RATING_API_URL || "https://www.getelevatewarranty.com/api/partners/rating" }}',
    sendHeaders: true,
    headerParameters: {
      parameters: [
        // The key is supplied by the environment and never stored in this repo.
        { name: 'x-captured-api-key', value: '={{ $env.RATING_API_KEY }}' },
        { name: 'Accept', value: 'application/json' },
      ],
    },
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={{ JSON.stringify({\n'
      + '  vin: $json.vin,\n'
      + '  mileage: $json.vehicle_mileage,\n'
      + '  partner_slug: ' + JSON.stringify(DEALER.supabase.slug) + '\n'
      + '}) }}',
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
      '    pricing_error     = case when $2::boolean then $13 else null end,',
      '    priced_at         = now(),',
      '    updated_at        = now()',
      'where id = $1;',
    ].join('\n'),
    '={{ $json.enrollment_id }}, {{ $json.failed }}, {{ $json.monthly }}, {{ $json.down }}, {{ $json.price }}, {{ $json.term }}, {{ $json.months }}, {{ $json.coverage_miles }}, {{ $json.plan_name }}, {{ $json.policy_name }}, {{ $json.vehicle_class }}, {{ $json.rate_id }}, {{ $json.reason }}'),

  node('Rating Failed (stays unpriced, retried later)', 'noOp', 1, [240, 110], {}),
];

writeFileSync(join(ROOT, 'n8n/workflows/05-pricing.json'),
  JSON.stringify(workflow('DriveOne VSC 05 Pricing (' + DEALER.dealer.displayName + ')', pricingNodes, connect([
    ['Price Sweep', 'Campaign Config'],
    ['Campaign Config', 'Claim Unpriced Enrolments'],
    ['Claim Unpriced Enrolments', 'Get Rating'],
    ['Get Rating', ['Map Rating To Enrolment', 'Rating Failed (stays unpriced, retried later)']],
    ['Map Rating To Enrolment', 'Store Price'],
  ])), null, 2));

console.log('built 05-pricing.json');
