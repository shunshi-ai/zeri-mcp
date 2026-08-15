# shunshi-zeri-core

> 🇨🇳 择日 (Chinese date selection) engine — find auspicious days for weddings, moving, business opening, groundbreaking, travel and contracts, straight from the 黄历. Offline.

[![npm](https://img.shields.io/npm/v/shunshi-zeri-core)](https://www.npmjs.com/package/shunshi-zeri-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Powered by Shunshi.AI](https://img.shields.io/badge/powered%20by-Shunshi.AI-purple)](https://shunshi.ai)

Part of [zeri-mcp](https://github.com/shunshi-ai/zeri-mcp) — repo README in
[English](https://github.com/shunshi-ai/zeri-mcp/blob/main/README.md) ·
[简体中文](https://github.com/shunshi-ai/zeri-mcp/blob/main/README.zh-CN.md) ·
[日本語](https://github.com/shunshi-ai/zeri-mcp/blob/main/README.ja.md) ·
[한국어](https://github.com/shunshi-ai/zeri-mcp/blob/main/README.ko.md).

## Install

```bash
npm install shunshi-zeri-core
```

Built on the same tyme4ts calendar core as
[`shunshi-bazi-core`](https://www.npmjs.com/package/shunshi-bazi-core), so 择日 stays
consistent with 八字 流日. No network at runtime.

## The contract

A day suits an activity **iff** the almanac's 宜 list literally contains one of that
activity's terms. That is the whole rule. Nothing is inferred, and activities the almanac
does not cover return "unmatched" rather than a nearest-neighbour verdict.

## API

### `findGoodDays(event, start, end, options?): SelectResult`

Scan a closed date range and return every day that suits the event.

```typescript
import { findGoodDays } from 'shunshi-zeri-core';

const r = findGoodDays(
  'wedding',
  { year: 2026, month: 1, day: 1 },
  { year: 2026, month: 6, day: 30 },
  { weekendOnly: true, excludeZodiac: ['龙'], limit: 10 },
);
```

| Option | Type | Default | Meaning |
|---|---|---|---|
| `weekendOnly` | `boolean` | `false` | Saturdays and Sundays only |
| `excludeZodiac` | `string[]` | — | Skip days whose 冲生肖 is one of these — pass the participants' signs |
| `limit` | `number` | — | Stop once this many good days are found |
| `maxDays` | `number` | `180` | Hard cap on days scanned; `truncated` reports when it bites |

Each returned day carries 日期, 星期, 农历, 日干支, 冲生肖, 煞方, 十二神, 黄道/黑道,
宜, 吉时, and the other major activities that day suits (`同宜事项`) or avoids (`同忌事项`).

### `findGoodDaysAhead(event, days?, start?, options?)`

Scan forward from a start date (default today) — the "when's the next good day to move?"
shape.

### `checkDay(event, activity, year, month, day): DayCheck`

Whether one day suits one activity. `event` is a resolved slug or `null`; pass `null` when
the activity could not be resolved and only the day's overall 宜/忌 comes back.

Verdicts: `宜` · `忌` · `不宜` (the day is 馀事勿取 and this is a real undertaking) ·
`未明确` (the almanac does not mention it) · `unknown` (activity not covered at all).

### `resolveEvent(activity): string | null`

Free text → event slug. Handles the aliases people actually type — 结婚, 领证, 乔迁,
签合同, 装修, 出差, 炒股. Returns `null` rather than guessing.

### `getDay(year, month, day): DayInfo`

Full almanac facts for one day: 农历, 干支, 节气, 宜/忌, 冲 (branch, zodiac, 干支, 煞方,
and the clashing generation's nominal age), 十二神, 神煞, 彭祖百忌, 二十八宿, 吉时,
吉神方位, 节日.

### Events

`wedding` 嫁娶 · `moving` 入宅搬家 · `opening` 开市开业 · `travel` 出行 ·
`groundbreaking` 动土修造 · `praying` 祭祀祈福 · `contract` 立券交易 ·
`bed` 安床 · `healing` 求医 · `schooling` 入学.

The first seven are the ones worth planning a date range around; the last three exist for
free-text questions. `listEvents()`, `EVENT_YI` and `EVENT_LABELS` expose the full table.

## The one graded verdict

Everything is read straight off the almanac except this: when a day's 宜 list ends in
**馀事勿取**, the verdict is graded by stakes — a contract or investment gets `不宜`, a
lottery ticket stays `未明确`. Stated openly because it is the only place a judgement
enters.

## Limits

Date selection is a cultural practice, not a predictive science. This is the general layer
— traditional practitioners also weigh the day against the individual's 四柱, which is not
in this package. What is here is what the almanac says for everyone, plus a zodiac-clash
filter.

## License

MIT © [Shunshi.AI](https://shunshi.ai)
