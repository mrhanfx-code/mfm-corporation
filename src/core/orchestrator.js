// Orchestrator — classifies CEO intent, routes to correct department agent

import { callLLM, parseJSON, MODELS } from './llm-client.js';
import { alertLowQualityScore } from '../tools/alerting.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { runPanel, PANELS, shouldUsePanel, pickPanel } from './multi-agent-panel.js';
import { logDecision, getAllRecentTasks, getAllMetrics, getRecentTasks, clearAllMemory, getTopPerformingAgents, updateRoutingScore, setTaskContentType } from '../tools/d1-store.js';
import { nl2sqlQuery } from '../tools/nl2sql-tool.js';
import { syncRoutingDecision, syncCeoCommand } from '../tools/supabase-bridge.js';
import { reviewOutput } from './quality-reviewer.js';
import { AgentBase } from './agent-base.js';
import { buildContextCard } from './context-card.js';
import { emitAgentStatus } from '../tools/dashboard-events.js';

import { OpsCoordinator } from '../agents/coo/ops-coordinator.js';
import { StrategicPlanner } from '../agents/coo/strategic-planner.js';
import { QualityOpsReviewer } from '../agents/coo/quality-ops-reviewer.js';
import { ProcessOptimizer } from '../agents/coo/process-optimizer.js';
import { DataGovernanceAgent } from '../agents/coo/data-governance-agent.js';
import { MeetingScheduler } from '../agents/coo/meeting-scheduler.js';
import { ReportingAnalyst } from '../agents/coo/reporting-analyst.js';
import { ProjectManager } from '../agents/coo/project-manager.js';
import { NotificationManager } from '../agents/coo/notification-manager.js';
import { GoogleDriveAgent } from '../agents/coo/google-drive-agent.js';
import { AnalyticsReporter } from '../agents/coo/analytics-reporter.js';
import { PDFGenerator } from '../agents/coo/pdf-generator.js';
import { QualityControlManager } from '../agents/coo/quality-control-manager.js';
import { TechAdvisor } from '../agents/cto/tech-advisor.js';
import { DevelopmentAdvisor } from '../agents/cto/development-advisor.js';
import { DevOpsMonitor } from '../agents/cto/devops-monitor.js';
import { SecurityAuditor } from '../agents/cto/security-auditor.js';
import { IntegrationAgent } from '../agents/cto/integration-agent.js';
import { FrontendDeveloper } from '../agents/cto/frontend-developer.js';
import { BackendDeveloper } from '../agents/cto/backend-developer.js';
import { QAEngineer } from '../agents/cto/qa-engineer.js';
import { DatabaseSpecialist } from '../agents/cto/database-specialist.js';
import { CloudEngineer } from '../agents/cto/cloud-engineer.js';
import { ContentWriter } from '../agents/cmo/content-writer.js';
import { MediaContentDirector } from '../agents/cmo/media-content-director.js';
import { MediaProducer } from '../agents/cmo/media-producer.js';
import { MarketAnalyst } from '../agents/cmo/market-analyst.js';
import { CustomerSuccessAgent } from '../agents/cmo/customer-success-agent.js';
import { SocialMediaAgent } from '../agents/cmo/social-media-agent.js';
import { EmailMarketingAgent } from '../agents/cmo/email-marketing-agent.js';
import { FinancePlanner } from '../agents/cfo/finance-planner.js';
import { RiskAssessor } from '../agents/cfo/risk-assessor.js';
import { GrantTracker } from '../agents/cfo/grant-tracker.js';
import { RevenueAnalyst } from '../agents/cfo/revenue-analyst.js';
import { ResearchAgent } from '../agents/cino/research-agent.js';
import { InnovationAnalyst } from '../agents/cino/innovation-analyst.js';
import { IdeaGenerator } from '../agents/cino/idea-generator.js';
import { TrendSpotter } from '../agents/cino/trend-spotter.js';
import { InnovationCoach } from '../agents/cino/innovation-coach.js';
import { McpLlmAgent } from '../agents/cino/mcp-llm-agent.js';
import { TechnologyTracker } from '../agents/cino/technology-tracker.js';
import { DataAnalyst } from '../agents/cino/data-analyst.js';
import { LegalAdvisor } from '../agents/clo/legal-advisor.js';
import { generateImage, formatImageResponse } from '../tools/image-tool.js';
import { createRepo, pushFile, pushMultipleFiles, listRepos, triggerWorkflow } from '../tools/github-tool.js';
import { submitRenderingJob, queueRenderingJob, estimateCost } from '../tools/fal-ai-wrapper.js';

const ORCHESTRATOR_MODEL = MODELS.CEREBRAS_FAST;

const SYSTEM_PROMPT = `You are the General Manager of MFM Corporation, reporting directly to CEO Remy.
Your job is to classify the CEO's message and route it to the best agent.

COMPANY IDENTITY (memorise this — never invent alternative descriptions):
- MFM Corporation is a Malaysian AI automation startup, founded by CEO Remy, headquartered in Kuala Lumpur.
- Business: We sell AI automation services, custom agent development, and social media management to Malaysian SMEs and SEA businesses.
- Model: Zero-cost bootstrapped (Cloudflare Workers, free-tier LLMs). Service revenue funds SaaS product development.
- Revenue target: MYR 60,000–120,000 Year 1; MYR 500,000–1,000,000 by Year 3.
- Core product: A 24-agent AI system (this system) that runs the company autonomously via Telegram.
- Market: AI agents market USD 11.55B globally (2026), 43.57% CAGR. Malaysia: 73% of 2.4M AI-using businesses still at basic adoption — our target gap.
- MFM is NOT a manufacturing company. MFM is NOT a hardware company. MFM has NO physical products.
- Team: Solo founder (CEO Remy) + AI agents. First contractor planned at Month 3.

Respond ONLY with valid JSON:
{
  "department": "coo|cto|cmo|cfo|cino|clo|direct",
  "agent": "ops-coordinator|quality-ops-reviewer|process-optimizer|data-governance-agent|strategic-planner|meeting-scheduler|reporting-analyst|project-manager|notification-manager|google-drive-agent|analytics-reporter|pdf-generator|quality-control-manager|tech-advisor|devops-monitor|security-auditor|integration-agent|development-advisor|frontend-developer|backend-developer|qa-engineer|database-specialist|cloud-engineer|content-writer|media-content-director|market-analyst|customer-success-agent|social-media-agent|media-producer|email-marketing-agent|finance-planner|risk-assessor|grant-tracker|revenue-analyst|research-agent|idea-generator|trend-spotter|innovation-coach|innovation-analyst|mcp-llm-agent|technology-tracker|data-analyst|legal-advisor|direct",
  "task_type": "brief task description",
  "urgency": "high|medium|low",
  "reasoning": "one sentence"
}

Routing rules:
- coo/ops-coordinator: daily ops, scheduling, team tasks, coordination, processes
- coo/quality-ops-reviewer: review quality of work, output evaluation
- coo/process-optimizer: improve workflows, identify bottlenecks, efficiency
- coo/data-governance-agent: data privacy, PDPA Malaysia, compliance, data retention
- coo/strategic-planner: project plans, roadmaps, resource allocation, execution strategy, milestones
- coo/meeting-scheduler: book meetings, find free slots, send invites via Google Calendar
- coo/reporting-analyst: compile business reports, weekly summaries, performance dashboards, executive briefs
- coo/project-manager: end-to-end project tracking, WBS, milestone management, cross-team coordination
- coo/notification-manager: compose and dispatch alerts across email, Slack, SMS
- coo/google-drive-agent: read/write/search documents in Google Drive
- coo/analytics-reporter: interpret D1 metrics, agent performance analysis, business KPIs
- coo/pdf-generator: convert content into professional PDF documents
- coo/quality-control-manager: cross-departmental quality authority, score outputs 0-100, audit processes
- cto/tech-advisor: code, architecture, technical decisions, software, debugging
- cto/devops-monitor: deployment, infrastructure, system health, alerts
- cto/security-auditor: security issues, vulnerabilities, access control
- cto/integration-agent: API integrations, webhooks, third-party connections
- cto/development-advisor: software development planning, build advice, dev team guidance, code strategy
- cto/frontend-developer: React, Tailwind CSS, Cloudflare Pages, UI/UX implementation
- cto/backend-developer: Cloudflare Workers, D1 SQLite, KV, R2, API design
- cto/qa-engineer: test plans, bug triage, test automation, code review
- cto/database-specialist: D1 schema design, query optimisation, migrations, data governance
- cto/cloud-engineer: Cloudflare platform, wrangler, edge deployment, free tier limits
- cmo/content-writer: write emails, posts, announcements, reports, copy
- cmo/media-content-director: storyboard generation, structured video content planning, platform-specific captions, rendering instructions
- cmo/market-analyst: market research, competitor analysis, industry news
- cmo/customer-success-agent: client relations, customer feedback, retention, support
- cmo/social-media-agent: post to Facebook, Instagram, TikTok; social media content, captions, hashtags, scheduling
- cmo/media-producer: video production, podcast, multimedia briefs, visual brand campaigns, content production strategy
- cmo/email-marketing-agent: email campaigns, newsletters, cold outreach, nurture sequences, SendGrid
- cfo/finance-planner: budgets, forecasts, costs, revenue, financial planning
- cfo/risk-assessor: risk analysis, mitigation, compliance, liability
- cfo/grant-tracker: identify and track Malaysian grants (MDEC, SME Corp, Cradle), eligibility, deadlines
- cfo/revenue-analyst: revenue tracking, MRR/ARR, pipeline, MYR 60K-120K target progress
- cino/research-agent: deep research on any topic, synthesis, citations
- cino/idea-generator: brainstorming, creative ideas, new concepts
- cino/trend-spotter: trends, emerging tech, market signals, opportunities
- cino/innovation-coach: refine ideas, Socratic questioning, strategy coaching
- cino/innovation-analyst: patent research, breakthrough technology analysis, competitive innovation tracking, technology evaluation
- cino/mcp-llm-agent: AI model evaluation, LLM benchmarks, MCP tools, AI adoption
- cino/technology-tracker: monitor new AI tools, frameworks, LLMs, platforms for MFM competitive edge
- cino/data-analyst: statistical analysis, D1 data interpretation, forecasting, anomaly detection
- clo/legal-advisor: contracts, legal compliance, regulations, Malaysian law, IP, employment law, corporate governance, disputes, PDPA, SSM, Bank Negara, legal risk, NDA, terms of service
- direct: greetings, slash commands (/start, /help, /status, /tasks, /metrics, /team, /memo, /clear)

SPECIAL CAPABILITIES (handled automatically before agent routing):
- Image generation: triggered by keywords like "generate image", "create image", "image of X", "picture of X" — uses Cloudflare Workers AI (Flux model, free)
- GitHub operations: "create repo named X", "list my repos" — uses GitHub API (free tier)`;

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

// Agents that ALWAYS require CEO approval before executing (irreversible external actions)
const ALWAYS_APPROVE_AGENTS = new Set(['social-media-agent']);

// Agents that require approval only on specific action keywords
const APPROVAL_AGENTS = new Set(['customer-success-agent', 'ops-coordinator']);
const APPROVAL_KEYWORDS = ['send email', 'email to', 'send to', 'post to', 'post on', 'publish', 'post facebook', 'post instagram', 'post tiktok', 'notify', 'let them know', 'announce to'];

function requiresApproval(agentName, text) {
  // Social media ALWAYS requires approval — no keyword check needed
  if (ALWAYS_APPROVE_AGENTS.has(agentName)) return true;
  if (!APPROVAL_AGENTS.has(agentName)) return false;
  const lower = text.toLowerCase();
  return APPROVAL_KEYWORDS.some(k => lower.includes(k));
}

function detectContentType(agentName, text) {
  const lower = text.toLowerCase();
  
  // Video-related content
  if (agentName === 'media-producer' || 
      lower.includes('video') || 
      lower.includes('reel') || 
      lower.includes('tiktok') && lower.includes('video')) {
    return 'video';
  }
  
  // Social media publishing
  if (ALWAYS_APPROVE_AGENTS.has(agentName) || 
      lower.includes('post to') || 
      lower.includes('post on') || 
      lower.includes('publish')) {
    return 'social_publish';
  }
  
  // Email-related content
  if (agentName === 'email-marketing-agent' || 
      lower.includes('send email') || 
      lower.includes('email to') || 
      lower.includes('newsletter')) {
    return 'email';
  }
  
  return 'general';
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
      return `*[${label}]* _(${review.score}/100)_\n\n${review.improved_response || output}`;
    }
    return `*[${label}]*\n\n⚠️ ${r.reason?.message || 'Error'}`;
  }));

  return `🔄 *PARALLEL BRIEFING — ${agentNames.length} specialists*\n\n` + sections.join('\n\n---\n\n');
}

const PANEL_AGENT_REGISTRY = {
  'research-agent':     () => new ResearchAgent(),
  'strategic-planner':  () => new StrategicPlanner(),
  'risk-assessor':      () => new RiskAssessor(),
  'development-advisor':() => new DevelopmentAdvisor(),
  'tech-advisor':       () => new TechAdvisor(),
  'security-auditor':   () => new SecurityAuditor(),
  'content-writer':     () => new ContentWriter(),
  'media-content-director': () => new MediaContentDirector(),
  'market-analyst':     () => new MarketAnalyst(),
  'media-producer':     () => new MediaProducer(),
  'innovation-analyst': () => new InnovationAnalyst(),
  'trend-spotter':      () => new TrendSpotter(),
  'idea-generator':     () => new IdeaGenerator(),
  'ops-coordinator':    () => new OpsCoordinator(),
  'finance-planner':    () => new FinancePlanner(),
  'legal-advisor':      () => new LegalAdvisor(),
  'meeting-scheduler':  () => new MeetingScheduler(),
  'project-manager':    () => new ProjectManager(),
  'backend-developer':  () => new BackendDeveloper(),
  'frontend-developer': () => new FrontendDeveloper(),
  'qa-engineer':        () => new QAEngineer(),
  'database-specialist':() => new DatabaseSpecialist(),
  'cloud-engineer':     () => new CloudEngineer(),
  'grant-tracker':      () => new GrantTracker(),
  'revenue-analyst':    () => new RevenueAnalyst(),
  'technology-tracker': () => new TechnologyTracker(),
  'data-analyst':       () => new DataAnalyst(),
  'email-marketing-agent': () => new EmailMarketingAgent(),
  'google-drive-agent': () => new GoogleDriveAgent(),
  'analytics-reporter': () => new AnalyticsReporter(),
  'pdf-generator':      () => new PDFGenerator(),
  'notification-manager':() => new NotificationManager(),
  'quality-control-manager': () => new QualityControlManager(),
};

const AGENT_MAP = {
  'ops-coordinator': OpsCoordinator,
  'quality-ops-reviewer': QualityOpsReviewer,
  'process-optimizer': ProcessOptimizer,
  'data-governance-agent': DataGovernanceAgent,
  'strategic-planner': StrategicPlanner,
  'meeting-scheduler': MeetingScheduler,
  'reporting-analyst': ReportingAnalyst,
  'project-manager': ProjectManager,
  'notification-manager': NotificationManager,
  'google-drive-agent': GoogleDriveAgent,
  'analytics-reporter': AnalyticsReporter,
  'pdf-generator': PDFGenerator,
  'quality-control-manager': QualityControlManager,
  'tech-advisor': TechAdvisor,
  'devops-monitor': DevOpsMonitor,
  'security-auditor': SecurityAuditor,
  'integration-agent': IntegrationAgent,
  'development-advisor': DevelopmentAdvisor,
  'frontend-developer': FrontendDeveloper,
  'backend-developer': BackendDeveloper,
  'qa-engineer': QAEngineer,
  'database-specialist': DatabaseSpecialist,
  'cloud-engineer': CloudEngineer,
  'content-writer': ContentWriter,
  'media-content-director': MediaContentDirector,
  'market-analyst': MarketAnalyst,
  'customer-success-agent': CustomerSuccessAgent,
  'social-media-agent': SocialMediaAgent,
  'media-producer': MediaProducer,
  'email-marketing-agent': EmailMarketingAgent,
  'finance-planner': FinancePlanner,
  'risk-assessor': RiskAssessor,
  'grant-tracker': GrantTracker,
  'revenue-analyst': RevenueAnalyst,
  'research-agent': ResearchAgent,
  'idea-generator': IdeaGenerator,
  'trend-spotter': TrendSpotter,
  'innovation-coach': InnovationCoach,
  'innovation-analyst': InnovationAnalyst,
  'mcp-llm-agent': McpLlmAgent,
  'technology-tracker': TechnologyTracker,
  'data-analyst': DataAnalyst,
  'legal-advisor': LegalAdvisor,
};

export async function routeMessage(message, userId, env) {
  const text = (message.text || '').trim();
  const isUrgent = message.urgent || false;

  if (text.startsWith('/')) {
    return await handleSlashCommand(text, userId, env);
  }

  const lowerText = text.toLowerCase();

  // ── Tool/secret status intercept — never route to LLM ──
  const toolQueryKw = ['what tools', 'which tools', 'tools configured', 'what secrets', 'which secrets', 'secrets configured', 'api keys', 'what api', 'missing keys', 'what is configured', "what's configured", 'tool status', 'secret status', 'check secrets', 'check tools'];
  if (toolQueryKw.some(k => lowerText.includes(k))) {
    return getToolsStatus(env);
  }

  // ── Image generation intercept ──
  const imgKeywords = ['generate image', 'create image', 'make image', 'draw image', 'generate a picture', 'create a picture', 'generate picture', 'make a picture', 'generate photo', 'create photo', 'image of ', 'picture of ', 'illustration of ', 'generate an image', 'create an image'];
  if (imgKeywords.some(k => lowerText.includes(k))) {
    const prompt = text.replace(/^(generate|create|make|draw)\s+(an?\s+)?(image|picture|photo|illustration)\s+(of\s+)?/i, '').trim() || text;
    const result = await generateImage(prompt, env);
    if (result.error) return `⚠️ Image generation failed: ${result.error}`;
    const workerHost = `mfm-corporation-telegram-bot.mrhan-fx.workers.dev`;
    const formatted = formatImageResponse(result, workerHost);
    return typeof formatted === 'string' ? formatted : formatted.text;
  }

  // ── GitHub / code creation intercept ──
  const ghCreateRepo = /create\s+(a\s+)?(new\s+)?repo(sitory)?\s+(?:named?\s+|called?\s+)?([\w-]+)/i.exec(text);
  if (ghCreateRepo) {
    const repoName = ghCreateRepo[4];
    const desc = text.replace(ghCreateRepo[0], '').trim() || '';
    const result = await createRepo(repoName, desc, env);
    if (result.error) return `⚠️ GitHub error: ${result.error}`;
    return `✅ *Repository created!*\n\n📁 **Name:** ${result.name}\n🔗 **URL:** ${result.url}\n🔒 Private: yes\n\nYou can now ask me to push code files to it.`;
  }

  const ghListRepos = /(list|show|what are)\s+(my\s+)?(github\s+)?repos(itories)?/i.test(text);
  if (ghListRepos) {
    const result = await listRepos(env);
    if (result.error) return `⚠️ GitHub error: ${result.error}`;
    const repoList = result.repos.slice(0, 15).map(r => `• [${r.name}](${r.url}) ${r.private ? '🔒' : '🌐'}`).join('\n');
    return `📁 *Your GitHub Repositories (${result.repos.length}):*\n\n${repoList}`;
  }

  const parallelKey = detectParallelIntent(text);
  if (parallelKey) {
    return await runParallelAgents(PARALLEL_ROUTES[parallelKey], text, userId, env);
  }

  // Auto-panel: complex decisions get multi-agent debate
  if (shouldUsePanel(text)) {
    const panelKey = pickPanel(text);
    const panel = PANELS[panelKey];
    const panelAgents = panel.agentNames
      .map(n => PANEL_AGENT_REGISTRY[n]?.())
      .filter(Boolean);
    return await runPanel(text, panelAgents, userId, env);
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
    if (requiresApproval(routing.agent, text) && !isUrgent) {
      const agent = new AgentClass();
      const draft = await agent.run(text, userId, env, { ...agentOptions, draftMode: true });

      const contentType = detectContentType(routing.agent, text);

      if (env.KV) {
        await env.KV.put(
          `pending:${userId}`,
          JSON.stringify({ text, agentName: routing.agent, contentType }),
          { expirationTtl: 3600 }
        );
      }

      const isSocial = ALWAYS_APPROVE_AGENTS.has(routing.agent);
      const isVideo = contentType === 'video';
      const isEmail = contentType === 'email';
      
      let approvalMsg;
      if (isSocial) {
        approvalMsg = `📱 *[SOCIAL MEDIA DRAFT — AWAITING YOUR APPROVAL]*\n\n${draft}\n\n---\n⚠️ *Nothing has been posted yet.*\n✅ Reply */approve* to post now  |  ❌ Reply */reject* to cancel\n_(Auto-expires in 1 hour)_`;
      } else if (isVideo) {
        approvalMsg = `🎬 *[VIDEO DRAFT — AWAITING YOUR APPROVAL]*\n\n${draft}\n\n---\n⚠️ *Video rendering will trigger after approval.*\n✅ Reply */approve* to render  |  ❌ Reply */reject* to cancel\n_(Auto-expires in 1 hour)_`;
      } else if (isEmail) {
        approvalMsg = `📧 *[EMAIL DRAFT — AWAITING YOUR APPROVAL]*\n\n${draft}\n\n---\n⚠️ *Email will be sent after approval.*\n✅ Reply */approve* to send  |  ❌ Reply */reject* to cancel\n_(Auto-expires in 1 hour)_`;
      } else {
        approvalMsg = `📋 *[DRAFT — ${routing.agent.replace(/-/g, ' ').toUpperCase()}]*\n\n${draft}\n\n---\n✅ Reply */approve* to execute  |  ❌ Reply */reject* to cancel\n_(Expires in 1 hour)_`;
      }
      return approvalMsg;
    }

    const agent = new AgentClass();
    const rawResponse = await agent.run(text, userId, env, agentOptions);

    const review = await reviewOutput(routing.agent, routing.task_type, rawResponse, env);
    agent.finalizeScore(review.score, env).catch(() => {});
    updateRoutingScore(routing.agent, review.score, env).catch(() => {});
    alertLowQualityScore(routing.agent, review.score, env).catch(() => {});

    // ── Compulsory error recovery: 3 low-quality responses → research-agent intervenes ──
    if (env.KV && routing.agent !== 'research-agent') {
      const failKey = `fail:${routing.agent}`;
      if (review.score < 50) {
        const fails = parseInt(await env.KV.get(failKey) || '0') + 1;
        await env.KV.put(failKey, String(fails), { expirationTtl: 3600 });
        if (fails >= 3) {
          await env.KV.delete(failKey);
          const recoveryAgent = new ResearchAgent();
          const recoveryTask = `[COMPULSORY ERROR RECOVERY] Agent "${routing.agent}" has failed 3 times.\n\nOriginal task: ${text}\n\nFailed response (score ${review.score}/100): ${rawResponse.slice(0, 600)}\n\nAnalyse why that answer was poor and deliver a correct, high-quality answer instead.`;
          const recoveryCtx = await buildContextCard('research-agent', env).catch(() => '');
          const recovery = await recoveryAgent.run(recoveryTask, userId, env, { contextCard: recoveryCtx });
          return `🔬 *[RESEARCH AGENT — ERROR RECOVERY]*\n_${routing.agent} failed 3 times. Research Team intervened._\n\n${recovery}`;
        }
      } else {
        env.KV.delete(failKey).catch(() => {});
      }
    }

    const finalResponse = review.improved_response || rawResponse;
    const header = `*[${routing.agent.replace(/-/g, ' ').toUpperCase()}]* _(score: ${review.score}/100)_\n\n`;
    const output = header + finalResponse;
    syncCeoCommand({ command: text, userId, response: output }, env).catch(() => {});
    
    // Emit dashboard event for agent status
    emitAgentStatus(env, routing.agent, 'active', text).catch(() => {});
    
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
      return `🚀 *MFM Corporation AI — Online*\n\n43 agents active across 6 departments.\nType any instruction — I route it to the right specialist.\nComplex questions auto-trigger a panel debate between agents.\n\nType /help for all agents and commands.`;

    case '/help':
      return `🏢 *MFM Corporation — 43 Agents*\n\n*COO:* ops-coordinator · quality-ops-reviewer · process-optimizer · data-governance-agent · strategic-planner\n*CTO:* tech-advisor · devops-monitor · security-auditor · integration-agent · development-advisor\n*CMO:* content-writer · market-analyst · customer-success-agent · social-media-agent · media-producer\n*CFO:* finance-planner · risk-assessor\n*CINO:* research-agent · idea-generator · trend-spotter · innovation-coach · innovation-analyst · mcp-llm-agent\n*CLO:* legal-advisor\n\n*Panel Debate* (agents argue for best answer):\n/panel strategy [question]\n/panel technical [question]\n/panel content [question]\n/panel innovation [question]\n/panel operations [question]\n/panel fullboard [question]\n_Complex questions auto-trigger a panel._\n\n*Commands:*\n/briefing — daily report (5 agents)\n/delegate [agent] [task] — direct to specific agent\n/status /tasks /metrics /team [name]\n/memo [text] /clear /query [q]\n/approve /reject /urgent\n/to [agent] /draft [agent] /follow [id]\n/cbstatus /panel\n/tools — show all configured API keys and secrets`;

    case '/image': {
      if (!args) return `Usage: /image [prompt]\nExample: /image a futuristic office building in Kuala Lumpur`;
      const imgResult = await generateImage(args, env);
      if (imgResult.error) return `⚠️ ${imgResult.error}`;
      const formatted = formatImageResponse(imgResult, 'mfm-corporation-telegram-bot.mrhan-fx.workers.dev');
      return typeof formatted === 'string' ? formatted : formatted.text;
    }

    case '/github': {
      const sub = args.split(' ')[0];
      const rest = args.slice(sub.length).trim();
      if (sub === 'repos') {
        const r = await listRepos(env);
        if (r.error) return `⚠️ ${r.error}`;
        return `📁 *Repos (${r.repos.length}):*\n` + r.repos.slice(0, 15).map(x => `• ${x.full_name} ${x.private ? '🔒' : '🌐'} — ${x.url}`).join('\n');
      }
      if (sub === 'create') {
        const name = rest.split(' ')[0];
        if (!name) return `Usage: /github create [repo-name] [description]`;
        const desc = rest.slice(name.length).trim();
        const r = await createRepo(name, desc, env);
        if (r.error) return `⚠️ ${r.error}`;
        return `✅ Created: ${r.url}`;
      }
      return `*GitHub Commands:*\n/github repos — list your repositories\n/github create [name] [desc] — create a new repository\n\nOr just say:\n• "generate image of a logo"\n• "create repo named my-project"\n• "list my repos"`;
    }

    case '/status':
      return await getStatusReport(env);

    case '/tools':
    case '/secrets':
      return getToolsStatus(env);

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
      const { text: pendingText, agentName, contentType, editCount, lastEdit } = JSON.parse(raw);
      await env.KV.delete(`pending:${userId}`);
      const AgentClass = AGENT_MAP[agentName];
      if (!AgentClass) return '⚠️ Agent not found for pending action.';
      const contextCard = await buildContextCard(agentName, env);
      const agentInst = new AgentClass();
      let runText = pendingText;
      if (editCount && editCount > 0) {
        runText = pendingText + '\n\nAdditional instructions from CEO (edit #' + editCount + '): ' + lastEdit;
      }
      
      // Execute the agent
      const result = await agentInst.run(runText, userId, env, { contextCard });
      const review = await reviewOutput(agentName, 'approved-action', result, env);
      agentInst.finalizeScore(review.score, env).catch(() => {});
      
      // If video content, trigger fal.ai rendering
      if (contentType === 'video' && agentName === 'media-content-director') {
        try {
          const storyboard = JSON.parse(result);
          const totalDuration = storyboard.storyboard.reduce((sum, scene) => sum + scene.duration_seconds, 0);
          const costEstimate = estimateCost('fal-ai/flux-schnell/v1.1', totalDuration);
          
          // Queue rendering job
          const jobId = `render_${Date.now()}`;
          await queueRenderingJob({
            jobId,
            params: {
              model: 'fal-ai/flux-schnell/v1.1',
              storyboard: storyboard.storyboard,
              rendering_instructions: storyboard.rendering_instructions
            }
          }, env);
          
          return `✅ *Approved & Queued for Rendering — [MEDIA CONTENT DIRECTOR]* _(score: ${review.score}/100)_\n\n${review.improved_response || result}\n\n---\n🎬 *Video Rendering Queued*\n\n• Job ID: ${jobId}\n• Duration: ${totalDuration}s\n• Estimated Cost: $${costEstimate.estimatedCost}\n• Model: fal-ai/flux-schnell/v1.1\n\nRendering will complete in the background. You'll be notified when ready.`;
        } catch (renderError) {
          return `✅ *Approved — [MEDIA CONTENT DIRECTOR]* _(score: ${review.score}/100)_\n\n${review.improved_response || result}\n\n---\n⚠️ *Rendering Failed:* ${renderError.message}\n\nStoryboard generated but video rendering encountered an error. Check fal.ai API key and Queue configuration.`;
        }
      }
      
      return '✅ *Approved & Executed — [' + agentName.replace(/-/g, ' ').toUpperCase() + ']* _(score: ' + review.score + '/100)_\n\n' + (review.improved_response || result);
    }

    case '/reject': {
      if (!env.KV) return '⚠️ KV not configured.';
      const pending = await env.KV.get(`pending:${userId}`);
      if (!pending) return '⚠️ No pending action to cancel.';
      await env.KV.delete(`pending:${userId}`);
      return '❌ Action cancelled and discarded.';
    }

    case '/urgent': {
      if (!args) return '⚠️ Usage: /urgent [task]\nExample: /urgent The website is down — fix it now';
      return await routeMessage({ text: args, urgent: true }, userId, env);
    }

    case '/to': {
      if (!args) return '⚠️ Usage: /to [agent-name] [task]\nExample: /to finance-planner What is the Q3 forecast?';
      const spaceIdx2 = args.indexOf(' ');
      const targetAgent = spaceIdx2 === -1 ? args : args.slice(0, spaceIdx2).trim();
      const taskText = spaceIdx2 === -1 ? '' : args.slice(spaceIdx2 + 1).trim();
      if (!taskText) return '⚠️ Usage: /to [agent-name] [task]\nExample: /to finance-planner What is the Q3 forecast?';
      const AgentClass = AGENT_MAP[targetAgent];
      if (!AgentClass) return '⚠️ Unknown agent: "' + targetAgent + '". Type /help for the list.';
      const agent = new AgentClass();
      const contextCard = await buildContextCard(targetAgent, env);
      const rawResponse = await agent.run(taskText, userId, env, { contextCard });
      const review = await reviewOutput(targetAgent, 'direct-command', rawResponse, env);
      agent.finalizeScore(review.score, env).catch(() => {});
      const header = '*[' + targetAgent.replace(/-/g, ' ').toUpperCase() + ']* _(score: ' + review.score + '/100)_\n\n';
      return header + (review.improved_response || rawResponse);
    }

    case '/draft': {
      if (!args) return '⚠️ Usage: /draft [agent-name] [task]\nExample: /draft social-media-agent Post about our new product';
      const spaceIdx2 = args.indexOf(' ');
      const targetAgent = spaceIdx2 === -1 ? args : args.slice(0, spaceIdx2).trim();
      const taskText = spaceIdx2 === -1 ? '' : args.slice(spaceIdx2 + 1).trim();
      if (!taskText) return '⚠️ Usage: /draft [agent-name] [task]';
      const AgentClass = AGENT_MAP[targetAgent];
      if (!AgentClass) return '⚠️ Unknown agent: "' + targetAgent + '".';
      const agent = new AgentClass();
      const contextCard = await buildContextCard(targetAgent, env);
      const draft = await agent.run(taskText, userId, env, { contextCard, draftMode: true });
      await env.KV.put(
        'pending:' + userId,
        JSON.stringify({ text: taskText, agentName: targetAgent, draftOutput: draft, isExplicitDraft: true, editCount: 0 }),
        { expirationTtl: 3600 }
      );
      return '📋 *[DRAFT — ' + targetAgent.replace(/-/g, ' ').toUpperCase() + ']*\n\n' + draft + '\n\n---\n✅ Reply */approve* to execute  |  📝 Reply */edit [changes]* to refine  |  ❌ Reply */reject* to cancel\n_(Expires in 1 hour)_';
    }

    case '/edit': {
      if (!env.KV) return '⚠️ KV not configured.';
      if (!args) return '⚠️ Usage: /edit [your changes]\nExample: /edit Make the tone more formal';
      const raw = await env.KV.get('pending:' + userId);
      if (!raw) return '⚠️ No pending draft found. Use /draft first.';
      const pending = JSON.parse(raw);
      const AgentClass = AGENT_MAP[pending.agentName];
      if (!AgentClass) return '⚠️ Agent not found.';
      const editPrompt = 'Original task: "' + pending.text + '"\n\nCEO requested these changes: "' + args + '"\n\nPlease revise your previous response incorporating these changes.';
      const agent = new AgentClass();
      const contextCard = await buildContextCard(pending.agentName, env);
      const revised = await agent.run(editPrompt, userId, env, { contextCard, draftMode: true });
      await env.KV.put(
        'pending:' + userId,
        JSON.stringify({ ...pending, draftOutput: revised, editCount: (pending.editCount || 0) + 1, lastEdit: args }),
        { expirationTtl: 3600 }
      );
      return '📋 *[REVISED DRAFT — ' + pending.agentName.replace(/-/g, ' ').toUpperCase() + ']* (edit #' + ((pending.editCount || 0) + 1) + ')\n\n' + revised + '\n\n---\n✅ */approve* to execute  |  📝 */edit [changes]* to refine again  |  ❌ */reject* to cancel';
    }

    case '/follow': {
      if (!args) return '⚠️ Usage: /follow [task-id]\nExample: /follow abc123';
      if (!env.db) return '⚠️ Database not available.';
      const task = await env.db.prepare('SELECT * FROM tasks WHERE id = ?').bind(args).first();
      if (!task) return '⚠️ Task "' + args + '" not found.';
      const status = task.status === 'completed' ? '✅ Completed' : '⏳ Pending';
      const score = task.quality_score ? ' _(score: ' + task.quality_score + '/100)_' : '';
      return '📋 *Task Follow-up*\n\n*ID:* ' + task.id + '\n*Agent:* ' + task.agent + '\n*Status:* ' + status + score + '\n*Created:* ' + task.created_at + '\n*Input:* ' + (task.input || '').slice(0, 100) + '...\n*Output:* ' + (task.output || '').slice(0, 200) + '...';
    }

    case '/query':
      if (!args) return '⚠️ Usage: /query [natural language question]\nExample: /query show me the top 5 agents by quality score this week';
      return await nl2sqlQuery(args, env);

    case '/briefing':
      return await getDailyBriefing(userId, env);

    case '/delegate': {
      if (!args) return `⚠️ Usage: /delegate [agent-name] [task]\nExample: /delegate market-analyst What is our best LinkedIn strategy for Q3?`;
      const spIdx = args.indexOf(' ');
      if (spIdx === -1) return `⚠️ Please include a task after the agent name.`;
      const targetAgent = args.slice(0, spIdx).trim().toLowerCase();
      const delegateTask = args.slice(spIdx + 1).trim();
      const DelegateClass = AGENT_MAP[targetAgent];
      if (!DelegateClass) return `⚠️ Unknown agent: *${targetAgent}*\nSee /help for available agents.`;
      const delegateAgent = new DelegateClass();
      const delegateCtx = await buildContextCard(targetAgent, env);
      const delegateRaw = await delegateAgent.run(delegateTask, userId, env, { contextCard: delegateCtx });
      const delegateReview = await reviewOutput(targetAgent, 'delegated', delegateRaw, env).catch(() => ({ score: 75, improved_response: null }));
      delegateAgent.finalizeScore?.(delegateReview.score, env);
      return `*[${targetAgent.replace(/-/g, ' ').toUpperCase()}]* _(score: ${delegateReview.score}/100)_\n\n${delegateReview.improved_response || delegateRaw}`;
    }

    case '/cbstatus':
      return await getCircuitBreakerStatus(env);

    case '/panel': {
      if (!args) return `⚠️ Usage: /panel [strategy|technical|content|innovation|operations|fullboard] [question]
Example: /panel strategy Should we enter the Johor market this quarter?`;
      const parts = args.split(' ');
      const panelKey = Object.keys(PANELS).find(k => k === parts[0]) || pickPanel(args);
      const panelTask = parts[0] in PANELS ? parts.slice(1).join(' ') : args;
      if (!panelTask.trim()) return `⚠️ Please include a question after the panel name.`;
      const panel = PANELS[panelKey];
      const panelAgents = panel.agentNames
        .map(n => PANEL_AGENT_REGISTRY[n]?.())
        .filter(Boolean);
      return await runPanel(panelTask, panelAgents, userId, env);
    }

    default:
      return '❓ Unknown command: ' + cmd + '\nType /help for all commands.';
  }
}

function getToolsStatus(env) {
  const check = (key) => env[key] ? '✅' : '❌';
  const val   = (key) => env[key] ? '`SET`' : '`MISSING`';

  return `🔧 *MFM Corporation — Tool & Secret Status*

*LLM Providers*
${check('CEREBRAS_API_KEY')} Cerebras (primary fast LLM) — ${val('CEREBRAS_API_KEY')}
${check('OPENROUTER_API_KEY')} OpenRouter (fallback LLMs) — ${val('OPENROUTER_API_KEY')}

*Infrastructure (Cloudflare)*
${env.KV ? '✅' : '❌'} KV Namespace (cache / approvals / circuit breaker)
${env.db ? '✅' : '❌'} D1 Database (memory / tasks / metrics)
${env['mfm-corporation-uploads'] ? '✅' : '❌'} R2 Bucket (file storage)
${env.TASK_QUEUE ? '✅' : '❌'} Queue (async tasks)
${env.AI ? '✅' : '❌'} Workers AI (image generation — Flux)

*Messaging*
${check('TELEGRAM_BOT_TOKEN')} Telegram Bot — ${val('TELEGRAM_BOT_TOKEN')}
${check('SENDGRID_API_KEY')} Email / SendGrid — ${val('SENDGRID_API_KEY')}
${check('TWILIO_ACCOUNT_SID')} SMS / Twilio — ${val('TWILIO_ACCOUNT_SID')}

*Social Media*
${check('META_PAGE_ACCESS_TOKEN')} Facebook / Instagram posting — ${val('META_PAGE_ACCESS_TOKEN')}
${check('TIKTOK_ACCESS_TOKEN')} TikTok posting — ${val('TIKTOK_ACCESS_TOKEN')}

*Search & Research*
${check('EXA_API_KEY')} Exa neural search — ${val('EXA_API_KEY')}
${check('BRAVE_API_KEY')} Brave web search — ${val('BRAVE_API_KEY')}
${check('PERPLEXITY_API_KEY')} Perplexity research — ${val('PERPLEXITY_API_KEY')}

*Code & Storage*
${check('GITHUB_TOKEN')} GitHub (code push / repos) — ${val('GITHUB_TOKEN')}
${check('GOOGLE_SERVICE_ACCOUNT')} Google Drive / Calendar — ${val('GOOGLE_SERVICE_ACCOUNT')}
${check('NOTION_API_KEY')} Notion — ${val('NOTION_API_KEY')}

*Finance*
${check('STRIPE_SECRET_KEY')} Stripe (billing / revenue) — ${val('STRIPE_SECRET_KEY')}

*Monitoring*
${check('SLACK_WEBHOOK_URL')} Slack alerts — ${val('SLACK_WEBHOOK_URL')}
${check('DASHBOARD_SECRET')} Dashboard access — ${val('DASHBOARD_SECRET')}

_To fix missing: \`wrangler secret put KEY_NAME\`_`;
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
    if (!byAgent[m.agent]) byAgent[m.agent] = { tasks: 0, totalScore: 0, totalMs: 0 };
    byAgent[m.agent].tasks += m.tasks_completed || 0;
    byAgent[m.agent].totalScore += (m.avg_quality_score || 0) * (m.tasks_completed || 0);
    byAgent[m.agent].totalMs += (m.avg_response_ms || 0) * (m.tasks_completed || 0);
  }

  const lines = Object.entries(byAgent)
    .map(([agent, s]) => {
      const avgScore = s.tasks ? Math.round(s.totalScore / s.tasks) : 0;
      const avgMs = s.tasks ? Math.round(s.totalMs / s.tasks) : 0;
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

async function getDailyBriefing(userId, env) {
  const myt = new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'short' });

  const briefingAgents = [
    { name: 'ops-coordinator',  AgentClass: OpsCoordinator,  prompt: 'Daily operations briefing: what tasks are running, any blockers, team status summary. Keep it to 3 bullet points.' },
    { name: 'market-analyst',   AgentClass: MarketAnalyst,   prompt: 'Today\'s Malaysia AI market briefing: one key trend, one competitor move, one opportunity. 3 bullet points max.' },
    { name: 'finance-planner',  AgentClass: FinancePlanner,  prompt: 'Financial snapshot: MFM Year 1 progress vs MYR 60K-120K target, current burn (zero-cost infra), one financial risk. 3 bullet points.' },
    { name: 'risk-assessor',    AgentClass: RiskAssessor,    prompt: 'Top 3 risks facing MFM Corporation today: one operational, one market, one technical. One sentence each.' },
    { name: 'trend-spotter',    AgentClass: TrendSpotter,    prompt: 'One AI or market signal CEO Remy must know about today. One paragraph, specific and actionable.' },
  ];

  const results = await Promise.allSettled(
    briefingAgents.map(async ({ name, AgentClass, prompt }) => {
      const agent = new AgentClass();
      const ctx = await buildContextCard(name, env).catch(() => '');
      const out = await agent.run(prompt, userId, env, { contextCard: ctx });
      return { name, out };
    })
  );

  const sections = results.map((r, i) => {
    const { name } = briefingAgents[i];
    const label = name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const content = r.status === 'fulfilled' ? r.value.out : `⚠️ Unavailable`;
    return `*${label}*\n${content}`;
  });

  return `📰 *MFM Corporation — Daily Briefing*\n_${myt}_\n\n${sections.join('\n\n---\n\n')}`;
}

async function getCircuitBreakerStatus(env) {
  const providers = ['cerebras', 'openrouter'];
  const lines = await Promise.all(providers.map(async p => {
    const cb = new CircuitBreaker(`llm:${p}`, env.KV);
    const status = await cb.getStatus();
    const icon = status.open ? '🔴' : '🟢';
    const detail = status.open
      ? ` — OPEN (${Math.round(status.cooldownRemaining)}s until reset, ${status.failures} failures)`
      : ` — OK (${status.failures} failure(s) recorded)`;
    return `${icon} *${p}*${detail}`;
  }));
  return `⚡ *Circuit Breaker Status*\n\n${lines.join('\n')}\n\n_Open = provider temporarily bypassed. Resets after 60s._`;
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
