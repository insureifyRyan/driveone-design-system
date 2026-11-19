// Builds cover.html from the live page numbers at a given markup (argv[2]) and prints the three PDFs.
const { chromium } = require('playwright');
const fs = require('fs');
const MARKUP = Number(process.argv[2] || 5);
const PRINT_CSS = `
  body { background: #fff !important; }
  .wrap { max-width: none !important; padding: 0 !important; gap: 12px !important; }
  .rules .markup:not(#markupBox), .rules .actions, .rules h2:first-of-type { display: none !important; }
  .cell input, table.tiers .num { border: none !important; background: transparent !important; outline: none !important; }
  .cell input::placeholder { opacity: 1 !important; color: #1a2233 !important; }
  .cell input.override { border: none !important; }
  .tablewrap { overflow: visible !important; break-inside: avoid; page-break-inside: avoid; }
  table.sched { min-width: 0 !important; font-size: 12px !important; }
  table.tiers { min-width: 0 !important; }
  .sheet { border: none !important; padding: 0 !important; }
  .chip { display: none !important; }
  .scenario { background: #1d6fd6; color: #fff; font: 700 14px Inter, sans-serif; padding: 8px 12px; border-radius: 6px; }
  .summary .stat { break-inside: avoid; }
`;
const money = n => '$' + n.toFixed(2);
const num = s => parseFloat(String(s).replace(/[^0-9.\-]/g, '')) || 0;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  await p.goto('file://' + process.cwd() + '/preview.html');
  await p.waitForTimeout(1000);
  const setMode = id => p.evaluate(id => { const r = document.getElementById(id); r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }, id);
  await p.evaluate(v => { const i = document.getElementById('markup'); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); }, MARKUP);
  await setMode('modeMarkup');
  await p.waitForTimeout(300);

  const read = () => p.evaluate(() => {
    const g = id => document.getElementById(id).textContent.trim();
    const rows = [...document.querySelectorAll('tr[data-id]')].map(tr => ({
      id: tr.dataset.id,
      prog: tr.querySelector('.prog').textContent.trim(),
      fee: parseFloat(tr.querySelector('td.fee').textContent.replace('$', '')),
      ws: parseFloat(tr.querySelector('[data-row="ws"]').textContent.replace('$', '')),
      pays: [...tr.querySelectorAll('td.pay input')].map(i => parseFloat((i.value || i.placeholder).replace('$', '')) || 0),
    }));
    return { rows, pct: g('statPct'), fee: g('statFee'), dealer: g('statDealer'), paid: g('statPaid'), net: g('statNet') };
  });
  const A = await read();
  await setMode('modeCost'); await p.waitForTimeout(300);
  const B = await read();

  const tiers = {};
  A.rows.forEach(r => {
    const k = r.id === 'pca-27' ? 'pca-27' : String(r.fee);
    if (!tiers[k]) tiers[k] = { fee: r.fee, ws: r.ws, pays: r.pays, label: r.id === 'pca-27' ? 'Pref. Care Adv. 2-7 Yr (exception)' : money(r.fee) };
  });
  const keys = Object.keys(tiers).filter(k => k !== 'pca-27').map(Number).sort((a, b) => a - b).map(String).concat(['pca-27']);
  const tierRows = keys.map(k => {
    const t = tiers[k]; const tot = t.pays.reduce((a, c) => a + c, 0); const netA = t.ws - tot;
    return '<tr><td' + (k === 'pca-27' ? ' style="font-size:11.5px"' : '') + '>' + t.label + '</td><td>$' + t.pays[0] + '</td><td>$' + t.pays[1] + '</td><td>$' + t.pays[2] + '</td><td>$' + tot + '</td><td class="a">' + money(t.ws) + '</td><td' + (netA < 0 ? ' style="color:#b45309"' : '') + '>' + money(netA) + '</td><td>+' + money(tot) + '</td><td>' + money(t.fee) + '</td></tr>';
  }).join('\n');

  const wasPct = (num(A.paid) / num(B.fee) * 100).toFixed(1) + '%';
  const negs = A.rows.filter(r => r.ws - r.pays.reduce((a, c) => a + c, 0) < 0).map(r => r.prog);
  let cover = fs.readFileSync('cover.template.html', 'utf8');
  const rep = (k, v) => { cover = cover.split('{{' + k + '}}').join(v); };
  rep('MARKUP', '$' + MARKUP); rep('TIER_ROWS', tierRows);
  rep('A_FEE', A.fee); rep('B_FEE', B.fee); rep('A_DEALER', A.dealer); rep('B_DEALER', B.dealer);
  rep('A_PAID', A.paid); rep('B_PAID', B.paid); rep('A_NET', A.net); rep('B_NET', B.net);
  rep('A_PCT', A.pct); rep('WAS_PCT', wasPct);
  rep('NEG_NOTE', negs.length ? '<li>Note: ' + negs.join(', ') + ' pays out more than its WS fee, so WS nets a loss on that product under this scenario.</li>' : '');
  rep('DATE', new Date().toLocaleDateString('en-US'));
  fs.writeFileSync('cover.html', cover);
  console.log('A: fee ' + A.fee + ' dealer ' + A.dealer + ' paid ' + A.paid + ' net ' + A.net + ' pct ' + A.pct + ' | B: fee ' + B.fee + ' dealer ' + B.dealer + ' net ' + B.net + ' | was ' + wasPct);

  const opts = { format: 'Letter', landscape: true, printBackground: true, margin: { top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in' }, scale: 0.72 };
  const banner = txt => p.evaluate(t => { let el = document.getElementById('scenarioBanner'); if (!el) { el = document.createElement('div'); el.id = 'scenarioBanner'; el.className = 'scenario'; document.querySelector('.rules').prepend(el); } el.textContent = t; }, txt);
  await p.addStyleTag({ content: PRINT_CSS });
  await setMode('modeMarkup'); await p.waitForTimeout(300);
  await banner('Scenario A · Markup on the WS fee: every product +$' + MARKUP + ', commissions paid from the new fee');
  await p.pdf({ ...opts, path: 'p1-markup.pdf' });
  await setMode('modeCost'); await p.waitForTimeout(300);
  await banner('Scenario B · Commission added to product cost: WS fee stays at the Vantage amount');
  await p.pdf({ ...opts, path: 'p2-cost.pdf' });
  await p.goto('file://' + process.cwd() + '/cover.html'); await p.waitForTimeout(400);
  await p.pdf({ ...opts, scale: 0.84, path: 'p0-cover.pdf' });
  await b.close();
})();
