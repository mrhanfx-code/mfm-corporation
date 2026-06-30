# Tool Parameter Validation Audit

**Date:** May 29, 2026
**Phase:** 2.7 - Tool Calling Standardization
**Status:** Audit Complete

## Current Parameter Validation State

### Tools with Required Parameter Validation

| Tool | Required Parameters | Validation Method | Type Safety |
|------|-------------------|------------------|------------|
| web-fetch | url | `if (!args?.url)` | None |
| send-email | to, subject, body | `if (!args?.to || !args?.subject || !args?.body)` | None |
| exa-search | query | `if (!args?.query)` | None |
| social-post | platform | `if (!args?.platform)` | None |
| perplexity-search | query | `if (!args?.query)` | None |
| brave-search | query | `if (!args?.query)` | None |
| github-issues | owner, repo | `if (!args?.owner || !args?.repo)` | None |
| notion-search | query | `if (!args?.query)` | None |
| drive-read | fileId | `if (!args?.fileId)` | None |
| drive-write | fileName, content | `if (!args?.fileName || !args?.content)` | None |
| drive-search | query | `if (!args?.query)` | None |
| calendar-create | summary, startDatetime, endDatetime | `if (!args?.summary || !args?.startDatetime || !args?.endDatetime)` | None |
| pdf-generate | title, content | `if (!args?.title || !args?.content)` | None |
| slack-notify | text | `if (!args?.text)` | None |
| sms-alert | message | `if (!args?.message)` | None |
| github-push | repo, path, content | `if (!args?.repo || !args?.path || !args?.content)` | None |
| github-create-repo | name | `if (!args?.name)` | None |
| codegraph-query | query | `if (!args?.query)` | None |
| codegraph-context | task | `if (!args?.task)` | None |
| d1-query | query | `if (!args?.query)` | None |
| memory-search | query | `if (!args?.query)` | None |
| memory-remember | content | `if (!args?.content)` | None |
| memory-context | query | `if (!args?.query)` | None |
| memory-enrich | content | `if (!args?.content)` | None |

### Tools with Optional Parameters Only

| Tool | Optional Parameters | Validation Method | Type Safety |
|------|-------------------|------------------|------------|
| drive-list | folderId | None | None |
| calendar-list | maxResults | None | None |
| calendar-free-slot | durationMinutes, withinDays | None | None |
| stripe-balance | None | None | None |
| stripe-charges | limit | None | None |
| github-list-repos | None | None | None |
| video-prompt | topic, style, duration, platform | None | None |

## Validation Issues Identified

### Critical Issues
1. **No Type Safety** - All tools lack type validation (string, number, boolean, etc.)
2. **No Schema Validation** - No structural validation for nested objects
3. **No Range Validation** - No min/max checks for numeric parameters
4. **No Format Validation** - No regex validation for URLs, emails, dates
5. **No Enum Validation** - No validation for allowed values (platform, style, etc.)

### Medium Issues
1. **Inconsistent Validation** - Some tools validate, some don't
2. **No Default Values** - Optional parameters lack defaults
3. **No Coercion** - No automatic type conversion
4. **No Custom Errors** - Generic error messages

### Low Issues
1. **No Validation Documentation** - Schema not documented
2. **No Validation Tests** - No tests for invalid inputs

## Recommended Zod Schema Design

### Schema Structure
```typescript
import { z } from 'zod';

const ToolSchemas = {
  'web-fetch': z.object({
    url: z.string().url(),
    maxChars: z.number().min(1).max(10000).optional()
  }),
  
  'send-email': z.object({
    to: z.string().email(),
    subject: z.string().min(1).max(500),
    body: z.string().min(1).max(10000)
  }),
  
  'exa-search': z.object({
    query: z.string().min(1),
    numResults: z.number().min(1).max(20).optional()
  }),
  
  'social-post': z.object({
    platform: z.enum(['facebook', 'instagram', 'tiktok']),
    text: z.string().optional(),
    caption: z.string().optional(),
    imageUrl: z.string().url().optional(),
    videoUrl: z.string().url().optional()
  }),
  
  // ... additional schemas for all tools
};
```

### Validation Layer
```typescript
function validateToolCall(toolName, args) {
  const schema = ToolSchemas[toolName];
  if (!schema) {
    throw new Error(`Unknown tool: ${toolName}`);
  }
  
  return schema.parse(args);
}
```

## Implementation Plan

1. **Phase 2.7.1** - Create Zod schema definitions for all 31 tools
2. **Phase 2.7.2** - Implement validation layer in agent-base.js
3. **Phase 2.7.3** - Add validation to useTool method
4. **Phase 2.7.4** - Create validation tests
5. **Phase 2.7.5** - Verify 100% type-safe parameters

## Success Criteria

- [ ] All 31 tools have Zod schemas
- [ ] Validation layer integrated
- [ ] 100% type-safe parameters
- [ ] Comprehensive test coverage
- [ ] No breaking changes to existing functionality
