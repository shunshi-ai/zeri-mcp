# zeri-mcp

<div align="center">

[![English](https://img.shields.io/badge/-English-555?style=flat-square)](README.md) ·
**简体中文** ·
[![日本語](https://img.shields.io/badge/-%E6%97%A5%E6%9C%AC%E8%AA%9E-555?style=flat-square)](README.ja.md)
[![한국어](https://img.shields.io/badge/-%ED%95%9C%EA%B5%AD%EC%96%B4-555?style=flat-square)](README.ko.md)

</div>

> 🇨🇳 **择日** — 嫁娶 · 入宅 · 开市 · 动土 · 出行 · 立券，从真黄历里挑，不是模型编的
>
> [Shunshi.AI](https://shunshi.ai) / 顺时 择日工具所用的引擎，开源发布。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Powered by Shunshi.AI](https://img.shields.io/badge/powered%20by-Shunshi.AI-purple)](https://shunshi.ai)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](#)

---

## 两个 npm 包

| 包 | 是什么 | 安装 |
|---|---|---|
| **[`shunshi-zeri-core`](./packages/zeri-core)** | 纯 TypeScript 择日引擎。离线。 | `npm install shunshi-zeri-core` |
| **[`shunshi-zeri-mcp`](./packages/zeri-mcp)** | 包装核心库的 [MCP](https://modelcontextprotocol.io/) 服务器。Claude Desktop / Cursor / Cline / Claude Code 可用。 | `npx -y shunshi-zeri-mcp` |

与 [`shunshi-bazi-core`](https://github.com/shunshi-ai/bazi-reader-mcp) 同一套 tyme4ts 历法内核，择日与八字流日始终同源。

---

## 为什么做这个

「三月哪天适合结婚？」——这种问题大模型会答得非常自信，而且全是编的。它没法知道：答案在黄历里，在那个「宜」栏里要么有「嫁娶」要么没有。

这个包把它变成查表：

- ✅ **判定是真值，不是判断。** 某天宜不宜嫁娶，**当且仅当**当日宜栏里确实列了该事项的关键词。不做任何推断。
- ✅ **答不了的就说答不了。** 问一个黄历没有对应条目的事，工具直接返回 `matched: false`，而不是挑一个最接近的事项、把它的结论冒充成这件事的结论。
- ✅ **真正管用的筛选。** `excludeZodiac` 可以排除冲新人/屋主生肖的日子 —— 传统择日必看这条，而通用黄历工具基本都不提供。
- ✅ **覆盖 10 类事项**：嫁娶 · 入宅搬家 · 开市开业 · 出行 · 动土修造 · 祭祀祈福 · 立券交易 · 安床 · 求医 · 入学。
- ✅ **自然语言输入**：「结婚」「领证」「乔迁」「签合同」「装修」「出差」都能识别到正确事项。
- ✅ **不联网、不需要 API key。**

### 唯一一处「判断」，明说

除了下面这一条，全部直接照抄黄历：当某天宜栏以 **馀事勿取** 收尾（破日/弱日，只宜宜栏列出的那几项，其余诸事不宜），判定按事情轻重分档 —— 签约、投资这类正经大事判 **不宜**（改天吧）；买张彩票这种小额娱乐仍判 **未明确**，因为拿「馀事勿取」跟它较真，是往另一个方向过度解读。

---

## 快速开始

### 在自己的应用里用

```bash
npm install shunshi-zeri-core
```

```typescript
import { findGoodDays, checkDay, getDay, resolveEvent } from 'shunshi-zeri-core';

// 2026 上半年的婚嫁吉日，只要周末，且避开冲龙的日子
const r = findGoodDays(
  'wedding',
  { year: 2026, month: 1, day: 1 },
  { year: 2026, month: 6, day: 30 },
  { weekendOnly: true, excludeZodiac: ['龙'] },
);
console.log(r.count, r.goodDays[0]);

// 某天适不适合做某事
checkDay(resolveEvent('签合同'), '签合同', 2026, 8, 20).verdict;  // '不宜'

// 某天的完整黄历
getDay(2026, 8, 20).冲;   // { 生肖: '猴', 煞方: '北', 虚岁: 43, … }
```

→ 完整 API 说明：[`packages/zeri-core/README.md`](./packages/zeri-core/README.md)

### 让 Claude / Cursor / Cline 会择日

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

**Claude Code** 用户：

```bash
claude mcp add shunshi-zeri -- npx -y shunshi-zeri-mcp
```

然后直接问：

> 我想明年上半年结婚，帮我挑几个周末的好日子，新娘属龙要避开冲龙的日子。
>
> 2026 年 8 月 20 日适合签合同吗？
>
> 下个月搬家挑个好日子。

---

## 提供给模型的工具

| 工具 | 作用 |
|---|---|
| `findAuspiciousDates` | 扫描区间，返回所有宜该事项的日子，带农历、日干支、冲生肖/煞方、建除十二神、黄道黑道、吉时，以及当天还宜/忌哪些事项。支持 `weekendOnly` 和 `excludeZodiac`。 |
| `nextAuspiciousDates` | 从今天起往后找最近几个吉日，不用给区间。 |
| `checkDate` | 某一天适不适合某件事，附当日完整宜忌。接受自然语言事项。 |
| `getAlmanacDay` | 某天完整黄历 —— 宜忌、冲煞、十二神、吉神凶煞、彭祖百忌、二十八宿、吉神方位、节日。 |
| `resolveActivity` | 自然语言 → 事项 slug，并列出全部可择吉事项及各自匹配的黄历条目。 |

---

## 验证

```bash
npm install
npm run build
npm test          # 23 项单元测试 + 320 天跨库对拍
npm run smoke -w shunshi-zeri-mcp   # 走真实 MCP stdio 协议的端到端测试
```

这里最关键的是对拍。生产服务跑在 **lunar-python** 上，这个包走的是 **tyme4ts**。对拍验证的是**两个独立历法库逐日一致** —— 跨 320 天、三个区间（2026 全年抽样、2027 春、2025 秋），比对宜/忌、日干支、冲生肖、煞方、吉时，以及派生的逐事项宜忌列表。结果完全一致。

> 有一处无害差异，测试里已归一：某天没有忌项时，lunar-python 返回 `["无"]`，tyme4ts 返回 `[]`。两者含义相同，且都不会匹配任何事项关键词。

---

## 把局限说清楚

- **择日是传统文化实践，不是科学预测。** 这里给的是黄历真值，如实转述。照不照做是读者自己的事。
- **这是通用层。** 传统择日师还会拿日子跟当事人四柱合看，那一层个性化判断不在本包内。这里有的是「对所有人都一样」的黄历真值，外加一个生肖冲煞筛选。
- **区间扫描上限 180 天。** 超出时结果里会明确标注截断，而不是悄悄少给几天。

---

## Shunshi.AI 开源生态

| 仓库 | 内容 |
|---|---|
| [bazi-reader-mcp](https://github.com/shunshi-ai/bazi-reader-mcp) | 八字 / 四柱推命 / 사주팔자 排盘引擎 + MCP 服务器 |
| [kangxi-mcp](https://github.com/shunshi-ai/kangxi-mcp) | 康熙字典引擎 + MCP 服务器 |
| [naming-mcp](https://github.com/shunshi-ai/naming-mcp) | 姓名打分 —— 五格 · 三才 · 81 数理 · 生肖 |
| **zeri-mcp** | 择日 *(本仓库)* |
| [fate-bench](https://github.com/shunshi-ai/fate-bench) | 中华命理开放数据集与基准 |

由 **[Shunshi.AI 顺时](https://shunshi.ai)** 打造 —— AI 驱动的中华命理平台，支持 中文 / English / 日本語 / 한국어。

## 许可

MIT © Shunshi.AI
