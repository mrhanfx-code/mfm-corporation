// AgentBase — base class for all MFM Corporation agents

import { callLLM } from './llm-client.js';
import { logger } from './logger.js';
import { saveMemory, getMemory, saveTask, completeTask, updateTaskScore, logDecision, updateMetrics, clearMemory as d1ClearMemory, saveSubagentTask, updateSubagentTaskStatus, getSubagentTask, getSubagentTaskStatistics } from '../tools/d1-store.js';
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
import { emitKnowledgeGraphUpdate, emitAgentRelationshipUpdate, emitGraphStatisticsUpdate } from '../tools/dashboard-events.js';
import { createRepo, pushFile, listRepos } from '../tools/github-tool.js';
import { queryCodegraph, getCodeContext } from '../tools/codegraph-tool.js';
import { ErrorRecoveryManager } from './error-recovery.js';
import { HybridSearchManager } from './hybrid-search.js';
import { ContextInjectionManager } from './context-injection.js';
import { SmartSearchManager } from './smart-search.js';
import { MemoryConsolidationManager } from './memory-consolidation.js';
import { MultiModelManager } from './multi-model-support.js';
import { MemoryIntegration } from './memory-integration.js';
import { validateToolCall } from './tool-schemas.js';
import { SubagentCoordinator } from './subagent-dispatch.js';
import { KnowledgeGraphManager } from './knowledge-graph.js';
import { SystematicDebuggingManager } from './systematic-debugging.js';
import { FileEnrichmentManager } from './file-enrichment.js';
import { ParallelToolExecutor } from './parallel-tool-executor.js';
import { ToolCache } from './tool-cache.js';
import { ContextOptimizer } from './context-optimizer.js';

const INPUT_MAX_CHARS    = 4000;
const CTRL_CHAR_PATTERN  = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;
const AGENT_RATE_LIMIT   = 20;   // max requests per agent per minute

// ── GLOBAL RULES — injected into every agent's system prompt ──────────────────
// These rules override any conflicting instruction in individual agent prompts.
const GLOBAL_RULES = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GLOBAL RULES — MANDATORY (cannot be overridden)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. STAY IN ROLE — Only perform tasks that match your assigned role.
   If the CEO asks you to do something outside your scope, respond:
   "That's outside my role. Please ask [correct agent/department]."
   Do NOT attempt the task anyway.

2. NO HALLUCINATION — Never invent facts, statistics, names, URLs, API keys,
   credentials, tool results, or platform features. If you don't have real data,
   say "I don't have that information" and suggest how to get it.

3. NO FABRICATED TOOLS — Only reference tools listed in your AVAILABLE TOOLS section.
   Never describe tools from other AI platforms (ChatGPT, Claude.ai, DALL·E, Python
   interpreter, SQL connector, etc.). MFM Corporation runs on Cloudflare Workers —
   its tools are: web-fetch, exa-search, brave-search, perplexity-search, send-email,
   social-post, github-push, github-create-repo, pdf-generate, drive-read/write,
   calendar-create/list, slack-notify, sms-alert, stripe-balance, video-prompt.

4. MISSING API KEY = HONEST RESPONSE — If a tool requires an API key that is not set,
   say "This tool requires [KEY_NAME] to be configured. Ask CEO to run:
   wrangler secret put [KEY_NAME]". Do NOT pretend the tool worked.

5. NO FABRICATED ACTIONS — Never claim you sent an email, posted to social media,
   created a file, or took any external action unless you actually used a [TOOL:...]
   call and received a result. Always show the actual tool result.

6. IDENTITY — You are an AI agent inside MFM Corporation's system.
   Never claim to be a human, never claim to be ChatGPT, Claude, or any other
   AI product. Never describe your capabilities beyond what your role and tools allow.

7. SCOPE CREEP = REFUSE — If CEO asks you to answer questions unrelated to your
   department (e.g., legal advisor asked to write social media posts), politely
   decline and name the correct agent. Short friendly response, no lecture.

8. UNCERTAINTY = ADMIT IT — If you are not sure about something, say so clearly.
   Use phrases like "I'm not certain, but..." or "You should verify this with..."
   Do not state uncertain things as facts.

9. NO UNSOLICITED ACTIONS — Never take external actions (post, email, push code,
   create files) unless CEO explicitly asked for it in this message.
   If in doubt, show a draft and ask for approval.

10. MFM IDENTITY — MFM Corporation is a Malaysian AI automation startup.
    It does NOT use: SQL connectors, Python interpreters, DALL·E, OpenAI GPT-4 keys,
    Slack/Teams bots, DeepL, or any other tool not listed in Rule 3.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

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
  'stripe-charges':     'List recent Stripe charges. Usage: [TOOL:stripe-charges|{"limit":5}]',
  'github-push':        'Create or update a file in a GitHub repository. Usage: [TOOL:github-push|{"repo":"repo-name","path":"src/index.js","content":"file content here","message":"feat: add feature"}]',
  'github-create-repo': 'Create a new GitHub repository. Usage: [TOOL:github-create-repo|{"name":"my-project","description":"Project description"}]',
  'github-list-repos':  'List GitHub repositories. Usage: [TOOL:github-list-repos|{}]',
  'video-prompt':       'Generate a detailed AI video generation prompt. Usage: [TOOL:video-prompt|{"topic":"what the video is about","style":"cinematic|social|product","duration":"5-15 seconds","platform":"instagram|tiktok|facebook"}]',
  'codegraph-query':    'Search pre-indexed code knowledge graph. Usage: [TOOL:codegraph-query|{"query":"symbol name"}]',
  'codegraph-context':  'Get code context for a task. Usage: [TOOL:codegraph-context|{"task":"describe what you need to understand"}]',
  'd1-query':          'Query D1 database for tasks, metrics, or decisions. Usage: [TOOL:d1-query|{"query":"SELECT * FROM tasks WHERE agent=? LIMIT 10","params":["ops-coordinator"]}]',
  'memory-search':     'Search memory for relevant information. Usage: [TOOL:memory-search|{"query":"search term","limit":10,"threshold":0.7}]',
  'memory-remember':   'Store information in memory. Usage: [TOOL:memory-remember|{"content":"information to remember","category":"general","importance":"normal"}]',
  'memory-context':    'Retrieve context for a query. Usage: [TOOL:memory-context|{"query":"your question","limit":5}]',
  'memory-enrich':     'Enrich content with metadata and related memories. Usage: [TOOL:memory-enrich|{"content":"text to enrich","enrichWith":["category","metadata","related"]}]'
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
  constructor({ name, model, systemPrompt, tools = [], optimizationConfig = {} }) {
    this.name = name;
    this.model = model;
    this.systemPrompt = systemPrompt;
    this.tools = tools;
    this.errorRecovery = null; // Will be initialized with env in run()
    this.hybridSearch = null;
    this.contextInjection = null;
    this.smartSearch = null;
    this.memoryConsolidation = null;
    this.multiModel = null;
    
    // Optimization configuration
    this.optimizationConfig = {
      enableParallel: optimizationConfig.enableParallel !== false, // Default true
      enableCache: optimizationConfig.enableCache !== false, // Default true
      enableContextOpt: optimizationConfig.enableContextOpt !== false, // Default true
      maxParallel: optimizationConfig.maxParallel || 5,
      ...optimizationConfig
    };
    
    // Optimization modules (initialized with env in run())
    this.parallelExecutor = null;
    this.toolCache = null;
    this.contextOptimizer = null;
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

    // Initialize error recovery manager
    if (!this.errorRecovery) {
      this.errorRecovery = new ErrorRecoveryManager(env);
    }

    // Initialize advanced managers
    if (!this.hybridSearch) {
      this.hybridSearch = new HybridSearchManager(env);
    }
    if (!this.contextInjection) {
      this.contextInjection = new ContextInjectionManager(env);
    }
    if (!this.smartSearch) {
      this.smartSearch = new SmartSearchManager(env);
    }
    if (!this.memoryConsolidation) {
      this.memoryConsolidation = new MemoryConsolidationManager(env);
    }
    if (!this.multiModel) {
      this.multiModel = new MultiModelManager(env);
    }
    if (!this.memoryIntegration) {
      this.memoryIntegration = new MemoryIntegration(env);
    }
    if (!this.subagentCoordinator) {
      this.subagentCoordinator = new SubagentCoordinator({ maxParallelTasks: 4 });
    }
    if (!this.knowledgeGraph) {
      this.knowledgeGraph = new KnowledgeGraphManager(env);
    }
    if (!this.systematicDebugging) {
      this.systematicDebugging = new SystematicDebuggingManager(env);
    }
    if (!this.contextInjection) {
      this.contextInjection = new ContextInjectionManager(env);
    }
    if (!this.fileEnrichment) {
      this.fileEnrichment = new FileEnrichmentManager(env);
    }

    // Initialize optimization modules
    if (this.optimizationConfig.enableParallel && !this.parallelExecutor) {
      this.parallelExecutor = new ParallelToolExecutor(env, {
        maxParallel: this.optimizationConfig.maxParallel
      });
    }
    if (this.optimizationConfig.enableCache && !this.toolCache) {
      this.toolCache = new ToolCache(env);
    }
    if (this.optimizationConfig.enableContextOpt && !this.contextOptimizer) {
      this.contextOptimizer = new ContextOptimizer(env);
    }

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

    // Wrap task execution with error recovery
    return await this.errorRecovery.executeWithRecovery(
      this.name,
      async () => {
        const history = await getMemory(this.name, userId, 20, env);
        const toolInstructions = buildToolInstructions(this.tools);
        const contextSection = options.contextCard
          ? `\n\n--- BUSINESS CONTEXT ---\n${options.contextCard}\n------------------------`
          : '';

        const baseMessages = [
          { role: 'system', content: this.systemPrompt + toolInstructions + contextSection + GLOBAL_RULES },
          ...history,
          { role: 'user', content: cleanMessage }
        ];

        let result;
        let loopMessages = [...baseMessages];

        for (let i = 0; i < MAX_TOOL_LOOPS; i++) {
          if (Date.now() - start > TIMEOUT_MS) break;

          // Apply context optimization if enabled
          let optimizedMessages = loopMessages;
          if (this.optimizationConfig.enableContextOpt && this.contextOptimizer) {
            optimizedMessages = this.contextOptimizer.optimizeContext(loopMessages);
            const stats = this.contextOptimizer.getStats();
            if (stats.totalReduction !== '0.00%') {
              logger.info(this.name, 'context_optimized', { 
                reduction: stats.totalReduction,
                originalSize: stats.originalSize,
                optimizedSize: stats.optimizedSize
              });
            }
          }

          result = await callLLM(this.model, optimizedMessages, env, options);
          logger.info(this.name, 'llm_call', { loop: i, provider: result?.provider, model: result?.model });

          const toolCalls = parseToolCalls(result.content);
          if (!toolCalls.length) break;

          const toolResults = [];
          
          // Use parallel execution if enabled, otherwise sequential
          if (this.optimizationConfig.enableParallel && this.parallelExecutor) {
            try {
              const results = await this.parallelExecutor.execute(toolCalls, async (tool, args) => {
                return await this.useTool(tool, args, env);
              });
              
              for (const { tool, result } of results) {
                toolResults.push(`[Result: ${tool}]\n${String(result).slice(0, 2000)}`);
              }
            } catch (parallelError) {
              logger.warn(this.name, 'parallel_execution_failed', { error: parallelError.message });
              // Fallback to sequential execution
              for (const { tool, args } of toolCalls) {
                if (Date.now() - start > TIMEOUT_MS) break;
                try {
                  const toolResult = await this.useTool(tool, args, env);
                  toolResults.push(`[Result: ${tool}]\n${String(toolResult).slice(0, 2000)}`);
                } catch (toolErr) {
                  toolResults.push(`[Error: ${tool}] ${toolErr.message}`);
                }
              }
            }
          } else {
            // Sequential execution (fallback or disabled)
            for (const { tool, args } of toolCalls) {
              if (Date.now() - start > TIMEOUT_MS) break;
              try {
                const toolResult = await this.useTool(tool, args, env);
                toolResults.push(`[Result: ${tool}]\n${String(toolResult).slice(0, 2000)}`);
              } catch (toolErr) {
                toolResults.push(`[Error: ${tool}] ${toolErr.message}`);
              }
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
      },
      { taskId, userId, message: cleanMessage }
    ).catch(async err => {
      logger.error(this.name, 'task_failed', { taskId, error: err.message });
      if (taskId && !this._draftMode) await completeTask(taskId, `ERROR: ${err.message}`, 0, env);
      throw err;
    }).finally(() => {
      this._draftMode = false;
    });
  }

  async useTool(toolName, args, env) {
    if (!this.tools.includes(toolName)) {
      return `[Tool ${toolName} not available for ${this.name}]`;
    }

    // Validate tool parameters using Zod schemas
    try {
      args = validateToolCall(toolName, args || {});
    } catch (validationError) {
      return `[${toolName}] ${validationError.message}`;
    }

    // Use cache if enabled
    if (this.optimizationConfig.enableCache && this.toolCache) {
      try {
        const cachedResult = await this.toolCache.execute(toolName, args, async () => {
          return await this._executeTool(toolName, args, env);
        });
        return cachedResult;
      } catch (cacheError) {
        logger.warn(this.name, 'cache_error', { tool: toolName, error: cacheError.message });
        // Fallback to direct execution
        return await this._executeTool(toolName, args, env);
      }
    }

    // Direct execution (cache disabled or unavailable)
    return await this._executeTool(toolName, args, env);
  }

  async _executeTool(toolName, args, env) {
    switch (toolName) {
      case 'web-fetch': {
        return await fetchWebContent(args.url, args.maxChars);
      }
      case 'send-email': {
        if (this._draftMode) {
          return `[DRAFT EMAIL]
To: ${args.to}
Subject: ${args.subject}

${args.body}`;
        }
        return await sendEmail(args.to, args.subject, args.body, env);
      }
      case 'exa-search': {
        return await searchExa(args.query, env, { numResults: args.numResults || 5 });
      }
      case 'social-post': {
        if (this._draftMode) {
          return `[DRAFT ${(args.platform || 'POST').toUpperCase()}
Caption/Text: ${args.caption || args.text || ''}
Image: ${args.imageUrl || 'auto-selected'}
Video: ${args.videoUrl || 'n/a'}]`;
        }
        return await postSocial(args.platform, args, env);
      }
      case 'perplexity-search': {
        const result = await perplexitySearch(args.query, env);
        return result || '[perplexity-search] No result (API key not configured or query failed)';
      }
      case 'brave-search': {
        const result = await braveSearch(args.query, env, args.count || 5);
        return result || '[brave-search] No result (API key not configured or query failed)';
      }
      case 'github-issues': {
        return await githubListIssues(args.owner, args.repo, env, args.state || 'open') ?? '[github-issues] Unavailable — GITHUB_TOKEN not set';
      }
      case 'notion-search': {
        return await notionSearch(args.query, env) ?? '[notion-search] Unavailable — NOTION_API_KEY not set';
      }
      case 'drive-list': {
        return await listDriveFolder(env, args?.folderId) ?? '[drive-list] Unavailable — GOOGLE_SERVICE_ACCOUNT_KEY not set';
      }
      case 'drive-read': {
        return await readDriveFile(args.fileId, env) ?? '[drive-read] Unavailable — GOOGLE_SERVICE_ACCOUNT_KEY not set';
      }
      case 'drive-write': {
        return await writeDriveFile(args.fileName, args.content, env, args.folderId) ?? '[drive-write] Unavailable — GOOGLE_SERVICE_ACCOUNT_KEY not set';
      }
      case 'drive-search': {
        return await searchDriveFiles(args.query, env) ?? '[drive-search] Unavailable — GOOGLE_SERVICE_ACCOUNT_KEY not set';
      }
      case 'calendar-list': {
        return await listCalendarEvents(env, args?.maxResults || 10) ?? '[calendar-list] Unavailable — GOOGLE_SERVICE_ACCOUNT_KEY not set';
      }
      case 'calendar-create': {
        return await createCalendarEvent(args.summary, args.startDatetime, args.endDatetime, args.description, args.attendees, env) ?? '[calendar-create] Unavailable — GOOGLE_SERVICE_ACCOUNT_KEY not set';
      }
      case 'calendar-free-slot': {
        return await findFreeSlot(args?.durationMinutes || 60, args?.withinDays || 7, env) ?? '[calendar-free-slot] Unavailable — GOOGLE_SERVICE_ACCOUNT_KEY not set';
      }
      case 'pdf-generate': {
        const pdfResult = await generatePDF(args.title, args.content, env);
        if (!pdfResult) return '[pdf-generate] Failed — PDFSHIFT_API_KEY or R2 not configured';
        return `PDF generated: ${pdfResult.url}`;
      }
      case 'slack-notify': {
        return await slackNotify(args.text, env) ?? '[slack-notify] Unavailable — SLACK_WEBHOOK_URL not set';
      }
      case 'sms-alert': {
        return await sendSMS(args.to, args.message, env) ?? '[sms-alert] Unavailable — TWILIO credentials not set';
      }
      case 'stripe-balance': {
        return await stripeGetBalance(env) ?? '[stripe-balance] Unavailable — STRIPE_SECRET_KEY not set';
      }
      case 'stripe-charges': {
        return await stripeListCharges(env, args?.limit || 5) ?? '[stripe-charges] Unavailable — STRIPE_SECRET_KEY not set';
      }
      case 'github-push': {
        if (this._draftMode) return `[DRAFT GITHUB PUSH]\nRepo: ${args.repo}\nFile: ${args.path}\nCommit: ${args.message || 'auto-commit'}\n\nContent preview:\n${args.content.slice(0, 300)}...`;
        const pushResult = await pushFile(args.repo, args.path, args.content, args.message || `feat: add ${args.path}`, env);
        if (pushResult.error) return `[github-push] Error: ${pushResult.error}`;
        return `[github-push] ✅ Pushed: ${args.path} → ${pushResult.url || args.repo}`;
      }
      case 'github-create-repo': {
        if (this._draftMode) return `[DRAFT GITHUB REPO]\nName: ${args.name}\nDescription: ${args.description || ''}`;
        const repoResult = await createRepo(args.name, args.description || '', env);
        if (repoResult.error) return `[github-create-repo] Error: ${repoResult.error}`;
        return `[github-create-repo] ✅ Created: ${repoResult.url}`;
      }
      case 'github-list-repos': {
        const reposResult = await listRepos(env);
        if (reposResult.error) return `[github-list-repos] Error: ${reposResult.error}`;
        return `[github-list-repos] Repos: ${reposResult.repos.map(r => r.full_name).join(', ')}`;
      }
      case 'video-prompt': {
        const topic = args?.topic || 'general';
        const style = args?.style || 'cinematic';
        const duration = args?.duration || '5-10 seconds';
        const platform = args?.platform || 'instagram';
        const platformNotes = {
          instagram: 'vertical 9:16, bold text overlay, eye-catching first frame',
          tiktok: 'vertical 9:16, fast cuts, trending music vibe, hook in first second',
          facebook: 'horizontal 16:9 or square 1:1, clear message, captions recommended',
        };
        const note = platformNotes[platform] || platformNotes.instagram;
        return `[VIDEO PROMPT READY]\n\n📋 **Copy this prompt into Kling / Seedance / any AI video tool:**\n\n---\n${style === 'cinematic' ? 'Cinematic' : style === 'social' ? 'Social media style' : 'Product showcase'} video about ${topic}. Duration: ${duration}. ${note}. High quality, professional lighting, smooth motion, no text in frame. Colour grade: warm tones, vibrant, modern. Camera: slow push-in or pan, minimal shake.\n---\n\n📌 **Platform:** ${platform}\n📐 **Format:** ${platform === 'facebook' ? '16:9' : '9:16 vertical'}\n⏱ **Duration:** ${duration}\n\nOnce generated, share the video file with MFM Corporation and we will handle posting, captions, and hashtags.`;
      }
      case 'codegraph-query': {
        const result = await queryCodegraph(args.query);
        return result || '[codegraph-query] No results found';
      }
      case 'codegraph-context': {
        const result = await getCodeContext(args.task);
        return result || '[codegraph-context] Context generation failed';
      }
      case 'd1-query': {
        if (!env.db) return '[d1-query] D1 database not configured';
        try {
          const stmt = env.db.prepare(args.query);
          if (args.params && Array.isArray(args.params)) {
            const result = await stmt.bind(...args.params).all();
            return JSON.stringify(result.results || [], null, 2);
          } else {
            const result = await stmt.all();
            return JSON.stringify(result.results || [], null, 2);
          }
        } catch (err) {
          return `[d1-query] Error: ${err.message}`;
        }
      }
      case 'memory-search': {
        const result = await this.memoryIntegration.memorySearch(args.query, args);
        if (!result.success) return `[memory-search] Error: ${result.error}`;
        return `[memory-search] Found ${result.results.length} results:\n${result.results.map(r => `[${r.category}] ${r.content.slice(0, 100)}... (score: ${r.score.toFixed(2)})`).join('\n')}`;
      }
      case 'memory-remember': {
        const result = await this.memoryIntegration.memoryRemember(args.content, args);
        if (!result.success) return `[memory-remember] Error: ${result.error}`;
        return `[memory-remember] ✅ Saved as ${result.memoryId}`;
      }
      case 'memory-context': {
        const result = await this.memoryIntegration.memoryContext(args.query, args);
        if (!result.success) return `[memory-context] Error: ${result.error}`;
        return `[memory-context] Retrieved ${result.context.length} context items:\n${result.context.map(c => `[${c.category}] ${c.content.slice(0, 80)}...`).join('\n')}`;
      }
      case 'memory-enrich': {
        const result = await this.memoryIntegration.memoryEnrich(args.content, args);
        if (!result.success) return `[memory-enrich] Error: ${result.error}`;
        return `[memory-enrich] Enrichments:\n${Object.entries(result.enriched.enrichments).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n')}`;
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

  /**
   * Create and execute subagent task for parallel development
   * @param {string} agent - Target agent name
   * @param {string} description - Task description
   * @param {object} instructions - Task instructions
   * @param {Array} dependencies - Task dependencies
   * @param {number} priority - Task priority (1-4)
   * @param {object} env - Environment context
   * @returns {Promise<object>} Task result
   */
  async createSubagentTask(agent, description, instructions, dependencies = [], priority = 2, env) {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Save to D1
    await saveSubagentTask(taskId, agent, description, instructions, dependencies, priority, env);
    
    // Create task in coordinator
    const task = this.subagentCoordinator.createDevelopmentTask({
      agent,
      description,
      instructions,
      dependencies,
      priority,
      metadata: { type: 'development', sourceAgent: this.name }
    });
    
    return task;
  }

  /**
   * Execute subagent workflow with parallel tasks
   * @param {object} env - Environment context
   * @returns {Promise<object>} Execution summary
   */
  async executeSubagentWorkflow(env) {
    const summary = await this.subagentCoordinator.executeDevelopmentWorkflow(env);
    
    // Update D1 with task statuses
    for (const task of this.subagentCoordinator.dispatch.getAllTasks()) {
      await updateSubagentTaskStatus(
        task.id,
        task.status,
        task.result,
        task.error,
        env
      );
    }
    
    return summary;
  }

  /**
   * Get subagent task statistics
   * @param {object} env - Environment context
   * @returns {Promise<object>} Task statistics
   */
  async getSubagentStatistics(env) {
    return await getSubagentTaskStatistics(env);
  }

  /**
   * Extract knowledge graph from agent interactions
   * @param {Array} observations - Agent interaction observations
   * @returns {object} Knowledge graph data
   */
  extractKnowledgeGraph(observations) {
    const entities = this.knowledgeGraph.extractEntities(observations);
    const relationships = this.knowledgeGraph.detectRelationships(entities, observations);
    const graph = this.knowledgeGraph.buildGraph(entities, relationships);
    
    return {
      entities: Array.from(entities.values()),
      relationships,
      graph: this.knowledgeGraph.getVisualizationData(),
      statistics: this.knowledgeGraph.getStatistics()
    };
  }

  /**
   * Get agent relationships from knowledge graph
   * @param {string} agentName - Agent name
   * @returns {Array} Agent relationships
   */
  getAgentRelationships(agentName) {
    return this.knowledgeGraph.getAgentRelationships(agentName);
  }

  /**
   * Get team composition from knowledge graph
   * @param {string} teamName - Team name
   * @returns {Array} Team members
   */
  getTeamComposition(teamName) {
    return this.knowledgeGraph.getTeamComposition(teamName);
  }

  /**
   * Get tools used by agent from knowledge graph
   * @param {string} agentName - Agent name
   * @returns {Array} Tools used by agent
   */
  getAgentTools(agentName) {
    return this.knowledgeGraph.getAgentTools(agentName);
  }

  /**
   * Get knowledge graph statistics
   * @returns {object} Graph statistics
   */
  getKnowledgeGraphStatistics() {
    return this.knowledgeGraph.getStatistics();
  }

  /**
   * Save knowledge graph to memory
   * @returns {Promise<void>}
   */
  async saveKnowledgeGraph() {
    await this.knowledgeGraph.saveGraph();
  }

  /**
   * Clear knowledge graph
   */
  clearKnowledgeGraph() {
    this.knowledgeGraph.clearGraph();
  }

  /**
   * Update knowledge graph with new observations and emit to dashboard
   * @param {Array} observations - New agent interaction observations
   * @param {object} env - Environment context
   * @returns {Promise<object>} Updated graph data
   */
  async updateKnowledgeGraph(observations, env) {
    const graphData = this.knowledgeGraph.updateGraph(observations);
    await emitKnowledgeGraphUpdate(env, graphData);
    return graphData;
  }

  /**
   * Emit agent relationships to dashboard
   * @param {string} agentName - Agent name
   * @param {object} env - Environment context
   * @returns {Promise<void>}
   */
  async emitAgentRelationships(agentName, env) {
    const relationships = this.getAgentRelationships(agentName);
    await emitAgentRelationshipUpdate(env, agentName, relationships);
  }

  /**
   * Emit graph statistics to dashboard
   * @param {object} env - Environment context
   * @returns {Promise<void>}
   */
  async emitGraphStatistics(env) {
    const statistics = this.getKnowledgeGraphStatistics();
    await emitGraphStatisticsUpdate(env, statistics);
  }

  /**
   * Capture error for systematic debugging
   * @param {Error} error - Error object
   * @param {object} context - Error context
   * @returns {Promise<object>} Debug session
   */
  async captureDebugError(error, context = {}) {
    return await this.systematicDebugging.captureError(error, context);
  }

  /**
   * Analyze error in debug session
   * @param {string} sessionId - Debug session ID
   * @returns {Promise<object>} Analysis result
   */
  async analyzeDebugError(sessionId) {
    return await this.systematicDebugging.analyzeError(sessionId);
  }

  /**
   * Hypothesize solution for error
   * @param {string} sessionId - Debug session ID
   * @returns {Promise<object>} Hypothesis result
   */
  async hypothesizeDebugSolution(sessionId) {
    return await this.systematicDebugging.hypothesizeSolution(sessionId);
  }

  /**
   * Verify solution implementation
   * @param {string} sessionId - Debug session ID
   * @param {object} implementationResult - Implementation result
   * @returns {Promise<object>} Verification result
   */
  async verifyDebugSolution(sessionId, implementationResult) {
    return await this.systematicDebugging.verifySolution(sessionId, implementationResult);
  }

  /**
   * Get debug session
   * @param {string} sessionId - Debug session ID
   * @returns {object|null} Debug session
   */
  getDebugSession(sessionId) {
    return this.systematicDebugging.getSession(sessionId);
  }

  /**
   * Get all debug sessions
   * @returns {Array} All debug sessions
   */
  getAllDebugSessions() {
    return this.systematicDebugging.getAllSessions();
  }

  /**
   * Inject context for session
   * @param {string} sessionId - Session ID
   * @param {object} task - Task object
   * @param {object} options - Context injection options
   * @returns {Promise<object>} Injected context
   */
  async injectSessionContext(sessionId, task, options = {}) {
    return await this.contextInjection.injectContext(sessionId, task, options);
  }

  /**
   * Get session context
   * @param {string} sessionId - Session ID
   * @returns {object|null} Session context
   */
  getSessionContext(sessionId) {
    return this.contextInjection.getSessionContext(sessionId);
  }

  /**
   * Track change for context
   * @param {object} change - Change object
   */
  trackContextChange(change) {
    this.contextInjection.trackChange(change);
  }

  /**
   * Get recent changes
   * @returns {Promise<Array>} Recent changes
   */
  async getRecentChanges() {
    return await this.contextInjection.getRecentChanges();
  }

  /**
   * Set user preference
   * @param {string} key - Preference key
   * @param {*} value - Preference value
   */
  setUserPreference(key, value) {
    this.contextInjection.setUserPreference(key, value);
  }

  /**
   * Get user preference
   * @param {string} key - Preference key
   * @param {*} defaultValue - Default value
   * @returns {*} Preference value
   */
  getUserPreference(key, defaultValue = null) {
    return this.contextInjection.getUserPreference(key, defaultValue);
  }

  /**
   * Get all user preferences
   * @returns {object} User preferences
   */
  getUserPreferences() {
    return this.contextInjection.getUserPreferences();
  }

  /**
   * Analyze file for enrichment
   * @param {string} filePath - Path to the file
   * @returns {Promise<object>} File analysis result
   */
  async analyzeFile(filePath) {
    return await this.fileEnrichment.analyzeFile(filePath);
  }

  /**
   * Analyze directory for enrichment
   * @param {string} dirPath - Path to the directory
   * @returns {Promise<object>} Directory analysis result
   */
  async analyzeDirectory(dirPath) {
    return await this.fileEnrichment.analyzeDirectory(dirPath);
  }

  /**
   * Detect dependencies in a file
   * @param {string} filePath - Path to the file
   * @returns {Promise<Array>} List of dependencies
   */
  async detectFileDependencies(filePath) {
    return await this.fileEnrichment.detectDependencies(filePath);
  }

  /**
   * Get file enrichment cache statistics
   * @returns {object} Cache statistics
   */
  getFileEnrichmentCacheStatistics() {
    return this.fileEnrichment.getCacheStatistics();
  }

  /**
   * Clear file enrichment cache
   */
  clearFileEnrichmentCache() {
    this.fileEnrichment.clearCache();
  }
}
