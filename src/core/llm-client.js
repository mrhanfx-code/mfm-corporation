// LLM Client — Cerebras primary, OpenRouter fallback, Cloudflare Workers AI tertiary

import { CircuitBreaker } from './circuit-breaker.js';
import { logger } from './logger.js';
import { alertLLMAllProvidersFailed, alertCircuitOpen } from '../tools/alerting.js';

const CEREBRAS_BASE  = 'https://api.cerebras.ai/v1/chat/completions';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';
const REFERER         = 'https://mfm-corporation-telegram-bot.mrhan-fx.workers.dev';

const RETRY_DELAYS = [1000, 2000, 5000, 10000]; // Increased delays with exponential backoff

export const MODELS = {
  CEREBRAS_FAST:  'llama-3.3-70b',
  CEREBRAS_LARGE: 'llama-4-scout-17b-16e-instruct',
  OR_PRIMARY:     'openai/gpt-oss-120b:free',
  OR_FAST:        'openai/gpt-oss-20b:free',
  OR_FALLBACK:    'nvidia/nemotron-3-super-120b-a12b:free',
  CF_AI:          '@cf/meta/llama-3.3-70b-instruct-fp8-fast' // Cloudflare Workers AI
};

const CEREBRAS_MODELS = new Set([MODELS.CEREBRAS_FAST, MODELS.CEREBRAS_LARGE]);
const CF_AI_MODELS = new Set([MODELS.CF_AI]);

async function callCerebras(model, messages, env, options = {}) {
  const { maxTokens = 500, temperature = 0.7 } = options;
  if (!env.CEREBRAS_API_KEY) throw new Error('No CEREBRAS_API_KEY');

  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(RETRY_DELAYS[attempt - 1]);
    try {
      const response = await fetch(CEREBRAS_BASE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.CEREBRAS_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature })
      });

      if (response.status === 402 || response.status === 404) {
        throw new Error(`Cerebras ${model} unavailable (${response.status})`);
      }
      if (response.status === 429 || response.status >= 500) {
        lastErr = new Error(`Cerebras ${response.status}`);
        logger.warn('llm-client', 'cerebras_retry', { model, attempt, status: response.status });
        continue;
      }
      if (!response.ok) throw new Error(`Cerebras ${response.status}: ${await response.text()}`);

      const data = await response.json();
      if (!data.choices?.[0]?.message?.content) throw new Error('Empty Cerebras response');

      return {
        content: data.choices[0].message.content.trim(),
        model,
        provider: 'cerebras',
        usage: data.usage || {}
      };
    } catch (err) {
      if (err.message.includes('unavailable')) throw err;
      lastErr = err;
    }
  }
  throw lastErr || new Error('Cerebras failed after retries');
}

async function callOpenRouter(model, messages, env, options = {}) {
  const { maxTokens = 500, temperature = 0.7 } = options;
  if (!env.OPENROUTER_API_KEY) throw new Error('No OPENROUTER_API_KEY');

  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await sleep(RETRY_DELAYS[Math.min(attempt - 1, RETRY_DELAYS.length - 1)]);
    try {
      const response = await fetch(OPENROUTER_BASE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': REFERER,
          'X-Title': 'MFM Corporation AI'
        },
        body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature })
      });

      if (response.status === 402 || response.status === 404 || response.status === 400) {
        throw new Error(`OpenRouter ${model} unavailable (${response.status})`);
      }
      if (response.status === 429) {
        lastErr = new Error(`OpenRouter rate limited (429)`);
        logger.warn('llm-client', 'openrouter_rate_limit', { model, attempt });
        // Set cooldown in KV for 60 seconds
        await env.KV.put('openrouter_cooldown', Date.now().toString(), { expirationTtl: 60 });
        // Immediately throw to allow chain to move to next provider
        throw lastErr;
      }
      if (response.status >= 500) {
        lastErr = new Error(`OpenRouter ${response.status}`);
        logger.warn('llm-client', 'openrouter_retry', { model, attempt, status: response.status });
        continue;
      }
      if (!response.ok) throw new Error(`OpenRouter ${response.status}: ${await response.text()}`);

      const data = await response.json();
      if (!data.choices?.[0]?.message?.content) throw new Error('Empty OpenRouter response');

      return {
        content: data.choices[0].message.content.trim(),
        model,
        provider: 'openrouter',
        usage: data.usage || {}
      };
    } catch (err) {
      if (err.message.includes('unavailable')) throw err;
      lastErr = err;
    }
  }
  throw lastErr || new Error('OpenRouter failed after retries');
}

async function callCloudflareAI(model, messages, env, options = {}) {
  const { maxTokens = 500, temperature = 0.7 } = options;
  if (!env.AI) throw new Error('No AI binding');

  try {
    const response = await env.AI.run(model, {
      messages,
      max_tokens: maxTokens,
      temperature
    });

    if (!response?.response) throw new Error('Empty Cloudflare AI response');

    const content = typeof response.response === 'string' 
      ? response.response.trim() 
      : String(response.response).trim();

    return {
      content,
      model,
      provider: 'cloudflare',
      usage: response.usage || {}
    };
  } catch (err) {
    logger.error('llm-client', 'cf_ai_failed', { model, error: err.message });
    throw new Error(`Cloudflare AI failed: ${err.message}`);
  }
}

function getCB(provider, kv) {
  return new CircuitBreaker(`llm:${provider}`, kv);
}

export async function callLLM(model, messages, env, options = {}) {
  // Check for OpenRouter cooldown
  const cooldown = await env.KV.get('openrouter_cooldown');
  if (cooldown) {
    const cooldownTime = parseInt(cooldown);
    const elapsed = Date.now() - cooldownTime;
    if (elapsed < 60000) {
      logger.warn('llm-client', 'openrouter_cooldown_active', { remainingMs: 60000 - elapsed });
    }
  }

  // Build ordered chain: requested model first, then Cerebras fast, then OR fallbacks, then Cloudflare AI
  const isCerebras = CEREBRAS_MODELS.has(model);
  const isCFAI = CF_AI_MODELS.has(model);
  const chain = isCerebras
    ? [
        { provider: 'cerebras', model },
        { provider: 'cerebras', model: MODELS.CEREBRAS_FAST },
        { provider: 'openrouter', model: MODELS.OR_PRIMARY },
        { provider: 'openrouter', model: MODELS.OR_FAST },
        { provider: 'openrouter', model: MODELS.OR_FALLBACK },
        { provider: 'cloudflare', model: MODELS.CF_AI }
      ]
    : isCFAI
    ? [
        { provider: 'cloudflare', model },
        { provider: 'cerebras', model: MODELS.CEREBRAS_FAST },
        { provider: 'openrouter', model: MODELS.OR_PRIMARY },
        { provider: 'openrouter', model: MODELS.OR_FAST }
      ]
    : [
        { provider: 'cerebras', model: MODELS.CEREBRAS_FAST },
        { provider: 'openrouter', model },
        { provider: 'openrouter', model: MODELS.OR_PRIMARY },
        { provider: 'openrouter', model: MODELS.OR_FAST },
        { provider: 'openrouter', model: MODELS.OR_FALLBACK },
        { provider: 'cloudflare', model: MODELS.CF_AI }
      ];

  // Deduplicate while preserving order
  const seen = new Set();
  const deduped = chain.filter(({ provider, model: m }) => {
    const key = `${provider}:${m}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const start = Date.now();
  let lastError;
  for (const { provider, model: currentModel } of deduped) {
    // Skip OpenRouter if in cooldown
    if (provider === 'openrouter' && cooldown) {
      const cooldownTime = parseInt(cooldown);
      if (Date.now() - cooldownTime < 60000) {
        logger.warn('llm-client', 'skip_openrouter_cooldown', { model: currentModel });
        lastError = lastError || new Error('OpenRouter in cooldown');
        continue;
      }
    }

    const cb = getCB(provider, env.KV);
    if (await cb.isOpen()) {
      logger.warn('llm-client', 'circuit_open_skip', { provider });
      lastError = lastError || new Error(`${provider} circuit breaker open`);
      continue;
    }
    try {
      let result;
      if (provider === 'cerebras') {
        result = await callCerebras(currentModel, messages, env, options);
      } else if (provider === 'openrouter') {
        result = await callOpenRouter(currentModel, messages, env, options);
      } else if (provider === 'cloudflare') {
        result = await callCloudflareAI(currentModel, messages, env, options);
      }
      await cb.recordSuccess();
      logger.info('llm-client', 'success', { provider, model: currentModel, latencyMs: Date.now() - start });
      return result;
    } catch (err) {
      logger.warn('llm-client', 'provider_failed', { provider, model: currentModel, error: err.message });
      await cb.recordFailure();
      const cbStatus = await cb.getStatus();
      if (cbStatus.open) alertCircuitOpen(`llm:${provider}`, env).catch(() => {});
      lastError = err;
    }
  }

  alertLLMAllProvidersFailed(env).catch(() => {});
  throw lastError || new Error('All LLM providers failed');
}

export function parseJSON(text) {
  if (!text || typeof text !== 'string') return null;
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const matches = cleaned.match(/\{[\s\S]*?\}/g);
  if (!matches) return null;

  // Try the longest match first (most likely to be the full object)
  const candidates = [...matches].sort((a, b) => b.length - a.length);
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (_) { /* try next */ }
  }
  return null;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
