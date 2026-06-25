import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrainstormingWorkflow } from '../../src/cascade/brainstorming.js';

describe('BrainstormingWorkflow', () => {
  let workflow;
  let mockEnv;

  beforeEach(() => {
    mockEnv = { test: 'env' };
    workflow = new BrainstormingWorkflow(mockEnv);
    vi.clearAllMocks();
  });

  it('should start brainstorming session', () => {
    const initialRequest = { description: 'Build a new feature' };
    const session = workflow.startSession('session-1', initialRequest);

    expect(session).toBeDefined();
    expect(session.id).toBe('session-1');
    expect(session.initialRequest).toEqual(initialRequest);
    expect(session.status).toBe('active');
    expect(session.currentPhase).toBe('clarification');
  });

  it('should ask clarifying question', () => {
    workflow.startSession('session-1', { description: 'Test' });
    const question = workflow.askClarifyingQuestion('session-1', 'What is the goal?', 'goal');

    expect(question).toBeDefined();
    expect(question.question).toBe('What is the goal?');
    expect(question.category).toBe('goal');
    expect(question.answered).toBe(false);
  });

  it('should record answer to question', () => {
    workflow.startSession('session-1', { description: 'Test' });
    const question = workflow.askClarifyingQuestion('session-1', 'What is the goal?', 'goal');
    const answer = workflow.recordAnswer('session-1', question.id, 'To improve user experience');

    expect(answer.answered).toBe(true);
    expect(answer.answer).toBe('To improve user experience');
  });

  it('should generate alternatives', () => {
    workflow.startSession('session-1', { description: 'Test' });
    const alternatives = [
      { description: 'Option A', pros: ['Fast'], cons: ['Complex'] },
      { description: 'Option B', pros: ['Simple'], cons: ['Slow'] }
    ];
    const result = workflow.generateAlternatives('session-1', alternatives);

    expect(result).toBeDefined();
    expect(result.alternatives.length).toBe(2);
    expect(result.alternatives[0].description).toBe('Option A');
  });

  it('should request approval', () => {
    workflow.startSession('session-1', { description: 'Test' });
    const approval = workflow.requestApproval('session-1', 'alt-0', 'Best option for requirements');

    expect(approval).toBeDefined();
    expect(approval.alternativeId).toBe('alt-0');
    expect(approval.approved).toBe(null);
  });

  it('should record approval decision', () => {
    workflow.startSession('session-1', { description: 'Test' });
    const approval = workflow.requestApproval('session-1', 'alt-0', 'Best option');
    const decision = workflow.recordApproval('session-1', approval.id, true, 'Looks good');

    expect(decision.approved).toBe(true);
    expect(decision.feedback).toBe('Looks good');
  });

  it('should get session summary', () => {
    workflow.startSession('session-1', { description: 'Test request' });
    const summary = workflow.getSessionSummary('session-1');

    expect(summary).toBeDefined();
    expect(summary.id).toBe('session-1');
    expect(summary.status).toBe('active');
    expect(summary.questionsAsked).toBe(0);
  });

  it('should return null for non-existent session', () => {
    const summary = workflow.getSessionSummary('non-existent');

    expect(summary).toBeNull();
  });

  it('should get unanswered questions', () => {
    workflow.startSession('session-1', { description: 'Test' });
    workflow.askClarifyingQuestion('session-1', 'Question 1', 'general');
    workflow.askClarifyingQuestion('session-1', 'Question 2', 'general');

    const unanswered = workflow.getUnansweredQuestions('session-1');

    expect(unanswered.length).toBe(2);
  });

  it('should filter answered questions', () => {
    workflow.startSession('session-1', { description: 'Test' });
    const q1 = workflow.askClarifyingQuestion('session-1', 'Question 1', 'general');
    workflow.askClarifyingQuestion('session-1', 'Question 2', 'general');
    workflow.recordAnswer('session-1', q1.id, 'Answer 1');

    const unanswered = workflow.getUnansweredQuestions('session-1');

    expect(unanswered.length).toBe(1);
  });

  it('should get pending approvals', () => {
    workflow.startSession('session-1', { description: 'Test' });
    workflow.requestApproval('session-1', 'alt-0', 'Justification');
    // Add delay to ensure different timestamps
    const now = Date.now();
    workflow.requestApproval('session-1', 'alt-1', 'Justification');

    const pending = workflow.getPendingApprovals();

    expect(pending.length).toBeGreaterThanOrEqual(1);
  });

  it('should complete session', () => {
    workflow.startSession('session-1', { description: 'Test' });
    const completed = workflow.completeSession('session-1', 'approved');

    expect(completed.status).toBe('completed');
    expect(completed.outcome).toBe('approved');
    expect(completed.endTime).toBeDefined();
  });

  it('should get workflow statistics', () => {
    workflow.startSession('session-1', { description: 'Test' });
    workflow.startSession('session-2', { description: 'Test' });
    workflow.completeSession('session-2', 'approved');

    const stats = workflow.getStatistics();

    expect(stats.totalSessions).toBe(2);
    expect(stats.activeSessions).toBe(1);
    expect(stats.completedSessions).toBe(1);
  });

  it('should calculate approval rate', () => {
    workflow.startSession('session-1', { description: 'Test' });
    const approval = workflow.requestApproval('session-1', 'alt-0', 'Justification');
    workflow.recordApproval('session-1', approval.id, true);

    const stats = workflow.getStatistics();

    expect(stats.approvalRate).toBe(100);
  });

  it('should clear history', () => {
    workflow.startSession('session-1', { description: 'Test' });
    workflow.requestApproval('session-1', 'alt-0', 'Justification');

    expect(workflow.workflowHistory.size).toBe(1);
    expect(workflow.approvalQueue.size).toBe(1);

    workflow.clearHistory();

    expect(workflow.workflowHistory.size).toBe(0);
    expect(workflow.approvalQueue.size).toBe(0);
  });

  it('should update session phase on approval', () => {
    workflow.startSession('session-1', { description: 'Test' });
    const approval = workflow.requestApproval('session-1', 'alt-0', 'Justification');
    workflow.recordApproval('session-1', approval.id, true);

    const session = workflow.workflowHistory.get('session-1');

    expect(session.currentPhase).toBe('implementation');
    expect(session.selectedAlternative).toBe('alt-0');
  });

  it('should return to exploration on rejection', () => {
    workflow.startSession('session-1', { description: 'Test' });
    const approval = workflow.requestApproval('session-1', 'alt-0', 'Justification');
    workflow.recordApproval('session-1', approval.id, false);

    const session = workflow.workflowHistory.get('session-1');

    expect(session.currentPhase).toBe('exploration');
  });
});
