# zeri-mcp

<div align="center">

[![English](https://img.shields.io/badge/-English-555?style=flat-square)](README.md)
[![简体中文](https://img.shields.io/badge/-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-555?style=flat-square)](README.zh-CN.md)
[![日本語](https://img.shields.io/badge/-%E6%97%A5%E6%9C%AC%E8%AA%9E-555?style=flat-square)](README.ja.md) ·
**한국어**

</div>

> 🇰🇷 **택일 (擇日)** — 혼례 · 이사 · 개업 · 동토 · 여행 · 계약의 길일을 실제 황력에서 고릅니다
>
> [Shunshi.AI](https://shunshi.ai) / 순시(順時) 택일 도구에서 실제로 돌아가는 엔진을 그대로 오픈소스로 공개합니다.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Powered by Shunshi.AI](https://img.shields.io/badge/powered%20by-Shunshi.AI-purple)](https://shunshi.ai)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](#)

---

## 두 개의 npm 패키지

| 패키지 | 내용 | 설치 |
|---|---|---|
| **[`shunshi-zeri-core`](./packages/zeri-core)** | 순수 TypeScript 택일 엔진. 오프라인. | `npm install shunshi-zeri-core` |
| **[`shunshi-zeri-mcp`](./packages/zeri-mcp)** | 코어를 감싼 [MCP](https://modelcontextprotocol.io/) 서버. Claude Desktop / Cursor / Cline / Claude Code용. | `npx -y shunshi-zeri-mcp` |

[`shunshi-bazi-core`](https://github.com/shunshi-ai/bazi-reader-mcp)와 동일한 tyme4ts 역법 코어 위에 세워져 있어, 택일과 사주 유일(流日)이 항상 같은 기준을 씁니다.

---

## 왜 만들었나

「3월에 결혼하기 좋은 날은?」 — 이런 질문에 LLM은 아주 자신 있게 답하지만 그 내용은 전부 지어낸 것입니다. 알 수가 없기 때문입니다. 답은 황력 안에, 「의(宜)」 목록에 「가취(嫁娶)」가 있느냐 없느냐에 있습니다.

이 패키지는 그것을 조회로 바꿉니다.

- ✅ **판정은 사실이지 판단이 아닙니다.** 어떤 날이 혼례에 맞는 것은 **그날의 의(宜) 목록에 해당 항목의 낱말이 실제로 실려 있을 때뿐**입니다. 추론은 하지 않습니다.
- ✅ **답할 수 없는 것은 답할 수 없다고 합니다.** 황력에 해당 항목이 없는 일을 물으면 `matched: false`를 돌려줍니다. 가장 비슷한 항목을 골라 그 결론을 대신 내밀지 않습니다.
- ✅ **실전에서 쓰는 필터.** `excludeZodiac`으로 신랑·신부나 집주인의 띠와 충(沖)하는 날을 제외할 수 있습니다. 실제 택일에서 반드시 보는 조건인데, 범용 달력 도구는 거의 제공하지 않습니다.
- ✅ **10가지 항목 지원**: 가취 · 입택(이사) · 개시(개업) · 출행 · 동토 · 제사기복 · 입권교역 · 안상 · 구의 · 입학.
- ✅ **자연어 입력**: 「결혼」「이사」「계약」「개업」 등이 올바른 항목으로 해석됩니다.
- ✅ **네트워크 불필요, API 키 불필요.**

### 유일한 「등급 판정」을 밝힙니다

아래 한 가지를 빼면 전부 황력을 그대로 옮긴 것입니다. 어떤 날의 의(宜) 목록이 **여사물취(馀事勿取)** 로 끝나는 경우 — 파일(破日) 등 나열된 몇 가지 외에는 삼가야 하는 약한 날 — 만 일의 경중으로 등급을 나눕니다. 계약·투자 같은 제대로 된 대사는 **불의(不宜)**(날을 바꾸라), 복권 정도의 소액 오락은 **미명확(未明確)** 그대로입니다. 후자에까지 그 기준을 들이대는 것은 반대 방향의 과잉 해석이기 때문입니다.

---

## 빠른 시작

### 직접 만든 앱에서 사용하기

```bash
npm install shunshi-zeri-core
```

```typescript
import { findGoodDays, checkDay, getDay, resolveEvent } from 'shunshi-zeri-core';

// 2026년 상반기 혼례 길일, 주말만, 용띠와 충하는 날 제외
const r = findGoodDays(
  'wedding',
  { year: 2026, month: 1, day: 1 },
  { year: 2026, month: 6, day: 30 },
  { weekendOnly: true, excludeZodiac: ['龙'] },
);

// 특정한 날이 특정한 일에 맞는가
checkDay(resolveEvent('签合同'), '签合同', 2026, 8, 20).verdict;  // '不宜'

// 특정한 날의 전체 황력
getDay(2026, 8, 20).冲;   // { 生肖: '猴', 煞方: '北', 虚岁: 43, … }
```

→ 전체 API 레퍼런스: [`packages/zeri-core/README.md`](./packages/zeri-core/README.md)

### Claude / Cursor / Cline에 택일 붙이기

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

**Claude Code** 사용자:

```bash
claude mcp add shunshi-zeri -- npx -y shunshi-zeri-mcp
```

그다음 이렇게 물어보면 됩니다.

> 내년 상반기에 결혼하려는데 주말 중 좋은 날 몇 개만 골라줘. 신부가 용띠라 용과 충하는 날은 피해줘.
>
> 2026년 8월 20일은 계약하기 좋은 날인가?
>
> 다음 달 이사에 좋은 날을 알려줘.

---

## 모델에 노출되는 도구

| 도구 | 기능 |
|---|---|
| `findAuspiciousDates` | 기간을 훑어 해당 항목에 맞는 날을 모두 반환합니다. 음력 날짜, 일간지, 충하는 띠와 살방, 건제십이신, 황도흑도, 길시, 그리고 그날이 또 어떤 항목에 맞고 피해야 하는지까지 포함합니다. `weekendOnly`와 `excludeZodiac` 지원. |
| `nextAuspiciousDates` | 오늘부터 앞으로 훑어 가장 가까운 길일 몇 개를 반환합니다. 기간 지정 불필요. |
| `checkDate` | 특정한 날이 특정한 일에 맞는지, 그날의 전체 의기(宜忌)와 함께. 자연어 항목명을 받습니다. |
| `getAlmanacDay` | 특정한 날의 전체 황력 —— 의기, 충살, 십이신, 길신흉살, 팽조백기, 이십팔수, 길방, 명절. |
| `resolveActivity` | 자연어를 지원 항목으로 매핑하고, 전체 항목과 각각이 대조하는 황력 낱말을 나열합니다. |

---

## 검증

```bash
npm install
npm run build
npm test          # 23개 유닛 테스트 + 320일 라이브러리 간 일치성 테스트
npm run smoke -w shunshi-zeri-mcp   # 실제 MCP stdio 프로토콜을 통한 테스트
```

여기서 가장 중요한 것이 일치성 테스트입니다. 프로덕션 서비스는 **lunar-python** 위에서 돌아가고, 이 패키지는 **tyme4ts**를 씁니다. 이 테스트가 검증하는 것은 **독립적인 두 역법 라이브러리가 날마다 일치한다**는 사실입니다. 세 구간(2026년, 2027년 봄, 2025년 가을)에 걸친 320일에 대해 의/기, 일간지, 충하는 띠, 살방, 길시, 그리고 항목별 파생 목록을 대조합니다. 결과는 완전히 일치했습니다.

> 무해한 차이가 하나 있으며 테스트에서 정규화합니다. 기(忌)가 없는 날에 대해 lunar-python은 `["无"]`를, tyme4ts는 `[]`를 반환합니다. 뜻은 같고 둘 다 어떤 항목 낱말과도 일치하지 않습니다.

---

## 한계를 솔직히

- **택일은 문화적 실천이지 과학적 예측이 아닙니다.** 여기 있는 것은 황력의 사실을 충실히 옮긴 것입니다. 그에 따를지는 읽는 이의 판단입니다.
- **이것은 범용 계층입니다.** 전통 택일가는 날과 당사자의 사주를 함께 봅니다. 그 개인화 계층은 이 패키지에 없습니다. 여기 있는 것은 「모두에게 공통인」 황력 사실에 띠 충살 필터를 더한 것입니다.
- **기간 조회 상한은 180일입니다.** 그보다 넓게 요청하면 조용히 적게 주지 않고, 잘렸다는 사실을 결과에 명시합니다.

---

## Shunshi.AI 오픈소스 생태계

| 저장소 | 내용 |
|---|---|
| [bazi-reader-mcp](https://github.com/shunshi-ai/bazi-reader-mcp) | 八字 / 四柱推命 / 사주팔자 명식 계산 엔진 + MCP 서버 |
| [kangxi-mcp](https://github.com/shunshi-ai/kangxi-mcp) | 강희자전 엔진 + MCP 서버 |
| [naming-mcp](https://github.com/shunshi-ai/naming-mcp) | 이름 감정 —— 오격 · 삼재 · 81 수리 · 십이지 |
| **zeri-mcp** | 택일 *(이 저장소)* |
| [fate-bench](https://github.com/shunshi-ai/fate-bench) | 중국 명리학 오픈 데이터셋과 벤치마크 |

**[Shunshi.AI 순시](https://shunshi.ai)** 개발 —— AI 기반 중국 명리학 플랫폼. 中文 / English / 日本語 / 한국어 지원.

## 라이선스

MIT © Shunshi.AI
