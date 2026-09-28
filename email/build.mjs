#!/usr/bin/env node
/**
 * DriveOne co-branded email builder.
 *
 * Reads brand tokens + dealer tokens + offer facts + copy deck, emits:
 *   email/dist/<slug>.html          merge tags intact, ready for n8n / any ESP
 *   preview/filled/<slug>.html      sample data filled in, for client review
 *   preview/index.html              gallery
 *   email/dist/manifest.json        machine readable index for n8n
 *
 * No dependencies. Node 18+.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

const DEALER_ID = process.argv[2] || 'bob-johnson';
const T = read('brand/driveone.tokens.json');
const D = read(`brand/dealers/${DEALER_ID}.json`);
const OFFER = read('brand/offer.json');
const DECK = read('email/copy/campaign.json');

// The form names a different Administrator/Obligor in NY, CA and FL. Resolve it
// from the dealer's state so the footer is correct per dealership, not per brand.
const OBLIGOR = (OFFER.obligor_by_state && OFFER.obligor_by_state[D.dealer.state]) || OFFER.administrator_default;

const C = { ...T.color, ...D.color };

// Co-brand balance. On a dealership send the dealer's colour should carry the
// layout and DriveOne should read as the provider, not the sender. When
// brandLead.mode is "dealer" every structural accent resolves to their gold and
// DriveOne cyan is kept for the provider lockup alone.
const DEALER_LED = (D.brandLead && D.brandLead.mode) === 'dealer';
const A = {
  accent:     DEALER_LED ? C.accent      : C.cyan,
  accentDark: DEALER_LED ? C.accentDark  : C.cyanDark,
  onAccent:   DEALER_LED ? C.onAccent    : C.ink,
  soft:       DEALER_LED ? C.primarySoft : C.cyanSoft,
  ground:     DEALER_LED ? C.primary     : C.ink,
};
const F = T.font;
const W = T.layout.emailWidth;
const GUT = T.layout.gutter;

/* ---------------------------------------------------------------- helpers */

const esc = (s) => String(s).replace(/&(?![a-z#0-9]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Turn [[phrase]] into a cyan accent span. */
const accent = (s) =>
  esc(s).replace(/\[\[(.+?)\]\]/g, `<span style="color:${A.accent};">$1</span>`);

/** Defaults injected for every {{tag}} that the ESP does not own. */
const OFFER_TAGS = {
  administrator: OBLIGOR,
  deductible_home: OFFER.deductible_home,
  deductible_away: OFFER.deductible_away,
  price_from: OFFER.price_from,
  rental_rate: OFFER.rental_rate,
  rental_max: OFFER.rental_max,
  dealer_name: D.dealer.displayName,
  dealer_short: D.dealer.shortName,
  service_area: D.dealer.serviceArea,
};

/** Recipient level tags. These stay as {{tags}} in dist and get sample values in preview. */
const SAMPLE = {
  first_name: 'Dana',
  vehicle_year: '2021',
  vehicle_make: 'Chevrolet',
  vehicle_model: 'Equinox',
  vehicle_mileage: '61,400',
  monthly_payment: '$66.47',
  coverage_label: '60 more months, 75,000 more miles',
  down_payment: '$110.35',
  last_ro_date: 'September 19',
  advisor_name: 'Marcus',
  quote_url: `${D.campaign.quoteUrlBase}?${D.campaign.utm}`,
  unsubscribe_url: '#unsubscribe',
  preferences_url: '#preferences',
};

/** Resolve offer tags always; recipient tags only when filling a preview. */
function resolve(str, fill) {
  let out = String(str);
  for (const [k, v] of Object.entries(OFFER_TAGS)) out = out.split(`{{${k}}}`).join(v);
  if (fill) for (const [k, v] of Object.entries(SAMPLE)) out = out.split(`{{${k}}}`).join(v);
  return out;
}

/* ------------------------------------------------------------- components */

const font = (family, size, weight, color, lh, extra = '') =>
  `font-family:${family};font-size:${size}px;font-weight:${weight};color:${color};line-height:${lh};${extra}`;

/** Hidden preheader plus whitespace padding so clients do not leak body copy into the preview line. */
const preheader = (text) => `
<div style="display:none;font-size:1px;color:${C.paper};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
${esc(text)}${'&#847;&zwnj;&nbsp;'.repeat(60)}
</div>`;

/** DriveOne lockup. Uses a hosted image when one is configured, otherwise a type lockup that survives images-off. */
function driveOneLockup(onDark) {
  const nameColor = onDark ? '#FFFFFF' : C.ink;
  if (T.logo && T.logo.url && !/REPLACE-ME/.test(T.logo.url)) {
    return `<img src="${T.logo.url}" width="${T.logo.widthPx || 120}" alt="DriveOne" style="display:block;border:0;outline:none;text-decoration:none;" />`;
  }
  return `
<span style="${font(F.display, 19, 800, nameColor, '1')}letter-spacing:-0.4px;">DriveOne</span>
<span style="${font(F.display, 19, 500, C.cyan, '1')}letter-spacing:-0.4px;">&nbsp;VSC</span>
<br />
<span style="${font(F.body, 8, 600, onDark ? 'rgba(255,255,255,0.62)' : C.mutedText, '1.6')}letter-spacing:1.6px;">${esc(T.brand.productDescriptor)}</span>`;
}

/** Dealer logo. Alt text is styled so images-off still reads as the dealership. */
function dealerLogo() {
  const wm = D.logo.wordmark || {};
  // Only use a hosted image when it has been explicitly vouched for. An image we
  // cannot inspect is a worse logo than type we control, and type also renders
  // when the client blocks images.
  if (D.logo.useImage && !/REPLACE-ME/.test(D.logo.light || '')) {
    return `<img src="${D.logo.light}" width="${D.logo.widthPx}" alt="${esc(D.logo.altText)}" style="display:block;border:0;outline:none;text-decoration:none;${font(F.display, 16, 800, C.primary, '1.2')}" />`;
  }
  const W1 = D.logo.widthPx || 190;
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${W1}" style="width:${W1}px;">
  <tr><td style="padding:0;${font(F.display, 25, 800, C.primary, '1.02')}letter-spacing:-0.9px;font-style:italic;white-space:nowrap;">
    ${esc(wm.line1 || D.dealer.displayName)}
  </td></tr>
  <tr><td style="padding:3px 0 0 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td width="26%" style="width:26%;height:4px;line-height:4px;font-size:4px;background-color:${wm.ruleColor || C.accent};">&nbsp;</td>
      <td width="4%"  style="width:4%;height:4px;line-height:4px;font-size:4px;background-color:${C.white};">&nbsp;</td>
      <td style="height:4px;line-height:4px;font-size:4px;background-color:${wm.ruleColor || C.accent};">&nbsp;</td>
    </tr></table>
  </td></tr>
  ${wm.line2 ? `<tr><td align="right" style="padding:4px 0 0 0;${font(F.display, 10, 700, C.primary, '1.2')}letter-spacing:4px;white-space:nowrap;">${esc(wm.line2)}</td></tr>` : ''}
</table>`;
}

/** Co-brand bar: dealership owns the relationship, DriveOne provides the product. */
const header = () => `
<tr>
<td style="padding:22px ${GUT}px 18px ${GUT}px;background-color:${C.white};border-bottom:1px solid ${C.rule};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td align="left" valign="middle">${dealerLogo()}</td>
    <td align="right" valign="middle" style="${font(F.body, 9, 600, C.mutedText, '1.5')}letter-spacing:1.1px;text-transform:uppercase;">
      Coverage by<br />
      <span style="${font(F.display, 13, 800, C.ink, '1.3')}letter-spacing:-0.2px;text-transform:none;">DriveOne<span style="color:${C.cyan};"> VSC</span></span>
    </td>
  </tr></table>
</td>
</tr>`;

/** Dark hero with a cyan rule standing in for the bloom. Gradients do not render in Outlook, a solid ground does. */
const hero = (e) => `
<tr>
<td style="padding:0;background-color:${A.ground};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="height:4px;line-height:4px;font-size:4px;background-color:${A.accent};">&nbsp;</td></tr>
    <tr><td style="padding:${GUT}px ${GUT}px 30px ${GUT}px;">
      <p style="margin:0 0 14px 0;${font(F.body, 10, 700, A.accent, '1.5')}letter-spacing:2px;">${esc(e.eyebrow)}</p>
      <h1 style="margin:0 0 14px 0;${font(F.display, 32, 800, '#FFFFFF', '1.14')}letter-spacing:-0.9px;">${accent(e.headline)}</h1>
      <p style="margin:0;${font(F.body, 16, 400, 'rgba(255,255,255,0.74)', '1.55')}">${esc(e.subhead)}</p>
    </td></tr>
  </table>
</td>
</tr>`;

/** The RO personalization card. This is the thing a generic VSC blast cannot do. */

/** Bulletproof purchase button. VML for Outlook, padded anchor everywhere else. */
function buyButton(label, widthPx) {
  const href = '{{quote_url}}';
  const safe = esc(label);
  return `
  <!--[if mso]>
  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
    href="${href}" style="height:54px;v-text-anchor:middle;width:${widthPx}px;" arcsize="24%" stroke="f" fillcolor="${A.accent}">
    <w:anchorlock/>
    <center style="color:${A.onAccent};font-family:Arial,sans-serif;font-size:17px;font-weight:bold;">${safe}</center>
  </v:roundrect>
  <![endif]-->
  <!--[if !mso]><!-- -->
  <a href="${href}" style="display:block;background-color:${A.accent};border-radius:${T.layout.radius}px;padding:18px 22px;text-align:center;text-decoration:none;${font(F.display, 17, 800, A.onAccent, '1.2')}letter-spacing:-0.2px;">${safe}</a>
  <!--<![endif]-->`;
}

/** Reassurance row under a purchase button. Every claim is contract backed:
 *  the 30 day full refund is in the cancellation section, no credit check and the
 *  0% plan are confirmed offer terms. It says payment plan rather than APR on
 *  purpose, because this is not a loan and must never be described as one. */
const trustRow = () => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
  <td align="center" style="padding:10px 0 0 0;${font(F.body, 11, 500, C.mutedText, '1.6')}">
    Secure checkout &nbsp;&middot;&nbsp; 0% payment plan &nbsp;&middot;&nbsp; No credit check &nbsp;&middot;&nbsp; 30 day money back
  </td>
</tr></table>`;

/** Product card: what they own, what it costs, and the way to buy it. */
const vehicleCard = () => `
<tr>
<td style="padding:26px ${GUT}px 0 ${GUT}px;background-color:${C.white};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.white};border:1px solid ${C.rule};border-radius:${T.layout.radius}px;">

    <tr><td style="padding:18px 20px 14px 20px;background-color:${A.soft};border-radius:${T.layout.radius}px ${T.layout.radius}px 0 0;">
      <p style="margin:0 0 6px 0;${font(F.body, 9, 700, A.accentDark, '1.5')}letter-spacing:1.6px;">DRIVEONE VSC &middot; PLATINUM COVERAGE</p>
      <p style="margin:0 0 3px 0;${font(F.display, 17, 800, C.ink, '1.3')}letter-spacing:-0.3px;">{{vehicle_year}} {{vehicle_make}} {{vehicle_model}}</p>
      <p style="margin:0;${font(F.body, 13, 400, C.bodyText, '1.6')}">Serviced {{last_ro_date}} &nbsp;&middot;&nbsp; {{vehicle_mileage}} miles on the clock</p>
    </td></tr>

    <tr><td style="padding:16px 20px 0 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="left" style="padding:0 0 8px 0;${font(F.body, 14, 400, C.bodyText, '1.5')}">Coverage added</td>
          <td align="right" style="padding:0 0 8px 0;${font(F.display, 14, 700, C.ink, '1.5')}">{{coverage_label}}</td>
        </tr>
        <tr>
          <td align="left" style="padding:0 0 8px 0;${font(F.body, 14, 400, C.bodyText, '1.5')}">Due today</td>
          <td align="right" style="padding:0 0 8px 0;${font(F.display, 14, 700, C.ink, '1.5')}">{{down_payment}}</td>
        </tr>
        <tr><td colspan="2" style="padding:6px 0 0 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="height:1px;line-height:1px;font-size:1px;background-color:${C.rule};">&nbsp;</td>
          </tr></table>
        </td></tr>
        <tr>
          <td align="left" valign="bottom" style="padding:12px 0 0 0;${font(F.display, 15, 800, C.ink, '1.4')}letter-spacing:-0.2px;">Then monthly</td>
          <td align="right" valign="bottom" style="padding:12px 0 0 0;white-space:nowrap;">
            <span style="${font(F.display, 32, 800, C.ink, '1')}letter-spacing:-1.3px;">{{monthly_payment}}</span><span style="${font(F.body, 14, 600, C.mutedText, '1')}">&nbsp;/mo</span>
          </td>
        </tr>
      </table>
    </td></tr>

    <tr><td style="padding:18px 20px 20px 20px;">
      ${buyButton('Buy now', W - GUT * 2 - 42)}
      ${trustRow()}
    </td></tr>
  </table>
</td>
</tr>`;

const bodyCopy = (e) => `
<tr>
<td style="padding:26px ${GUT}px 4px ${GUT}px;background-color:${C.white};">
  ${e.body.map((p) => `<p style="margin:0 0 16px 0;${font(F.body, 16, 400, C.bodyText, '1.62')}">${esc(p)}</p>`).join('\n  ')}
</td>
</tr>`;

/** Circular cyan outline icon + title + subtitle, hairline separated. Outlook squares the circle, which is acceptable. */
const featureRows = (e) => `
<tr>
<td style="padding:10px ${GUT}px 4px ${GUT}px;background-color:${C.white};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  ${e.featureRows.map((r, i) => `
    <tr><td style="padding:16px 0 16px 0;${i ? `border-top:1px solid ${C.rule};` : ''}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="44" valign="top" style="width:44px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="34" style="width:34px;border:2px solid ${A.accent};border-radius:17px;">
            <tr><td align="center" valign="middle" height="30" style="height:30px;${font(F.display, 14, 800, A.accentDark, '30px')}">${esc(r.icon)}</td></tr>
          </table>
        </td>
        <td valign="top">
          <p style="margin:0 0 3px 0;${font(F.display, 15, 700, C.ink, '1.4')}letter-spacing:-0.2px;">${esc(r.title)}</p>
          <p style="margin:0;${font(F.body, 14, 400, C.mutedText, '1.5')}">${esc(r.subtitle)}</p>
        </td>
      </tr></table>
    </td></tr>`).join('')}
  </table>
</td>
</tr>`;

/** Bulletproof CTA. VML for Outlook, padded anchor everywhere else. */
function cta(e) {
  return `
<tr>
<td align="center" style="padding:22px ${GUT}px 6px ${GUT}px;background-color:${C.white};">
  ${buyButton(resolve(e.cta.label, false), W - GUT * 2)}
  ${trustRow()}
</td>
</tr>`;
}

const benefitStrip = (e) => `
<tr>
<td style="padding:16px ${GUT}px 0 ${GUT}px;background-color:${C.white};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left:3px solid ${A.accent};">
    <tr><td style="padding:2px 0 2px 14px;${font(F.body, 14, 500, C.bodyText, '1.55')}">${esc(e.benefitStrip)}</td></tr>
  </table>
</td>
</tr>`;

const ps = (e) => !e.ps ? '' : `
<tr>
<td style="padding:22px ${GUT}px 30px ${GUT}px;background-color:${C.white};">
  <p style="margin:0;${font(F.body, 14, 400, C.mutedText, '1.6')}"><span style="font-weight:700;color:${C.ink};">P.S.</span> ${esc(e.ps)}</p>
</td>
</tr>`;

/** Dealer accent bar keeps the dealership visually in control of the send. */
const dealerBar = () => `
<tr>
<td style="padding:0;background-color:${C.primary};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="height:3px;line-height:3px;font-size:3px;background-color:${C.accent};">&nbsp;</td></tr>
    <tr><td align="center" style="padding:18px ${GUT}px;">
      <p style="margin:0 0 4px 0;${font(F.display, 15, 800, C.onPrimary, '1.4')}letter-spacing:-0.2px;">${esc(D.dealer.displayName)}</p>
      <p style="margin:0;${font(F.body, 13, 400, 'rgba(255,255,255,0.78)', '1.6')}">${esc(D.contact.addressLine1)} &nbsp;&middot;&nbsp; ${esc(D.contact.addressLine2)}<br />Service: ${esc(D.contact.servicePhone)}</p>
    </td></tr>
  </table>
</td>
</tr>`;

const footer = () => `
<tr>
<td style="padding:24px ${GUT}px 34px ${GUT}px;background-color:${C.paper};">
  <p style="margin:0 0 12px 0;${font(F.body, 11, 400, C.legalText, '1.65')}">
    You are receiving this because you have serviced a vehicle with ${esc(D.dealer.displayName)}. This message is about vehicle service contract coverage offered through ${esc(D.dealer.displayName)} and provided by DriveOne.
  </p>
  <p style="margin:0 0 12px 0;${font(F.body, 11, 400, C.legalText, '1.65')}">
    A vehicle service contract is not an insurance policy and is not a manufacturer warranty. Coverage, exclusions, deductible, eligibility and cancellation terms are governed entirely by your contract. Administrator and obligor: ${esc(OBLIGOR)}. Coverage is not available in all states and is not sold in California. Pricing varies by vehicle, mileage, coverage tier and term. Payment plan is not a loan and involves no credit check.
  </p>
  <p style="margin:0;${font(F.body, 11, 400, C.legalText, '1.65')}">
    ${esc(D.dealer.displayName)}, ${esc(D.contact.addressLine1)}, ${esc(D.contact.addressLine2)}<br />
    <a href="{{unsubscribe_url}}" style="color:${C.legalText};text-decoration:underline;">Unsubscribe from this series</a> &nbsp;&middot;&nbsp;
    <a href="{{preferences_url}}" style="color:${C.legalText};text-decoration:underline;">Email preferences</a>
  </p>
</td>
</tr>`;

/* ----------------------------------------------------------------- shell */

function render(e) {
  const title = `${D.dealer.displayName} | ${resolve(e.subject, false)}`;
  return `<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${esc(title)}</title>
<!--[if mso]>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
<style>table,td,div,h1,p{font-family:Arial,Helvetica,sans-serif !important;}</style>
<![endif]-->
<style>
  body{margin:0;padding:0;width:100% !important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table{border-collapse:collapse;}
  img{border:0;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;}
  a{text-decoration:none;}
  /* Force the intended palette in clients that auto invert. */
  :root{color-scheme:light;supported-color-schemes:light;}
  @media (max-width:620px){
    .wrap{width:100% !important;}
    .gut{padding-left:20px !important;padding-right:20px !important;}
    h1{font-size:26px !important;line-height:1.16 !important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${C.paper};">
${preheader(resolve(e.preheader, false))}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.paper};">
<tr><td align="center" style="padding:0;">
  <!--[if mso]><table role="presentation" width="${W}" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
  <table role="presentation" class="wrap" width="${W}" cellpadding="0" cellspacing="0" border="0" style="width:${W}px;max-width:${W}px;background-color:${C.white};">
    ${header()}
    ${hero(e)}
    ${vehicleCard()}
    ${bodyCopy(e)}
    ${featureRows(e)}
    ${cta(e)}
    ${benefitStrip(e)}
    ${ps(e)}
    ${dealerBar()}
    ${footer()}
  </table>
  <!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`;
}

/* ------------------------------------------------------------------ main */

rmSync(join(ROOT, 'email/dist'), { recursive: true, force: true });
rmSync(join(ROOT, 'preview/filled'), { recursive: true, force: true });
mkdirSync(join(ROOT, 'email/dist'), { recursive: true });
mkdirSync(join(ROOT, 'preview/filled'), { recursive: true });

const manifest = [];

for (const e of DECK.emails) {
  const raw = render(e);
  const dist = resolve(raw, false);          // offer tags baked, recipient tags intact
  const filled = resolve(raw, true);         // everything filled, for review

  writeFileSync(join(ROOT, `email/dist/${e.slug}.html`), dist);
  writeFileSync(join(ROOT, `preview/filled/${e.slug}.html`), filled);

  manifest.push({
    step: e.step,
    sendDay: e.sendDay,
    slug: e.slug,
    goal: e.goal,
    subject: resolve(e.subject, false),
    subjectAlt: resolve(e.subjectAlt, false),
    preheader: resolve(e.preheader, false),
    cta: resolve(e.cta.label, false),
    ctaPath: e.cta.path,
    file: `email/dist/${e.slug}.html`,
  });
}

writeFileSync(
  join(ROOT, 'email/dist/manifest.json'),
  JSON.stringify({ dealer: D.id, campaign: DECK.campaign.id, generated: new Date().toISOString().slice(0, 10), emails: manifest }, null, 2)
);

/* ------------------------------------------------------------- gallery */

const card = (m) => `
  <a class="card" href="filled/${m.slug}.html" target="_blank" rel="noopener">
    <div class="step">Email ${m.step}<span>Day ${m.sendDay}</span></div>
    <h3>${esc(m.subject)}</h3>
    <p class="pre">${esc(m.preheader)}</p>
    <p class="alt"><b>A/B:</b> ${esc(m.subjectAlt)}</p>
    <div class="cta">${esc(m.cta)}</div>
  </a>`;

writeFileSync(join(ROOT, 'preview/index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(D.dealer.displayName)} VSC Campaign</title>
<style>
  :root{--cyan:${C.cyan};--ink:${C.ink};--soft:${C.cyanSoft};--rule:${C.rule};--muted:${C.mutedText};--primary:${C.primary};--accent:${C.accent};--paper:${C.paper};}
  *{box-sizing:border-box;}
  body{margin:0;background:var(--paper);color:var(--ink);font-family:'Inter Tight','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;}
  header{background:var(--ink);color:#fff;padding:44px 28px 38px;border-top:4px solid var(--cyan);}
  .inner{max-width:1120px;margin:0 auto;}
  header h1{margin:0 0 10px;font-size:34px;letter-spacing:-1px;font-weight:800;}
  header h1 span{color:var(--cyan);}
  header p{margin:0;color:rgba(255,255,255,.7);font-size:16px;line-height:1.6;max-width:65ch;}
  .flag{margin:18px 0 0;padding:14px 16px;border-left:3px solid var(--accent);background:rgba(255,255,255,.06);border-radius:0 8px 8px 0;font-size:14px;line-height:1.6;color:rgba(255,255,255,.85);max-width:78ch;}
  main{padding:34px 28px 70px;}
  .grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));}
  .card{display:block;background:#fff;border:1px solid var(--rule);border-radius:14px;padding:20px;text-decoration:none;color:inherit;transition:.15s;}
  .card:hover{border-color:var(--cyan);transform:translateY(-2px);box-shadow:0 8px 24px rgba(14,27,44,.09);}
  .step{display:flex;justify-content:space-between;font-size:11px;font-weight:700;letter-spacing:1.4px;color:var(--cyan);text-transform:uppercase;margin-bottom:12px;}
  .step span{color:var(--muted);}
  .card h3{margin:0 0 8px;font-size:17px;line-height:1.35;letter-spacing:-.3px;font-weight:800;}
  .pre{margin:0 0 12px;font-size:13px;line-height:1.55;color:var(--muted);}
  .alt{margin:0 0 16px;font-size:12px;line-height:1.5;color:var(--muted);padding-top:12px;border-top:1px solid var(--rule);}
  .alt b{color:var(--ink);}
  .cta{display:inline-block;background:var(--soft);color:${C.cyanDark};font-size:12px;font-weight:700;padding:7px 12px;border-radius:8px;}
</style></head>
<body>
<header><div class="inner">
  <h1>${esc(D.dealer.displayName)} <span>&times;</span> DriveOne VSC</h1>
  <p>Post service "why buy now" campaign. Ten emails over 60 days to service customers with a recent closed repair order and no vehicle service contract on file.</p>
  <div class="flag"><b>Brand assets are placeholders.</b> The dealership site is blocked by this environment's network egress proxy, so no colors or logos were sampled from it. Drop the real values into <code>brand/dealers/bob-johnson.json</code> and rebuild. Nothing else needs to change.</div>
</div></header>
<main><div class="inner"><div class="grid">${manifest.map(card).join('')}</div></div></main>
</body></html>`);

console.log(`Built ${manifest.length} emails for "${D.dealer.displayName}"`);
console.log(`  email/dist/*.html      merge tags intact`);
console.log(`  preview/filled/*.html  sample data filled`);
console.log(`  preview/index.html     gallery`);
