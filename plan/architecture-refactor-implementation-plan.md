# Implementation Plan: Architecture Refactor - LLM Client & Telegram Bot Agent

## Overview

This plan implements Clean Architecture patterns for two core modules:
1. **LLM Client** (`src/core/llm-client.js`) - 272 lines, moderate complexity
2. **Telegram Bot Agent** (`src/telegram-bot-agent.js`) - 933 lines, high complexity

The refactoring follows Clean Architecture principles with layered separation: repositories, use cases, controllers, and entry points. Each phase maintains backward compatibility and includes independent testing.

## Architecture Decisions

- **Dependency direction**: Entry point → Controllers → Use Cases → Repositories → Infrastructure
- **Interface-based design**: All repositories and providers implement abstract interfaces
- **In-memory testing**: Each layer can be tested with mock implementations
- **Backward compatibility**: Public APIs remain unchanged during transition
- **Incremental migration**: Each phase is independently testable and deployable

## Task List

### Phase 1: LLM Client - Foundation (Low Risk)

#### Task 1: Create KV Repository Interface
**Description:** Define abstract interface for KV operations with in-memory implementation for testing.

**Acceptance criteria:**
- [ ] `IKVRepository` interface defined with `get(key)`, `put(key, value, options)` methods
- [ ] `InMemoryKVRepository` implementation created for testing
- [ ] `ProductionKVRepository` implementation wraps Cloudflare KV binding
- [ ] Interface exported from `src/core/repositories/kv-repository.js`

**Verification:**
- [ ] Unit tests pass: `npm test -- --grep "kv-repository"`
- [ ] Lint check passes: `npm run lint`

**Dependencies:** None

**Files likely touched:**
- `src/core/repositories/kv-repository.js`
- `tests/core/repositories/kv-repository.test.js`

**Estimated scope:** Small (2 files)

---

#### Task 2: Create LLM Provider Interface
**Description:** Define abstract interface for LLM providers with standardized response format.

**Acceptance criteria:**
- [ ] `ILLMProvider` interface defined with `call(model, messages, options)` method
- [ ] Standardized response format defined (content, usage, error fields)
- [ ] Interface exported from `src/core/providers/llm-provider-interface.js`

**Verification:**
- [ ] Interface file loads without errors
- [ ] Lint check passes: `npm run lint`

**Dependencies:** None

**Files likely touched:**
- `src/core/providers/llm-provider-interface.js`

**Estimated scope:** XS (1 file)

---

#### Task 3: Extract JSON Parser Utility
**Description:** Move `parseJSON` function to separate utility module.

**Acceptance criteria:**
- [ ] `parseJSON` function moved to `src/core/utils/json-parser.js`
- [ ] Function exported as named export
- [ ] `llm-client.js` imports and re-exports for backward compatibility
- [ ] Existing tests for `parseJSON` still pass

**Verification:**
- [ ] Tests pass: `npm test -- --grep "parseJSON"`
- [ ] Build succeeds: `npm run build`

**Dependencies:** None

**Files likely touched:**
- `src/core/utils/json-parser.js`
- `src/core/llm-client.js`
- `tests/llm-client.test.js`

**Estimated scope:** Small (3 files)

---

### Checkpoint: LLM Client Foundation
- [ ] All new tests pass
- [ ] Lint check passes
- [ ] Backward compatibility maintained (existing tests pass)
- [ ] Review with human before proceeding

---

### Phase 2: LLM Client - Provider Implementations (Medium Risk)

#### Task 4: Implement Cerebras Provider
**Description:** Create Cerebras provider implementing ILLMProvider interface.

**Acceptance criteria:**
- [ ] `CerebrasProvider` class implements `ILLMProvider`
- [ ] Extracts Cerebras-specific HTTP logic from `llm-client.js`
- [ ] Handles Cerebras API authentication and error responses
- [ ] Returns standardized response format

**Verification:**
- [ ] Unit tests pass: `npm test -- --grep "cerebras-provider"`
- [ ] Lint check passes: `npm run lint`

**Dependencies:** Task 2 (Provider Interface)

**Files likely touched:**
- `src/core/providers/cerebras-provider.js`
- `tests/core/providers/cerebras-provider.test.js`

**Estimated scope:** Medium (2 files)

---

#### Task 5: Implement OpenRouter Provider
**Description:** Create OpenRouter provider implementing ILLMProvider interface.

**Acceptance criteria:**
- [ ] `OpenRouterProvider` class implements `ILLMProvider`
- [ ] Extracts OpenRouter-specific HTTP logic from `llm-client.js`
- [ ] Handles OpenRouter API authentication and cooldown logic
- [ ] Returns standardized response format

**Verification:**
- [ ] Unit tests pass: `npm test -- --grep "openrouter-provider"`
- [ ] Lint check passes: `npm run lint`

**Dependencies:** Task 2 (Provider Interface)

**Files likely touched:**
- `src/core/providers/openrouter-provider.js`
- `tests/core/providers/openrouter-provider.test.js`

**Estimated scope:** Medium (2 files)

---

#### Task 6: Implement Cloudflare Provider
**Description:** Create Cloudflare Workers AI provider implementing ILLMProvider interface.

**Acceptance criteria:**
- [ ] `CloudflareProvider` class implements `ILLMProvider`
- [ ] Extracts Cloudflare AI binding logic from `llm-client.js`
- [ ] Handles Cloudflare AI binding and model selection
- [ ] Returns standardized response format

**Verification:**
- [ ] Unit tests pass: `npm test -- --grep "cloudflare-provider"`
- [ ] Lint check passes: `npm run lint`

**Dependencies:** Task 2 (Provider Interface)

**Files likely touched:**
- `src/core/providers/cloudflare-provider.js`
- `tests/core/providers/cloudflare-provider.test.js`

**Estimated scope:** Medium (2 files)

---

### Checkpoint: LLM Client Providers
- [ ] All provider tests pass
- [ ] Each provider can be instantiated independently
- [ ] Standardized response format consistent across providers
- [ ] Review with human before proceeding

---

### Phase 3: LLM Client - Use Case Orchestration (Medium Risk)

#### Task 7: Extract Call LLM Use Case
**Description:** Move orchestration logic to dedicated use case class.

**Acceptance criteria:**
- [ ] `CallLLMUseCase` class created in `src/core/use-cases/call-llm-use-case.js`
- [ ] Provider chain construction logic moved from `llm-client.js`
- [ ] Circuit breaker integration maintained
- [ ] Cooldown checking logic preserved
- [ ] Fallback logic implemented
- [ ] Error handling and alerting preserved
- [ ] Accepts repository and provider dependencies via constructor

**Verification:**
- [ ] Unit tests pass: `npm test -- --grep "call-llm-use-case"`
- [ ] Existing `llm-client.test.js` tests still pass (backward compatibility)
- [ ] Integration test with mock providers succeeds

**Dependencies:** Tasks 1, 4, 5, 6 (Repository and Providers)

**Files likely touched:**
- `src/core/use-cases/call-llm-use-case.js`
- `tests/core/use-cases/call-llm-use-case.test.js`
- `src/core/llm-client.js`

**Estimated scope:** Medium (3 files)

---

#### Task 8: Simplify LLM Client Public API
**Description:** Reduce `llm-client.js` to thin wrapper around use case.

**Acceptance criteria:**
- [ ] `llm-client.js` exports `CallLLMUseCase` instance
- [ ] `callLLM` function delegates to use case
- [ ] `parseJSON` re-exported from utils
- [ ] Backward compatibility maintained (all existing imports work)
- [ ] File reduced to <50 lines

**Verification:**
- [ ] All existing tests pass: `npm test -- --grep "llm-client"`
- [ ] Lint check passes: `npm run lint`
- [ ] Manual check: Existing code using `callLLM` still works

**Dependencies:** Task 7 (Use Case)

**Files likely touched:**
- `src/core/llm-client.js`

**Estimated scope:** Small (1 file)

---

### Checkpoint: LLM Client Complete
- [ ] All LLM client tests pass
- [ ] Backward compatibility verified
- [ ] Code coverage maintained or improved
- [ ] Ready for Telegram Bot Agent refactor

---

### Phase 4: Telegram Bot Agent - Repository Layer (Low Risk)

#### Task 9: Create KV Repository for Telegram
**Description:** Create KV repository interface for Telegram-specific operations.

**Acceptance criteria:**
- [ ] `TelegramKVRepository` interface defined for cooldown, deduplication storage
- [ ] `InMemoryTelegramKVRepository` for testing
- [ ] `ProductionTelegramKVRepository` wraps Cloudflare KV
- [ ] Methods: `getCooldown()`, `setCooldown()`, `getMessageHash()`, `checkDuplicate()`

**Verification:**
- [ ] Unit tests pass: `npm test -- --grep "telegram-kv-repository"`
- [ ] Lint check passes: `npm run lint`

**Dependencies:** None

**Files likely touched:**
- `src/repositories/kv-repository.js`
- `tests/repositories/kv-repository.test.js`

**Estimated scope:** Small (2 files)

---

#### Task 10: Create D1 Repository
**Description:** Create D1 repository interface for database operations.

**Acceptance criteria:**
- [ ] `D1Repository` interface defined for query operations
- [ ] `InMemoryD1Repository` for testing
- [ ] `ProductionD1Repository` wraps Cloudflare D1 binding
- [ ] Methods: `query()`, `execute()`, `batch()`

**Verification:**
- [ ] Unit tests pass: `npm test -- --grep "d1-repository"`
- [ ] Lint check passes: `npm run lint`

**Dependencies:** None

**Files likely touched:**
- `src/repositories/d1-repository.js`
- `tests/repositories/d1-repository.test.js`

**Estimated scope:** Small (2 files)

---

#### Task 11: Create R2 Repository
**Description:** Create R2 repository interface for file storage operations.

**Acceptance criteria:**
- [ ] `R2Repository` interface defined for file operations
- [ ] `InMemoryR2Repository` for testing
- [ ] `ProductionR2Repository` wraps Cloudflare R2 binding
- [ ] Methods: `put()`, `get()`, `delete()`, `list()`

**Verification:**
- [ ] Unit tests pass: `npm test -- --grep "r2-repository"`
- [ ] Lint check passes: `npm run lint`

**Dependencies:** None

**Files likely touched:**
- `src/repositories/r2-repository.js`
- `tests/repositories/r2-repository.test.js`

**Estimated scope:** Small (2 files)

---

### Checkpoint: Telegram Repositories
- [ ] All repository tests pass
- [ ] In-memory implementations enable testing without infrastructure
- [ ] Review with human before proceeding

---

### Phase 5: Telegram Bot Agent - Use Cases (Medium Risk)

#### Task 12: Extract Handle Incoming Message Use Case
**Description:** Move message routing business logic to dedicated use case.

**Acceptance criteria:**
- [ ] `HandleIncomingMessageUseCase` class created
- [ ] Validation logic moved from webhook handler
- [ ] Deduplication logic moved to use case
- [ ] Rate limiting logic moved to use case
- [ ] Message routing logic moved to use case
- [ ] Accepts repository dependencies via constructor

**Verification:**
- [ ] Unit tests pass: `npm test -- --grep "handle-incoming-message"`
- [ ] Integration test with in-memory repositories succeeds

**Dependencies:** Tasks 9, 10, 11 (Repositories)

**Files likely touched:**
- `src/use-cases/handle-incoming-message.js`
- `tests/use-cases/handle-incoming-message.test.js`
- `src/telegram-bot-agent.js`

**Estimated scope:** Medium (3 files)

---

#### Task 13: Extract Process Async Task Use Case
**Description:** Move queue task processing to dedicated use case.

**Acceptance criteria:**
- [ ] `ProcessAsyncTaskUseCase` class created
- [ ] Queue job processing logic moved from handler
- [ ] Retry logic preserved
- [ ] Error handling maintained
- [ ] Accepts repository dependencies via constructor

**Verification:**
- [ ] Unit tests pass: `npm test -- --grep "process-async-task"`
- [ ] Integration test with in-memory repositories succeeds

**Dependencies:** Tasks 9, 10, 11 (Repositories)

**Files likely touched:**
- `src/use-cases/process-async-task.js`
- `tests/use-cases/process-async-task.test.js`
- `src/telegram-bot-agent.js`

**Estimated scope:** Medium (3 files)

---

#### Task 14: Extract Run Scheduled Briefing Use Case
**Description:** Move cron-triggered briefing logic to dedicated use case.

**Acceptance criteria:**
- [ ] `RunScheduledBriefingUseCase` class created
- [ ] Cron trigger logic moved from handler
- [ ] Briefing generation logic preserved
- [ ] Accepts repository dependencies via constructor

**Verification:**
- [ ] Unit tests pass: `npm test -- --grep "run-scheduled-briefing"`
- [ ] Integration test with in-memory repositories succeeds

**Dependencies:** Tasks 9, 10, 11 (Repositories)

**Files likely touched:**
- `src/use-cases/run-scheduled-briefing.js`
- `tests/use-cases/run-scheduled-briefing.test.js`
- `src/telegram-bot-agent.js`

**Estimated scope:** Medium (3 files)

---

### Checkpoint: Telegram Use Cases
- [ ] All use case tests pass
- [ ] Business logic separated from HTTP handling
- [ ] Review with human before proceeding

---

### Phase 6: Telegram Bot Agent - Controller Layer (Medium Risk)

#### Task 15: Create Telegram Webhook Controller
**Description:** Extract HTTP-specific logic to controller.

**Acceptance criteria:**
- [ ] `TelegramWebhookController` class created
- [ ] Request parsing logic moved from handler
- [ ] Response formatting logic moved to controller
- [ ] CORS handling moved to controller
- [ ] Authentication validation moved to controller
- [ ] Accepts use case dependencies via constructor

**Verification:**
- [ ] Unit tests pass: `npm test -- --grep "telegram-webhook-controller"`
- [ ] Integration test with use cases succeeds

**Dependencies:** Tasks 12, 13, 14 (Use Cases)

**Files likely touched:**
- `src/controllers/telegram-webhook-controller.js`
- `tests/controllers/telegram-webhook-controller.test.js`
- `src/telegram-bot-agent.js`

**Estimated scope:** Medium (3 files)

---

### Checkpoint: Telegram Controller
- [ ] Controller tests pass
- [ ] HTTP logic separated from business logic
- [ ] Review with human before proceeding

---

### Phase 7: Telegram Bot Agent - Simplify Entry Point (Low Risk)

#### Task 16: Simplify Telegram Bot Agent Entry Point
**Description:** Reduce `telegram-bot-agent.js` to routing logic only.

**Acceptance criteria:**
- [ ] `telegram-bot-agent.js` reduced to routing logic
- [ ] Routes paths to controllers
- [ ] Injects dependencies (repositories, use cases, controllers)
- [ ] Handles Worker lifecycle (fetch, queue, scheduled)
- [ ] File reduced to <100 lines
- [ ] Backward compatibility maintained (all routes still work)

**Verification:**
- [ ] All existing tests pass: `npm test -- --grep "telegram-bot"`
- [ ] Lint check passes: `npm run lint`
- [ ] Manual check: Telegram bot still responds to webhooks
- [ ] Manual check: Dashboard API routes still work

**Dependencies:** Task 15 (Controller)

**Files likely touched:**
- `src/telegram-bot-agent.js`

**Estimated scope:** Small (1 file)

---

### Checkpoint: Complete
- [ ] All tests pass
- [ ] Lint check passes
- [ ] Telegram bot functional
- [ ] Dashboard API functional
- [ ] Code coverage maintained or improved
- [ ] Architecture documentation updated
- [ ] Ready for review

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing functionality | High | Maintain backward compatibility, test after each phase |
| Test coverage gaps | Medium | Add tests for each new layer before refactoring |
| Performance regression | Medium | Benchmark before/after, monitor in production |
| Dependency injection complexity | Low | Use simple constructor injection, avoid DI frameworks |
| Integration test failures | Medium | Use in-memory implementations for reliable tests |

## Open Questions

- Should we use a dependency injection framework or manual constructor injection? (Recommendation: Manual for simplicity)
- Do we need to maintain the exact same API surface or can we deprecate old exports? (Recommendation: Maintain compatibility during transition)
- Should we create shared repository interfaces or separate per module? (Recommendation: Separate per module for now, consolidate later if patterns emerge)

## Parallelization Opportunities

**Safe to parallelize:**
- Tasks 1, 2, 3 (LLM Client foundation - independent)
- Tasks 4, 5, 6 (LLM Client providers - independent)
- Tasks 9, 10, 11 (Telegram repositories - independent)
- Tasks 12, 13, 14 (Telegram use cases - independent after repositories)

**Must be sequential:**
- Task 7 depends on Tasks 1, 4, 5, 6
- Task 8 depends on Task 7
- Tasks 12, 13, 14 depend on Tasks 9, 10, 11
- Task 15 depends on Tasks 12, 13, 14
- Task 16 depends on Task 15

## Verification Before Implementation

- [ ] Every task has acceptance criteria
- [ ] Every task has a verification step
- [ ] Task dependencies are identified and ordered correctly
- [ ] No task touches more than 5 files
- [ ] Checkpoints exist between major phases
- [ ] Human has reviewed and approved this plan
