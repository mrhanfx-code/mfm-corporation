# Tool Audit Report

**Project**: MFM Corporation
**Phase**: Phase 2 - Foundation
**Created**: 2026-05-30
**Owner**: Sage (Backend Engineer)

---

## Overview

Audit of all existing tools in `src/tools/` for parameter validation and type safety. This audit identifies tools that need Zod schema implementation for type-safe parameter validation.

## Tool Inventory

### Core Tools

#### 1. d1-store.js
**Purpose**: Database operations (tasks, memory, decisions, metrics)
**Parameters**:
- `saveTask(agent, input, env)` - agent (string), input (string), env (object)
- `completeTask(id, output, qualityScore, env)` - id (string), output (string), qualityScore (number), env (object)
- `saveMemory(agent, userId, role, content, env)` - agent (string), userId (string/number), role (string), content (string), env (object)
- `getMemory(agent, userId, limit, env)` - agent (string), userId (string/number), limit (number), env (object)

**Current Validation**: None (runtime type checking only)
**Zod Schema Needed**: Yes
**Priority**: High (core data operations)

---

#### 2. telegram-tool.js
**Purpose**: Telegram bot integration
**Parameters**: Various Telegram API parameters

**Current Validation**: None
**Zod Schema Needed**: Yes
**Priority**: High (external API integration)

---

#### 3. web-fetch.js
**Purpose**: HTTP web requests
**Parameters**: URL, headers, body, method

**Current Validation**: None
**Zod Schema Needed**: Yes
**Priority**: High (network operations)

---

### Integration Tools

#### 4. supabase-bridge.js
**Purpose**: Supabase database integration
**Parameters**: Database query parameters

**Current Validation**: None
**Zod Schema Needed**: Yes
**Priority**: Medium (external service)

---

#### 5. social-media-tool.js
**Purpose**: Social media posting
**Parameters**: Platform-specific parameters

**Current Validation**: None
**Zod Schema Needed**: Yes
**Priority**: Medium (external service)

---

#### 6. sms-tool.js
**Purpose**: SMS sending
**Parameters**: Phone number, message

**Current Validation**: None
**Zod Schema Needed**: Yes
**Priority**: Medium (external service)

---

#### 7. email-tool.js
**Purpose**: Email sending
**Parameters**: To, subject, body, attachments

**Current Validation**: None
**Zod Schema Needed**: Yes
**Priority**: Medium (external service)

---

#### 8. github-tool.js
**Purpose**: GitHub API integration
**Parameters**: Repository, issue, PR parameters

**Current Validation**: None
**Zod Schema Needed**: Yes
**Priority**: Medium (external service)

---

#### 9. google-drive-tool.js
**Purpose**: Google Drive integration
**Parameters**: File operations parameters

**Current Validation**: None
**Zod Schema Needed**: Yes
**Priority**: Medium (external service)

---

#### 10. notion-tool.js
**Purpose**: Notion integration
**Parameters**: Database, page, block parameters

**Current Validation**: None
**Zod Schema Needed**: Yes
**Priority**: Medium (external service)

---

#### 11. calendar-tool.js
**Purpose**: Calendar operations
**Parameters**: Event details, scheduling parameters

**Current Validation**: None
**Zod Schema Needed**: Yes
**Priority**: Low (internal utility)

---

#### 12. pdf-tool.js
**Purpose**: PDF generation/processing
**Parameters**: Content, formatting parameters

**Current Validation**: None
**Zod Schema Needed**: Yes
**Priority**: Low (internal utility)

---

#### 13. image-tool.js
**Purpose**: Image processing
**Parameters**: Image data, processing parameters

**Current Validation**: None
**Zod Schema Needed**: Yes
**Priority**: Low (internal utility)

---

#### 14. nl2sql-tool.js
**Purpose**: Natural language to SQL
**Parameters**: Query text, schema

**Current Validation**: None
**Zod Schema Needed**: Yes
**Priority**: Low (internal utility)

---

#### 15. exa-tool.js
**Purpose**: Exa search API
**Parameters**: Search query, filters

**Current Validation**: None
**Zod Schema Needed**: Yes
**Priority**: Medium (external service)

---

#### 16. mcp-client.js
**Purpose**: MCP server client
**Parameters**: Server configuration, tool calls

**Current Validation**: None
**Zod Schema Needed**: Yes
**Priority**: High (core infrastructure)

---

#### 17. novaread-store.js
**Purpose**: NovaRead storage
**Parameters**: Storage operations

**Current Validation**: None
**Zod Schema Needed**: Yes
**Priority**: Low (internal utility)

---

#### 18. knowledge-graph-dashboard.js
**Purpose**: Knowledge graph visualization
**Parameters**: Graph query parameters

**Current Validation**: None
**Zod Schema Needed**: Yes
**Priority**: Low (internal utility)

---

#### 19. dashboard-events.js
**Purpose**: Dashboard event handling
**Parameters**: Event data

**Current Validation**: None
**Zod Schema Needed**: Yes
**Priority**: Low (internal utility)

---

#### 20. codegraph-tool.js
**Purpose**: Code graph operations
**Parameters**: Graph query parameters

**Current Validation**: None
**Zod Schema Needed**: Yes
**Priority**: Low (internal utility)

---

#### 21. alerting.js
**Purpose**: Alert notifications
**Parameters**: Alert details, recipients

**Current Validation**: None
**Zod Schema Needed**: Yes
**Priority**: Medium (critical operations)

---

## Summary

**Total Tools**: 21
**Tools with Validation**: 0
**Tools Needing Zod Schemas**: 21
**High Priority**: 4 (d1-store, telegram-tool, web-fetch, mcp-client)
**Medium Priority**: 7 (supabase-bridge, social-media, sms, email, github, google-drive, notion, exa, alerting)
**Low Priority**: 10 (calendar, pdf, image, nl2sql, novaread, knowledge-graph, dashboard-events, codegraph)

## Recommendations

1. **Phase 1**: Implement Zod schemas for high-priority tools (4 tools)
2. **Phase 2**: Implement Zod schemas for medium-priority tools (7 tools)
3. **Phase 3**: Implement Zod schemas for low-priority tools (10 tools)

## Next Steps

1. Design Zod schema for each tool (Task 2.49)
2. Implement Zod validation in tool system (Task 2.50)
3. Add automatic validation on tool calls (Task 2.51)
4. Update all existing tools with Zod schemas (Task 2.52)
5. Test tool validation with invalid inputs (Task 2.53)
6. Verify 100% type-safe parameters (Task 2.54)

## References

- Tool Directory: src/tools/
- Zod Documentation: https://zod.dev
- Task 2.49: Design Zod schema for each tool
- Task 2.50: Implement Zod validation in tool system
