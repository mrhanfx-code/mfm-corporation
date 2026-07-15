// Context Manager - Context summarization and re-derivation avoidance

/**
 * Context summarization rules
 * Defines when and how to summarize conversation context
 */
export const CONTEXT_SUMMARIZATION_RULES = {
  // Summarize when conversation exceeds this many turns
  MAX_TURNS_BEFORE_SUMMARY: 20,
  
  // Summarize when total tokens exceed this threshold
  MAX_TOKENS_BEFORE_SUMMARY: 8000,
  
  // Keep this many recent turns after summarization
  RECENT_TURNS_TO_KEEP: 5,
  
  // Summarization triggers
  TRIGGERS: {
    EXCEEDS_MAX_TURNS: 'exceeds_max_turns',
    EXCEEDS_MAX_TOKENS: 'exceeds_max_tokens',
    USER_REQUEST: 'user_request',
    TOPIC_CHANGE: 'topic_change'
  }
};

/**
 * Re-derivation avoidance guidelines
 * Prevents re-deriving information already established in conversation
 */
export const RE_DERIVATION_AVOIDANCE = {
  // Information types to track to avoid re-derivation
  TRACKED_INFO_TYPES: [
    'user_preferences',
    'project_context',
    'decisions_made',
    'agreements_reached',
    'unresolved_questions'
  ],
  
  // Mark information as established to avoid re-derivation
  markEstablished(infoType, info) {
    this.establishedInfo = this.establishedInfo || {};
    this.establishedInfo[infoType] = this.establishedInfo[infoType] || [];
    this.establishedInfo[infoType].push({
      info,
      timestamp: Date.now()
    });
  },
  
  // Check if information was already established
  isEstablished(infoType, info) {
    if (!this.establishedInfo || !this.establishedInfo[infoType]) {
      return false;
    }
    return this.establishedInfo[infoType].some(
      established => established.info === info
    );
  },
  
  // Get all established information of a type
  getEstablished(infoType) {
    if (!this.establishedInfo || !this.establishedInfo[infoType]) {
      return [];
    }
    return this.establishedInfo[infoType];
  }
};

/**
 * Token budget management
 * Monitors and manages token usage to stay within limits
 */
export class TokenBudgetManager {
  constructor(maxTokens = 8000) {
    this.maxTokens = maxTokens;
    this.usedTokens = 0;
  }
  
  /**
   * Estimate token count for text (rough approximation)
   * @param {string} text - Text to estimate tokens for
   * @returns {number} Estimated token count
   */
  estimateTokens(text) {
    // Rough approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
  
  /**
   * Check if adding text would exceed budget
   * @param {string} text - Text to check
   * @returns {boolean} True if within budget
   */
  canAdd(text) {
    const estimatedTokens = this.estimateTokens(text);
    return (this.usedTokens + estimatedTokens) <= this.maxTokens;
  }
  
  /**
   * Add text to budget tracking
   * @param {string} text - Text to add
   * @returns {boolean} True if added successfully
   */
  add(text) {
    const estimatedTokens = this.estimateTokens(text);
    if (!this.canAdd(text)) {
      return false;
    }
    this.usedTokens += estimatedTokens;
    return true;
  }
  
  /**
   * Get remaining token budget
   * @returns {number} Remaining tokens
   */
  getRemaining() {
    return this.maxTokens - this.usedTokens;
  }
  
  /**
   * Reset budget tracking
   */
  reset() {
    this.usedTokens = 0;
  }
  
  /**
   * Get budget utilization percentage
   * @returns {number} Percentage used (0-100)
   */
  getUtilization() {
    return (this.usedTokens / this.maxTokens) * 100;
  }
}

/**
 * Summarize conversation history
 * @param {Array} history - Conversation history messages
 * @param {Object} options - Summarization options
 * @returns {Object} Summary with key points and recent turns
 */
export function summarizeConversation(history, options = {}) {
  const {
    maxTurns = CONTEXT_SUMMARIZATION_RULES.MAX_TURNS_BEFORE_SUMMARY,
    recentTurnsToKeep = CONTEXT_SUMMARIZATION_RULES.RECENT_TURNS_TO_KEEP
  } = options;
  
  if (history.length <= maxTurns) {
    return {
      summarized: false,
      reason: 'Conversation within threshold',
      history
    };
  }
  
  // Extract key points from older turns
  const olderTurns = history.slice(0, -recentTurnsToKeep);
  const recentTurns = history.slice(-recentTurnsToKeep);
  
  const keyPoints = extractKeyPoints(olderTurns);
  
  return {
    summarized: true,
    reason: 'Exceeded turn threshold',
    keyPoints,
    recentTurns,
    summaryText: formatSummary(keyPoints)
  };
}

/**
 * Extract key points from conversation turns
 * @param {Array} turns - Conversation turns to analyze
 * @returns {Array} Key points extracted
 */
function extractKeyPoints(turns) {
  const keyPoints = [];
  
  turns.forEach(turn => {
    if (turn.role === 'user') {
      // Track user requests and decisions
      if (turn.content.includes('decide') || turn.content.includes('choose')) {
        keyPoints.push({
          type: 'decision',
          content: turn.content
        });
      }
      if (turn.content.includes('remember') || turn.content.includes('note')) {
        keyPoints.push({
          type: 'preference',
          content: turn.content
        });
      }
    } else if (turn.role === 'assistant') {
      // Track agreements and conclusions
      if (turn.content.includes('agreed') || turn.content.includes('confirmed')) {
        keyPoints.push({
          type: 'agreement',
          content: turn.content
        });
      }
    }
  });
  
  return keyPoints;
}

/**
 * Format summary text from key points
 * @param {Array} keyPoints - Key points to format
 * @returns {string} Formatted summary
 */
function formatSummary(keyPoints) {
  if (keyPoints.length === 0) {
    return 'No key points to summarize.';
  }
  
  const sections = {
    decisions: keyPoints.filter(p => p.type === 'decision'),
    preferences: keyPoints.filter(p => p.type === 'preference'),
    agreements: keyPoints.filter(p => p.type === 'agreement')
  };
  
  let summary = 'Conversation Summary:\n\n';
  
  if (sections.decisions.length > 0) {
    summary += 'Decisions Made:\n';
    sections.decisions.forEach((point, i) => {
      summary += `${i + 1}. ${point.content.slice(0, 100)}...\n`;
    });
    summary += '\n';
  }
  
  if (sections.preferences.length > 0) {
    summary += 'User Preferences:\n';
    sections.preferences.forEach((point, i) => {
      summary += `${i + 1}. ${point.content.slice(0, 100)}...\n`;
    });
    summary += '\n';
  }
  
  if (sections.agreements.length > 0) {
    summary += 'Agreements Reached:\n';
    sections.agreements.forEach((point, i) => {
      summary += `${i + 1}. ${point.content.slice(0, 100)}...\n`;
    });
  }
  
  return summary;
}

/**
 * Check if context needs summarization
 * @param {Array} history - Conversation history
 * @param {TokenBudgetManager} tokenManager - Token budget manager
 * @returns {Object} Summarization recommendation
 */
export function shouldSummarize(history, tokenManager) {
  const turnCount = history.length;
  const tokenCount = tokenManager.usedTokens;
  
  if (turnCount >= CONTEXT_SUMMARIZATION_RULES.MAX_TURNS_BEFORE_SUMMARY) {
    return {
      shouldSummarize: true,
      reason: CONTEXT_SUMMARIZATION_RULES.TRIGGERS.EXCEEDS_MAX_TURNS,
      turnCount,
      tokenCount
    };
  }
  
  if (tokenCount >= CONTEXT_SUMMARIZATION_RULES.MAX_TOKENS_BEFORE_SUMMARY) {
    return {
      shouldSummarize: true,
      reason: CONTEXT_SUMMARIZATION_RULES.TRIGGERS.EXCEEDS_MAX_TOKENS,
      turnCount,
      tokenCount
    };
  }
  
  return {
    shouldSummarize: false,
    reason: 'Within thresholds',
    turnCount,
    tokenCount
  };
}
