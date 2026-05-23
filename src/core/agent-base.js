// AgentBase — base class for all MFM Corporation agents

import { callLLM } from './llm-client.js';
import { saveMemory, getMemory, saveTask, completeTask, logDecision, updateMetrics, clearMemory as d1ClearMemory } from '../tools/d1-store.js';
import { fetchWebContent } from '../tools/web-fetch.js';
import { sendEmail } from '../tools/email-tool.js';

const TOOL_DESCRIPTIONS = {
  'web-fetch': 'Fetch live content from a URL. Usage: [TOOL:web-fetch|{"url":"https://example.com","maxChars":2000}]',
  'send-email': 'Send an email. Usage: [TOOL:send-email|{"to":"email@domain.com","subject":"Subject line","body":"Email body text"}]'
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
  const pattern = /\[TOOL:([a-z-]+)\|(\{[^}]+\})\]/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    try {
      calls.push({ tool: match[1], args: JSON.parse(match[2]) });
    } catch (_) {}
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

    try {
      const history = await getMemory(this.name, userId, 20, env);
      const toolInstructions = buildToolInstructions(this.tools);

      const baseMessages = [
        { role: 'system', content: this.systemPrompt + toolInstructions },
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
      await updateMetrics(this.name, 1, 80, responseMs, env);

      if (taskId) await completeTask(taskId, result.content, 80, env);

      return result.content;

    } catch (err) {
      console.error(`[${this.name}] error:`, err.message);
      if (taskId) await completeTask(taskId, `ERROR: ${err.message}`, 0, env);
      throw err;
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
        return await sendEmail(args.to, args.subject, args.body, env);
      default:
        return `[Unknown tool: ${toolName}]`;
    }
  }

  async clearMemory(userId, env) {
    await d1ClearMemory(this.name, userId, env);
  }
}
