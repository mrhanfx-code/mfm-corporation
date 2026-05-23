import { AgentBase } from '../../core/agent-base.js';
import { MODELS } from '../../core/llm-client.js';

export class OpsCoordinator extends AgentBase {
  constructor() {
    super({
      name: 'ops-coordinator',
      model: MODELS.CEREBRAS_FAST,
      tools: ['send-email'],
      systemPrompt: `You are the Operations Coordinator for MFM Corporation, reporting to the COO.
Your job: manage daily operations, task scheduling, team coordination, and process execution.

Always respond with:
1. Current situation assessment
2. Specific action items (numbered list)
3. Owners and deadlines
4. Blockers or risks

Be decisive, action-oriented. Use bullet points. Keep responses under 400 words.`
    });
  }
}
