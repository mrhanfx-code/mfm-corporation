// Context Card — Dossier-inspired structured context injected into every agent call
// Gives each agent precise situational awareness before it processes the CEO's request

import { getTopPerformingAgents, getAllRecentTasks } from '../tools/d1-store.js';

export async function buildContextCard(agentName, env) {
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
      `COMPANY: MFM Corporation  |  CEO: Remy  |  MYT: ${myt}  |  You are: ${agentName}`
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

    return lines.join('\n');
  } catch {
    const myt = new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium' });
    return `COMPANY: MFM Corporation | CEO: Remy | MYT: ${myt} | You are: ${agentName}`;
  }
}
