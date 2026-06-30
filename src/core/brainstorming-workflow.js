// Brainstorming Workflow — Idea generation and exploration

import { logger } from './logger.js';
import { saveMemory, getMemory } from '../tools/d1-store.js';

class BrainstormingWorkflow {
  constructor(env) {
    this.env = env;
    this.activeSessions = new Map();
  }

  async startSession(topic, context = {}) {
    const sessionId = `brainstorm:${Date.now()}`;
    
    const session = {
      id: sessionId,
      topic,
      context,
      status: 'active',
      startTime: new Date().toISOString(),
      ideas: [],
      categories: new Map(),
      votes: new Map(),
      phase: 'divergent',
      history: []
    };
    
    this.activeSessions.set(sessionId, session);
    
    logger.info(`Brainstorming: Started session ${sessionId}`, {
      topic,
      context
    });
    
    await this.saveSession(session);
    
    return session;
  }

  async generateIdea(sessionId, idea, category = 'general') {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Brainstorming session not found: ${sessionId}`);
    }
    
    const ideaId = `idea:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    
    const ideaData = {
      id: ideaId,
      content: idea,
      category,
      createdAt: new Date().toISOString(),
      votes: 0,
      comments: [],
      tags: this.extractTags(idea)
    };
    
    session.ideas.push(ideaData);
    
    // Track categories
    if (!session.categories.has(category)) {
      session.categories.set(category, []);
    }
    session.categories.get(category).push(ideaId);
    
    session.history.push({
      type: 'idea_added',
      ideaId,
      timestamp: new Date().toISOString()
    });
    
    logger.info(`Brainstorming: Added idea to ${sessionId}`, {
      ideaId,
      category
    });
    
    await this.saveSession(session);
    
    return ideaData;
  }

  extractTags(text) {
    const tags = [];
    const words = text.split(/\s+/);
    
    for (const word of words) {
      if (word.startsWith('#')) {
        tags.push(word.substring(1));
      }
    }
    
    return tags;
  }

  async voteIdea(sessionId, ideaId, vote = 1) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Brainstorming session not found: ${sessionId}`);
    }
    
    const idea = session.ideas.find(i => i.id === ideaId);
    if (!idea) {
      throw new Error(`Idea not found: ${ideaId}`);
    }
    
    idea.votes += vote;
    
    session.votes.set(ideaId, idea.votes);
    
    session.history.push({
      type: 'vote',
      ideaId,
      vote,
      timestamp: new Date().toISOString()
    });
    
    logger.info(`Brainstorming: Voted on idea ${ideaId}`, {
      vote,
      totalVotes: idea.votes
    });
    
    await this.saveSession(session);
    
    return idea;
  }

  async commentIdea(sessionId, ideaId, comment) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Brainstorming session not found: ${sessionId}`);
    }
    
    const idea = session.ideas.find(i => i.id === ideaId);
    if (!idea) {
      throw new Error(`Idea not found: ${ideaId}`);
    }
    
    const commentData = {
      id: `comment:${Date.now()}`,
      content: comment,
      timestamp: new Date().toISOString()
    };
    
    idea.comments.push(commentData);
    
    session.history.push({
      type: 'comment',
      ideaId,
      commentId: commentData.id,
      timestamp: new Date().toISOString()
    });
    
    logger.info(`Brainstorming: Commented on idea ${ideaId}`);
    
    await this.saveSession(session);
    
    return commentData;
  }

  async transitionToConvergent(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Brainstorming session not found: ${sessionId}`);
    }
    
    session.phase = 'convergent';
    session.transitionTime = new Date().toISOString();
    
    session.history.push({
      type: 'phase_transition',
      from: 'divergent',
      to: 'convergent',
      timestamp: new Date().toISOString()
    });
    
    logger.info(`Brainstorming: Session ${sessionId} transitioned to convergent phase`);
    
    await this.saveSession(session);
    
    return session;
  }

  async selectTopIdeas(sessionId, limit = 5) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Brainstorming session not found: ${sessionId}`);
    }
    
    const sortedIdeas = [...session.ideas].sort((a, b) => b.votes - a.votes);
    const topIdeas = sortedIdeas.slice(0, limit);
    
    session.selectedIdeas = topIdeas.map(i => i.id);
    
    session.history.push({
      type: 'selection',
      selectedCount: topIdeas.length,
      timestamp: new Date().toISOString()
    });
    
    logger.info(`Brainstorming: Selected ${topIdeas.length} top ideas for ${sessionId}`);
    
    await this.saveSession(session);
    
    return topIdeas;
  }

  async consolidateIdeas(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Brainstorming session not found: ${sessionId}`);
    }
    
    const selectedIdeas = session.selectedIdeas || [];
    const ideas = session.ideas.filter(i => selectedIdeas.includes(i.id));
    
    const consolidated = {
      topic: session.topic,
      topIdeas: ideas.map(i => ({
        content: i.content,
        category: i.category,
        votes: i.votes,
        tags: i.tags
      })),
      categories: Object.fromEntries(session.categories),
      totalIdeas: session.ideas.length,
      totalVotes: Array.from(session.votes.values()).reduce((sum, v) => sum + v, 0),
      timestamp: new Date().toISOString()
    };
    
    session.status = 'completed';
    session.endTime = new Date().toISOString();
    session.consolidated = consolidated;
    
    session.history.push({
      type: 'consolidation',
      timestamp: new Date().toISOString()
    });
    
    logger.info(`Brainstorming: Consolidated ideas for ${sessionId}`, {
      totalIdeas: consolidated.totalIdeas,
      topIdeas: consolidated.topIdeas.length
    });
    
    await this.saveSession(session);
    
    return consolidated;
  }

  async saveSession(session) {
    try {
      const memoryKey = `brainstorm_session:${session.id}`;
      await saveMemory(this.env, memoryKey, session);
    } catch (error) {
      logger.error(`Brainstorming: Failed to save session`, {
        error: error.message
      });
    }
  }

  getSession(sessionId) {
    return this.activeSessions.get(sessionId) || null;
  }

  getAllSessions() {
    return Array.from(this.activeSessions.values());
  }

  getSessionStatistics(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;
    
    const categoryCounts = {};
    for (const [category, ideaIds] of session.categories) {
      categoryCounts[category] = ideaIds.length;
    }
    
    return {
      totalIdeas: session.ideas.length,
      totalVotes: Array.from(session.votes.values()).reduce((sum, v) => sum + v, 0),
      categories: categoryCounts,
      phase: session.phase,
      duration: session.endTime 
        ? new Date(session.endTime) - new Date(session.startTime)
        : Date.now() - new Date(session.startTime)
    };
  }
}

export { BrainstormingWorkflow };
