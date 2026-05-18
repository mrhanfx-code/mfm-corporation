// MFM Corporation AI Memory Manager
// Advanced Context and Memory System for CEO Remy

export class MemoryManager {
  constructor(env) {
    this.env = env;
    this.memoryTypes = {
      SHORT_TERM: 'conversation:short',
      LONG_TERM: 'conversation:long',
      ENTITY_MEMORY: 'conversation:entities',
      EMOTIONAL_STATE: 'conversation:emotions',
      USER_PREFERENCES: 'user:preferences',
      KNOWLEDGE_BASE: 'knowledge:base'
    };
    
    this.maxContextSize = 50;
    this.retentionPeriods = {
      SHORT_TERM: 86400 * 7,      // 7 days
      LONG_TERM: 86400 * 30,       // 30 days
      ENTITY_MEMORY: 86400 * 90,   // 90 days
      EMOTIONAL_STATE: 86400 * 14, // 14 days
      USER_PREFERENCES: 86400 * 365, // 1 year
      KNOWLEDGE_BASE: 86400 * 365   // 1 year
    };
  }

  async storeContext(userId, message, response, metadata) {
    const contextEntry = {
      userId,
      timestamp: Date.now(),
      message: {
        text: message.text,
        intent: metadata.intent,
        entities: metadata.entities,
        sentiment: metadata.sentiment,
        urgency: metadata.urgency,
        emotionalTone: metadata.emotionalTone
      },
      response: {
        text: response.text,
        confidence: response.confidence,
        reasoning: response.reasoning,
        suggestedActions: response.suggestedActions
      },
      metadata: {
        conversationState: metadata.conversationState,
        userMood: metadata.userMood,
        contextRelevance: metadata.contextRelevance,
        interactionType: metadata.interactionType
      }
    };

    // Store in short-term memory
    await this.storeInMemory(this.memoryTypes.SHORT_TERM, userId, contextEntry);
    
    // Also store in long-term if significant
    if (this.isSignificantInteraction(contextEntry)) {
      await this.storeInMemory(this.memoryTypes.LONG_TERM, userId, contextEntry);
    }

    // Update entity memory
    await this.updateEntityMemory(userId, metadata.entities);
    
    // Update emotional state
    await this.updateEmotionalState(userId, metadata.emotionalTone);
    
    return contextEntry;
  }

  async storeInMemory(memoryType, userId, data) {
    const key = `${memoryType}:${userId}:${Date.now()}`;
    await this.env.KV.put(key, JSON.stringify(data), { 
      expirationTtl: this.retentionPeriods[memoryType] 
    });
    
    // Maintain memory size limits
    await this.cleanupMemory(memoryType, userId);
  }

  async cleanupMemory(memoryType, userId) {
    const list = await this.env.KV.list({ prefix: `${memoryType}:${userId}:` });
    const maxSize = this.getMaxMemorySize(memoryType);
    
    if (list.keys.length > maxSize) {
      // Sort by timestamp (oldest first)
      const sortedKeys = list.keys.sort((a, b) => {
        const aTime = parseInt(a.name.split(':').pop());
        const bTime = parseInt(b.name.split(':').pop());
        return aTime - bTime;
      });
      
      // Delete oldest entries
      const toDelete = sortedKeys.slice(0, list.keys.length - maxSize);
      for (const key of toDelete) {
        await this.env.KV.delete(key.name);
      }
    }
  }

  getMaxMemorySize(memoryType) {
    const sizes = {
      [this.memoryTypes.SHORT_TERM]: 50,
      [this.memoryTypes.LONG_TERM]: 100,
      [this.memoryTypes.ENTITY_MEMORY]: 200,
      [this.memoryTypes.EMOTIONAL_STATE]: 30,
      [this.memoryTypes.USER_PREFERENCES]: 10,
      [this.memoryTypes.KNOWLEDGE_BASE]: 500
    };
    
    return sizes[memoryType] || 50;
  }

  isSignificantInteraction(contextEntry) {
    const significanceFactors = {
      highUrgency: contextEntry.message.urgency.urgency === 'high',
      strongSentiment: Math.abs(contextEntry.message.sentiment.confidence) > 0.7,
      complexTask: contextEntry.message.entities.projects.length > 0,
      emotionalContent: contextEntry.message.emotionalTone.confidence > 0.6,
      decisionMaking: contextEntry.message.intent.intent === 'DECISION_MAKING'
    };

    return Object.values(significanceFactors).some(factor => factor);
  }

  async updateEntityMemory(userId, entities) {
    const existingMemory = await this.getEntityMemory(userId);
    
    for (const [entityType, entityList] of Object.entries(entities)) {
      if (entityList.length > 0) {
        if (!existingMemory[entityType]) {
          existingMemory[entityType] = [];
        }
        
        // Add new entities, avoiding duplicates
        for (const entity of entityList) {
          if (!existingMemory[entityType].includes(entity)) {
            existingMemory[entityType].push({
              entity,
              firstSeen: Date.now(),
              lastSeen: Date.now(),
              frequency: 1
            });
          } else {
            // Update existing entity
            const existingEntity = existingMemory[entityType].find(e => e.entity === entity);
            if (existingEntity) {
              existingEntity.lastSeen = Date.now();
              existingEntity.frequency += 1;
            }
          }
        }
      }
    }

    const memoryKey = `${this.memoryTypes.ENTITY_MEMORY}:${userId}`;
    await this.env.KV.put(memoryKey, JSON.stringify(existingMemory), {
      expirationTtl: this.retentionPeriods[this.memoryTypes.ENTITY_MEMORY]
    });
  }

  async updateEmotionalState(userId, emotionalTone) {
    const existingState = await this.getEmotionalState(userId);
    
    const stateEntry = {
      timestamp: Date.now(),
      tone: emotionalTone.tone,
      confidence: emotionalTone.confidence
    };

    existingState.history.push(stateEntry);
    
    // Keep only recent emotional states
    if (existingState.history.length > 30) {
      existingState.history.shift();
    }

    // Update current state
    existingState.current = {
      tone: emotionalTone.tone,
      confidence: emotionalTone.confidence,
      trend: this.calculateEmotionalTrend(existingState.history)
    };

    const stateKey = `${this.memoryTypes.EMOTIONAL_STATE}:${userId}`;
    await this.env.KV.put(stateKey, JSON.stringify(existingState), {
      expirationTtl: this.retentionPeriods[this.memoryTypes.EMOTIONAL_STATE]
    });
  }

  calculateEmotionalTrend(history) {
    if (history.length < 3) return 'stable';
    
    const recent = history.slice(-3);
    const tones = recent.map(entry => entry.tone);
    
    const positiveCount = tones.filter(t => ['positive', 'confident', 'excited'].includes(t)).length;
    const negativeCount = tones.filter(t => ['negative', 'stressed', 'concerned'].includes(t)).length;
    
    if (positiveCount > negativeCount) return 'improving';
    if (negativeCount > positiveCount) return 'declining';
    return 'stable';
  }

  async getContext(userId, limit = 10) {
    const contextKey = `${this.memoryTypes.SHORT_TERM}:${userId}`;
    const list = await this.env.KV.list({ prefix: `${contextKey}:` });
    
    // Get most recent entries
    const sortedKeys = list.keys.sort((a, b) => {
      const aTime = parseInt(a.name.split(':').pop());
      const bTime = parseInt(b.name.split(':').pop());
      return bTime - aTime; // Descending order
    });

    const contexts = [];
    for (const key of sortedKeys.slice(0, limit)) {
      const value = await this.env.KV.get(key.name);
      if (value) {
        contexts.push(JSON.parse(value));
      }
    }

    return contexts;
  }

  async getEntityMemory(userId) {
    const memoryKey = `${this.memoryTypes.ENTITY_MEMORY}:${userId}`;
    const existing = await this.env.KV.get(memoryKey);
    return existing ? JSON.parse(existing) : {
      people: [],
      dates: [],
      numbers: [],
      projects: [],
      teams: [],
      priorities: []
    };
  }

  async getEmotionalState(userId) {
    const stateKey = `${this.memoryTypes.EMOTIONAL_STATE}:${userId}`;
    const existing = await this.env.KV.get(stateKey);
    return existing ? JSON.parse(existing) : {
      current: { tone: 'neutral', confidence: 0.5, trend: 'stable' },
      history: []
    };
  }

  async getUserPreferences(userId) {
    const prefKey = `${this.memoryTypes.USER_PREFERENCES}:${userId}`;
    const existing = await this.env.KV.get(prefKey);
    return existing ? JSON.parse(existing) : {
      communicationStyle: 'professional',
      responseLength: 'medium',
      formality: 'balanced',
      preferredTopics: [],
      interactionPatterns: {}
    };
  }

  async updateUserPreferences(userId, preferences) {
    const existing = await this.getUserPreferences(userId);
    const updated = { ...existing, ...preferences };
    
    const prefKey = `${this.memoryTypes.USER_PREFERENCES}:${userId}`;
    await this.env.KV.put(prefKey, JSON.stringify(updated), {
      expirationTtl: this.retentionPeriods[this.memoryTypes.USER_PREFERENCES]
    });
    
    return updated;
  }

  async searchMemory(userId, query) {
    const context = await this.getContext(userId, 50);
    const entityMemory = await this.getEntityMemory(userId);
    
    const queryLower = query.toLowerCase();
    const results = {
      contextMatches: [],
      entityMatches: [],
      semanticMatches: []
    };

    // Search in conversation context
    for (const entry of context) {
      const messageText = entry.message.text.toLowerCase();
      const responseText = entry.response.text.toLowerCase();
      
      if (messageText.includes(queryLower) || responseText.includes(queryLower)) {
        results.contextMatches.push({
          type: 'exact_match',
          entry,
          relevance: this.calculateRelevance(query, entry)
        });
      }
    }

    // Search in entity memory
    for (const [entityType, entities] of Object.entries(entityMemory)) {
      for (const entity of entities) {
        if (entity.entity.toLowerCase().includes(queryLower)) {
          results.entityMatches.push({
            type: 'entity',
            entityType,
            entity: entity.entity,
            frequency: entity.frequency,
            lastSeen: entity.lastSeen
          });
        }
      }
    }

    return results;
  }

  calculateRelevance(query, entry) {
    const queryWords = query.toLowerCase().split(' ');
    const messageText = entry.message.text.toLowerCase();
    const responseText = entry.response.text.toLowerCase();
    const combinedText = messageText + ' ' + responseText;
    
    let matches = 0;
    for (const word of queryWords) {
      if (combinedText.includes(word)) {
        matches++;
      }
    }

    const relevance = matches / queryWords.length;
    const timeDecay = Math.max(0, 1 - (Date.now() - entry.timestamp) / (86400 * 7)); // Decay over 7 days
    
    return relevance * timeDecay;
  }

  async generateMemorySummary(userId) {
    const context = await this.getContext(userId, 20);
    const entityMemory = await this.getEntityMemory(userId);
    const emotionalState = await this.getEmotionalState(userId);
    const preferences = await this.getUserPreferences(userId);

    return {
      totalInteractions: context.length,
      recentTopics: this.extractRecentTopics(context),
      frequentEntities: this.getFrequentEntities(entityMemory),
      emotionalTrend: emotionalState.current.trend,
      currentMood: emotionalState.current.tone,
      communicationPreferences: preferences.communicationStyle,
      lastInteraction: context.length > 0 ? context[0].timestamp : null
    };
  }

  extractRecentTopics(context) {
    const topics = [];
    for (const entry of context.slice(0, 10)) {
      if (entry.message.entities.projects.length > 0) {
        topics.push(...entry.message.entities.projects);
      }
      if (entry.message.entities.teams.length > 0) {
        topics.push(...entry.message.entities.teams);
      }
    }
    return [...new Set(topics)]; // Remove duplicates
  }

  getFrequentEntities(entityMemory) {
    const frequent = {};
    
    for (const [entityType, entities] of Object.entries(entityMemory)) {
      const sorted = entities.sort((a, b) => b.frequency - a.frequency);
      frequent[entityType] = sorted.slice(0, 5).map(e => ({
        entity: e.entity,
        frequency: e.frequency,
        lastSeen: e.lastSeen
      }));
    }
    
    return frequent;
  }

  async learnFromInteraction(userId, message, response, userFeedback) {
    const learningData = {
      userId,
      timestamp: Date.now(),
      inputFeatures: await this.extractFeatures(message),
      responseFeatures: await this.extractFeatures(response),
      userFeedback: userFeedback,
      effectiveness: this.calculateEffectiveness(userFeedback)
    };

    // Store learning data for pattern recognition
    const learningKey = `${this.memoryTypes.KNOWLEDGE_BASE}:${userId}:${Date.now()}`;
    await this.env.KV.put(learningKey, JSON.stringify(learningData), {
      expirationTtl: this.retentionPeriods[this.memoryTypes.KNOWLEDGE_BASE]
    });

    // Update user preferences based on feedback
    await this.updatePreferencesFromFeedback(userId, userFeedback);
  }

  async extractFeatures(content) {
    const text = typeof content === 'string' ? content : content.text || '';
    
    return {
      length: text.length,
      wordCount: text.split(' ').length,
      sentenceCount: text.split(/[.!?]+/).length,
      questionCount: (text.match(/\?/g) || []).length,
      urgency: text.toLowerCase().includes('urgent') ? 'high' : 'normal',
      complexity: text.length > 500 ? 'high' : text.length > 200 ? 'medium' : 'low',
      sentiment: text.includes('good') ? 'positive' : text.includes('bad') ? 'negative' : 'neutral'
    };
  }

  calculateEffectiveness(feedback) {
    if (!feedback) return 0.5;
    
    const score = feedback.rating ? feedback.rating / 5 : 0.5;
    const adjustment = feedback.helpful ? 0.1 : feedback.helpful === false ? -0.1 : 0;
    
    return Math.max(0, Math.min(1, score + adjustment));
  }

  async updatePreferencesFromFeedback(userId, feedback) {
    if (!feedback) return;

    const preferences = await this.getUserPreferences(userId);
    
    if (feedback.responseLength) {
      preferences.responseLength = feedback.responseLength;
    }
    
    if (feedback.formality) {
      preferences.formality = feedback.formality;
    }
    
    if (feedback.topics) {
      preferences.preferredTopics = [...new Set([...preferences.preferredTopics, ...feedback.topics])];
    }

    await this.updateUserPreferences(userId, preferences);
  }
}
