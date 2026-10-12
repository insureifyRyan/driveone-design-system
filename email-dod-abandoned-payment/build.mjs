// DriveOne Direct: Finish Your Payment series.
// Renders copy/campaign.json into email safe HTML + plain text with Resend
// {{{VARIABLE}}} merge tags intact. No dependencies. Node 18+.
//
//   node build.mjs            -> dist/*.html, dist/*.txt, dist/manifest.json, dist/preview.html
//
// Design mirrors the live driveonedirect.com welcome email and the dod-abandon
// drip: #0E1B2C ink, #1FBFEC cyan, #EEF2F6 page, Helvetica, 600px white card,
// table layout, inline styles, no webfonts, no JS.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const deck = JSON.parse(readFileSync(join(here, "copy/campaign.json"), "utf8"));
const out = join(here, "dist");
mkdirSync(out, { recursive: true });

const T = JSON.parse(readFileSync(join(here, "../brand/driveone.tokens.json"), "utf8"));
const B = T.brand.direct;
const F = `font-family:${T.font.body}`;
const MONO = `font-family:${T.font.mono}`;
// Every color below is a token. Add a token before adding a color.
const C = { ink: T.color.ink, cyan: T.color.cyan, page: T.color.paper, body: T.color.bodyText, mute: T.color.mutedText, card: T.color.cardFill, line: T.color.rule, link: T.color.cyanDark, tint: T.color.cyanSoft, cyanDark: T.color.cyanDark, inkMuted: T.color.inkMuted, white: T.color.white };
const L = T.layout;
const P = B.phones;

const FOOTER_LEGAL = "This is an advertisement. A vehicle service contract is not insurance and is not a manufacturer's warranty. Coverage is administered by Ascent Administration Services, LLC and insured by Old Republic Insurance Company (A+ rated by AM Best). Not available in California. Coverage, price and terms vary by state and are subject to limits and exclusions; see your contract for the complete list of covered components and exclusions. Coverage is not active until your payment is completed. Payment amounts shown are from the contract you signed; your exact terms are confirmed by Budco Financial Services at checkout. A $100 deductible applies per visit. Cancel anytime: full refund within 30 days if no claim has been paid; prorated after, less any paid claims and a cancellation fee where permitted by your state. Questions about coverage or claims? Call the administrator, Ascent, at " + P.ascentClaims + ".";
const ADDRESS = `${B.entity} &middot; ${B.postal}`;

// Guard: the voice rules are enforced at build time, not by hoping.
function lint(e) {
  const text = JSON.stringify(e);
  const problems = [];
  if (/[—–]/.test(text)) problems.push("em/en dash");
  if (/!/.test(text.replace(/&rarr;/g, ""))) problems.push("exclamation point");
  if (/warrant(y|ies)/i.test(text)) problems.push("the word warranty");
  if (/you(?:'|&#39;|’)?re covered|you are covered|now covered|coverage is active/i.test(text)) problems.push("claims coverage is active");
  if (/\{\{\{MONTHLY\}\}\}|\{\{\{DOWN\}\}\}/.test(e.subject + e.subjectAlt)) problems.push("numeric variable in subject");
  if (problems.length) throw new Error(`Email ${e.step} (${e.slug}): ${problems.join(", ")}`);
}

const p = (s, extra = "") => `<div style="${F};font-weight:400;font-size:15px;line-height:1.65;color:${C.body};${extra}">${s}</div>`;
const pad = (inner, top = 0, bottom = 0) => `<tr><td style="padding-top:${top}px;padding-bottom:${bottom}px;padding-left:32px;padding-right:32px">${inner}</td></tr>`;

function cardHtml(card) {
  if (!card) return "";
  const rows = card.rows.map(([k, v], i) => {
    const border = i < card.rows.length - 1 ? `border-bottom:1px solid ${C.line};` : "";
    const isStep = /^\d$/.test(k);
    const keyCell = isStep
      ? `<td width="34" valign="top" style="padding:13px 0 13px 18px;${border}"><div style="${F};font-weight:800;font-size:14px;line-height:1;color:${C.cyanDark}">${k}.</div></td>`
      : `<td valign="top" style="padding:13px 12px 13px 18px;${border}"><div style="${F};font-weight:400;font-size:14px;line-height:1.45;color:${C.body}">${k}</div></td>`;
    const valCell = isStep
      ? `<td valign="top" style="padding:13px 18px 13px 6px;${border}"><div style="${F};font-weight:400;font-size:14px;line-height:1.45;color:${C.body}">${v}</div></td>`
      : `<td valign="top" align="right" style="padding:13px 18px 13px 0;${border}"><div style="${MONO};font-weight:700;font-size:13px;line-height:1.45;color:${C.ink}">${v}</div></td>`;
    return `<tr>${keyCell}${valCell}</tr>`;
  }).join("");
  return pad(`
    <div style="${F};font-weight:700;font-size:10px;line-height:1;color:${C.ink};letter-spacing:0.16em;padding-bottom:10px">${card.title}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.card}" style="background-color:${C.card};border-radius:${L.radius}px">${rows}</table>`, 22);
}

function heroHtml(h) {
  return pad(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.ink}" style="background-color:${C.ink};border-radius:${L.radius}px">
      <tr><td style="padding:24px 26px">
        <div style="${F};font-weight:600;font-size:11px;line-height:1;color:${C.mute};letter-spacing:0.14em">${h.label}</div>
        <div style="${F};font-weight:800;font-size:36px;line-height:1.1;color:${C.cyan};letter-spacing:-0.03em;padding-top:12px">${h.big}</div>
        <div style="${F};font-weight:600;font-size:13px;line-height:1.5;color:${C.white};padding-top:10px">${h.sub}</div>
        <div style="${F};font-weight:400;font-size:12px;line-height:1.6;color:${C.inkMuted};padding-top:8px">${h.fine}</div>
      </td></tr>
    </table>`, 22);
}

function html(e) {
  const body = e.body.map((b, i) => pad(p(b), i === 0 ? 16 : 14)).join("");
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting"><title>DriveOne Direct</title></head>
<body style="margin:0;padding:0;background-color:${C.page}">
<div style="display:none;font-size:1px;color:${C.page};line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden">${e.preheader}${"&#8204;&nbsp;".repeat(18)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.page}" style="background-color:${C.page}">
<tr><td align="center" style="padding:26px 12px">
<table role="presentation" width="${L.emailWidth}" cellpadding="0" cellspacing="0" border="0" style="width:${L.emailWidth}px;max-width:100%;background-color:${C.white};border-radius:${L.radiusOuter}px;overflow:hidden">

  <tr><td bgcolor="${C.ink}" align="center" style="background-color:${C.ink};padding:26px 32px">
    <div style="${F};font-weight:800;font-size:22px;line-height:1;color:${C.white};letter-spacing:-0.01em">${B.wordmark[0]}<span style="color:${C.cyan}">${B.wordmark[1]}</span>${B.wordmark[2]}</div>
    <div style="${F};font-weight:600;font-size:9px;line-height:1;color:${C.mute};letter-spacing:0.22em;padding-top:8px">${T.brand.productDescriptor}</div>
  </td></tr>

  ${pad(`<div style="${F};font-weight:700;font-size:10px;line-height:1;color:${C.link};letter-spacing:0.16em">${e.eyebrow}</div>`, 30)}
  ${pad(`<div style="${F};font-weight:700;font-size:27px;line-height:1.25;color:${C.ink};letter-spacing:-0.02em">${e.headline}</div>`, 14)}
  ${body}
  ${cardHtml(e.card)}
  ${heroHtml(e.hero)}
  ${pad(p(e.after), 18)}
  ${pad(`<a href="{{{RESUME_URL}}}" style="background-color:${C.cyan};color:${C.ink};${F};font-weight:700;font-size:15px;line-height:1;text-decoration:none;padding:${L.buttonPadding};border-radius:${L.radiusPill}px;display:inline-block">${e.cta}</a>`, 22, 4)}
  ${pad(`<div style="${F};font-weight:400;font-size:12px;line-height:1.6;color:${C.mute}">${e.ctaNote}</div>`, 12)}
  ${pad(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.tint}" style="background-color:${C.tint};border-radius:${L.radius}px"><tr><td style="padding:16px 20px">${p(e.ps, "font-size:14px;")}</td></tr></table>`, 26)}
  <tr><td style="height:30px;font-size:0;line-height:0">&nbsp;</td></tr>

  <tr><td bgcolor="${C.ink}" style="background-color:${C.ink};padding:26px 32px">
    <div style="${F};font-weight:700;font-size:13px;line-height:1.5;color:${C.white};padding-bottom:4px">Stuck on the payment step?</div>
    <div style="${F};font-weight:400;font-size:13px;line-height:1.6;color:${C.inkMuted}">Call Budco Financial Services, who run the 0% plan, at <a href="tel:1${P.budcoPayments.replace(/-/g,"")}" style="color:${C.cyan};text-decoration:none;font-weight:700">${P.budcoPayments}</a>. Coverage or claims questions go to Ascent, the administrator, at <a href="tel:1${P.ascentClaims.replace(/-/g,"")}" style="color:${C.cyan};text-decoration:none;font-weight:700">${P.ascentClaims}</a>. Neither will sell you anything.</div>
  </td></tr>
  <tr><td bgcolor="${C.page}" style="background-color:${C.page};padding:22px 32px 30px">
    <div style="${F};font-weight:400;font-size:11px;line-height:1.65;color:${C.mute}">${FOOTER_LEGAL}</div>
    <div style="${F};font-weight:400;font-size:11px;line-height:1.65;color:${C.mute};padding-top:12px">${ADDRESS}</div>
    <div style="${F};font-weight:400;font-size:11px;line-height:1.65;color:${C.mute};padding-top:10px"><a href="https://www.driveonedirect.com/privacy" style="color:${C.mute}">Privacy</a> &middot; <a href="https://www.driveonedirect.com/terms" style="color:${C.mute}">Terms</a> &middot; <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:${C.mute}">Unsubscribe</a></div>
    <div style="${F};font-weight:400;font-size:11px;line-height:1.65;color:${C.mute};padding-top:10px">Contract {{{CONTRACT}}} &middot; Reference {{{REF}}}</div>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

const strip = (s) => s.replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, "").replace(/&rarr;/g, "->").replace(/&times;/g, "x").replace(/&middot;/g, "-").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

function text(e) {
  const lines = [strip(e.headline), "", ...e.body.map(strip), ""];
  if (e.card) { lines.push(strip(e.card.title)); e.card.rows.forEach(([k, v]) => lines.push(`${strip(k)}: ${strip(v)}`)); lines.push(""); }
  lines.push(`${strip(e.hero.label)}: ${strip(e.hero.big)}, ${strip(e.hero.sub)}. ${strip(e.hero.fine)}`, "", strip(e.after), "", `${strip(e.cta)} {{{RESUME_URL}}}`, strip(e.ctaNote), "", strip(e.ps), "", `Stuck on the payment step? Budco Financial Services: ${P.budcoPayments}. Coverage or claims: Ascent, ${P.ascentClaims}.`, "", "---", strip(FOOTER_LEGAL), "", strip(ADDRESS), "Contract {{{CONTRACT}}} - Reference {{{REF}}}", "Unsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}");
  return lines.join("\n");
}

const manifest = { campaign: deck.campaign, emails: [] };
for (const e of deck.emails) {
  lint(e);
  const h = html(e);
  writeFileSync(join(out, `${e.slug}.html`), h);
  writeFileSync(join(out, `${e.slug}.txt`), text(e));
  manifest.emails.push({ step: e.step, sendDay: e.sendDay, delayFromPrevious: e.delayFromPrevious, slug: e.slug, alias: `dod-payment-e${String(e.step).padStart(2, "0")}`, name: `DOD Payment E${e.step} - ${strip(e.subject).slice(0, 36)}`, subject: e.subject, subjectAlt: e.subjectAlt, preheader: e.preheader, goal: e.goal, bytes: Buffer.byteLength(h) });
}
writeFileSync(join(out, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Built ${deck.emails.length} emails -> ${out}`);

// Brand guard: the product is "DriveOne Direct". Never "DriveOne" or "Drive One" alone in copy.
for (const e of deck.emails) {
  const t = JSON.stringify(e);
  if (/Drive ?One(?! ?Direct)(?!direct)/.test(t)) throw new Error(`Email ${e.step}: brand must read "DriveOne Direct"`);
}
