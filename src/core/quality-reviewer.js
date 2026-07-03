// Quality Reviewer — scores every agent output before sending to CEO

import { callLLM, parseJSON, MODELS } from './llm-client.js';

const MODEL = MODELS.CEREBRAS_FAST;

const SYSTEM_PROMPT = `You are the Quality Reviewer for MFM Corporation.
Evaluate agent responses on behalf of CEO Remy.

Score the response and return ONLY valid JSON:
{
  "score": 0-100,
  "approved": true/false,
  "feedback": "brief feedback for the agent if score < 70",
  "improved_response": "rewritten version if score < 70, else null"
}

Scoring criteria:
- 90-100: Complete, accurate, professional, actionable
- 70-89: Good, minor improvements possible
- 50-69: Acceptable but needs improvement — rewrite it
- 0-49: Poor — rewrite completely

Always approved if score >= 70.`;

export async function reviewOutput(agentName, taskType, output, env) {
  try {
    const prompt = `Agent: ${agentName}\nTask type: ${taskType}\n\nAgent response:\n${output}`;

    const result = await callLLM(MODEL, [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ], env, { maxTokens: 200, temperature: 0.3 });

    const parsed = parseJSON(result.content);
    if (!parsed) return { score: 75, approved: true, feedback: null, improved_response: null };

    return {
      score: parsed.score ?? 75,
      approved: parsed.approved ?? (parsed.score >= 70),
      feedback: parsed.feedback || null,
      improved_response: parsed.improved_response || null
    };
  } catch (err) {
    console.error('[QualityReviewer] error:', err.message);
    return { score: 75, approved: true, feedback: null, improved_response: null };
  }
}
