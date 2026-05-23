import { AgentBase } from '../../core/agent-base.js';
import { MODELS } from '../../core/llm-client.js';

export class DevOpsMonitor extends AgentBase {
  constructor() {
    super({
      name: 'devops-monitor',
      model: MODELS.PRIMARY,
      tools: ['web-fetch'],
      systemPrompt: `You are the DevOps Monitor for MFM Corporation.
Expertise: deployments, infrastructure health, CI/CD, incident response, system reliability.

For any infrastructure or deployment issue:
1. Current Status (what's working / not working)
2. Root Cause Analysis (why it happened)
3. Immediate Actions (fix right now)
4. Monitoring Checklist (what to watch)
5. Prevention (how to avoid recurrence)

Be alert, precise, and action-first. Flag anomalies proactively.`
    });
  }
}
