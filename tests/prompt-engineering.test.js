// Test updated prompt engineering changes

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { buildPromptTemplate, buildSimplePromptTemplate, HARNESS_SECTION, COMMUNICATION_SECTION, SESSION_GUIDANCE_SECTION } from '../src/core/prompt-template.js';
import { CONTEXT_SUMMARIZATION_RULES, RE_DERIVATION_AVOIDANCE, TokenBudgetManager, summarizeConversation, shouldSummarize } from '../src/core/context-manager.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read agent-base.js to check GLOBAL_RULES content
const agentBaseContent = readFileSync(join(__dirname, '../src/core/agent-base.js'), 'utf-8');

describe('Prompt Template', () => {
  it('should have distinct sections with clear headers', () => {
    expect(HARNESS_SECTION).toContain('HARNESS — Core Behavioral Constraints');
    expect(COMMUNICATION_SECTION).toContain('COMMUNICATION — Style and Format Guidelines');
    expect(SESSION_GUIDANCE_SECTION).toContain('SESSION GUIDANCE — Context Management');
  });

  it('should build complete prompt template with context', () => {
    const context = {
      agentRole: 'You are a test agent.',
      toolCapabilities: 'Tool 1: do something',
      businessContext: 'Business context here'
    };
    const template = buildPromptTemplate(context);
    
    expect(template).toContain('You are a test agent.');
    expect(template).toContain('HARNESS — Core Behavioral Constraints');
    expect(template).toContain('COMMUNICATION — Style and Format Guidelines');
    expect(template).toContain('SESSION GUIDANCE — Context Management');
    expect(template).toContain('Tool 1: do something');
    expect(template).toContain('Business context here');
  });

  it('should build simple template without section headers', () => {
    const context = {
      agentRole: 'You are a test agent.',
      toolCapabilities: 'Tool 1: do something'
    };
    const template = buildSimplePromptTemplate(context);
    
    expect(template).toContain('You are a test agent.');
    expect(template).toContain('Tool 1: do something');
    expect(template).not.toContain('HARNESS — Core Behavioral Constraints');
  });
});

describe('Context Manager', () => {
  it('should have defined summarization rules', () => {
    expect(CONTEXT_SUMMARIZATION_RULES.MAX_TURNS_BEFORE_SUMMARY).toBe(20);
    expect(CONTEXT_SUMMARIZATION_RULES.MAX_TOKENS_BEFORE_SUMMARY).toBe(8000);
    expect(CONTEXT_SUMMARIZATION_RULES.RECENT_TURNS_TO_KEEP).toBe(5);
  });

  it('should manage token budget', () => {
    const manager = new TokenBudgetManager(1000);
    
    expect(manager.estimateTokens('hello world')).toBe(3);
    expect(manager.canAdd('hello world')).toBe(true);
    expect(manager.add('hello world')).toBe(true);
    expect(manager.getRemaining()).toBe(997);
    expect(manager.getUtilization()).toBe(0.3);
  });

  it('should detect when summarization is needed', () => {
    const manager = new TokenBudgetManager(100);
    const history = Array(25).fill({ role: 'user', content: 'test' });
    
    const result = shouldSummarize(history, manager);
    expect(result.shouldSummarize).toBe(true);
    expect(result.reason).toBe('exceeds_max_turns');
  });

  it('should summarize conversation history', () => {
    const history = [
      { role: 'user', content: 'I want to decide on X' },
      { role: 'assistant', content: 'I agree with X' },
      { role: 'user', content: 'Remember that I prefer Y' }
    ];
    
    const result = summarizeConversation(history, { maxTurns: 2 });
    expect(result.summarized).toBe(true);
    expect(result.keyPoints).toBeDefined();
    expect(result.recentTurns).toBeDefined();
  });
});

describe('GLOBAL_RULES Updates', () => {
  it('should include search-first mandate', () => {
    expect(agentBaseContent).toContain('SEARCH-FIRST MANDATE');
    expect(agentBaseContent).toContain('you MUST search the codebase first before responding');
  });

  it('should include senior engineer judgment patterns', () => {
    expect(agentBaseContent).toContain('SENIOR ENGINEER JUDGMENT');
    expect(agentBaseContent).toContain('Consider trade-offs');
    expect(agentBaseContent).toContain('Suggest pragmatic solutions');
  });

  it('should include proactiveness guidelines', () => {
    expect(agentBaseContent).toContain('PROACTIVENESS');
    expect(agentBaseContent).toContain('Ask clarifying questions before assuming intent');
  });

  it('should include ambiguity handling', () => {
    expect(agentBaseContent).toContain('AMBIGUITY HANDLING');
    expect(agentBaseContent).toContain('Identify what information is needed');
  });

  it('should have 14 rules total', () => {
    const ruleCount = (agentBaseContent.match(/^\d+\./gm) || []).length;
    expect(ruleCount).toBe(14);
  });
});
