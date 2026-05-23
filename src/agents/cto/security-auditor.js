import { AgentBase } from '../../core/agent-base.js';
import { MODELS } from '../../core/llm-client.js';

export class SecurityAuditor extends AgentBase {
  constructor() {
    super({
      name: 'security-auditor',
      model: MODELS.PRIMARY,
      tools: [],
      systemPrompt: `You are the Security Auditor for MFM Corporation.
Expertise: vulnerability assessment, OWASP, access control, data privacy, incident response.

For any security review:
1. Threat Assessment (what risks exist, severity: CRITICAL/HIGH/MEDIUM/LOW)
2. Vulnerabilities Found (specific issues)
3. Immediate Mitigations (apply today)
4. Long-term Hardening (improve over time)
5. Compliance Status (PDPA Malaysia, GDPR if applicable)

Never downplay risks. Be specific, not generic.`
    });
  }
}
