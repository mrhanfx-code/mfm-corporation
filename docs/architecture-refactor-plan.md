# Telegram Bot Agent - Architecture Refactor Plan

## Current State Analysis

**File:** `src/telegram-bot-agent.js` (933 lines)

**Violations of Clean Architecture:**
- HTTP handling, business logic, and infrastructure concerns mixed in single file
- No clear layer separation (controllers, use cases, repositories)
- Direct coupling to Telegram API, KV, D1, R2 throughout
- Business logic embedded in HTTP request handler
- No repository abstractions for data access
- Not testable without real infrastructure

## Proposed Layer Structure

```
src/
├── controllers/
│   └── telegram-webhook-controller.js  # HTTP request parsing, response formatting
├── use-cases/
│   ├── handle-incoming-message.js      # Message routing business logic
│   ├── process-async-task.js           # Queue task processing
│   └── run-scheduled-briefing.js      # Cron trigger logic
├── repositories/
│   ├── kv-repository.js                # KV operations abstraction
│   ├── d1-repository.js                # D1 operations abstraction
│   └── r2-repository.js                # R2 operations abstraction
└── telegram-bot-agent.js              # Thin entry point (routes to controllers)
```

## Refactor Steps

### Step 1: Extract Repository Interfaces
Create abstract interfaces for KV, D1, R2 operations to enable in-memory testing.

### Step 2: Extract Use Cases
Move business logic from webhook handler into dedicated use case classes:
- `HandleIncomingMessageUseCase` - validates, deduplicates, rate limits, routes
- `ProcessAsyncTaskUseCase` - queue job processing with retry logic
- `RunScheduledBriefingUseCase` - cron-triggered briefings

### Step 3: Create Controller Layer
Extract HTTP-specific logic into controller:
- Request parsing
- Response formatting
- CORS handling
- Authentication validation

### Step 4: Simplify Entry Point
Reduce `telegram-bot-agent.js` to routing logic only:
- Route paths to controllers
- Inject dependencies
- Handle Worker lifecycle (fetch, queue, scheduled)

## Benefits

- **Testability:** Use cases can be tested with in-memory repositories
- **Maintainability:** Clear separation of concerns
- **Flexibility:** Swap implementations (e.g., KV → Redis) without touching business logic
- **Readability:** Smaller, focused files

## Timeline

Given the 933-line monolith, this is a multi-phase refactor:
- Phase 1: Extract repositories (least risk)
- Phase 2: Extract use cases (medium risk)
- Phase 3: Create controller layer (medium risk)
- Phase 4: Simplify entry point (low risk)

Each phase should be tested independently before proceeding.
