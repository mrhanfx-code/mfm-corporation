// AgentBase — base class for all MFM Corporation agents

import { callLLM } from './llm-client.js';
import { saveMemory, getMemory, saveTask, completeTask, logDecision, updateMetrics, clearMemory as d1ClearMemory } from '../tools/d1-store.js';
import { fetchWebContent } from '../tools/web-fetch.js';
import { sendEmail } from '../tools/email-tool.js';
import { searchExa } from '../tools/exa-tool.js';
import { postSocial } from '../tools/social-media-tool.js';
import { syncAgentEvent, syncAgentMetrics } from '../tools/supabase-bridge.js';

const TOOL_DESCRIPTIONS = {
  'web-fetch':   'Fetch live content from a URL. Usage: [TOOL:web-fetch|{"url":"https://example.com","maxChars":2000}]',
  'send-email':  'Send an email. Usage: [TOOL:send-email|{"to":"email@domain.com","subject":"Subject line","body":"Email body text"}]',
  'exa-search':  'Neural web search for real-time information. Usage: [TOOL:exa-search|{"query":"your search query","numResults":5}]',
  'social-post': 'Post to social media. Usage: [TOOL:social-post|{"platform":"facebook|instagram|tiktok","text":"post text (facebook)","caption":"caption (instagram/tiktok)","imageUrl":"https://... (optional, instagram auto-selects if omitted)","videoUrl":"https://... (required for tiktok)"}]'
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

  async run(userMessage, userId, env, options = {}) {
    const start = Date.now();
    const taskId = await saveTask(this.name, userMessage, env);
    this._draftMode = !!options.draftMode;

    try {
      const history = await getMemory(this.name, userId, 20, env);
      const toolInstructions = buildToolInstructions(this.tools);
      const contextSection = options.contextCard
        ? `\n\n--- BUSINESS CONTEXT ---\n${options.contextCard}\n------------------------`
        : '';

      const baseMessages = [
        { role: 'system', content: this.systemPrompt + toolInstructions + contextSection },
        ...history,
        { role: 'user', content: userMessage }
      ];

      let result;
      let loopMessages = [...baseMessages];

      for (let i = 0; i < MAX_TOOL_LOOPS; i++) {
        if (Date.now() - start > TIMEOUT_MS) break;

        result = await callLLM(this.model, loopMessages, env, options);

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

      await saveMemory(this.name, userId, 'user', userMessage, env);
      await saveMemory(this.name, userId, 'assistant', result.content, env);

      const responseMs = Date.now() - start;
      if (taskId) await completeTask(taskId, result.content, 0, env);

      // Store state for finalizeScore() — called by orchestrator with real review score
      this._lastTaskId = taskId;
      this._lastResponseMs = responseMs;
      this._lastResult = result;
      this._lastUserId = userId;
      this._lastMessage = userMessage;

      return result.content;

    } catch (err) {
      console.error(`[${this.name}] error:`, err.message);
      if (taskId) await completeTask(taskId, `ERROR: ${err.message}`, 0, env);
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
      case 'web-fetch':
        return await fetchWebContent(args.url, args.maxChars);
      case 'send-email':
        if (this._draftMode) {
          return `[DRAFT EMAIL]
To: ${args.to}
Subject: ${args.subject}

${args.body}`;
        }
        return await sendEmail(args.to, args.subject, args.body, env);
      case 'exa-search':
        return await searchExa(args.query, env, { numResults: args.numResults || 5 });
      case 'social-post':
        if (this._draftMode) {
          return `[DRAFT ${(args.platform || 'POST').toUpperCase()}
Caption/Text: ${args.caption || args.text || ''}
Image: ${args.imageUrl || 'auto-selected'}
Video: ${args.videoUrl || 'n/a'}]`;
        }
        return await postSocial(args.platform, args, env);
      default:
        return `[Unknown tool: ${toolName}]`;
    }
  }

  async finalizeScore(score, env) {
    if (!this._lastResult) return;
    const responseMs = this._lastResponseMs || 0;
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
