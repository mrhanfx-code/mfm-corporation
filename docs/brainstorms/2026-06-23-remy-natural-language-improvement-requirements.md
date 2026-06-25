# REMY Natural Language Improvement - Requirements

## Problem Statement
REMY's current responses feel too formal, robotic, and corporate. The user wants REMY to communicate in more natural, conversational language that feels like talking to a helpful assistant rather than a corporate bot.

## Current State Analysis

### Response Generation System
- **LLM Configuration**: Uses Cerebras (primary) and OpenRouter (fallback) with temperature 0.7
- **System Prompts**: Highly structured, business-focused, formal tone
- **Quality Review**: Scores responses 0-100, may enforce structure
- **Formatting**: Heavy use of markdown, emojis, and structured sections
- **Persona**: "General Manager of MFM Corporation" - very formal corporate identity

### Issues Identified
1. **Overly Formal Tone**: System prompts use corporate language ("classify", "route", "execute")
2. **Rigid Structure**: Responses follow strict patterns with headers and scores
3. **Lack of Personality**: No warmth, humor, or conversational elements
4. **Corporate Jargon**: Uses business terminology that feels mechanical
5. **Predictable Patterns**: Every response follows the same template

## Success Criteria
- REMY sounds like a helpful, intelligent assistant
- Responses feel natural and conversational
- Maintains professionalism while being approachable
- Reduces corporate jargon and robotic phrasing
- Keeps the system reliable and accurate

## Proposed Improvements

### 1. System Prompt Redesign
**Current**: "You are the General Manager of MFM Corporation, reporting directly to CEO Remy. Your job is to classify the CEO's message and route it to the best agent."

**Improved**: "You're REMY, my helpful AI assistant. You understand what I need and connect me with the right specialist. Talk naturally, like we're colleagues working together."

### 2. Temperature Adjustment
- **Current**: 0.7 (moderate creativity)
- **Proposed**: 0.8-0.9 (more natural variation and personality)
- **Rationale**: Higher temperature allows more natural language patterns

### 3. Response Format Simplification
- **Current**: `[AGENT NAME] (score: X/100)` followed by structured content
- **Proposed**: More natural flow, less rigid formatting
- **Keep**: Agent identification (but make it conversational)
- **Remove**: Score display from user-facing responses

### 4. Personality Injection
- Add conversational openers ("Got it!", "Here's what I found...")
- Use natural transitions instead of formal connectors
- Include appropriate warmth without being unprofessional
- Allow for occasional humor or personality (when appropriate)

### 5. Jargon Reduction
- Replace "classify" with "understand"
- Replace "route" with "connect" or "get"
- Replace "execute" with "handle" or "take care of"
- Simplify business terminology

## Implementation Phases

### Phase 1: Quick Wins (Low Risk)
- Adjust temperature settings
- Simplify response formatting
- Remove score display from user responses

### Phase 2: System Prompt Updates (Medium Risk)
- Rewrite main orchestrator prompt
- Update agent-specific prompts
- Test with various conversation types

### Phase 3: Personality Layer (Higher Risk)
- Add conversational patterns
- Implement natural language variations
- A/B test with users

## Constraints
- Must maintain system reliability and accuracy
- Cannot break existing agent routing
- Quality review system still needs to work
- Professional standards must be maintained
- Malaysia business context must be preserved

## Dependencies
- `src/core/llm-client.js` - temperature settings
- `src/core/orchestrator.js` - main system prompt
- Individual agent files - agent-specific prompts
- `src/core/quality-reviewer.js` - quality scoring system

## User Requirements (Confirmed)

**Persona:** Professional Friendly AI General Manager who works directly for CEO Remy
**Tone:** Calm, straight, honest
**Style:** No emojis, no exclamation points, always professional
**Testing:** A/B testing approved before full rollout

**Full Persona Document:** `docs/remy-persona.md`

### Key Personality Traits
- **Calm:** Never shows panic, measured responses, thoughtful
- **Straight:** Direct and efficient, gets to the point, respects CEO's time
- **Honest:** Always truthful, admits uncertainty, transparent about limitations
- **Professional:** Appropriate boundaries, proper grammar, represents MFM Corporation well
- **Friendly:** Warm and approachable, shows care, builds rapport

### Communication Rules
- Complete, well-structured sentences
- Professional vocabulary without jargon
- No emojis, no exclamation points
- No slang or casual abbreviations
- Clear and unambiguous
- Acknowledges requests before acting

## Implementation Plan

### Phase 1: Core Configuration Changes (Low Risk)
**Files to modify:**
- `src/core/llm-client.js` - Adjust temperature from 0.7 to 0.85
- `src/core/orchestrator.js` - Remove emoji usage from responses

**Changes:**
1. Increase LLM temperature to 0.85 for more natural variation
2. Remove all emoji characters from response templates
3. Remove exclamation points from system messages
4. Simplify response headers (remove score display from user-facing output)

**Testing:**
- Test 10 sample conversations
- Verify no emojis appear
- Check tone is calm and professional
- Ensure accuracy is maintained

### Phase 2: System Prompt Rewrite (Medium Risk)
**Files to modify:**
- `src/core/orchestrator.js` - Rewrite SYSTEM_PROMPT
- Individual agent files - Update agent-specific prompts

**Changes:**
1. Rewrite main orchestrator system prompt using persona guidelines
2. Update "General Manager" framing to "AI General Manager working for CEO Remy"
3. Incorporate calm, straight, honest communication patterns
4. Remove corporate jargon (classify → understand, route → connect, execute → handle)
5. Add response pattern examples from persona document

**Testing:**
- Test across all agent types
- Verify routing still works correctly
- Check responses match persona
- A/B test with current version

### Phase 3: Agent-Specific Prompt Updates (Medium Risk)
**Files to modify:**
- All agent files in `src/agents/` directory
- Each agent's system prompt

**Changes:**
1. Update each agent's system prompt to align with REMY persona
2. Ensure agents maintain their expertise while using consistent tone
3. Add persona-specific response patterns
4. Remove emojis and exclamation points from agent responses

**Testing:**
- Test each agent individually
- Verify specialist knowledge is preserved
- Check tone consistency across agents
- Full integration testing

### Phase 4: Quality Review System Update (Low Risk)
**Files to modify:**
- `src/core/quality-reviewer.js` - Update quality criteria

**Changes:**
1. Add persona compliance to quality scoring
2. Check for emoji usage (penalize)
3. Check for exclamation points (penalize)
4. Verify calm, straight, honest tone
5. Ensure professional language standards

**Testing:**
- Test quality review system
- Verify scoring still works
- Check persona compliance detection
- Calibrate scoring thresholds

### Phase 5: A/B Testing (User Approval Required)
**Approach:**
1. Deploy new version to test environment
2. Run parallel with current version
3. Collect user feedback on 50+ interactions
4. Compare metrics (accuracy, satisfaction, efficiency)
5. Decide on full rollout

**Success Criteria:**
- User preference for new version
- Maintained or improved accuracy
- No degradation in task completion
- Positive feedback on tone and clarity

## Next Steps
1. Implement Phase 1 changes (temperature, emoji removal, formatting)
2. Test Phase 1 changes with sample conversations
3. Present Phase 1 results for review
4. Proceed to Phase 2 upon approval
