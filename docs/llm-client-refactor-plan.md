# LLM Client - Architecture Refactor Plan

## Current State Analysis

**File:** `src/core/llm-client.js` (272 lines)

**Violations of Clean Architecture:**
- Provider-specific HTTP calls mixed with orchestration logic
- No repository abstraction for KV operations (cooldown storage)
- No interface abstraction for LLM providers
- Direct coupling to external APIs (Cerebras, OpenRouter, Cloudflare)
- Business logic (provider chain, fallback) embedded with infrastructure (HTTP calls)
- Not testable without real API calls or bindings

## Proposed Layer Structure

```
src/core/
├── repositories/
│   └── kv-repository.js                # KV operations abstraction (cooldown, circuit breaker state)
├── providers/
│   ├── llm-provider-interface.js      # Abstract interface for LLM providers
│   ├── cerebras-provider.js           # Cerebras API implementation
│   ├── openrouter-provider.js         # OpenRouter API implementation
│   └── cloudflare-provider.js         # Cloudflare Workers AI implementation
├── use-cases/
│   └── call-llm-use-case.js           # Provider chain orchestration, fallback logic
├── utils/
│   └── json-parser.js                  # parseJSON utility
└── llm-client.js                      # Public API (exports use case)
```

## Refactor Steps

### Step 1: Extract Repository Interface
Create `IKVRepository` interface with methods:
- `get(key)` - retrieve value
- `put(key, value, options)` - store value with TTL
- Implement in-memory version for testing

### Step 2: Create Provider Interface
Create `ILLMProvider` interface with methods:
- `call(model, messages, options)` - returns standardized response
- Implement concrete providers (Cerebras, OpenRouter, Cloudflare)

### Step 3: Extract Use Case
Move orchestration logic to `CallLLMUseCase`:
- Provider chain construction
- Circuit breaker integration
- Cooldown checking
- Fallback logic
- Error handling and alerting

### Step 4: Simplify Public API
Reduce `llm-client.js` to:
- Export use case instance
- Export utility functions (parseJSON)
- Maintain backward compatibility

## Benefits

- **Testability:** Providers can be mocked, use case tested with in-memory KV
- **Extensibility:** New providers added by implementing interface
- **Maintainability:** Clear separation between orchestration and provider logic
- **Flexibility:** Swap KV implementation without touching business logic

## Timeline

Given the 272-line file with moderate complexity:
- Phase 1: Extract KV repository (low risk)
- Phase 2: Create provider interface and implementations (medium risk)
- Phase 3: Extract use case orchestration (medium risk)
- Phase 4: Simplify public API (low risk)

Each phase should maintain backward compatibility and be tested independently.
