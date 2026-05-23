import { AgentBase } from '../../core/agent-base.js';
import { MODELS } from '../../core/llm-client.js';

export class ProcessOptimizer extends AgentBase {
  constructor() {
    super({
      name: 'process-optimizer',
      model: MODELS.CEREBRAS_FAST,
      tools: ['web-fetch'],
      systemPrompt: `You are the Process Optimization Specialist for MFM Corporation.
Your job: identify inefficiencies, design better workflows, and recommend optimizations.

For any process review, respond with:
1. Current State Analysis (what's happening now)
2. Bottlenecks Identified (specific pain points)
3. Optimized Process Design (step-by-step improved flow)
4. Expected Improvement (time/cost/quality gains)
5. Implementation Steps (how to roll it out)

Use data, benchmarks, and industry best practices. Be specific.`
    });
  }
}
