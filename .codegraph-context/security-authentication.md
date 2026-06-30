## Code Context

**Query:** security authentication

### Entry Points

- **SecurityAuditor** (class) - src/agents/cto/security-auditor.js:4
- **constructor** (method) - src/agents/cto/security-auditor.js:5
  `()`

### Related Symbols

- src/core/agent-base.js: AgentBase:137

### Code

#### SecurityAuditor (src/agents/cto/security-auditor.js:4)

```javascript
export class SecurityAuditor extends AgentBase {
  constructor() {
    super({
      name: 'security-auditor',
      model: MODELS.CEREBRAS_FAST,
      tools: ['codegraph-query', 'codegraph-context'],
      systemPrompt: `You are the Security Auditor for MFM Corporation.
Expertise: vulnerability assessment, OWASP, access control, data privacy, incident response.
Stack: Cloudflare Workers, D1 SQLite, KV, R2, Supabase, Telegram Bot API, Wrangler secrets.

For any security review:
1. Threat Assessment (severity: CRITICAL / HIGH / MEDIUM / LOW)
2. Vulnerabilities Found (specific issues with file/line reference if given)
3. Immediate Mitigations (apply today ΓÇö CRITICAL and HIGH only)
4. Long-term Hardening (MEDIUM and LOW, improve over time)
5. Compliance Status (PDPA Malaysia, GDPR if applicable)

SECURITY SCAN CHECKLIST ΓÇö always verify:
Γ£ô Exposed secrets or API keys hardcoded in source
Γ£ô Environment variables accessed directly vs via env object
Γ£ô SQL injection surface (use parameterized queries only)
Γ£ô Input validation at all system boundaries
Γ£ô Auth bypass possibilities on webhook endpoints
Γ£ô Files > 500 lines (increased attack surface from monoliths)
Γ£ô Rate limiting on all public endpoints
Γ£ô CORS and security headers present

Never downplay risks. Flag CRITICAL issues first. Be specific, not generic.`
    });
  }
}
```

#### constructor (src/agents/cto/security-auditor.js:5)

```javascript
  constructor() {
    super({
      name: 'security-auditor',
      model: MODELS.CEREBRAS_FAST,
      tools: ['codegraph-query', 'codegraph-context'],
      systemPrompt: `You are the Security Auditor for MFM Corporation.
Expertise: vulnerability assessment, OWASP, access control, data privacy, incident response.
Stack: Cloudflare Workers, D1 SQLite, KV, R2, Supabase, Telegram Bot API, Wrangler secrets.

For any security review:
1. Threat Assessment (severity: CRITICAL / HIGH / MEDIUM / LOW)
2. Vulnerabilities Found (specific issues with file/line reference if given)
3. Immediate Mitigations (apply today ΓÇö CRITICAL and HIGH only)
4. Long-term Hardening (MEDIUM and LOW, improve over time)
5. Compliance Status (PDPA Malaysia, GDPR if applicable)

SECURITY SCAN CHECKLIST ΓÇö always verify:
Γ£ô Exposed secrets or API keys hardcoded in source
Γ£ô Environment variables accessed directly vs via env object
Γ£ô SQL injection surface (use parameterized queries only)
Γ£ô Input validation at all system boundaries
Γ£ô Auth bypass possibilities on webhook endpoints
Γ£ô Files > 500 lines (increased attack surface from monoliths)
Γ£ô Rate limiting on all public endpoints
Γ£ô CORS and security headers present

Never downplay risks. Flag CRITICAL issues first. Be specific, not generic.`
    });
  }
```

#### AgentBase (src/core/agent-base.js:137)

```javascript
  return calls;
}

export class AgentBase {
  constructor({ name, model, systemPrompt, tools = [] }) {
    this.name = name;
    this.model = model;
    this.systemPrompt = systemPrompt;
    this.tools = tools;
  }

  _validateInput(input) {
    if (typeof input !== 'string') return { error: 'Input must be a string.' };
    const cleaned = input.replace(CTRL_CHAR_PATTERN, '').trim();
    if (!cleaned) return { error: 'Empty input.' };
    if (cleaned.length > INPUT_MAX_CHARS) return { error: `Input too long (${cleaned.length} chars, max ${INPUT_MAX_CHARS}).` };
    return { cleaned };
  }

  async run(userMessage, userId, env, options = {}) {
    const start = Date.now();
    this._draftMode = !!options.draftMode;

    const validation = this._validateInput(userMessage);
    if (validation.error) {
      logger.warn(this.name, 'input_invalid', { userId, reason: validation.error });
      return `ΓÜá∩╕Å ${validation.error}`;
    }
    const cleanMessage = validation.cleaned;

    // Emit agent status to dashboard
    emitAgentStatus(env, this.name, 'active', cleanMessage).catch(() => {});

    // Per-agent rate limiting: max 20 req/min per agent
    if (env.KV) {
      const minute   = Math.floor(Date.now() / 60000);
      const rateKey  = `rate:agent:${this.name}:${minute}`;
      const hits     = parseInt(await env.KV.get(rateKey) || '0');
      if (hits >= AGENT_RATE_LIMIT) {
        logger.warn(this.name, 'rate_limited', { userId, hits });
        return `ΓÅ│ Agent *${this.name}
... (truncated) ...
```

