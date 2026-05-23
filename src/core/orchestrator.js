// Orchestrator — classifies CEO intent, routes to correct department agent

import { callLLM, parseJSON, MODELS } from './llm-client.js';
import { logDecision, getAllRecentTasks, getAllMetrics, getRecentTasks, clearAllMemory, updateRoutingScore, getTopPerformingAgents } from '../tools/d1-store.js';
import { nl2sqlQuery } from '../tools/nl2sql-tool.js';
import { syncRoutingDecision, syncCeoCommand } from '../tools/supabase-bridge.js';
import { reviewOutput } from './quality-reviewer.js';
import { AgentBase } from './agent-base.js';
import { buildContextCard } from './context-card.js';

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
import { SocialMediaAgent } from '../agents/cmo/social-media-agent.js';
import { FinancePlanner } from '../agents/cfo/finance-planner.js';
import { RiskAssessor } from '../agents/cfo/risk-assessor.js';
import { ResearchAgent } from '../agents/cino/research-agent.js';
import { IdeaGenerator } from '../agents/cino/idea-generator.js';
import { TrendSpotter } from '../agents/cino/trend-spotter.js';
import { InnovationCoach } from '../agents/cino/innovation-coach.js';
import { McpLlmAgent } from '../agents/cino/mcp-llm-agent.js';
import { LegalAdvisor } from '../agents/clo/legal-advisor.js';

const ORCHESTRATOR_MODEL = MODELS.CEREBRAS_FAST;

const SYSTEM_PROMPT = `You are the General Manager of MFM Corporation, reporting directly to CEO Remy.
Your job is to classify the CEO's message and route it to the best agent.

Respond ONLY with valid JSON:
{
  "department": "coo|cto|cmo|cfo|cino|clo|direct",
  "agent": "ops-coordinator|quality-ops-reviewer|process-optimizer|data-governance-agent|tech-advisor|devops-monitor|security-auditor|integration-agent|content-writer|market-analyst|customer-success-agent|social-media-agent|finance-planner|risk-assessor|research-agent|idea-generator|trend-spotter|innovation-coach|mcp-llm-agent|legal-advisor|direct",
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
- cmo/social-media-agent: post to Facebook, Instagram, TikTok; social media content, captions, hashtags, scheduling
- cfo/finance-planner: budgets, forecasts, costs, revenue, financial planning
- cfo/risk-assessor: risk analysis, mitigation, compliance, liability
- cino/research-agent: deep research on any topic, synthesis, citations
- cino/idea-generator: brainstorming, creative ideas, new concepts
- cino/trend-spotter: trends, emerging tech, market signals, opportunities
- cino/innovation-coach: refine ideas, Socratic questioning, strategy coaching
- cino/mcp-llm-agent: AI model evaluation, LLM benchmarks, MCP tools, AI adoption
- clo/legal-advisor: contracts, legal compliance, regulations, Malaysian law, IP, employment law, corporate governance, disputes, PDPA, SSM, Bank Negara, legal risk, NDA, terms of service
- direct: greetings, slash commands (/start, /help, /status, /tasks, /metrics, /team, /memo, /clear)`;

const PARALLEL_ROUTES = {
  'product-launch':   ['market-analyst', 'finance-planner', 'ops-coordinator'],
  'campaign':         ['content-writer', 'social-media-agent', 'market-analyst'],
  'quarterly-review': ['finance-planner', 'risk-assessor', 'process-optimizer'],
  'tech-build':       ['tech-advisor', 'security-auditor', 'integration-agent'],
};

const PARALLEL_KEYWORDS = {
  'product-launch':   ['product launch', 'go to market', 'go-to-market', 'launch plan', 'launch strategy'],
  'campaign':         ['marketing campaign', 'ad campaign', 'run a campaign', 'promotion campaign'],
  'quarterly-review': ['quarterly review', 'q1 review', 'q2 review', 'q3 review', 'q4 review', 'annual review', 'full review'],
  'tech-build':       ['architecture review', 'system design', 'tech stack review', 'full tech audit'],
};

// Agents that can take irreversible external actions
const APPROVAL_AGENTS = new Set(['social-media-agent', 'customer-success-agent', 'ops-coordinator']);
const APPROVAL_KEYWORDS = ['send email', 'email to', 'send to', 'post to', 'post on', 'publish', 'post facebook', 'post instagram', 'post tiktok', 'notify', 'let them know', 'announce to'];

function requiresApproval(agentName, text) {
  if (!APPROVAL_AGENTS.has(agentName)) return false;
  const lower = text.toLowerCase();
  return APPROVAL_KEYWORDS.some(k => lower.includes(k));
}

function detectParallelIntent(text) {
  const lower = text.toLowerCase();
  for (const [key, phrases] of Object.entries(PARALLEL_KEYWORDS)) {
    if (phrases.some(p => lower.includes(p))) return key;
  }
  return null;
}

async function runParallelAgents(agentNames, task, userId, env) {
  const contextCard = await buildContextCard('parallel-dispatch', env).catch(() => '');

  const settled = await Promise.allSettled(
    agentNames.map(name => {
      const AgentClass = AGENT_MAP[name];
      if (!AgentClass) return Promise.resolve({ name, output: '[Agent not found]', agent: null });
      const agent = new AgentClass();
      return agent.run(task, userId, env, { contextCard }).then(out => ({ name, output: out, agent }));
    })
  );

  const sections = await Promise.all(settled.map(async (r, i) => {
    const label = agentNames[i].replace(/-/g, ' ').toUpperCase();
    if (r.status === 'fulfilled') {
      const { output, agent } = r.value;
      const review = await reviewOutput(agentNames[i], 'parallel', output, env).catch(() => ({ score: 75, improved_response: null }));
      if (agent) agent.finalizeScore(review.score, env).catch(() => {});
      updateRoutingScore(agentNames[i], review.score, env).catch(() => {});
      return `*[${label}]* _(${review.score}/100)_\n\n${review.improved_response || output}`;
    }
    return `*[${label}]*\n\n⚠️ ${r.reason?.message || 'Error'}`;
  }));

  return `🔄 *PARALLEL BRIEFING — ${agentNames.length} specialists*\n\n` + sections.join('\n\n---\n\n');
}

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
  'social-media-agent': SocialMediaAgent,
  'finance-planner': FinancePlanner,
  'risk-assessor': RiskAssessor,
  'research-agent': ResearchAgent,
  'idea-generator': IdeaGenerator,
  'trend-spotter': TrendSpotter,
  'innovation-coach': InnovationCoach,
  'mcp-llm-agent': McpLlmAgent,
  'legal-advisor': LegalAdvisor
};

export async function routeMessage(message, userId, env) {
  const text = (message.text || '').trim();

  if (text.startsWith('/')) {
    return await handleSlashCommand(text, userId, env);
  }

  const parallelKey = detectParallelIntent(text);
  if (parallelKey) {
    return await runParallelAgents(PARALLEL_ROUTES[parallelKey], text, userId, env);
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

    // Build context card (Dossier pattern)
    const contextCard = await buildContextCard(routing.agent, env);
    const agentOptions = { contextCard };

    // CEO approval gate (LangGraph human-in-the-loop pattern)
    if (requiresApproval(routing.agent, text)) {
      const agent = new AgentClass();
      const draft = await agent.run(text, userId, env, { ...agentOptions, draftMode: true });

      await env.KV.put(
        `pending:${userId}`,
        JSON.stringify({ text, agentName: routing.agent }),
        { expirationTtl: 3600 }
      );

      return `📋 *[DRAFT — ${routing.agent.replace(/-/g, ' ').toUpperCase()}]*\n\n${draft}\n\n---\n✅ Reply */approve* to execute  |  ❌ Reply */reject* to cancel\n_(Expires in 1 hour)_`;
    }

    const agent = new AgentClass();
    const rawResponse = await agent.run(text, userId, env, agentOptions);

    const review = await reviewOutput(routing.agent, routing.task_type, rawResponse, env);
    updateRoutingScore(routing.agent, review.score, env).catch(() => {});
    agent.finalizeScore(review.score, env).catch(() => {});
    const finalResponse = review.improved_response || rawResponse;
    const header = `*[${routing.agent.replace(/-/g, ' ').toUpperCase()}]* _(score: ${review.score}/100)_\n\n`;
    const output = header + finalResponse;
    syncCeoCommand({ command: text, userId, response: output }, env).catch(() => {});
    return output;

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
      return `🚀 *MFM Corporation AI — Online*\n\n20 agents active across 6 departments.\nType any instruction — I route it to the right specialist.\n\nType /help for all agents.`;

    case '/help':
      return `🏢 *MFM Corporation — 20 Agents*\n\n*COO:* ops-coordinator · quality-ops-reviewer · process-optimizer · data-governance-agent\n*CTO:* tech-advisor · devops-monitor · security-auditor · integration-agent\n*CMO:* content-writer · market-analyst · customer-success-agent · social-media-agent\n*CFO:* finance-planner · risk-assessor\n*CINO:* research-agent · idea-generator · trend-spotter · innovation-coach · mcp-llm-agent\n*CLO:* legal-advisor\n\n*Commands:* /status /tasks /metrics /team [name] /memo [text] /clear /query [question] /approve /reject`;

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

    case '/approve': {
      if (!env.KV) return '⚠️ KV not configured.';
      const raw = await env.KV.get(`pending:${userId}`);
      if (!raw) return '⚠️ No pending action found. It may have expired (1h TTL).';
      const { text: pendingText, agentName } = JSON.parse(raw);
      await env.KV.delete(`pending:${userId}`);
      const AgentClass = AGENT_MAP[agentName];
      if (!AgentClass) return '⚠️ Agent not found for pending action.';
      const contextCard = await buildContextCard(agentName, env);
      const agentInst = new AgentClass();
      const result = await agentInst.run(pendingText, userId, env, { contextCard });
      const review = await reviewOutput(agentName, 'approved-action', result, env);
      updateRoutingScore(agentName, review.score, env).catch(() => {});
      return `✅ *Approved & Executed — [${agentName.replace(/-/g, ' ').toUpperCase()}]*\n\n${review.improved_response || result}`;
    }

    case '/reject': {
      if (!env.KV) return '⚠️ KV not configured.';
      const pending = await env.KV.get(`pending:${userId}`);
      if (!pending) return '⚠️ No pending action to cancel.';
      await env.KV.delete(`pending:${userId}`);
      return '❌ Action cancelled and discarded.';
    }

    case '/query':
      if (!args) return '⚠️ Usage: /query [natural language question]\nExample: /query show me the top 5 agents by quality score this week';
      return await nl2sqlQuery(args, env);

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
