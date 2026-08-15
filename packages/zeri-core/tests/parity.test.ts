/**
 * Cross-language parity: TypeScript port vs the original Python engine.
 *
 * `fixtures-python.json` is generated with `lunar-python`, the calendar library the
 * production service runs on, over 320 days spanning three ranges (200 days of 2026,
 * 60 of spring 2027, 60 of autumn 2025) so year boundaries and leap months are covered.
 *
 * The TypeScript side reaches the same facts through `tyme4ts` — a different library by
 * the same author. That makes this test the important one for this package: it is not
 * checking a re-implementation of arithmetic, it is checking that **two independent
 * almanac libraries agree**, day for day, on 宜/忌, 日干支, 冲生肖, 煞方 and auspicious
 * hours. If they ever diverge, 择日 results would quietly stop matching the live site.
 *
 * One known, harmless difference is normalised below: where a day has nothing to avoid,
 * lunar-python reports `["无"]` and tyme4ts reports `[]`. Both mean "nothing", and
 * neither matches any event keyword, so the verdict is unaffected either way.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDay, EVENT_YI, ZERI_EVENTS } from '../src/index.js';

interface Fixture {
  yi: string[];
  ji: string[];
  gz: string;
  chong_sx: string;
  sha: string;
  good_hours: string[];
  yi_events: string[];
  ji_events: string[];
}

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(readFileSync(join(here, 'fixtures-python.json'), 'utf8')) as Record<
  string,
  Fixture
>;

/** "nothing to avoid" is `["无"]` in lunar-python and `[]` in tyme4ts. */
function normaliseEmpty(list: string[]): string[] {
  return list.length === 1 && list[0] === '无' ? [] : list;
}

const mismatches: string[] = [];
let compared = 0;
let emptyNormalised = 0;

for (const [dateStr, want] of Object.entries(fixtures)) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const got = getDay(y, m, d);
  compared++;

  const wantYi = normaliseEmpty(want.yi);
  const wantJi = normaliseEmpty(want.ji);
  if (wantYi.length !== want.yi.length || wantJi.length !== want.ji.length) emptyNormalised++;

  const cmp: Array<[string, unknown, unknown]> = [
    ['宜', got.宜, wantYi],
    ['忌', got.忌, wantJi],
    ['日干支', got.干支.日, want.gz],
    ['冲生肖', got.冲.生肖, want.chong_sx],
    ['煞方', got.冲.煞方, want.sha],
    ['吉时', got.吉时, want.good_hours],
    ['日期', got.日期, dateStr],
  ];

  for (const [field, a, b] of cmp) {
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      mismatches.push(`${dateStr}.${field}: TS=${JSON.stringify(a)} Python=${JSON.stringify(b)}`);
    }
  }

  // The derived layer that 择日 actually acts on: which of the 7 categories this day
  // suits and which it avoids.
  const gotYiEvents = ZERI_EVENTS.filter((ev) => EVENT_YI[ev].some((k) => got.宜.includes(k)));
  const gotJiEvents = ZERI_EVENTS.filter((ev) => EVENT_YI[ev].some((k) => got.忌.includes(k)));
  if (JSON.stringify(gotYiEvents) !== JSON.stringify(want.yi_events)) {
    mismatches.push(`${dateStr}.宜事项: TS=${gotYiEvents} Python=${want.yi_events}`);
  }
  if (JSON.stringify(gotJiEvents) !== JSON.stringify(want.ji_events)) {
    mismatches.push(`${dateStr}.忌事项: TS=${gotJiEvents} Python=${want.ji_events}`);
  }
}

if (mismatches.length) {
  console.error(`\n${mismatches.length} mismatches across ${compared} days:`);
  for (const m of mismatches.slice(0, 40)) console.error('  ✗ ' + m);
  if (mismatches.length > 40) console.error(`  … and ${mismatches.length - 40} more`);
  process.exit(1);
}

assert.equal(compared, Object.keys(fixtures).length);
console.log(
  `✓ parity: ${compared} days — 宜/忌, 日干支, 冲生肖, 煞方, 吉时 and the derived event lists ` +
    `all identical between tyme4ts and lunar-python.`,
);
console.log(`  (${emptyNormalised} days had an empty 忌 list reported as ["无"] by lunar-python)`);
