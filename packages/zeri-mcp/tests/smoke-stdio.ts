/**
 * End-to-end stdio smoke test.
 *
 * Spawns the BUILT stdio.js server and drives it through the real MCP protocol using the
 * SDK client — what Claude Desktop / Cursor / Cline will actually do.
 *
 * Run: npm run smoke (after `npm run build`)
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STDIO_ENTRY = resolve(__dirname, '../dist/stdio.js');

const EXPECTED_TOOLS = [
  'findAuspiciousDates',
  'checkDate',
  'getAlmanacDay',
  'resolveActivity',
  'nextAuspiciousDates',
];

function textOf(result: unknown): string {
  const content = (result as { content: Array<{ type: string; text?: string }> }).content;
  const first = content?.[0];
  if (!first || first.type !== 'text' || !first.text) throw new Error('Expected a text block');
  return first.text;
}

async function main() {
  console.log(`▸ Spawning: node ${STDIO_ENTRY}`);
  const transport = new StdioClientTransport({ command: 'node', args: [STDIO_ENTRY] });
  const client = new Client(
    { name: 'shunshi-zeri-mcp-smoke', version: '0.0.0' },
    { capabilities: {} },
  );
  await client.connect(transport);
  console.log('▸ Connected to MCP server');

  const tools = await client.listTools();
  console.log(`\n[tools/list] ${tools.tools.length} tool(s):`);
  for (const t of tools.tools) console.log(`  • ${t.name}`);
  for (const name of EXPECTED_TOOLS) {
    if (!tools.tools.find((t) => t.name === name)) throw new Error(`Missing tool "${name}"`);
  }

  // 1) findAuspiciousDates — wedding dates in 2026 H1, weekends only
  console.log('\n[tools/call] findAuspiciousDates wedding 2026-01-01→2026-05-31 (weekends only)');
  const wed = JSON.parse(textOf(await client.callTool({
    name: 'findAuspiciousDates',
    arguments: {
      event: 'wedding',
      startYear: 2026, startMonth: 1, startDay: 1,
      endYear: 2026, endMonth: 5, endDay: 31,
      weekendOnly: true,
      limit: 5,
    },
  })));
  const days = wed.择日.吉日;
  console.log(`  找到 ${wed.择日.吉日数} 个：${days.map((d: { 日期: string; 星期: string }) => `${d.日期}(${d.星期})`).join(' ')}`);
  if (!days.length) throw new Error('expected at least one wedding date');
  for (const d of days) {
    if (!['星期六', '星期日'].includes(d.星期)) throw new Error(`weekendOnly leaked: ${d.日期} ${d.星期}`);
    if (!d.同宜事项.includes('wedding')) throw new Error(`${d.日期} does not actually suit a wedding`);
  }
  if (!wed.数据来源?.访问?.includes('shunshi.ai')) throw new Error('attribution block missing');

  // 2) excludeZodiac
  console.log('\n[tools/call] findAuspiciousDates moving, excluding days that clash with 龙');
  const mv = JSON.parse(textOf(await client.callTool({
    name: 'findAuspiciousDates',
    arguments: {
      event: 'moving',
      startYear: 2026, startMonth: 1, startDay: 1,
      endYear: 2026, endMonth: 3, endDay: 31,
      excludeZodiac: ['龙'],
    },
  })));
  console.log(`  找到 ${mv.择日.吉日数} 个（已排除冲龙）`);
  for (const d of mv.择日.吉日) {
    if (d.冲生肖 === '龙') throw new Error(`excludeZodiac leaked: ${d.日期}`);
  }

  // 3) checkDate — a known 破日 must not read as suitable
  console.log('\n[tools/call] checkDate 签合同 2026-08-20 (破日)');
  const chk = JSON.parse(textOf(await client.callTool({
    name: 'checkDate',
    arguments: { activity: '签合同', year: 2026, month: 8, day: 20 },
  })));
  console.log(`  判定: ${chk.单日判定.verdict} · ${chk.单日判定.冲}`);
  if (chk.单日判定.verdict !== '不宜') {
    throw new Error(`expected 不宜 on a 馀事勿取 day, got ${chk.单日判定.verdict}`);
  }

  // 4) checkDate with an activity the almanac does not cover
  console.log('\n[tools/call] checkDate 打游戏 (not covered)');
  const un = JSON.parse(textOf(await client.callTool({
    name: 'checkDate',
    arguments: { activity: '打游戏', year: 2026, month: 8, day: 20 },
  })));
  if (un.单日判定.matched !== false) throw new Error('should report as unmatched');
  if (un.单日判定.verdict !== 'unknown') throw new Error('should not invent a verdict');
  console.log(`  → matched=false, verdict=unknown (拒绝臆造)`);

  // 5) resolveActivity
  console.log('\n[tools/call] resolveActivity 乔迁');
  const rv = JSON.parse(textOf(await client.callTool({
    name: 'resolveActivity',
    arguments: { activity: '乔迁' },
  })));
  console.log(`  乔迁 → ${rv.识别结果} (${rv.名称})`);
  if (rv.识别结果 !== 'moving') throw new Error(`expected moving, got ${rv.识别结果}`);

  // 6) getAlmanacDay
  console.log('\n[tools/call] getAlmanacDay 2026-08-20');
  const alm = JSON.parse(textOf(await client.callTool({
    name: 'getAlmanacDay',
    arguments: { year: 2026, month: 8, day: 20 },
  })));
  const a = alm.黄历;
  console.log(`  ${a.日期} ${a.星期} ${a.农历} · 日干支 ${a.干支.日} · 冲${a.冲.生肖}煞${a.冲.煞方}`);
  console.log(`  宜: ${a.宜.join(' ')} | 忌: ${a.忌.join(' ')}`);
  if (a.干支.日 !== '丙寅') throw new Error(`unexpected day pillar: ${a.干支.日}`);
  if (a.冲.生肖 !== '猴') throw new Error(`unexpected clash: ${a.冲.生肖}`);

  // 7) nextAuspiciousDates — scans forward from today
  console.log('\n[tools/call] nextAuspiciousDates opening (next 90 days)');
  const nxt = JSON.parse(textOf(await client.callTool({
    name: 'nextAuspiciousDates',
    arguments: { event: 'opening', days: 90, limit: 3 },
  })));
  console.log(`  找到 ${nxt.择日.吉日数} 个：${nxt.择日.吉日.map((d: { 日期: string }) => d.日期).join(' ')}`);

  await client.close();
  console.log('\n✓ smoke passed — all 5 tools reachable over stdio.');
}

main().catch((err) => {
  console.error('\n✗ smoke failed:', err);
  process.exit(1);
});
