// Multi-Agent Panel — debate engine for complex decisions
// Flow: Round 1 (parallel drafts) → Round 2 (parallel challenges) → Round 3 (synthesis)

import { callLLM, MODELS } from './llm-client.js';
import { logger } from './logger.js';

const MAX_DRAFT_CHARS = 1200;   // truncate per-agent draft in context to keep tokens reasonable
const SYNTHESIS_MAX_TOKENS = 800;

function truncate(text, max) {
  if (!text || text.length <= max) return text;
  return text.slice(0, max) + '...[truncated]';
}

export async function runPanel(task, agents, userId, env) {
  const panelNames = agents.map(a => a.name).join(', ');
  logger.info('panel', 'start', { task: task.slice(0, 80), agents: panelNames });

  // ── Round 1: Independent drafts (parallel) ────────────────────────────────
  logger.info('panel', 'round1_start', { agents: panelNames });
  const drafts = await Promise.allSettled(
    agents.map(agent => agent.run(
      `[PANEL DEBATE — Round 1]\nTask: ${task}\n\nGive your best independent answer from your specialist perspective. Be direct and specific. Do not hedge.`,
      userId,
      env
    ))
  );

  const round1 = agents.map((agent, i) => ({
    name:   agent.name,
    output: drafts[i].status === 'fulfilled' ? drafts[i].value : `[${agent.name} failed: ${drafts[i].reason?.message}]`
  }));

  logger.info('panel', 'round1_done', { results: round1.map(r => r.name) });

  // ── Round 2: Challenge round (parallel) ───────────────────────────────────
  logger.info('panel', 'round2_start', {});
  const challengeResults = await Promise.allSettled(
    agents.map((agent, i) => {
      const othersContext = round1
        .filter((_, j) => j !== i)
        .map(r => `**${r.name}**:\n${truncate(r.output, MAX_DRAFT_CHARS)}`)
        .join('\n\n---\n\n');

      const challengePrompt = `[PANEL DEBATE — Round 2: Challenge]\nTask: ${task}\n\nYou previously said:\n${truncate(round1[i].output, MAX_DRAFT_CHARS)}\n\nYour colleagues said:\n${othersContext}\n\nNow:\n1. Challenge any points you disagree with — be specific about WHY they are wrong or incomplete.\n2. Acknowledge what they got right.\n3. Add anything critical they both missed.\n4. State your final refined position in 3-5 sentences.`;

      return agent.run(challengePrompt, userId, env);
    })
  );

  const round2 = agents.map((agent, i) => ({
    name:   agent.name,
    output: challengeResults[i].status === 'fulfilled' ? challengeResults[i].value : round1[i].output
  }));

  logger.info('panel', 'round2_done', {});

  // ── Round 3: Synthesis ────────────────────────────────────────────────────
  const debateSummary = [
    `# Panel Debate Summary\n## Task\n${task}`,
    ...round1.map((r, i) => `## ${r.name} — Initial Position\n${truncate(r.output, MAX_DRAFT_CHARS)}`),
    ...round2.map((r, i) => `## ${r.name} — After Challenge\n${truncate(r.output, MAX_DRAFT_CHARS)}`)
  ].join('\n\n');

  const synthesisMessages = [
    {
      role: 'system',
      content: `You are the Chief of Staff for MFM Corporation CEO Remy. You have just moderated a panel debate between ${agents.length} specialist agents. Your job is to synthesize the debate into a single, clear, actionable answer for the CEO.\n\nRules:\n- Extract the strongest arguments from each agent\n- Resolve any genuine disagreements with a reasoned decision\n- Discard weak or redundant points\n- Be direct and concise — the CEO does not want to read debate transcripts\n- Format: Executive Summary → Key Decision/Recommendation → Action Steps`
    },
    {
      role: 'user',
      content: `${debateSummary}\n\nWrite the synthesized answer for CEO Remy now.`
    }
  ];

  logger.info('panel', 'synthesis_start', {});
  const synthesis = await callLLM(synthesisMessages, env, { maxTokens: SYNTHESIS_MAX_TOKENS });
  logger.info('panel', 'synthesis_done', {});

  // ── Format output ─────────────────────────────────────────────────────────
  const agentLine = agents.map(a => `_${a.name}_`).join(' · ');
  return `🏛️ *Panel Debate Complete*\n_Agents: ${agentLine}_\n\n${synthesis}\n\n---\n_This answer was challenged and refined across ${agents.length} specialist agents before reaching you._`;
}

// Panel composition definitions
export const PANELS = {
  strategy: {
    label: 'Strategy Panel',
    description: 'For major business decisions, strategic direction, market entry',
    agentNames: ['research-agent', 'strategic-planner', 'risk-assessor']
  },
  technical: {
    label: 'Technical Panel',
    description: 'For architecture decisions, tech stack choices, development planning',
    agentNames: ['development-advisor', 'tech-advisor', 'security-auditor']
  },
  content: {
    label: 'Content & Media Panel',
    description: 'For marketing strategy, content campaigns, media production',
    agentNames: ['content-writer', 'market-analyst', 'media-producer']
  },
  innovation: {
    label: 'Innovation Panel',
    description: 'For new product ideas, emerging tech evaluation, innovation strategy',
    agentNames: ['innovation-analyst', 'trend-spotter', 'idea-generator']
  },
  operations: {
    label: 'Operations Panel',
    description: 'For process improvement, resource planning, operational decisions',
    agentNames: ['strategic-planner', 'ops-coordinator', 'finance-planner']
  },
  fullboard: {
    label: 'Full Board',
    description: 'High-stakes decisions — one voice per department',
    agentNames: ['research-agent', 'development-advisor', 'market-analyst', 'finance-planner', 'innovation-analyst', 'legal-advisor']
  }
};

// Detect if a task warrants a panel debate
const PANEL_TRIGGERS = [
  'should we', 'should i', 'what should', 'best approach', 'best strategy',
  'recommend', 'decide', 'decision', 'compare', 'versus', 'vs ', 'trade-off',
  'pros and cons', 'which is better', 'how should we', 'strategy for',
  'plan for', 'roadmap', 'launch', 'evaluate', 'assess', 'is it worth',
  'debate', 'panel', 'team discussion', 'get all opinions', 'what do the team think'
];

export function shouldUsePanel(text) {
  const lower = text.toLowerCase();
  return PANEL_TRIGGERS.some(t => lower.includes(t)) && text.length > 80;
}

// Pick best panel based on task content
export function pickPanel(text) {
  const lower = text.toLowerCase();
  if (/techni|architect|code|develop|software|stack|api|database|backend|frontend/.test(lower)) return 'technical';
  if (/content|video|podcast|media|post|campaign|brand|creative/.test(lower)) return 'content';
  if (/innovat|trend|emerging|disrupt|new tech|future|breakthrough/.test(lower)) return 'innovation';
  if (/operat|process|resource|workflow|efficiency|plan|timeline|milestone/.test(lower)) return 'operations';
  if (/strategy|market|business|revenue|growth|decision|launch|direction/.test(lower)) return 'strategy';
  return 'strategy'; // default
}
