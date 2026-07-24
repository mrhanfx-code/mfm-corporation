# Cascade Core Prompt Structure Analysis

## Current Prompt Structure

### Assembly Order (Line 206 in agent-base.js)
```
systemPrompt + toolInstructions + contextSection + GLOBAL_RULES
```

### 1. Individual Agent System Prompt
- **Location**: Passed via constructor parameter `systemPrompt`
- **Purpose**: Agent-specific role definition and behavioral guidelines
- **Example**: Each agent defines its own role-specific instructions

### 2. Tool Instructions (Lines 75-110)
- **Location**: `TOOL_DESCRIPTIONS` object + `buildToolInstructions()` function
- **Purpose**: Dynamic tool availability and usage patterns
- **Content**: 20 tool definitions with usage syntax
- **Injection**: Only includes tools available to the specific agent

### 3. Context Section (Lines 201-203)
- **Location**: Optional `contextCard` parameter
- **Purpose**: Business context injection
- **Content**: Free-form business context card
- **Condition**: Only added if `options.contextCard` is provided

### 4. GLOBAL_RULES (Lines 22-73)
- **Location**: Hardcoded constant in agent-base.js
- **Purpose**: Mandatory rules that override all other instructions
- **Content**: 10 non-overrideable rules
- **Rules**:
  1. STAY IN ROLE - Role boundary enforcement
  2. NO HALLUCINATION - Factuality requirement
  3. NO FABRICATED TOOLS - Tool whitelist enforcement
  4. MISSING API KEY = HONEST RESPONSE - Secret handling
  5. NO FABRICATED ACTIONS - Action verification
  6. IDENTITY - AI agent identity
  7. SCOPE CREEP = REFUSE - Boundary enforcement
  8. UNCERTAINTY = ADMIT IT - Honesty requirement
  9. NO UNSOLICITED ACTIONS - Approval requirement
  10. MFM IDENTITY - Platform identity

## Integration Points for system_prompts_leaks Patterns

### 1. Harness Section
- **Integration Point**: Before GLOBAL_RULES
- **Purpose**: Core behavioral constraints and safety guidelines
- **Current Coverage**: Partially covered by GLOBAL_RULES
- **Enhancement**: Add structured harness with capability definitions

### 2. Communication Section
- **Integration Point**: After agent systemPrompt, before tool instructions
- **Purpose**: Communication style, tone, and format guidelines
- **Current Coverage**: Not explicitly defined
- **Enhancement**: Add communication patterns for clarity and consistency

### 3. Session Guidance Section
- **Integration Point**: After context section, before GLOBAL_RULES
- **Purpose**: Session-specific behavior and context management
- **Current Coverage**: Minimal (context section only)
- **Enhancement**: Add session-specific guidelines and context summarization

## Risk Assessment

### Low Risk
- Adding new sections to prompt structure
- Enhancing existing GLOBAL_RULES with sub-sections
- Adding context management guidelines

### Medium Risk
- Modifying GLOBAL_RULES order or content
- Changing tool instruction injection logic
- Adding mandatory search-first patterns

### High Risk
- Removing or weakening existing GLOBAL_RULES
- Changing the prompt assembly order
- Modifying tool parsing logic

## Recommended Integration Strategy

1. **Phase 1**: Add new sections as optional modules
2. **Phase 2**: Enhance existing sections with structured patterns
3. **Phase 3**: Add context management and search-first guidelines
4. **Phase 4**: Test and validate with existing agents

## Files to Modify
- `src/core/agent-base.js` - Prompt assembly logic
- `src/core/prompt-template.js` - New structured template (to be created)
- `src/core/context-manager.js` - Context management (to be created)
