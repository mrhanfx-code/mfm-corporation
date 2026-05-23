// Orchestrator — classifies CEO intent, routes to correct department agent

import { callLLM, parseJSON, MODELS } from './llm-client.js';
import { logDecision, getAllRecentTasks, getAllMetrics, getRecentTasks, clearAllMemory, updateRoutingScore, getTopPerformingAgents } from '../tools/d1-store.js';
import { syncRoutingDecision, syncCeoCommand } from '../tools/supabase-bridge.js';
import { reviewOutput } from './quality-reviewer.js';
import { AgentBase } from './agent-base.js';

import { OpsCoordinator } from '../agents/coo/ops-coordinator.js';
import { QualityOpsReviewer } from '../agents/coo/quality-ops-reviewer.js';
import { ProcessOptimizer } from '../agents/coo/process-optimizer.js';
import { DataGovernanceAgent } from '../agents/coo/data-governance-agent.js';
import { TechAdvisor } from '../agents/cto/tech-advisor.js';
import { DevOpsMonitor } from '../agents/cto/devops-monitor.js';
import { SecurityAuditor } from '../agents/cto/security-auditor.js';
import { IntegrationAgent } from '../agents/cto/integration-agent.js';
import { ContentWriter } from '../agents/cmo/content-writer.js';
import { MarketAnalyst } from '../agents/cmo/market-analyst.js';
import { CustomerSuccessAgent } from '../agents/cmo/customer-success-agent.js';
import { FinancePlanner } from '../agents/cfo/finance-planner.js';
import { RiskAssessor } from '../agents/cfo/risk-assessor.js';
import { ResearchAgent } from '../agents/cino/research-agent.js';
import { IdeaGenerator } from '../agents/cino/idea-generator.js';
import { TrendSpotter } from '../agents/cino/trend-spotter.js';
import { InnovationCoach } from '../agents/cino/innovation-coach.js';
import { McpLlmAgent } from '../agents/cino/mcp-llm-agent.js';

const ORCHESTRATOR_MODEL = MODELS.CEREBRAS_FAST;

const SYSTEM_PROMPT = `You are the General Manager of MFM Corporation, reporting directly to CEO Remy.
Your job is to classify the CEO's message and route it to the best agent.

Respond ONLY with valid JSON:
{
  "department": "coo|cto|cmo|cfo|cino|direct",
  "agent": "ops-coordinator|quality-ops-reviewer|process-optimizer|data-governance-agent|tech-advisor|devops-monitor|security-auditor|integration-agent|content-writer|market-analyst|customer-success-agent|finance-planner|risk-assessor|research-agent|idea-generator|trend-spotter|innovation-coach|mcp-llm-agent|direct",
  "task_type": "brief task description",
  "urgency": "high|medium|low",
  "reasoning": "one sentence"
}

Routing rules:
- coo/ops-coordinator: daily ops, scheduling, team tasks, coordination, processes
- coo/quality-ops-reviewer: review quality of work, output evaluation
- coo/process-optimizer: improve workflows, identify bottlenecks, efficiency
- coo/data-governance-agent: data privacy, PDPA Malaysia, compliance, data retention
- cto/tech-advisor: code, architecture, technical decisions, software, debugging
- cto/devops-monitor: deployment, infrastructure, system health, alerts
- cto/security-auditor: security issues, vulnerabilities, access control
- cto/integration-agent: API integrations, webhooks, third-party connections
- cmo/content-writer: write emails, posts, announcements, reports, copy
- cmo/market-analyst: market research, competitor analysis, industry news
- cmo/customer-success-agent: client relations, customer feedback, retention, support
- cfo/finance-planner: budgets, forecasts, costs, revenue, financial planning
- cfo/risk-assessor: risk analysis, mitigation, compliance, liability
- cino/research-agent: deep research on any topic, synthesis, citations
- cino/idea-generator: brainstorming, creative ideas, new concepts
- cino/trend-spotter: trends, emerging tech, market signals, opportunities
- cino/innovation-coach: refine ideas, Socratic questioning, strategy coaching
- cino/mcp-llm-agent: AI model evaluation, LLM benchmarks, MCP tools, AI adoption
- direct: greetings, slash commands (/start, /help, /status, /tasks, /metrics, /team, /memo, /clear)`;

const AGENT_MAP = {
  'ops-coordinator': OpsCoordinator,
  'quality-ops-reviewer': QualityOpsReviewer,
  'process-optimizer': ProcessOptimizer,
  'data-governance-agent': DataGovernanceAgent,
  'tech-advisor': TechAdvisor,
  'devops-monitor': DevOpsMonitor,
  'security-auditor': SecurityAuditor,
  'integration-agent': IntegrationAgent,
  'content-writer': ContentWriter,
  'market-analyst': MarketAnalyst,
  'customer-success-agent': CustomerSuccessAgent,
  'finance-planner': FinancePlanner,
  'risk-assessor': RiskAssessor,
  'research-agent': ResearchAgent,
  'idea-generator': IdeaGenerator,
  'trend-spotter': TrendSpotter,
  'innovation-coach': InnovationCoach,
  'mcp-llm-agent': McpLlmAgent
};

export async function routeMessage(message, userId, env) {
  const text = (message.text || '').trim();

  if (text.startsWith('/')) {
    return await handleSlashCommand(text, userId, env);
  }

  try {
    const topAgents = await getTopPerformingAgents(5, env);
    const perfHint = topAgents.length
      ? `\n\nRECENT TOP PERFORMERS (last 7 days): ${topAgents.map(a => `${a.agent} (avg score: ${Number(a.avg_score).toFixed(0)}/100)`).join(', ')}. Prefer these agents for similar tasks when appropriate.`
      : '';

    const routeResult = await callLLM(ORCHESTRATOR_MODEL, [
      { role: 'system', content: SYSTEM_PROMPT + perfHint },
      { role: 'user', content: text }
    ], env, { maxTokens: 150, temperature: 0.2 });

    const routing = parseJSON(routeResult.content);

    if (!routing || routing.department === 'direct') {
      return await handleDirect(text, userId, env);
    }

    await logDecision('orchestrator', text, routing.reasoning, routing.agent, 0.9, env);
    syncRoutingDecision({ agent: routing.agent, taskType: routing.task_type, reasoning: routing.reasoning, confidence: 0.9 }, env).catch(() => {});

    const AgentClass = AGENT_MAP[routing.agent];
    if (!AgentClass) return await handleDirect(text, userId, env);

    const agent = new AgentClass();
    const rawResponse = await agent.run(text, userId, env);

    const review = await reviewOutput(routing.agent, routing.task_type, rawResponse, env);
    updateRoutingScore(routing.agent, review.score, env).catch(() => {});
    const finalResponse = review.improved_response || rawResponse;
    const header = `*[${routing.agent.replace(/-/g, ' ').toUpperCase()}]* _(score: ${review.score}/100)_\n\n`;

    return header + finalResponse;

  } catch (err) {
    console.error('[Orchestrator] error:', err.message);
    return `⚠️ System error: ${err.message}. Please try again.`;
  }
}

async function handleSlashCommand(text, userId, env) {
  const spaceIdx = text.indexOf(' ');
  const cmd = spaceIdx === -1 ? text : text.slice(0, spaceIdx);
  const args = spaceIdx === -1 ? '' : text.slice(spaceIdx + 1).trim();

  switch (cmd) {
    case '/start':
      return `🚀 *MFM Corporation AI — Online*\n\n18 agents active across 5 departments.\nType any instruction — I route it to the right specialist.\n\nType /help for all agents.`;

    case '/help':
      return `🏢 *MFM Corporation — 18 Agents*\n\n*COO:* ops-coordinator · quality-ops-reviewer · process-optimizer · data-governance-agent\n*CTO:* tech-advisor · devops-monitor · security-auditor · integration-agent\n*CMO:* content-writer · market-analyst · customer-success-agent\n*CFO:* finance-planner · risk-assessor\n*CINO:* research-agent · idea-generator · trend-spotter · innovation-coach · mcp-llm-agent\n\n*Commands:* /status /tasks /metrics /team [name] /memo [text] /clear`;

    case '/status':
      return await getStatusReport(env);

    case '/tasks':
      return await getTasksReport(env);

    case '/metrics':
      return await getMetricsReport(env);

    case '/team':
      return await getTeamReport(args, env);

    case '/memo':
      if (!args) return '⚠️ Usage: /memo [message to broadcast]';
      return await broadcastMemo(args, userId, env);

    case '/clear':
      await clearAllMemory(userId, env);
      return '🧹 All agent conversation memory cleared.';

    default:
      return `❓ Unknown command: ${cmd}\nType /help for all commands.`;
  }
}

async function getStatusReport(env) {
  const tasks = await getAllRecentTasks(20, env);
  if (!tasks.length) return '📊 *System Status*\n\nNo tasks recorded yet. Send a message to activate agents.';

  const byAgent = {};
  for (const t of tasks) {
    if (!byAgent[t.agent]) byAgent[t.agent] = { count: 0, lastScore: 0, lastTime: '' };
    byAgent[t.agent].count++;
    byAgent[t.agent].lastScore = t.quality_score || 0;
    byAgent[t.agent].lastTime = t.created_at || '';
  }

  const lines = Object.entries(byAgent)
    .map(([agent, s]) => `• *${agent}* — ${s.count} task(s), last score: ${s.lastScore}/100`)
    .join('\n');

  return `📊 *MFM Corporation — Agent Status*\n\n${lines}\n\n_Last 20 tasks shown_`;
}

async function getTasksReport(env) {
  const tasks = await getAllRecentTasks(10, env);
  if (!tasks.length) return '📋 *Recent Tasks*\n\nNo completed tasks yet.';

  const lines = tasks.map((t, i) => {
    const input = (t.input || '').slice(0, 60).replace(/\n/g, ' ');
    return `${i + 1}. *${t.agent}* — "${input}..." (score: ${t.quality_score || '?'}/100)`;
  }).join('\n');

  return `📋 *Last 10 Tasks*\n\n${lines}`;
}

async function getMetricsReport(env) {
  const metrics = await getAllMetrics(7, env);
  if (!metrics.length) return '📈 *Metrics*\n\nNo metrics recorded yet.';

  const byAgent = {};
  for (const m of metrics) {
    if (!byAgent[m.agent]) byAgent[m.agent] = { tasks: 0, totalScore: 0, totalMs: 0, days: 0 };
    byAgent[m.agent].tasks += m.tasks_completed || 0;
    byAgent[m.agent].totalScore += m.avg_quality_score || 0;
    byAgent[m.agent].totalMs += m.avg_response_ms || 0;
    byAgent[m.agent].days++;
  }

  const lines = Object.entries(byAgent)
    .map(([agent, s]) => {
      const avgScore = s.days ? Math.round(s.totalScore / s.days) : 0;
      const avgMs = s.days ? Math.round(s.totalMs / s.days) : 0;
      return `• *${agent}* — ${s.tasks} tasks · avg score ${avgScore}/100 · avg ${avgMs}ms`;
    })
    .join('\n');

  return `📈 *Agent Metrics (7 days)*\n\n${lines}`;
}

async function getTeamReport(agentName, env) {
  if (!agentName) return '⚠️ Usage: /team [agent-name]\nExample: /team market-analyst';
  const tasks = await getRecentTasks(agentName, 5, env);
  if (!tasks.length) return `📁 *${agentName}*\n\nNo tasks recorded for this agent yet.`;

  const lines = tasks.map((t, i) => {
    const input = (t.input || '').slice(0, 80).replace(/\n/g, ' ');
    const output = (t.output || '').slice(0, 100).replace(/\n/g, ' ');
    return `${i + 1}. Q: "${input}..."\n   A: "${output}..." _(${t.quality_score || '?'}/100)_`;
  }).join('\n\n');

  return `📁 *${agentName} — Recent Tasks*\n\n${lines}`;
}

async function broadcastMemo(memoText, userId, env) {
  const writer = new ContentWriter();
  const prompt = `Draft a professional internal broadcast memo from CEO Remy to all department heads with this message: "${memoText}". Format it as a proper business memo.`;
  const draft = await writer.run(prompt, userId, env);
  return `📢 *Memo Drafted*\n\n${draft}\n\n_Send /memo [text] again after review to regenerate, or forward this directly._`;
}

async function handleDirect(text, userId, env) {
  const gm = new AgentBase({
    name: 'general-manager',
    model: MODELS.CEREBRAS_FAST,
    systemPrompt: `You are the General Manager of MFM Corporation, reporting to CEO Remy (Malaysia, UTC+8).
Answer general questions, provide status updates, and assist with anything not requiring a specialist.
Be concise, professional, and direct. No fluff.`
  });
  return await gm.run(text, userId, env);
}
