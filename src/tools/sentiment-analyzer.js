// Sentiment Analyzer — 0.00-1.00 scoring with multilingual support

import { callLLM, MODELS } from '../core/llm-client.js';

/**
 * Analyzes sentiment of text with 0.00-1.00 scoring
 * @param {string} text - Text to analyze
 * @param {object} env - Cloudflare Workers environment
 * @returns {Promise<object>} - Sentiment score object
 */
export async function analyzeSentiment(text, env) {
  const systemPrompt = `You are a sentiment analyzer. Analyze the sentiment of the given text and respond with valid JSON:

{
  "score": 0.00-1.00 (0.00 = very negative, 0.50 = neutral, 1.00 = very positive),
  "label": "positive|neutral|negative",
  "confidence": 0.00-1.00,
  "emotions": ["emotion1", "emotion2"],
  "language": "detected language"
}

Scoring guidelines:
- 0.00-0.20: Very negative (anger, frustration, disappointment)
- 0.21-0.40: Negative (concern, dissatisfaction, worry)
- 0.41-0.60: Neutral (factual, balanced, indifferent)
- 0.61-0.80: Positive (satisfaction, approval, optimism)
- 0.81-1.00: Very positive (excitement, joy, enthusiasm)

Support multiple languages: English, Malay, Chinese, Indonesian, Thai, Vietnamese.`;

  try {
    const response = await callLLM(MODELS.CEREBRAS_FAST, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text }
    ], env, { maxTokens: 100, temperature: 0.1 });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return getDefaultSentiment();
    }

    const result = JSON.parse(jsonMatch[0]);
    
    // Validate and normalize score
    result.score = Math.max(0.00, Math.min(1.00, parseFloat(result.score) || 0.50));
    result.confidence = Math.max(0.00, Math.min(1.00, parseFloat(result.confidence) || 0.50));
    
    // Determine label from score if not provided
    if (!result.label) {
      if (result.score >= 0.61) result.label = 'positive';
      else if (result.score >= 0.41) result.label = 'neutral';
      else result.label = 'negative';
    }
    
    return result;
  } catch (e) {
    console.error('[Sentiment Analyzer] Error:', e.message);
    return getDefaultSentiment();
  }
}

function getDefaultSentiment() {
  return {
    score: 0.50,
    label: 'neutral',
    confidence: 0.30,
    emotions: [],
    language: 'unknown'
  };
}

/**
 * Batch analyze sentiment for multiple texts
 * @param {string[]} texts - Array of texts to analyze
 * @param {object} env - Cloudflare Workers environment
 * @returns {Promise<object[]>} - Array of sentiment results
 */
export async function analyzeSentimentBatch(texts, env) {
  const results = await Promise.all(
    texts.map(text => analyzeSentiment(text, env))
  );
  
  return results;
}

/**
 * Get sentiment summary for a collection of texts
 * @param {string[]} texts - Array of texts
 * @param {object} env - Cloudflare Workers environment
 * @returns {Promise<object>} - Summary statistics
 */
export async function getSentimentSummary(texts, env) {
  const results = await analyzeSentimentBatch(texts, env);
  
  const total = results.length;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / total;
  
  const labelCounts = {
    positive: 0,
    neutral: 0,
    negative: 0
  };
  
  results.forEach(r => {
    labelCounts[r.label]++;
  });
  
  return {
    total,
    averageScore: Math.round(avgScore * 100) / 100,
    labelDistribution: {
      positive: Math.round((labelCounts.positive / total) * 100),
      neutral: Math.round((labelCounts.neutral / total) * 100),
      negative: Math.round((labelCounts.negative / total) * 100)
    },
    overallSentiment: avgScore >= 0.61 ? 'positive' : avgScore >= 0.41 ? 'neutral' : 'negative'
  };
}
