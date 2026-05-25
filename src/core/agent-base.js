// AgentBase — base class for all MFM Corporation agents

import { callLLM } from './llm-client.js';
import { logger } from './logger.js';
import { saveMemory, getMemory, saveTask, completeTask, updateTaskScore, logDecision, updateMetrics, clearMemory as d1ClearMemory } from '../tools/d1-store.js';
import { fetchWebContent } from '../tools/web-fetch.js';
import { sendEmail } from '../tools/email-tool.js';
import { searchExa } from '../tools/exa-tool.js';
import { postSocial } from '../tools/social-media-tool.js';
import { syncAgentEvent, syncAgentMetrics } from '../tools/supabase-bridge.js';
import { perplexitySearch, braveSearch, githubListIssues, notionSearch, slackNotify, stripeGetBalance, stripeListCharges } from '../tools/mcp-client.js';
import { listCalendarEvents, createCalendarEvent, findFreeSlot } from '../tools/calendar-tool.js';
import { listDriveFolder, readDriveFile, writeDriveFile, searchDriveFiles } from '../tools/google-drive-tool.js';
import { generatePDF, generateReportPDF } from '../tools/pdf-tool.js';
import { sendSMS } from '../tools/sms-tool.js';
import { emitAgentStatus, emitTaskUpdate } from '../tools/dashboard-events.js';

const INPUT_MAX_CHARS    = 4000;
const CTRL_CHAR_PATTERN  = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;
const AGENT_RATE_LIMIT   = 20;   // max requests per agent per minute

const TOOL_DESCRIPTIONS = {
  'web-fetch':          'Fetch live content from a URL. Usage: [TOOL:web-fetch|{"url":"https://example.com","maxChars":2000}]',
  'send-email':         'Send an email. Usage: [TOOL:send-email|{"to":"email@domain.com","subject":"Subject line","body":"Email body text"}]',
  'exa-search':         'Neural web search for real-time information. Usage: [TOOL:exa-search|{"query":"your search query","numResults":5}]',
  'social-post':        'Post to social media. Usage: [TOOL:social-post|{"platform":"facebook|instagram|tiktok","text":"post text (facebook)","caption":"caption (instagram/tiktok)","imageUrl":"https://... (optional, instagram auto-selects if omitted)","videoUrl":"https://... (required for tiktok)"}]',
  'perplexity-search':  'Fact-check or research via Perplexity AI (highest accuracy). Usage: [TOOL:perplexity-search|{"query":"your question"}]',
  'brave-search':       'Fast web search via Brave. Usage: [TOOL:brave-search|{"query":"your search","count":5}]',
  'github-issues':      'List GitHub repo issues. Usage: [TOOL:github-issues|{"owner":"org","repo":"repo-name","state":"open"}]',
  'notion-search':      'Search MFM knowledge base in Notion. Usage: [TOOL:notion-search|{"query":"search term"}]',
  'drive-list':         'List files in Google Drive folder. Usage: [TOOL:drive-list|{"folderId":"optional-folder-id"}]',
  'drive-read':         'Read a file from Google Drive. Usage: [TOOL:drive-read|{"fileId":"drive-file-id"}]',
  'drive-write':        'Write a text file to Google Drive. Usage: [TOOL:drive-write|{"fileName":"report.txt","content":"file content here","folderId":"optional"}]',
  'drive-search':       'Search Google Drive for files. Usage: [TOOL:drive-search|{"query":"search term"}]',
  'calendar-list':      'List upcoming calendar events. Usage: [TOOL:calendar-list|{"maxResults":10}]',
  'calendar-create':    'Create a calendar event. Usage: [TOOL:calendar-create|{"summary":"Meeting name","startDatetime":"2026-05-25T09:00:00+08:00","endDatetime":"2026-05-25T10:00:00+08:00","description":"Agenda","attendees":["email@example.com"]}]',
  'calendar-free-slot': 'Find next free time slot. Usage: [TOOL:calendar-free-slot|{"durationMinutes":60,"withinDays":7}]',
  'pdf-generate':       'Generate a PDF from content. Usage: [TOOL:pdf-generate|{"title":"Report Name","content":"markdown or HTML content"}]',
  'slack-notify':       'Send a notification to Slack channel. Usage: [TOOL:slack-notify|{"text":"message text"}]',
  'sms-alert':          'Send an SMS alert. Usage: [TOOL:sms-alert|{"to":"+60123456789","message":"alert text"}]',
  'stripe-balance':     'Check Stripe account balance. Usage: [TOOL:stripe-balance|{}]',
  'stripe-charges':     'List recent Stripe charges. Usage: [TOOL:stripe-charges|{"limit":5}]'
};

const TIMEOUT_MS = 25000;
const MAX_TOOL_LOOPS = 3;

function buildToolInstructions(tools) {
  if (!tools.length) return '';
  const available = tools.map(t => TOOL_DESCRIPTIONS[t]).filter(Boolean);
  if (!available.length) return '';
  return `\n\nAVAILABLE TOOLS — use when the request requires live data or sending a message:\n${available.join('\n')}\nInclude the exact [TOOL:...] syntax in your response when needed. Incorporate the tool result into your final answer.`;
}

function parseToolCalls(text) {
  const calls = [];
  const prefix = '[TOOL:';
  let i = 0;
  while (i < text.length) {
    const start = text.indexOf(prefix, i);
    if (start === -1) break;
    const pipeIdx = text.indexOf('|', start + prefix.length);
    if (pipeIdx === -1) { i = start + 1; continue; }
    const toolName = text.slice(start + prefix.length, pipeIdx).trim();
    if (!/^[a-z-]+$/.test(toolName)) { i = start + 1; continue; }
    let depth = 0, jsonStart = -1, jsonEnd = -1;
    for (let j = pipeIdx + 1; j < text.length; j++) {
      if (text[j] === '{') { if (depth === 0) jsonStart = j; depth++; }
      else if (text[j] === '}') { depth--; if (depth === 0) { jsonEnd = j; break; } }
    }
    if (jsonStart !== -1 && jsonEnd !== -1) {
      try { calls.push({ tool: toolName, args: JSON.parse(text.slice(jsonStart, jsonEnd + 1)) }); } catch (_) {}
    }
    i = start + 1;
  }
  return calls;
}

export class AgentBase {
  constructor({ name, model, systemPrompt, tools = [] }) {
    this.name = name;
    this.model = model;
    this.systemPrompt = systemPrompt;
    this.tools = tools;
  }

  _validateInput(input) {
    if (typeof input !== 'string') return { error: 'Input must be a string.' };
    const cleaned = input.replace(CTRL_CHAR_PATTERN, '').trim();
    if (!cleaned) return { error: 'Empty input.' };
    if (cleaned.length > INPUT_MAX_CHARS) return { error: `Input too long (${cleaned.length} chars, max ${INPUT_MAX_CHARS}).` };
    return { cleaned };
  }

  async run(userMessage, userId, env, options = {}) {
    const start = Date.now();
    this._draftMode = !!options.draftMode;

    const validation = this._validateInput(userMessage);
    if (validation.error) {
      logger.warn(this.name, 'input_invalid', { userId, reason: validation.error });
      return `⚠️ ${validation.error}`;
    }
    const cleanMessage = validation.cleaned;

    // Emit agent status to dashboard
    emitAgentStatus(env, this.name, 'active', cleanMessage).catch(() => {});

    // Per-agent rate limiting: max 20 req/min per agent
    if (env.KV) {
      const minute   = Math.floor(Date.now() / 60000);
      const rateKey  = `rate:agent:${this.name}:${minute}`;
      const hits     = parseInt(await env.KV.get(rateKey) || '0');
      if (hits >= AGENT_RATE_LIMIT) {
        logger.warn(this.name, 'rate_limited', { userId, hits });
        return `⏳ Agent *${this.name}* is busy (rate limit). Retry in a moment.`;
      }
      await env.KV.put(rateKey, String(hits + 1), { expirationTtl: 120 });
    }

    const taskId = this._draftMode ? null : await saveTask(this.name, cleanMessage, env);

    try {
      const history = await getMemory(this.name, userId, 20, env);
      const toolInstructions = buildToolInstructions(this.tools);
      const contextSection = options.contextCard
        ? `\n\n--- BUSINESS CONTEXT ---\n${options.contextCard}\n------------------------`
        : '';

      const baseMessages = [
        { role: 'system', content: this.systemPrompt + toolInstructions + contextSection },
        ...history,
        { role: 'user', content: cleanMessage }
      ];

      let result;
      let loopMessages = [...baseMessages];

      for (let i = 0; i < MAX_TOOL_LOOPS; i++) {
        if (Date.now() - start > TIMEOUT_MS) break;

        result = await callLLM(this.model, loopMessages, env, options);
        logger.info(this.name, 'llm_call', { loop: i, provider: result?.provider, model: result?.model });

        const toolCalls = parseToolCalls(result.content);
        if (!toolCalls.length) break;

        const toolResults = [];
        for (const { tool, args } of toolCalls) {
          if (Date.now() - start > TIMEOUT_MS) break;
          try {
            const toolResult = await this.useTool(tool, args, env);
            toolResults.push(`[Result: ${tool}]\n${String(toolResult).slice(0, 2000)}`);
          } catch (toolErr) {
            toolResults.push(`[Error: ${tool}] ${toolErr.message}`);
          }
        }

        loopMessages = [
          ...loopMessages,
          { role: 'assistant', content: result.content },
          { role: 'user', content: `Tool results:\n${toolResults.join('\n\n')}\n\nNow provide your complete final answer incorporating these results.` }
        ];
      }

      const responseMs = Date.now() - start;
      logger.info(this.name, 'task_complete', { taskId, responseMs, outputLen: result.content.length });

      if (!this._draftMode) {
        await saveMemory(this.name, userId, 'user', cleanMessage, env);
        await saveMemory(this.name, userId, 'assistant', result.content, env);
        if (taskId) await completeTask(taskId, result.content, 0, env);
      }

      // Store state for finalizeScore() — called by orchestrator with real review score
      this._lastTaskId = taskId;
      this._lastResponseMs = responseMs;
      this._lastResult = result;
      this._lastUserId = userId;
      this._lastMessage = userMessage;

      return result.content;

    } catch (err) {
      logger.error(this.name, 'task_failed', { taskId, error: err.message });
      if (taskId && !this._draftMode) await completeTask(taskId, `ERROR: ${err.message}`, 0, env);
      throw err;
    } finally {
      this._draftMode = false;
    }
  }

  async useTool(toolName, args, env) {
    if (!this.tools.includes(toolName)) {
      return `[Tool ${toolName} not available for ${this.name}]`;
    }

    switch (toolName) {
      case 'web-fetch': {
        if (!args?.url) return '[web-fetch] Missing required argument: url';
        return await fetchWebContent(args.url, args.maxChars);
      }
      case 'send-email': {
        if (!args?.to || !args?.subject || !args?.body) {
          return '[send-email] Missing required arguments: to, subject, body';
        }
        if (this._draftMode) {
          return `[DRAFT EMAIL]
To: ${args.to}
Subject: ${args.subject}

${args.body}`;
        }
        return await sendEmail(args.to, args.subject, args.body, env);
      }
      case 'exa-search': {
        if (!args?.query) return '[exa-search] Missing required argument: query';
        return await searchExa(args.query, env, { numResults: args.numResults || 5 });
      }
      case 'social-post': {
        if (!args?.platform) return '[social-post] Missing required argument: platform';
        if (this._draftMode) {
          return `[DRAFT ${(args.platform || 'POST').toUpperCase()}
Caption/Text: ${args.caption || args.text || ''}
Image: ${args.imageUrl || 'auto-selected'}
Video: ${args.videoUrl || 'n/a'}]`;
        }
        return await postSocial(args.platform, args, env);
      }
      case 'perplexity-search': {
        if (!args?.query) return '[perplexity-search] Missing required argument: query';
        const result = await perplexitySearch(args.query, env);
        return result || '[perplexity-search] No result (API key not configured or query failed)';
      }
      case 'brave-search': {
        if (!args?.query) return '[brave-search] Missing required argument: query';
        const result = await braveSearch(args.query, env, args.count || 5);
        return result || '[brave-search] No result (API key not configured or query failed)';
      }
      case 'github-issues': {
        if (!args?.owner || !args?.repo) return '[github-issues] Missing required arguments: owner, repo';
        return await githubListIssues(args.owner, args.repo, env, args.state || 'open') ?? '[github-issues] Unavailable — GITHUB_TOKEN not set';
      }
      case 'notion-search': {
        if (!args?.query) return '[notion-search] Missing required argument: query';
        return await notionSearch(args.query, env) ?? '[notion-search] Unavailable — NOTION_API_KEY not set';
      }
      case 'drive-list': {
        return await listDriveFolder(env, args?.folderId) ?? '[drive-list] Unavailable — GOOGLE_SERVICE_ACCOUNT_KEY not set';
      }
      case 'drive-read': {
        if (!args?.fileId) return '[drive-read] Missing required argument: fileId';
        return await readDriveFile(args.fileId, env) ?? '[drive-read] Unavailable — GOOGLE_SERVICE_ACCOUNT_KEY not set';
      }
      case 'drive-write': {
        if (!args?.fileName || !args?.content) return '[drive-write] Missing required arguments: fileName, content';
        return await writeDriveFile(args.fileName, args.content, env, args.folderId) ?? '[drive-write] Unavailable — GOOGLE_SERVICE_ACCOUNT_KEY not set';
      }
      case 'drive-search': {
        if (!args?.query) return '[drive-search] Missing required argument: query';
        return await searchDriveFiles(args.query, env) ?? '[drive-search] Unavailable — GOOGLE_SERVICE_ACCOUNT_KEY not set';
      }
      case 'calendar-list': {
        return await listCalendarEvents(env, args?.maxResults || 10) ?? '[calendar-list] Unavailable — GOOGLE_SERVICE_ACCOUNT_KEY not set';
      }
      case 'calendar-create': {
        if (!args?.summary || !args?.startDatetime || !args?.endDatetime) return '[calendar-create] Missing required arguments: summary, startDatetime, endDatetime';
        return await createCalendarEvent(args.summary, args.startDatetime, args.endDatetime, args.description, args.attendees, env) ?? '[calendar-create] Unavailable — GOOGLE_SERVICE_ACCOUNT_KEY not set';
      }
      case 'calendar-free-slot': {
        return await findFreeSlot(args?.durationMinutes || 60, args?.withinDays || 7, env) ?? '[calendar-free-slot] Unavailable — GOOGLE_SERVICE_ACCOUNT_KEY not set';
      }
      case 'pdf-generate': {
        if (!args?.title || !args?.content) return '[pdf-generate] Missing required arguments: title, content';
        const pdfResult = await generatePDF(args.title, args.content, env);
        if (!pdfResult) return '[pdf-generate] Failed — PDFSHIFT_API_KEY or R2 not configured';
        return `PDF generated: ${pdfResult.url}`;
      }
      case 'slack-notify': {
        if (!args?.text) return '[slack-notify] Missing required argument: text';
        return await slackNotify(args.text, env) ?? '[slack-notify] Unavailable — SLACK_WEBHOOK_URL not set';
      }
      case 'sms-alert': {
        if (!args?.message) return '[sms-alert] Missing required argument: message';
        return await sendSMS(args.to, args.message, env) ?? '[sms-alert] Unavailable — TWILIO credentials not set';
      }
      case 'stripe-balance': {
        return await stripeGetBalance(env) ?? '[stripe-balance] Unavailable — STRIPE_SECRET_KEY not set';
      }
      case 'stripe-charges': {
        return await stripeListCharges(env, args?.limit || 5) ?? '[stripe-charges] Unavailable — STRIPE_SECRET_KEY not set';
      }
      default:
        return `[Unknown tool: ${toolName}]`;
    }
  }

  async finalizeScore(score, env) {
    if (!this._lastResult) return;
    const responseMs = this._lastResponseMs || 0;
    await updateTaskScore(this._lastTaskId, score, env);
    await updateMetrics(this.name, 1, score, responseMs, env);
    syncAgentEvent({
      agent: this.name,
      task: this._lastMessage || '',
      response: this._lastResult.content || '',
      score,
      latencyMs: responseMs,
      provider: this._lastResult.provider,
      model: this._lastResult.model,
      userId: this._lastUserId
    }, env).catch(() => {});
    syncAgentMetrics({
      agent: this.name,
      totalRuns: 1,
      avgScore: score,
      avgLatency: responseMs
    }, env).catch(() => {});
  }

  async clearMemory(userId, env) {
    await d1ClearMemory(this.name, userId, env);
  }
}
