# zeri-mcp

<div align="center">

[![English](https://img.shields.io/badge/-English-555?style=flat-square)](README.md)
[![简体中文](https://img.shields.io/badge/-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-555?style=flat-square)](README.zh-CN.md) ·
**日本語** ·
[![한국어](https://img.shields.io/badge/-%ED%95%9C%EA%B5%AD%EC%96%B4-555?style=flat-square)](README.ko.md)

</div>

> 🇯🇵 **択日・日取り** — 婚礼 · 引越し · 開業 · 動土 · 旅行 · 契約の吉日を、実際の黄暦から選ぶ
>
> [Shunshi.AI](https://shunshi.ai) / 順時 の択日ツールで稼働しているエンジンを、そのままオープンソース化したものです。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Powered by Shunshi.AI](https://img.shields.io/badge/powered%20by-Shunshi.AI-purple)](https://shunshi.ai)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](#)

---

## 2 つの npm パッケージ

| パッケージ | 内容 | インストール |
|---|---|---|
| **[`shunshi-zeri-core`](./packages/zeri-core)** | 純粋な TypeScript の択日エンジン。オフライン。 | `npm install shunshi-zeri-core` |
| **[`shunshi-zeri-mcp`](./packages/zeri-mcp)** | コアを包む [MCP](https://modelcontextprotocol.io/) サーバー。Claude Desktop / Cursor / Cline / Claude Code 用。 | `npx -y shunshi-zeri-mcp` |

[`shunshi-bazi-core`](https://github.com/shunshi-ai/bazi-reader-mcp) と同一の tyme4ts 暦法コアの上に構築されており、択日と四柱推命の流日は常に同期します。

---

## なぜ作ったか

「3 月で結婚に良い日は？」——この種の質問に LLM は自信たっぷりに答えますが、その中身は完全な創作です。知りようがないのです。答えは黄暦の中、「宜」の欄に「嫁娶」が入っているかいないか、それだけです。

このパッケージはそれを表引きにします。

- ✅ **判定は事実であって判断ではありません。** ある日が嫁娶に適するのは、**その日の「宜」欄にその事項の語が実際に載っている場合に限ります**。推論は一切行いません。
- ✅ **答えられないことは答えられないと言います。** 黄暦に該当項目のない事柄を尋ねると、`matched: false` を返します。最も近い事項を選んでその結論をすり替えることはしません。
- ✅ **実用的な絞り込み。** `excludeZodiac` で、新郎新婦や家主の干支と冲する日を除外できます。実際の択日では必ず見る条件ですが、汎用の暦アプリはまず提供していません。
- ✅ **10 種類の事項に対応**：嫁娶 · 入宅（引越し）· 開市（開業）· 出行 · 動土 · 祭祀祈福 · 立券交易 · 安床 · 求医 · 入学。
- ✅ **自然言語入力**：「結婚」「引越し」「契約」「開業」なども正しい事項に解決されます。
- ✅ **ネットワーク不要・API キー不要。**

### 唯一の「等級付け」を明示します

以下の 1 点を除き、すべて黄暦をそのまま転記しています。ある日の「宜」欄が **馀事勿取**（破日など、列挙された数項目以外は控えるべき弱い日）で終わる場合のみ、事の重さで等級を分けます。契約・投資といった本来の大事は **不宜**（日を改めるべき）、宝くじ程度の少額の娯楽は **未明確** のままです。後者にまでこの基準を当てるのは、逆方向への行き過ぎだからです。

---

## クイックスタート

### 自分のアプリで使う

```bash
npm install shunshi-zeri-core
```

```typescript
import { findGoodDays, checkDay, getDay, resolveEvent } from 'shunshi-zeri-core';

// 2026 年上半期の婚礼吉日、週末のみ、辰と冲する日を除外
const r = findGoodDays(
  'wedding',
  { year: 2026, month: 1, day: 1 },
  { year: 2026, month: 6, day: 30 },
  { weekendOnly: true, excludeZodiac: ['龙'] },
);

// ある日がある事柄に適するか
checkDay(resolveEvent('签合同'), '签合同', 2026, 8, 20).verdict;  // '不宜'

// ある日の完全な黄暦
getDay(2026, 8, 20).冲;   // { 生肖: '猴', 煞方: '北', 虚岁: 43, … }
```

→ 詳細な API リファレンス：[`packages/zeri-core/README.md`](./packages/zeri-core/README.md)

### Claude / Cursor / Cline に択日をさせる

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

**Claude Code** の場合：

```bash
claude mcp add shunshi-zeri -- npx -y shunshi-zeri-mcp
```

あとはこう尋ねるだけです。

> 来年の上半期に結婚したい。週末で良い日をいくつか挙げて。新婦は辰年なので辰と冲する日は避けて。
>
> 2026 年 8 月 20 日は契約に良い日？
>
> 来月の引っ越しに良い日を教えて。

---

## モデルに公開されるツール

| ツール | 機能 |
|---|---|
| `findAuspiciousDates` | 期間を走査し、その事項に適する日をすべて返します。旧暦日付・日干支・冲の干支と煞方・建除十二神・黄道黒道・吉時、およびその日が他にどの事項に適する／避けるべきかも付きます。`weekendOnly` と `excludeZodiac` に対応。 |
| `nextAuspiciousDates` | 今日から前方に走査して直近の吉日をいくつか返します。期間指定不要。 |
| `checkDate` | ある特定の日がある特定の事柄に適するか。その日の完全な宜忌付き。自然言語の事項名を受け付けます。 |
| `getAlmanacDay` | ある日の完全な黄暦 —— 宜忌・冲煞・十二神・吉神凶煞・彭祖百忌・二十八宿・吉方位・祝祭日。 |
| `resolveActivity` | 自然言語を対応事項に対応付け、全事項とそれぞれが照合する黄暦の語を一覧します。 |

---

## 検証

```bash
npm install
npm run build
npm test          # 23 件のユニットテスト + 320 日分のライブラリ間整合性テスト
npm run smoke -w shunshi-zeri-mcp   # 実際の MCP stdio プロトコル経由のテスト
```

ここで最も重要なのが整合性テストです。本番サービスは **lunar-python** で動いており、このパッケージは **tyme4ts** を使っています。このテストが検証しているのは、**独立した 2 つの暦ライブラリが日ごとに一致すること**です。3 つの期間（2026 年、2027 年春、2025 年秋）にまたがる 320 日について、宜／忌・日干支・冲の干支・煞方・吉時、および事項ごとの派生リストを照合します。結果は完全に一致しました。

> 無害な差分が 1 つあり、テスト内で正規化しています。忌が無い日について lunar-python は `["无"]` を、tyme4ts は `[]` を返します。意味は同じで、どちらも事項の語には一致しません。

---

## 限界を正直に

- **択日は文化的実践であり、科学的予測ではありません。** ここにあるのは黄暦の事実を忠実に転記したものです。それに従うかどうかは読み手の判断です。
- **これは汎用層です。** 伝統的な択日家は、日と本人の四柱を突き合わせても見ます。その個別層は本パッケージには含まれません。ここにあるのは「万人に共通の」黄暦の事実に、干支の冲による絞り込みを加えたものです。
- **期間走査の上限は 180 日です。** それを超える指定では、黙って少なく返すのではなく、切り詰めた旨を結果に明示します。

---

## Shunshi.AI オープンソースエコシステム

| リポジトリ | 内容 |
|---|---|
| [bazi-reader-mcp](https://github.com/shunshi-ai/bazi-reader-mcp) | 八字 / 四柱推命 / 사주팔자 の命式計算エンジン + MCP サーバー |
| [kangxi-mcp](https://github.com/shunshi-ai/kangxi-mcp) | 康熙字典エンジン + MCP サーバー |
| [naming-mcp](https://github.com/shunshi-ai/naming-mcp) | 姓名判断 —— 五格 · 三才 · 81 数理 · 十二支 |
| **zeri-mcp** | 択日 *(本リポジトリ)* |
| [fate-bench](https://github.com/shunshi-ai/fate-bench) | 中国命理学のオープンデータセットとベンチマーク |

**[Shunshi.AI 順時](https://shunshi.ai)** が開発 —— AI による中国命理学プラットフォーム。中文 / English / 日本語 / 한국어 対応。

## ライセンス

MIT © Shunshi.AI
