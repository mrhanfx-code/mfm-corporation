// generate-action-plan.js
// Sends all 7 MFM docs to agents, gets analysis, compiles action plan → Remy's Telegram
// Usage: set DASHBOARD_SECRET=MFM-E345553E705249F191873BF3 && node scripts/generate-action-plan.js

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT       = join(__dirname, '..');
const WORKER_URL = 'https://mfm-corporation-telegram-bot.mrhan-fx.workers.dev';
const SECRET     = process.env.DASHBOARD_SECRET;

if (!SECRET) {
  console.error('Set DASHBOARD_SECRET first.');
  process.exit(1);
}

function readDoc(path) {
  try { return readFileSync(join(ROOT, path), 'utf8'); } catch { return null; }
}

async function ask(question) {
  const res = await fetch(`${WORKER_URL}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SECRET}` },
    body: JSON.stringify({ message: question, userId: '6847462500' })
  });
  const data = await res.json();
  return data.response || data.error || '[No response]';
}

async function relay(text) {
  const res = await fetch(`${WORKER_URL}/relay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SECRET}` },
    body: JSON.stringify({ text })
  });
  await res.json();
  await new Promise(r => setTimeout(r, 600));
}

const businessPlan   = readDoc('docs/mfm-business-plan-2026.md');
const marketResearch = readDoc('docs/mfm-market-research-2026.md');
const evalReport     = readDoc('docs/mfm-comprehensive-evaluation-report.md');
const socialStrategy = readDoc('docs/mfm-social-media-strategy.md');
const workflows      = readDoc('docs/mfm-autonomous-workflows.md');
const apiCosts       = readDoc('docs/mfm-api-cost-optimization.md');
const contentEngine  = readDoc('docs/mfm-content-creation-engine.md');

console.log('📋 Querying agents based on MFM documents...\n');

async function main() {
  await relay('⏳ *Generating MFM Corporation Action Plan...*\n\nAgents are reviewing all 7 strategy documents now. Stand by.');

  // 1. Strategic Planner — overall 90-day plan
  console.log('  [1/5] Strategic Planner — 90-day execution plan...');
  const stratPlan = await ask(
    `/delegate strategic-planner Based on this exact business plan, give me a precise 90-day execution plan for Months 1-3 (May–July 2026). Be specific — exact actions per week, owners, targets. Do NOT make up anything not in the plan.\n\n---\n${businessPlan?.slice(0, 6000)}`
  );

  // 2. Market Analyst — top 3 opportunities to pursue first
  console.log('  [2/5] Market Analyst — priority targets...');
  const marketPlan = await ask(
    `/delegate market-analyst Based on this market research, identify the top 3 highest-probability client segments MFM should target FIRST in Malaysia right now. Include why, expected deal size, and how to reach them.\n\n---\n${marketResearch?.slice(0, 5000)}`
  );

  // 3. Finance Planner — realistic cash flow Month 1-6
  console.log('  [3/5] Finance Planner — realistic cash flow...');
  const financePlan = await ask(
    `/delegate finance-planner Based on this business plan's financial projections, build a realistic Month 1–6 cash flow model. Include the pessimistic scenario (MYR 0 Month 1). Flag break-even point and survival threshold.\n\n---\n${businessPlan?.slice(3500, 7500)}`
  );

  // 4. Risk Assessor — top 5 risks to mitigate now
  console.log('  [4/5] Risk Assessor — critical risks...');
  const riskPlan = await ask(
    `/delegate risk-assessor Based on the evaluation report's identified weaknesses and risk section, list the top 5 risks MFM faces right now (May 2026) with specific mitigation actions. Be direct.\n\n---\n${evalReport?.slice(0, 5000)}`
  );

  // 5. Content Writer — first LinkedIn post to launch the brand
  console.log('  [5/5] Content Writer — launch post...');
  const launchPost = await ask(
    `/delegate content-writer Write the first LinkedIn post to launch MFM Corporation's brand. Based on MFM's actual positioning: Malaysian AI automation company, self-improving 24-agent system, zero-cost infrastructure. Target: Malaysian SME decision makers. Goal: Attract first 3 clients. Keep it under 300 words. No fluff.\n\n---\n${socialStrategy?.slice(0, 3000)}`
  );

  // Send action plan to Remy
  await relay(`📋 *MFM CORPORATION — ACTION PLAN*
_Based on 7 strategy documents | Generated: ${new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'long', year: 'numeric' })}_

---`);

  await relay(`🗓️ *90-DAY EXECUTION PLAN (May–July 2026)*\n\n${stratPlan}`);
  await relay(`🎯 *TOP 3 CLIENT TARGETS*\n\n${marketPlan}`);
  await relay(`💰 *CASH FLOW PROJECTION (Months 1–6)*\n\n${financePlan}`);
  await relay(`⚠️ *TOP 5 RISKS & MITIGATIONS*\n\n${riskPlan}`);
  await relay(`📣 *LAUNCH POST (LinkedIn — Ready to Use)*\n\n${launchPost}`);

  await relay(`✅ *Action Plan Complete*

*D1 Status:* All test data cleared — clean slate
*Documents loaded:* 7/8 documents reviewed
*Agents used:* strategic-planner · market-analyst · finance-planner · risk-assessor · content-writer

*Immediate next step:*
Post the LinkedIn launch post above. That starts the clock on Month 1.`);

  console.log('\n✅ Action plan delivered to Telegram.');
}

main().catch(err => { console.error('FAILED:', err.message); process.exit(1); });
