// LLM Client — Cerebras primary, OpenRouter fallback

import { CircuitBreaker } from './circuit-breaker.js';
import { logger } from './logger.js';
import { alertLLMAllProvidersFailed, alertCircuitOpen } from '../tools/alerting.js';

const CEREBRAS_BASE  = 'https://api.cerebras.ai/v1/chat/completions';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';
const REFERER         = 'https://mfm-corporation-telegram-bot.mrhan-fx.workers.dev';

const RETRY_DELAYS = [500, 1500, 4000];

export const MODELS = {
  CEREBRAS_FAST:  'llama-3.3-70b',
  CEREBRAS_LARGE: 'llama-4-scout-17b-16e-instruct',
  OR_PRIMARY:     'openai/gpt-oss-120b:free',
  OR_FAST:        'openai/gpt-oss-20b:free',
  OR_FALLBACK:    'nvidia/nemotron-3-super-120b-a12b:free'
};

const CEREBRAS_MODELS = new Set([MODELS.CEREBRAS_FAST, MODELS.CEREBRAS_LARGE]);

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
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(RETRY_DELAYS[attempt - 1]);
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
      if (response.status === 429 || response.status >= 500) {
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

function getCB(provider, kv) {
  return new CircuitBreaker(`llm:${provider}`, kv);
}

export async function callLLM(model, messages, env, options = {}) {
  // Build ordered chain: requested model first, then Cerebras fast, then OR fallbacks
  const isCerebras = CEREBRAS_MODELS.has(model);
  const chain = isCerebras
    ? [
        { provider: 'cerebras', model },
        { provider: 'cerebras', model: MODELS.CEREBRAS_FAST },
        { provider: 'openrouter', model: MODELS.OR_PRIMARY },
        { provider: 'openrouter', model: MODELS.OR_FAST },
        { provider: 'openrouter', model: MODELS.OR_FALLBACK }
      ]
    : [
        { provider: 'cerebras', model: MODELS.CEREBRAS_FAST },
        { provider: 'openrouter', model },
        { provider: 'openrouter', model: MODELS.OR_PRIMARY },
        { provider: 'openrouter', model: MODELS.OR_FAST },
        { provider: 'openrouter', model: MODELS.OR_FALLBACK }
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
      } else {
        result = await callOpenRouter(currentModel, messages, env, options);
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
