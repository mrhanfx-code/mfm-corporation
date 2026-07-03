// Context Card — Dossier-inspired structured context injected into every agent call
// Gives each agent precise situational awareness before it processes the CEO's request

import { getTopPerformingAgents, getAllRecentTasks } from '../tools/d1-store.js';

export async function buildContextCard(agentName, env) {
  const cacheKey = `ctx:${agentName}:${Math.floor(Date.now() / 30000)}`;
  if (env.KV) {
    const cached = await env.KV.get(cacheKey);
    if (cached) return cached;
  }

  try {
    const [topAgents, recentTasks] = await Promise.all([
      getTopPerformingAgents(3, env),
      getAllRecentTasks(5, env)
    ]);

    const myt = new Date().toLocaleString('en-MY', {
      timeZone: 'Asia/Kuala_Lumpur',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const lines = [
      `COMPANY: MFM Corporation  |  CEO: Remy  |  MYT: ${myt}  |  You are: ${agentName}`,
      `IDENTITY: Malaysian AI automation startup (KL). Sells AI agent services + social media management to SEA SMEs. Zero-cost bootstrapped. NOT a manufacturer. NOT hardware. Solo founder + AI agents.`,
      `REVENUE MODEL: Service (project-based) → SaaS (agent templates). Year 1 target: MYR 60K-120K. Free infra: Cloudflare Workers + OpenRouter free tier.`
    ];

    if (topAgents.length) {
      lines.push(
        `TOP AGENTS (7d): ${topAgents.map(a => `${a.agent} ${Number(a.avg_score).toFixed(0)}/100`).join(' · ')}`
      );
    }

    if (recentTasks.length) {
      const recent = recentTasks.slice(0, 3)
        .map(t => `[${t.agent}] "${(t.input || '').replace(/\n/g, ' ').slice(0, 55)}"`)
        .join(' | ');
      lines.push(`RECENT CEO TASKS: ${recent}`);
    }

    const card = lines.join('\n');
    if (env.KV) env.KV.put(cacheKey, card, { expirationTtl: 45 }).catch(() => {});
    return card;
  } catch {
    const myt = new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium' });
    const card = `COMPANY: MFM Corporation | CEO: Remy | MYT: ${myt} | You are: ${agentName}\nIDENTITY: Malaysian AI automation startup (KL). Sells AI agent services to SEA SMEs. NOT a manufacturer.`;
    if (env.KV) env.KV.put(cacheKey, card, { expirationTtl: 45 }).catch(() => {});
    return card;
  }
}
