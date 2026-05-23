// LLM Client — Cerebras primary, OpenRouter fallback

const CEREBRAS_BASE = 'https://api.cerebras.ai/v1/chat/completions';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';
const REFERER = 'https://mfm-corporation-telegram-bot.mrhan-fx.workers.dev';

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

  const response = await fetch(CEREBRAS_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.CEREBRAS_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature })
  });

  if (response.status === 429 || response.status === 402 || response.status === 404) {
    throw new Error(`Cerebras ${model} unavailable (${response.status})`);
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
}

async function callOpenRouter(model, messages, env, options = {}) {
  const { maxTokens = 500, temperature = 0.7 } = options;
  if (!env.OPENROUTER_API_KEY) throw new Error('No OPENROUTER_API_KEY');

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

  if (response.status === 429 || response.status === 402 || response.status === 404 || response.status === 400) {
    throw new Error(`OpenRouter ${model} unavailable (${response.status})`);
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

  let lastError;
  for (const { provider, model: currentModel } of deduped) {
    try {
      if (provider === 'cerebras') {
        return await callCerebras(currentModel, messages, env, options);
      } else {
        return await callOpenRouter(currentModel, messages, env, options);
      }
    } catch (err) {
      console.warn(`[LLM] ${provider}/${currentModel} failed: ${err.message}`);
      lastError = err;
    }
  }

  throw lastError || new Error('All LLM providers failed');
}

export function parseJSON(text) {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch (_) {}
  return null;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
