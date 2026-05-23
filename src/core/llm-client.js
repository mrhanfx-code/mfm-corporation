// OpenRouter LLM Client — shared by all agents

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';
const REFERER = 'https://mfm-corporation-telegram-bot.mrhan-fx.workers.dev';

export const MODELS = {
  PRIMARY:  'openai/gpt-oss-120b:free',
  FAST:     'openai/gpt-oss-20b:free',
  FALLBACK: 'nvidia/nemotron-3-super-120b-a12b:free'
};

const FALLBACK_CHAIN = [MODELS.PRIMARY, MODELS.FAST, MODELS.FALLBACK];

export async function callLLM(model, messages, env, options = {}) {
  const { maxTokens = 500, temperature = 0.7 } = options;

  // Try requested model first, then fallback chain
  const chain = [model, ...FALLBACK_CHAIN.filter(m => m !== model)];

  let lastError;
  for (const currentModel of chain) {
    try {
      const response = await fetch(OPENROUTER_BASE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': REFERER,
          'X-Title': 'MFM Corporation AI'
        },
        body: JSON.stringify({
          model: currentModel,
          messages,
          max_tokens: maxTokens,
          temperature
        })
      });

      // Skip to next fallback on unavailable/rate-limited
      if (response.status === 429 || response.status === 402 || response.status === 404 || response.status === 400) {
        lastError = new Error(`Model ${currentModel} unavailable (${response.status})`);
        continue;
      }

      if (!response.ok) {
        const err = await response.text();
        lastError = new Error(`OpenRouter ${response.status}: ${err}`);
        continue;
      }

      const data = await response.json();

      if (!data.choices?.[0]?.message?.content) {
        lastError = new Error('Empty response from LLM');
        continue;
      }

      return {
        content: data.choices[0].message.content.trim(),
        model: currentModel,
        usage: data.usage || {}
      };

    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All models in fallback chain failed');
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
