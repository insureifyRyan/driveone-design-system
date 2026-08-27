/**
 * Verify the ad destination still works.
 *
 *   node --experimental-strip-types scripts/check-links.mts
 *
 * Checks the bare quote URL and every per-frame UTM variant built from
 * ads/frames.json, skipping the Reels cuts, which carry no CTA. Exits non-zero
 * if any of them fails, so CI goes red.
 *
 * This exists because the creatives are static images: the destination lives in
 * Meta's Ads Manager, not in anything this repo deploys. If driveonedirect.com
 * moves its quote route or starts dropping query params, nothing here breaks.
 * The ads just quietly stop converting, or stop being attributable, and nobody
 * finds out until someone reads a report.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { DESTINATION, UTM } from '../src/lib/destination.ts';

const ROOT = resolve(import.meta.dirname, '..');
const BASE = process.env.DESTINATION_URL ?? DESTINATION;
const TIMEOUT_MS = 20_000;

interface Frame { id: string; cta: boolean }

const frames: Frame[] = JSON.parse(readFileSync(join(ROOT, 'ads', 'frames.json'), 'utf8'));

function adUrl(frameId: string): string {
  const url = new URL(BASE);
  url.searchParams.set('utm_source', UTM.source);
  url.searchParams.set('utm_medium', UTM.medium);
  url.searchParams.set('utm_campaign', UTM.campaign);
  url.searchParams.set('utm_content', frameId);
  return url.toString();
}

interface Result { label: string; url: string; ok: boolean; detail: string }

async function check(label: string, url: string): Promise<Result> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { redirect: 'follow', signal: controller.signal });
    return {
      label,
      url,
      ok: response.ok,
      detail: `${response.status}${response.redirected ? ` (redirected to ${response.url})` : ''}`,
    };
  } catch (error) {
    return { label, url, ok: false, detail: `request failed: ${String(error)}` };
  } finally {
    clearTimeout(timer);
  }
}

const results: Result[] = [await check('base', BASE)];
for (const frame of frames.filter((f) => f.cta !== false)) {
  results.push(await check(frame.id, adUrl(frame.id)));
}

for (const r of results) {
  console.log(`${r.ok ? 'ok  ' : 'FAIL'}  ${r.label.padEnd(5)}  ${r.detail}`);
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} reachable`);

if (failed.length) {
  console.error(`\n${failed.length} destination(s) unreachable:`);
  for (const r of failed) console.error(`  ${r.label}: ${r.url}\n    ${r.detail}`);
  process.exit(1);
}
