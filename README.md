# zeri-mcp

<div align="center">

**English** ·
[![简体中文](https://img.shields.io/badge/-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-555?style=flat-square)](README.zh-CN.md)
[![日本語](https://img.shields.io/badge/-%E6%97%A5%E6%9C%AC%E8%AA%9E-555?style=flat-square)](README.ja.md)
[![한국어](https://img.shields.io/badge/-%ED%95%9C%EA%B5%AD%EC%96%B4-555?style=flat-square)](README.ko.md)

</div>

> 🇨🇳 **择日 (Chinese date selection)** ・ 🇯🇵 **日取り・六曜** ・ 🇰🇷 **택일 (擇日)**
>
> Pick auspicious dates for weddings, moving house, opening a business — from the real 黄历, not from a model's imagination. Open-sourced by [Shunshi.AI](https://shunshi.ai) / 顺时.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Powered by Shunshi.AI](https://img.shields.io/badge/powered%20by-Shunshi.AI-purple)](https://shunshi.ai)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](#)

---

## Two published npm packages

| Package | What it is | Install |
|---|---|---|
| **[`shunshi-zeri-core`](./packages/zeri-core)** | Pure TypeScript date-selection engine. Offline. | `npm install shunshi-zeri-core` |
| **[`shunshi-zeri-mcp`](./packages/zeri-mcp)** | [MCP](https://modelcontextprotocol.io/) server wrapping the core. For Claude Desktop / Cursor / Cline / Claude Code. | `npx -y shunshi-zeri-mcp` |

Built on the same tyme4ts calendar core as [`shunshi-bazi-core`](https://github.com/shunshi-ai/bazi-reader-mcp), so 择日 stays in lockstep with 八字 流日.

---

## Why this exists

"When is a good day to get married in March?" is a question an LLM will answer
confidently and entirely from imagination. It cannot know — the answer lives in the
almanac, in a 宜 list that either contains 嫁娶 or does not.

This package makes that a lookup:

- ✅ **The verdict is a fact, not a judgement.** A day suits 嫁娶 **iff** its 宜 list
  literally contains one of that event's terms. Nothing is inferred.
- ✅ **It refuses to answer what it cannot.** Ask about an activity the almanac has no
  entry for and the tool says `matched: false` instead of picking the nearest event and
  presenting its verdict as though it applied.
- ✅ **Real filters.** `excludeZodiac` skips days that clash with the bride's, groom's or
  homeowner's zodiac sign — standard practice in actual date selection, and something no
  general-purpose almanac tool offers.
- ✅ **10 activities covered**: 嫁娶 · 入宅搬家 · 开市开业 · 出行 · 动土修造 · 祭祀祈福 ·
  立券交易 · 安床 · 求医 · 入学.
- ✅ **Free-text input**: "结婚" "领证" "乔迁" "签合同" "装修" "出差" all resolve to the
  right event.
- ✅ **Zero network, zero API key.**

### The one graded verdict

Everything is read straight off the almanac except one case, which is stated openly:
when a day's 宜 list ends in **馀事勿取** — a 破日 or otherwise weak day where only the
few things listed are advisable — the verdict is graded by stakes. A contract, an
investment or any real undertaking gets **不宜** (pick another day). A lottery ticket
stays **未明确**, because holding a small flutter to that standard would be overreach in
the other direction.

---

## Quick start

### Use the engine in your own app

```bash
npm install shunshi-zeri-core
```

```typescript
import { findGoodDays, checkDay, getDay, resolveEvent } from 'shunshi-zeri-core';

// Wedding dates in 2026 H1, weekends only, skipping days that clash with the Dragon
const r = findGoodDays(
  'wedding',
  { year: 2026, month: 1, day: 1 },
  { year: 2026, month: 6, day: 30 },
  { weekendOnly: true, excludeZodiac: ['龙'] },
);
console.log(r.count, r.goodDays[0]);
// { 日期: '2026-01-03', 星期: '星期六', 农历: '…', 日干支: '…',
//   冲生肖: '…', 煞方: '…', 十二神: '…', 宜: [...], 吉时: [...] }

// Does one specific day suit one specific thing?
checkDay(resolveEvent('签合同'), '签合同', 2026, 8, 20).verdict;  // '不宜'

// The full almanac for a day
getDay(2026, 8, 20).冲;   // { 生肖: '猴', 煞方: '北', 虚岁: 43, … }
```

→ Full API reference: [`packages/zeri-core/README.md`](./packages/zeri-core/README.md)

### Give Claude / Cursor / Cline date selection

```jsonc
{
  "mcpServers": {
    "shunshi-zeri": {
      "command": "npx",
      "args": ["-y", "shunshi-zeri-mcp"]
    }
  }
}
```

For **Claude Code**:

```bash
claude mcp add shunshi-zeri -- npx -y shunshi-zeri-mcp
```

Then ask:

> 我想明年上半年结婚，帮我挑几个周末的好日子，新娘属龙要避开冲龙的日子。
>
> Is 2026-08-20 a good day to sign a contract?
>
> 来月の引っ越しに良い日を教えて。

---

## Tools exposed to the model

| Tool | What it does |
|---|---|
| `findAuspiciousDates` | Scans a date range and returns every day suiting the activity, with 农历 date, 日干支, 冲生肖/煞方, 建除十二神, 黄道/黑道, auspicious hours, and which other activities that day suits or avoids. Supports `weekendOnly` and `excludeZodiac`. |
| `nextAuspiciousDates` | The next few good days scanning forward from today — no date range needed. |
| `checkDate` | Whether one specific day suits one specific activity, with the day's full 宜/忌. Takes free-text activities. |
| `getAlmanacDay` | The full 黄历 for a day — 宜/忌, 冲煞, 十二神, 吉神/凶煞, 彭祖百忌, 二十八宿, lucky directions, festivals. |
| `resolveActivity` | Maps free text to a covered event, and lists every covered event with the exact almanac terms it matches. |

---

## Verification

```bash
npm install
npm run build
npm test          # 23 unit tests + 320-day cross-library parity
npm run smoke -w shunshi-zeri-mcp   # end-to-end over the real MCP stdio protocol
```

The parity suite is the important one here. The production service runs on
**lunar-python**; this package reaches the same facts through **tyme4ts**. The suite
checks that two independent almanac libraries agree, day for day across 320 days
spanning three ranges (2026, spring 2027, autumn 2025), on 宜/忌, 日干支, 冲生肖, 煞方,
auspicious hours, and the derived per-event lists. They do — exactly.

> One harmless difference, normalised in the test: where a day has nothing to avoid,
> lunar-python reports `["无"]` and tyme4ts reports `[]`. Both mean nothing, and neither
> matches any event keyword.

---

## Honest limits

- **Date selection is a cultural practice, not a predictive science.** These are almanac
  facts, faithfully reported. Whether to act on them is the reader's business.
- **This is the general-purpose layer.** Traditional practitioners also weigh the day
  against the individual's own 四柱 — that personal layer is not in this package. What is
  here is what the almanac says for everyone, plus a zodiac-clash filter.
- **Range scans are capped at 180 days.** When a wider range is requested the result says
  it truncated rather than silently returning less.

---

## Part of the Shunshi.AI open-source ecosystem

| Repo | What |
|---|---|
| [bazi-reader-mcp](https://github.com/shunshi-ai/bazi-reader-mcp) | 八字 / 四柱推命 / 사주팔자 chart engine + MCP server |
| [kangxi-mcp](https://github.com/shunshi-ai/kangxi-mcp) | 康熙字典 dictionary engine + MCP server |
| [naming-mcp](https://github.com/shunshi-ai/naming-mcp) | Chinese name scoring — 五格 · 三才 · 81 数理 · 生肖 |
| **zeri-mcp** | 择日 / date selection *(this repo)* |
| [fate-bench](https://github.com/shunshi-ai/fate-bench) | Open datasets and benchmarks for Chinese metaphysics |

Built by **[Shunshi.AI](https://shunshi.ai)** — AI-powered Chinese metaphysics, in 中文 / English / 日本語 / 한국어.

## License

MIT © Shunshi.AI
