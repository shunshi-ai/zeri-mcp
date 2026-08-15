/**
 * Unit tests for the 择日 engine.
 *
 * The parity suite already proves the almanac facts match the production engine. These
 * cover the selection logic layered on top: event resolution, the range scan and its
 * filters, and the verdict grading — especially the 馀事勿取 case, which is the one
 * place a verdict is graded rather than read straight off the almanac.
 */

import assert from 'node:assert/strict';
import {
  EVENT_YI,
  ZERI_EVENTS,
  checkDay,
  findGoodDays,
  findGoodDaysAhead,
  getDay,
  listEvents,
  resolveEvent,
} from '../src/index.js';

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('事项识别');
check('slugs pass through unchanged', () => {
  for (const e of listEvents()) assert.equal(resolveEvent(e), e);
});
check('common natural-language words resolve', () => {
  assert.equal(resolveEvent('结婚'), 'wedding');
  assert.equal(resolveEvent('领证'), 'wedding');
  assert.equal(resolveEvent('搬家'), 'moving');
  assert.equal(resolveEvent('乔迁'), 'moving');
  assert.equal(resolveEvent('开业'), 'opening');
  assert.equal(resolveEvent('签合同'), 'contract');
  assert.equal(resolveEvent('装修'), 'groundbreaking');
  assert.equal(resolveEvent('出差'), 'travel');
});
check('speculative activities map to 交易/纳财', () => {
  for (const w of ['炒股', '买彩票', '投资', '基金']) {
    assert.equal(resolveEvent(w), 'contract', `${w} should resolve to contract`);
  }
});
check('unmatched activities return null rather than a nearest guess', () => {
  assert.equal(resolveEvent('打游戏'), null);
  assert.equal(resolveEvent(''), null);
  assert.equal(resolveEvent(null), null);
});

console.log('单日判定');
check('a day whose 宜 lists the event grades 宜', () => {
  // Find a real 宜嫁娶 day rather than hard-coding one.
  const found = findGoodDaysAhead('wedding', 120, { year: 2026, month: 1, day: 1 }, { limit: 1 });
  assert.equal(found.count, 1, 'expected at least one 宜嫁娶 day in 2026 H1');
  const [y, m, d] = found.goodDays[0].日期.split('-').map(Number);
  const r = checkDay('wedding', '结婚', y, m, d);
  assert.equal(r.verdict, '宜');
  assert.ok(r.宜.some((x) => EVENT_YI.wedding.includes(x)));
});
check('馀事勿取 grades a real undertaking 不宜', () => {
  // 2026-08-20 is 破日 — 宜 is 破屋/坏垣/治病/馀事勿取.
  const r = checkDay('contract', '签合同', 2026, 8, 20);
  assert.ok(r.宜.includes('馀事勿取'), 'fixture day should be a 馀事勿取 day');
  assert.equal(r.verdict, '不宜');
});
check('馀事勿取 stays 未明确 for a small-stakes flutter', () => {
  const r = checkDay('contract', '买彩票', 2026, 8, 20);
  assert.equal(r.verdict, '未明确');
});
check('an explicit 忌 entry grades 忌', () => {
  // Same day lists 嫁娶 under 忌.
  const r = checkDay('wedding', '结婚', 2026, 8, 20);
  assert.ok(r.忌.includes('嫁娶'));
  assert.equal(r.verdict, '忌');
});
check('an unmatched activity reports unmatched, never a verdict', () => {
  const r = checkDay(null, '打游戏', 2026, 8, 20);
  assert.equal(r.matched, false);
  assert.equal(r.verdict, 'unknown');
  assert.ok(r.说明.includes('不臆造'));
  // The day's own 宜/忌 are still reported.
  assert.ok(Array.isArray(r.宜) && Array.isArray(r.忌));
});

console.log('区间筛选');
check('every returned day genuinely lists the event under 宜', () => {
  const r = findGoodDays('moving', { year: 2026, month: 1, day: 1 }, { year: 2026, month: 3, day: 31 });
  assert.ok(r.count > 0);
  for (const d of r.goodDays) {
    assert.ok(EVENT_YI.moving.some((k) => d.宜.includes(k)), `${d.日期} does not list 入宅/移徙/搬家`);
  }
});
check('weekendOnly returns only Saturdays and Sundays', () => {
  const r = findGoodDays(
    'wedding',
    { year: 2026, month: 1, day: 1 },
    { year: 2026, month: 4, day: 30 },
    { weekendOnly: true },
  );
  for (const d of r.goodDays) {
    assert.ok(['星期六', '星期日'].includes(d.星期), `${d.日期} is ${d.星期}`);
  }
});
check('excludeZodiac removes days clashing with that sign', () => {
  const all = findGoodDays('wedding', { year: 2026, month: 1, day: 1 }, { year: 2026, month: 6, day: 30 });
  const clashSign = all.goodDays[0].冲生肖;
  const filtered = findGoodDays(
    'wedding',
    { year: 2026, month: 1, day: 1 },
    { year: 2026, month: 6, day: 30 },
    { excludeZodiac: [clashSign] },
  );
  assert.ok(filtered.count < all.count, 'filter should remove something');
  for (const d of filtered.goodDays) assert.notEqual(d.冲生肖, clashSign);
});
check('limit stops the scan early', () => {
  const r = findGoodDays(
    'praying',
    { year: 2026, month: 1, day: 1 },
    { year: 2026, month: 6, day: 30 },
    { limit: 3 },
  );
  assert.equal(r.count, 3);
});
check('reversed start/end are swapped, not returned empty', () => {
  const fwd = findGoodDays('travel', { year: 2026, month: 3, day: 1 }, { year: 2026, month: 3, day: 31 });
  const rev = findGoodDays('travel', { year: 2026, month: 3, day: 31 }, { year: 2026, month: 3, day: 1 });
  assert.equal(rev.count, fwd.count);
});
check('an over-wide range truncates and says so', () => {
  const r = findGoodDays('travel', { year: 2026, month: 1, day: 1 }, { year: 2027, month: 12, day: 31 });
  assert.equal(r.truncated, true);
  assert.ok(r.daysScanned <= 180);
});
check('a range within the cap is not flagged as truncated', () => {
  const r = findGoodDays('travel', { year: 2026, month: 1, day: 1 }, { year: 2026, month: 2, day: 1 });
  assert.equal(r.truncated, false);
});
check('an unknown event throws rather than returning nothing', () => {
  assert.throws(() => findGoodDays('nope', { year: 2026, month: 1, day: 1 }, { year: 2026, month: 1, day: 2 }), /未知事项/);
});
check('the scan spans month and year boundaries correctly', () => {
  const r = findGoodDays('praying', { year: 2026, month: 12, day: 20 }, { year: 2027, month: 1, day: 10 });
  assert.equal(r.daysScanned, 22); // 12 days in Dec + 10 in Jan
});

console.log('单日黄历');
check('冲 is the branch opposite the day branch, with its zodiac', () => {
  const d = getDay(2026, 8, 20); // 丙寅 day
  assert.equal(d.干支.日, '丙寅');
  assert.equal(d.冲.地支, '申');
  assert.equal(d.冲.生肖, '猴');
});
check('煞方 follows the 三合 rule — 寅午戌 clash north', () => {
  assert.equal(getDay(2026, 8, 20).冲.煞方, '北'); // 寅 day
});
check('冲 虚岁 resolves to a plausible age', () => {
  const d = getDay(2026, 8, 20);
  assert.ok(d.冲.虚岁 !== null && d.冲.虚岁 > 0 && d.冲.虚岁 <= 60, `got ${d.冲.虚岁}`);
});
check('吉时 lists at most 12 unique branches', () => {
  const d = getDay(2026, 8, 20);
  assert.ok(d.吉时.length > 0 && d.吉时.length <= 12);
  assert.equal(new Set(d.吉时).size, d.吉时.length, '吉时 should be de-duplicated');
});
check('同宜事项 / 同忌事项 agree with the 宜/忌 lists', () => {
  const r = findGoodDays('wedding', { year: 2026, month: 1, day: 1 }, { year: 2026, month: 2, day: 28 });
  for (const d of r.goodDays) {
    assert.ok(d.同宜事项.includes('wedding'));
    for (const ev of d.同宜事项) {
      assert.ok(ZERI_EVENTS.includes(ev as (typeof ZERI_EVENTS)[number]));
      assert.ok(EVENT_YI[ev].some((k) => d.宜.includes(k)));
    }
  }
});

console.log(`\n${passed} checks passed.`);
