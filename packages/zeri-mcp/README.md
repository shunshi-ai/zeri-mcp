# shunshi-zeri-mcp

> 🇨🇳 Give your AI agent 择日 — auspicious date selection for weddings, moving, business opening and contracts, read from the real 黄历 instead of imagined. An open-source MCP server, offline.

[![npm](https://img.shields.io/npm/v/shunshi-zeri-mcp)](https://www.npmjs.com/package/shunshi-zeri-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Powered by Shunshi.AI](https://img.shields.io/badge/powered%20by-Shunshi.AI-purple)](https://shunshi.ai)

Part of [zeri-mcp](https://github.com/shunshi-ai/zeri-mcp) — repo README in
[English](https://github.com/shunshi-ai/zeri-mcp/blob/main/README.md) ·
[简体中文](https://github.com/shunshi-ai/zeri-mcp/blob/main/README.zh-CN.md) ·
[日本語](https://github.com/shunshi-ai/zeri-mcp/blob/main/README.ja.md) ·
[한국어](https://github.com/shunshi-ai/zeri-mcp/blob/main/README.ko.md).

## Setup

**Claude Desktop / Cursor / Cline:**

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

**Claude Code:**

```bash
claude mcp add shunshi-zeri -- npx -y shunshi-zeri-mcp
```

No API key, no network at runtime.

## Why the model needs this

"When is a good day to get married in March?" is a question an LLM answers confidently and
entirely from imagination. It cannot know: the answer is in the almanac, in a 宜 list that
either contains 嫁娶 or does not.

This server makes it a lookup, and — just as importantly — makes the model **stop** when
there is nothing to look up. Ask about an activity the almanac has no entry for and the
tool returns `matched: false` rather than letting the nearest event's verdict stand in
for it.

## Tools

### `findAuspiciousDates`

Scans a date range and returns every day suiting the activity, each with its 农历 date,
day 干支, 冲生肖 and 煞方, 建除十二神, 黄道/黑道, auspicious hours, and which other major
activities that day suits or avoids.

Two filters that matter in practice: `weekendOnly` for anything needing guests, and
`excludeZodiac` to skip days clashing with a participant's zodiac sign — standard in real
date selection.

> 我想明年上半年结婚，帮我挑几个周末的好日子，新娘属龙要避开冲龙的日子。

### `nextAuspiciousDates`

The next few good days scanning forward from today. No date range needed.

> 下个月搬家挑个好日子。

### `checkDate`

Whether one specific day suits one specific activity, with the day's full 宜/忌. Takes
free text — "结婚", "搬家", "签合同", "出差".

Verdicts: `宜` · `忌` · `不宜` (a 馀事勿取 day and this is a real undertaking) ·
`未明确` · `unknown` (not covered).

### `getAlmanacDay`

The full 黄历 for a day — 宜/忌, 冲煞, 十二神, 吉神/凶煞, 彭祖百忌, 二十八宿, lucky
directions, festivals.

### `resolveActivity`

Maps free text to a covered event and lists every event with the exact almanac terms it
matches. Call it first when the user describes something in their own words.

## Covered activities

嫁娶 · 入宅搬家 · 开市开业 · 出行 · 动土修造 · 祭祀祈福 · 立券交易 · 安床 · 求医 · 入学

## Honest limits

Date selection is a cultural practice, not a predictive science. This is the general
almanac layer plus a zodiac-clash filter; the personal layer traditional practitioners
use (weighing the day against the individual's 四柱) is not included.

## Related

| Package | What |
|---|---|
| [`shunshi-zeri-core`](https://www.npmjs.com/package/shunshi-zeri-core) | The engine behind this server |
| [`shunshi-bazi-mcp`](https://www.npmjs.com/package/shunshi-bazi-mcp) | 八字 / 四柱推命 / 사주팔자 chart MCP server |
| [`shunshi-kangxi-mcp`](https://www.npmjs.com/package/shunshi-kangxi-mcp) | 康熙字典 dictionary MCP server |
| [`shunshi-naming-mcp`](https://www.npmjs.com/package/shunshi-naming-mcp) | Chinese name scoring MCP server |

Built by [Shunshi.AI](https://shunshi.ai) — AI-powered Chinese metaphysics in 中文 / English / 日本語 / 한국어.

## License

MIT © [Shunshi.AI](https://shunshi.ai)
