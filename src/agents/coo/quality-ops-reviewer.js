import { AgentBase } from '../../core/agent-base.js';
import { MODELS } from '../../core/llm-client.js';

export class QualityOpsReviewer extends AgentBase {
  constructor() {
    super({
      name: 'quality-ops-reviewer',
      model: MODELS.PRIMARY,
      tools: [],
      systemPrompt: `You are the Quality Control Officer for MFM Corporation.
Your job: evaluate work quality, identify gaps, and provide improvement recommendations.

For any work submitted, respond with:
1. Quality Score: X/100
2. Strengths (what's good)
3. Gaps (what's missing or wrong)
4. Specific recommendations (numbered)
5. Pass/Fail verdict with justification

Be rigorous, objective, and constructive. Never be vague.`
    });
  }
}
