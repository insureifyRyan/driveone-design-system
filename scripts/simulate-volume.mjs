#!/usr/bin/env node
/**
 * Daily send volume for a dealership's cohort, against its own daily cap.
 *
 *   node scripts/simulate-volume.mjs <dealer> [intakePerDay ...]
 *
 * Reads cohort, cap and send days from brand/dealers/<dealer>.json, and the
 * cadence from the copy deck, so it cannot disagree with what actually ships.
 * It was previously hardcoded to one rooftop's numbers, which made it quietly
 * wrong for every other one.
 *
 * Total sends are cohort x steps however slowly people are fed in. Intake rate
 * does not change the total, only the shape, and the shape is what the daily cap
 * and a domain's sending history actually care about.
 */
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

const DEALER_ID = process.argv.slice(2).find((a) => !a.startsWith('-') && !/^\d+$/.test(a)) || 'bob-johnson';
const D = read(`brand/dealers/${DEALER_ID}.json`);
const DECK = read('email/copy/campaign.json');

const CADENCE = DECK.emails.map((e) => e.sendDay);
const CAP = D.sending.dailyCap;
const SEND_DAYS = D.sending.days;
const COHORT = D.supabase.initial_cohort;

const rates = process.argv.slice(2).filter((a) => /^\d+$/.test(a)).map(Number);
const INTAKE_RATES = rates.length ? rates : [COHORT, 60, 40, 30, 20, 10];

const key = (d) => d.toISOString().slice(0, 10);

// Each person keeps their own preferred weekday rather than slipping forward to
// the next allowed one. Slipping forward pins everybody onto the same day and
// collapses distinct gaps onto one occurrence; see the cadence note in the
// dealer file's sending block.
function run(intakePerDay, total) {
  const SEND = new Set(SEND_DAYS);
  const allowed = [...SEND].sort();
  const perDay = new Map();
  let d = new Date('2026-10-06T14:00:00Z'), assigned = 0;
  const people = [];
  while (assigned < total) {
    while (!SEND.has(d.getUTCDay())) d.setUTCDate(d.getUTCDate() + 1);
    const n = Math.min(intakePerDay, total - assigned);
    for (let i = 0; i < n; i++) people.push({ start: new Date(d), id: 'p' + (assigned + i) });
    assigned += n;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  for (const p of people) {
    const pref = allowed[parseInt(crypto.createHash('md5').update(p.id).digest('hex').slice(0, 4), 16) % allowed.length];
    for (const off of CADENCE) {
      const due = new Date(p.start);
      due.setUTCDate(due.getUTCDate() + off);
      while (due.getUTCDay() !== pref) due.setUTCDate(due.getUTCDate() + 1);
      const k = key(due);
      perDay.set(k, (perDay.get(k) || 0) + 1);
    }
  }
  const days = [...perDay.entries()].sort();
  return { days, peak: Math.max(...days.map(([, n]) => n)) };
}

console.log(`\n${D.dealer.displayName}  cohort ${COHORT}  cap ${CAP}/day  ` +
  `send days ${SEND_DAYS.join(',')}  ${CADENCE.length} steps  = ${COHORT * CADENCE.length} sends total\n`);
console.log('  intake/day   peak/day          first 10 send days');
console.log('  ' + '-'.repeat(88));
for (const r of INTAKE_RATES) {
  const { days, peak } = run(r, COHORT);
  const flag = peak > CAP ? 'OVER CAP' : '  ok    ';
  console.log(
    '  ' + String(r === COHORT ? `${r} (all at once)` : r).padEnd(13) +
    String(peak).padStart(5) + '  ' + flag + '  ' +
    days.slice(0, 10).map(([dd, n]) => dd.slice(5) + ':' + n).join(' ')
  );
}
console.log(`\n  Peak is what the cap and a cold sending path see. Lowering intake per day\n` +
  `  lowers the peak without changing the ${COHORT * CADENCE.length} total sends.\n`);
