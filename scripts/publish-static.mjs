#!/usr/bin/env node
/**
 * Assembles the Vercel static output across every built dealership.
 *
 *   public/index.html                     dealer picker
 *   public/<dealer>.html                  that dealership's review gallery
 *   public/filled/<dealer>/*.html         sample-data previews for client sign off
 *   public/templates/<dealer>/*.html      merge-tag templates, for reference
 *
 * Note on templates/: the scheduler reads its HTML from the vsc_email_template
 * table, not over HTTPS, so nothing at send time depends on this directory. It
 * is published for review and diffing only. Do not reintroduce a fetch against
 * it; that path needed public hosting, a deployment protection carve out and a
 * base URL in config, and it could fail at send time.
 */
import { cpSync, mkdirSync, rmSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public');
const TOKENS = JSON.parse(readFileSync(join(ROOT, 'brand/driveone.tokens.json'), 'utf8'));

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'templates'), { recursive: true });

cpSync(join(ROOT, 'preview'), OUT, { recursive: true });
cpSync(join(ROOT, 'email/dist'), join(OUT, 'templates'), { recursive: true });

// Only list dealerships that actually built. A dealer file with no manifest
// means someone added the JSON and never ran the build, and a picker linking to
// a gallery that does not exist is worse than one that omits it.
const dealers = readdirSync(join(ROOT, 'brand/dealers'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''))
  .filter((id) => existsSync(join(ROOT, 'email/dist', id, 'manifest.json')))
  .map((id) => ({
    id,
    dealer: JSON.parse(readFileSync(join(ROOT, `brand/dealers/${id}.json`), 'utf8')),
    manifest: JSON.parse(readFileSync(join(ROOT, 'email/dist', id, 'manifest.json'), 'utf8')),
  }));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Same walk as the gallery banner and the pre-send guard: name what is still
// open rather than asserting in prose that everything is a placeholder.
const openItems = (node, path = '') => {
  const out = [];
  (function walk(n, p) {
    if (typeof n === 'string') {
      if (/NEEDS CONFIRMATION|PLACEHOLDER|REPLACE-ME/i.test(n)) out.push(p);
      return;
    }
    if (n && typeof n === 'object') {
      for (const [k, v] of Object.entries(n)) {
        if (k.startsWith('$') || /Note$/.test(k)) continue;
        walk(v, p ? `${p}.${k}` : k);
      }
    }
  })(node, path);
  return out;
};

const C = TOKENS.color;
const cards = dealers.map(({ id, dealer, manifest }) => {
  const open = openItems(dealer);
  return `
  <a class="card" href="${esc(id)}.html">
    <div class="swatch"><span style="background:${esc(dealer.color.primary)}"></span><span style="background:${esc(dealer.color.accent)}"></span></div>
    <h3>${esc(dealer.dealer.displayName)}</h3>
    <p class="meta">${manifest.emails.length} emails &middot; campaign <code>${esc(manifest.campaign)}</code></p>
    <p class="${open.length ? 'blocked' : 'ready'}">${open.length ? `${open.length} field${open.length === 1 ? '' : 's'} unconfirmed` : 'No unconfirmed fields'}</p>
  </a>`;
}).join('');

writeFileSync(join(OUT, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>DriveOne VSC Campaigns</title>
<style>
  :root{--cyan:${C.cyan};--ink:${C.ink};--rule:${C.rule};--muted:${C.mutedText};--paper:${C.paper};}
  *{box-sizing:border-box;}
  body{margin:0;background:var(--paper);color:var(--ink);font-family:'Inter Tight','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;}
  header{background:var(--ink);color:#fff;padding:44px 28px 38px;border-top:4px solid var(--cyan);}
  .inner{max-width:1120px;margin:0 auto;}
  header h1{margin:0 0 10px;font-size:34px;letter-spacing:-1px;font-weight:800;}
  header h1 span{color:var(--cyan);}
  header p{margin:0;color:rgba(255,255,255,.7);font-size:16px;line-height:1.6;max-width:65ch;}
  main{padding:34px 28px 70px;}
  .grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));}
  .card{display:block;background:#fff;border:1px solid var(--rule);border-radius:14px;padding:20px;text-decoration:none;color:inherit;transition:.15s;}
  .card:hover{border-color:var(--cyan);transform:translateY(-2px);box-shadow:0 8px 24px rgba(14,27,44,.09);}
  .swatch{display:flex;gap:6px;margin-bottom:14px;}
  .swatch span{width:26px;height:26px;border-radius:7px;border:1px solid rgba(0,0,0,.12);}
  .card h3{margin:0 0 6px;font-size:18px;letter-spacing:-.3px;font-weight:800;}
  .meta{margin:0 0 14px;font-size:13px;color:var(--muted);}
  .meta code{font-size:12px;}
  .ready,.blocked{margin:0;font-size:12px;font-weight:700;padding:6px 10px;border-radius:8px;display:inline-block;}
  .ready{background:#E8F6EC;color:#1B6B37;}
  .blocked{background:#FDECEE;color:#9E1318;}
</style></head>
<body>
<header><div class="inner">
  <h1>DriveOne <span>VSC</span> campaigns</h1>
  <p>Post service follow up, sent on each dealership's behalf to its own service drive customers. One engine, one copy deck, one brand file per rooftop.</p>
</div></header>
<main><div class="inner"><div class="grid">${cards}</div></div></main>
</body></html>`);

console.log(`public/ assembled: ${dealers.length} dealership(s), ${readdirSync(join(OUT, 'templates')).length} template folder(s)`);
