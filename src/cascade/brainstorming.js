// Brainstorming Workflow — Socratic design refinement with user approval

import { logger } from '../core/logger.js';

class BrainstormingWorkflow {
  constructor(env) {
    this.env = env;
    this.workflowHistory = new Map();
    this.approvalQueue = new Map();
  }

  /**
   * Start brainstorming session
   * @param {string} sessionId - Session identifier
   * @param {object} initialRequest - Initial user request
   * @returns {object} Session data
   */
  startSession(sessionId, initialRequest) {
    const session = {
      id: sessionId,
      initialRequest,
      startTime: new Date().toISOString(),
      status: 'active',
      questions: [],
      answers: [],
      alternatives: [],
      approvals: [],
      currentPhase: 'clarification'
    };

    this.workflowHistory.set(sessionId, session);

    logger.info(`Brainstorming: Started session ${sessionId}`, {
      initialRequest: initialRequest.description
    });

    return session;
  }

  /**
   * Ask clarifying question (Socratic method)
   * @param {string} sessionId - Session identifier
   * @param {string} question - Clarifying question
   * @param {string} category - Question category
   * @returns {object} Question data
   */
  askClarifyingQuestion(sessionId, question, category = 'general') {
    const session = this.workflowHistory.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const questionData = {
      id: `q-${Date.now()}`,
      question,
      category,
      timestamp: new Date().toISOString(),
      answer: null,
      answered: false
    };

    session.questions.push(questionData);

    logger.info(`Brainstorming: Asked clarifying question`, {
      sessionId,
      category,
      question
    });

    return questionData;
  }

  /**
   * Record answer to clarifying question
   * @param {string} sessionId - Session identifier
   * @param {string} questionId - Question identifier
   * @param {string} answer - User's answer
   * @returns {object} Updated question data
   */
  recordAnswer(sessionId, questionId, answer) {
    const session = this.workflowHistory.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const question = session.questions.find(q => q.id === questionId);
    if (!question) {
      throw new Error(`Question not found: ${questionId}`);
    }

    question.answer = answer;
    question.answered = true;
    question.answeredAt = new Date().toISOString();

    session.answers.push({
      questionId,
      answer,
      timestamp: question.answeredAt
    });

    logger.info(`Brainstorming: Recorded answer`, {
      sessionId,
      questionId
    });

    return question;
  }

  /**
   * Generate alternative approaches
   * @param {string} sessionId - Session identifier
   * @param {Array} alternatives - List of alternative approaches
   * @returns {object} Alternatives data
   */
  generateAlternatives(sessionId, alternatives) {
    const session = this.workflowHistory.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const alternativesData = {
      id: `alt-${Date.now()}`,
      alternatives: alternatives.map((alt, index) => ({
        id: `alt-${index}`,
        description: alt.description,
        pros: alt.pros || [],
        cons: alt.cons || [],
        complexity: alt.complexity || 'medium',
        estimatedEffort: alt.estimatedEffort || 'medium'
      })),
      timestamp: new Date().toISOString(),
      selected: null
    };

    session.alternatives.push(alternativesData);
    session.currentPhase = 'exploration';

    logger.info(`Brainstorming: Generated alternatives`, {
      sessionId,
      count: alternativesData.alternatives.length
    });

    return alternativesData;
  }

  /**
   * Request user approval for approach
   * @param {string} sessionId - Session identifier
   * @param {string} alternativeId - Alternative identifier
   * @param {string} justification - Justification for selection
   * @returns {object} Approval request data
   */
  requestApproval(sessionId, alternativeId, justification) {
    const session = this.workflowHistory.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const approvalRequest = {
      id: `apr-${Date.now()}`,
      alternativeId,
      justification,
      timestamp: new Date().toISOString(),
      approved: null,
      feedback: null
    };

    this.approvalQueue.set(approvalRequest.id, approvalRequest);
    session.currentPhase = 'approval';

    logger.info(`Brainstorming: Requested approval`, {
      sessionId,
      alternativeId
    });

    return approvalRequest;
  }

  /**
   * Record user approval decision
   * @param {string} sessionId - Session identifier
   * @param {string} approvalId - Approval request identifier
   * @param {boolean} approved - Whether approved
   * @param {string} feedback - User feedback
   * @returns {object} Updated approval data
   */
  recordApproval(sessionId, approvalId, approved, feedback = null) {
    const session = this.workflowHistory.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const approval = this.approvalQueue.get(approvalId);
    if (!approval) {
      throw new Error(`Approval request not found: ${approvalId}`);
    }

    approval.approved = approved;
    approval.feedback = feedback;
    approval.decidedAt = new Date().toISOString();

    session.approvals.push(approval);

    if (approved) {
      session.currentPhase = 'implementation';
      session.selectedAlternative = approval.alternativeId;
    } else {
      session.currentPhase = 'exploration';
    }

    logger.info(`Brainstorming: Recorded approval decision`, {
      sessionId,
      approved,
      alternativeId: approval.alternativeId
    });

    return approval;
  }

  /**
   * Get session summary
   * @param {string} sessionId - Session identifier
   * @returns {object} Session summary
   */
  getSessionSummary(sessionId) {
    const session = this.workflowHistory.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      id: session.id,
      initialRequest: session.initialRequest,
      status: session.status,
      currentPhase: session.currentPhase,
      questionsAsked: session.questions.length,
      questionsAnswered: session.questions.filter(q => q.answered).length,
      alternativesGenerated: session.alternatives.length,
      approvalsReceived: session.approvals.length,
      selectedAlternative: session.selectedAlternative,
      startTime: session.startTime,
      duration: this.calculateDuration(session.startTime)
    };
  }

  /**
   * Calculate session duration
   * @param {string} startTime - Start time ISO string
   * @returns {string} Duration string
   */
  calculateDuration(startTime) {
    const start = new Date(startTime);
    const now = new Date();
    const diff = now - start;

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  }

  /**
   * Get unanswered questions
   * @param {string} sessionId - Session identifier
   * @returns {Array} Unanswered questions
   */
  getUnansweredQuestions(sessionId) {
    const session = this.workflowHistory.get(sessionId);
    if (!session) {
      return [];
    }

    return session.questions.filter(q => !q.answered);
  }

  /**
   * Get pending approvals
   * @returns {Array} Pending approval requests
   */
  getPendingApprovals() {
    return Array.from(this.approvalQueue.values())
      .filter(apr => apr.approved === null);
  }

  /**
   * Complete session
   * @param {string} sessionId - Session identifier
   * @param {string} outcome - Session outcome
   * @returns {object} Completed session data
   */
  completeSession(sessionId, outcome) {
    const session = this.workflowHistory.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.status = 'completed';
    session.endTime = new Date().toISOString();
    session.outcome = outcome;

    logger.info(`Brainstorming: Completed session ${sessionId}`, {
      outcome,
      duration: this.calculateDuration(session.startTime)
    });

    return session;
  }

  /**
   * Get workflow statistics
   * @returns {object} Workflow statistics
   */
  getStatistics() {
    const sessions = Array.from(this.workflowHistory.values());

    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      totalQuestions: sessions.reduce((sum, s) => sum + s.questions.length, 0),
      totalAnswers: sessions.reduce((sum, s) => sum + s.answers.length, 0),
      totalAlternatives: sessions.reduce((sum, s) => sum + s.alternatives.length, 0),
      totalApprovals: sessions.reduce((sum, s) => sum + s.approvals.length, 0),
      approvalRate: this.calculateApprovalRate(sessions)
    };
  }

  /**
   * Calculate approval rate
   * @param {Array} sessions - Session array
   * @returns {number} Approval rate percentage
   */
  calculateApprovalRate(sessions) {
    const totalApprovals = sessions.reduce((sum, s) => sum + s.approvals.length, 0);
    if (totalApprovals === 0) return 0;

    const approved = sessions.reduce((sum, s) => {
      return sum + s.approvals.filter(a => a.approved).length;
    }, 0);

    return (approved / totalApprovals) * 100;
  }

  /**
   * Clear session history
   */
  clearHistory() {
    this.workflowHistory.clear();
    this.approvalQueue.clear();
    logger.info(`Brainstorming: History cleared`);
  }
}

export { BrainstormingWorkflow };
