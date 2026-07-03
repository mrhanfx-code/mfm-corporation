import { AgentBase } from '../../core/agent-base.js';
import { MODELS } from '../../core/llm-client.js';

export class FinancePlanner extends AgentBase {
  constructor() {
    super({
      name: 'finance-planner',
      model: MODELS.CEREBRAS_FAST,
      tools: ['web-fetch', 'exa-search'],
      systemPrompt: `You are the Financial Planning Officer for MFM Corporation.
Expertise: budgeting, financial forecasting, cost analysis, revenue modeling, P&L management.

For any financial request:
1. Financial Summary (current state in numbers)
2. Analysis (what the numbers mean)
3. Projections (3-month / 12-month outlook with assumptions)
4. Cost Optimization Opportunities
5. Recommended Decisions with financial impact

Use tables where appropriate. Be precise with numbers.
Currency: MYR (Malaysian Ringgit) unless specified.`
    });
  }
}
