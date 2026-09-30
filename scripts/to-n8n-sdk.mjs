#!/usr/bin/env node
/**
 * Converts a built workflow JSON into n8n Workflow SDK code.
 *
 * The point is fidelity: the SQL and the Code node bodies in these workflows are
 * verified against the live database, so they are carried across verbatim rather
 * than retyped. Only the wrapper changes.
 */
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const file = process.argv[2];
const wf = JSON.parse(readFileSync(file, 'utf8'));

const TRIGGERS = new Set(['scheduleTrigger', 'webhook', 'errorTrigger', 'emailReadImap', 'manualTrigger']);
const short = (t) => t.replace('n8n-nodes-base.', '');
const handle = (name) => 'n_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

// Render a JS literal, turning n8n "=..." expression strings into expr(...).
function lit(v, ind = 6) {
  const pad = ' '.repeat(ind);
  if (v === null) return 'null';
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  if (typeof v === 'string') {
    if (v.startsWith('=')) return `expr(${JSON.stringify(v.slice(1))})`;
    return JSON.stringify(v);
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]';
    return '[\n' + v.map((x) => pad + '  ' + lit(x, ind + 2)).join(',\n') + '\n' + pad + ']';
  }
  const keys = Object.keys(v);
  if (keys.length === 0) return '{}';
  return '{\n' + keys.map((k) => `${pad}  ${/^[a-zA-Z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${lit(v[k], ind + 2)}`).join(',\n') + '\n' + pad + '}';
}

const out = [];
out.push(`import { workflow, node, trigger, ifElse, expr, newCredential } from '@n8n/workflow-sdk';`);
out.push('');

const ifNodes = new Set(wf.nodes.filter((n) => short(n.type) === 'if').map((n) => n.name));

for (const n of wf.nodes) {
  const t = short(n.type);
  const fn = TRIGGERS.has(t) ? 'trigger' : t === 'if' ? 'ifElse' : 'node';
  const cfg = [`name: ${JSON.stringify(n.name)}`, `parameters: ${lit(n.parameters, 6)}`];
  for (const k of ['onError', 'retryOnFail', 'maxTries', 'waitBetweenTries', 'alwaysOutputData', 'executeOnce']) {
    if (n[k] !== undefined) cfg.push(`${k}: ${lit(n[k], 6)}`);
  }
  if (n.credentials) {
    const entries = Object.entries(n.credentials)
      .map(([k, v]) => `${k}: newCredential(${JSON.stringify(v.name || k)})`).join(', ');
    cfg.push(`credentials: { ${entries} }`);
  }
  const head = t === 'if'
    ? `const ${handle(n.name)} = ifElse({\n  version: ${n.typeVersion},`
    : `const ${handle(n.name)} = ${fn}({\n  type: ${JSON.stringify(n.type)},\n  version: ${n.typeVersion},`;
  out.push(`${head}\n  config: {\n    ${cfg.join(',\n    ')}\n  }\n});`);
  out.push('');
}

// Walk the connection graph into .add()/.to()/.onTrue()/.onFalse() chains.
const conns = wf.connections;
const targets = (name, idx) => ((conns[name] && conns[name].main && conns[name].main[idx]) || []).map((t) => t.node);
const isTrigger = (name) => TRIGGERS.has(short(wf.nodes.find((n) => n.name === name).type));
const incoming = new Set();
for (const c of Object.values(conns)) for (const o of c.main) for (const t of o) incoming.add(t.node);
const roots = wf.nodes.filter((n) => isTrigger(n.name) && !incoming.has(n.name)).map((n) => n.name);

function chain(name, seen) {
  if (seen.has(name)) return '';
  seen.add(name);
  if (ifNodes.has(name)) {
    const [t] = targets(name, 0);
    const [f] = targets(name, 1);
    let s = '';
    if (t) s += `\n  .onTrue(${handle(t)}${chain(t, seen)})`;
    if (f) s += `\n  .onFalse(${handle(f)}${chain(f, seen)})`;
    return s;
  }
  const [next] = targets(name, 0);
  const [err] = targets(name, 1);   // second output on a node is its error branch
  let s = '';
  if (next) s += `\n  .to(${handle(next)}${chain(next, seen)})`;
  if (err)  s += `\n  .onError(${handle(err)}${chain(err, seen)})`;
  return s;
}

const seen = new Set();
const chains = roots.map((r) => `  .add(${handle(r)})${chain(r, seen)}`);
const id = basename(file, '.json').replace(/[^a-z0-9-]/g, '-');
out.push(`export default workflow(${JSON.stringify(id)}, ${JSON.stringify(wf.name)})`);
out.push(chains.join('\n') + ';');
process.stdout.write(out.join('\n') + '\n');
