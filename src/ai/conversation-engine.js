// MFM Corporation AI Conversation Engine
// Advanced CEO Remy Conversation System

export class ConversationEngine {
  constructor(env) {
    this.env = env;
    this.conversationState = {
      GREETING: 'greeting',
      CONTEXT_ESTABLISHMENT: 'context',
      TASK_UNDERSTANDING: 'task',
      SOLUTION_DISCUSSION: 'solution',
      ACTION_PLANNING: 'planning',
      FOLLOW_UP: 'followup'
    };
    
    this.personality = {
      traits: {
        leadership: 0.9,
        empathy: 0.8,
        analytical: 0.85,
        decisiveness: 0.9,
        approachability: 0.75,
        strategic: 0.88
      },
      communicationStyle: 'professional yet approachable',
      emotionalState: 'neutral'
    };
  }

  async processMessage(message, context, userState) {
    const analysis = await this.analyzeMessage(message, context, userState);
    const conversationFlow = await this.determineConversationFlow(analysis, context);
    const response = await this.generateResponse(analysis, conversationFlow, userState);
    
    // Store conversation context
    await this.storeConversationContext(message, response, analysis);
    
    return {
      response: response.text,
      confidence: response.confidence,
      emotionalIndicators: response.emotionalIndicators,
      suggestedActions: response.suggestedActions,
      conversationMetrics: response.metrics,
      nextState: conversationFlow.nextState
    };
  }

  async analyzeMessage(message, context, userState) {
    const analysis = {
      intent: await this.classifyIntent(message),
      entities: await this.extractEntities(message),
      sentiment: await this.analyzeSentiment(message),
      urgency: await this.assessUrgency(message),
      complexity: await this.assessComplexity(message),
      emotionalTone: await this.analyzeEmotionalTone(message, userState),
      contextualRelevance: await this.calculateContextualRelevance(message, context)
    };

    return analysis;
  }

  async classifyIntent(message) {
    const text = message.text?.toLowerCase() || '';
    
    const intentCategories = {
      CONVERSATION: ['chat', 'talk', 'discuss', 'conversation', 'hello', 'hi'],
      TASK_EXECUTION: ['create', 'build', 'implement', 'deploy', 'execute', 'run'],
      INFORMATION_SEEKING: ['what', 'how', 'why', 'status', 'update', 'tell me'],
      DECISION_MAKING: ['should', 'recommend', 'decide', 'choose', 'advise'],
      EMOTIONAL_SUPPORT: ['feel', 'worried', 'concerned', 'stressed', 'help'],
      STRATEGIC_PLANNING: ['plan', 'strategy', 'roadmap', 'vision', 'goal'],
      TEAM_COORDINATION: ['team', 'coordinate', 'assign', 'delegate', 'manage']
    };

    let detectedIntent = 'GENERAL';
    let confidence = 0.5;

    for (const [intent, keywords] of Object.entries(intentCategories)) {
      const matches = keywords.filter(keyword => text.includes(keyword)).length;
      if (matches > 0) {
        const intentConfidence = matches / keywords.length;
        if (intentConfidence > confidence) {
          detectedIntent = intent;
          confidence = intentConfidence;
        }
      }
    }

    return { intent: detectedIntent, confidence };
  }

  async extractEntities(message) {
    const text = message.text || '';
    const entities = {
      people: this.extractPeople(text),
      dates: this.extractDates(text),
      numbers: this.extractNumbers(text),
      projects: this.extractProjects(text),
      teams: this.extractTeams(text),
      priorities: this.extractPriorities(text)
    };

    return entities;
  }

  extractPeople(text) {
    const peopleKeywords = ['remy', 'ceo', 'manager', 'team', 'staff', 'employee'];
    return peopleKeywords.filter(keyword => text.toLowerCase().includes(keyword));
  }

  extractDates(text) {
    const datePatterns = [
      /\b(today|tomorrow|yesterday|next week|last week)\b/gi,
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      /\b\d{4}-\d{2}-\d{2}\b/g
    ];

    const dates = [];
    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches) dates.push(...matches);
    }

    return dates;
  }

  extractNumbers(text) {
    const numbers = text.match(/\b\d+(?:\.\d+)?\b/g) || [];
    return numbers.map(n => parseFloat(n));
  }

  extractProjects(text) {
    const projectKeywords = ['project', 'initiative', 'program', 'campaign', 'launch'];
    return projectKeywords.filter(keyword => text.toLowerCase().includes(keyword));
  }

  extractTeams(text) {
    const teamKeywords = ['marketing', 'development', 'design', 'sales', 'finance', 'hr', 'operations'];
    return teamKeywords.filter(keyword => text.toLowerCase().includes(keyword));
  }

  extractPriorities(text) {
    const priorityKeywords = ['urgent', 'high priority', 'low priority', 'critical', 'important'];
    return priorityKeywords.filter(keyword => text.toLowerCase().includes(keyword));
  }

  async analyzeSentiment(message) {
    const text = message.text?.toLowerCase() || '';
    
    const positiveWords = ['good', 'great', 'excellent', 'successful', 'achieved', 'completed'];
    const negativeWords = ['bad', 'failed', 'problem', 'issue', 'error', 'delayed', 'stuck'];
    
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    let sentiment = 'neutral';
    if (positiveCount > negativeCount) sentiment = 'positive';
    else if (negativeCount > positiveCount) sentiment = 'negative';
    
    return {
      sentiment,
      confidence: Math.abs(positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1)
    };
  }

  async assessUrgency(message) {
    const text = message.text?.toLowerCase() || '';
    const urgencyKeywords = ['urgent', 'asap', 'immediately', 'emergency', 'critical', 'deadline'];
    
    const urgencyScore = urgencyKeywords.filter(keyword => text.includes(keyword)).length;
    
    return {
      urgency: urgencyScore > 0 ? 'high' : urgencyScore > 2 ? 'medium' : 'low',
      score: urgencyScore
    };
  }

  async assessComplexity(message) {
    const text = message.text || '';
    const complexityIndicators = {
      length: text.length,
      sentences: text.split(/[.!?]+/).length,
      questions: (text.match(/\?/g) || []).length,
      entities: (await this.extractEntities(message)).people.length + 
                (await this.extractEntities(message)).teams.length
    };

    let complexity = 'simple';
    if (complexityIndicators.length > 500 || complexityIndicators.sentences > 5) {
      complexity = 'complex';
    } else if (complexityIndicators.length > 200 || complexityIndicators.sentences > 3) {
      complexity = 'moderate';
    }

    return { complexity, indicators: complexityIndicators };
  }

  async analyzeEmotionalTone(message, userState) {
    const text = message.text?.toLowerCase() || '';
    
    const emotionalIndicators = {
      stressed: ['stressed', 'overwhelmed', 'pressure', 'deadline'],
      confident: ['confident', 'sure', 'certain', 'ready'],
      concerned: ['concerned', 'worried', 'unsure', 'hesitant'],
      excited: ['excited', 'enthusiastic', 'looking forward', 'optimistic']
    };

    let detectedTone = 'neutral';
    let toneConfidence = 0;

    for (const [tone, indicators] of Object.entries(emotionalIndicators)) {
      const matches = indicators.filter(indicator => text.includes(indicator)).length;
      if (matches > 0) {
        const confidence = matches / indicators.length;
        if (confidence > toneConfidence) {
          detectedTone = tone;
          toneConfidence = confidence;
        }
      }
    }

    return { tone: detectedTone, confidence: toneConfidence };
  }

  async calculateContextualRelevance(message, context) {
    if (!context || !context.length) return { relevance: 0.5, reason: 'no context' };

    const messageText = message.text?.toLowerCase() || '';
    const contextText = context.map(c => c.text).join(' ').toLowerCase();
    
    const commonWords = this.getCommonWords(messageText, contextText);
    const relevance = commonWords.length / Math.max(messageText.split(' ').length, 1);

    return {
      relevance: Math.min(relevance * 2, 1), // Scale up to max 1
      reason: `${commonWords.length} common words found`,
      commonWords
    };
  }

  getCommonWords(text1, text2) {
    const words1 = text1.split(' ').filter(w => w.length > 3);
    const words2 = text2.split(' ').filter(w => w.length > 3);
    
    return words1.filter(word => words2.includes(word));
  }

  async determineConversationFlow(analysis, context) {
    const currentState = context.currentState || this.conversationState.GREETING;
    const intent = analysis.intent.intent;
    const urgency = analysis.urgency.urgency;

    let nextState = currentState;
    let flowReason = 'continuing current state';

    // State transition logic
    if (currentState === this.conversationState.GREETING) {
      if (intent === 'CONVERSATION') {
        nextState = this.conversationState.CONTEXT_ESTABLISHMENT;
        flowReason = 'moving to context establishment';
      } else if (intent === 'TASK_EXECUTION') {
        nextState = this.conversationState.TASK_UNDERSTANDING;
        flowReason = 'direct to task understanding';
      }
    } else if (currentState === this.conversationState.CONTEXT_ESTABLISHMENT) {
      if (intent === 'TASK_EXECUTION' || intent === 'DECISION_MAKING') {
        nextState = this.conversationState.TASK_UNDERSTANDING;
        flowReason = 'task identified';
      }
    } else if (currentState === this.conversationState.TASK_UNDERSTANDING) {
      if (intent === 'DECISION_MAKING' || urgency === 'high') {
        nextState = this.conversationState.SOLUTION_DISCUSSION;
        flowReason = 'decision making required';
      }
    } else if (currentState === this.conversationState.SOLUTION_DISCUSSION) {
      if (intent === 'TASK_EXECUTION') {
        nextState = this.conversationState.ACTION_PLANNING;
        flowReason = 'ready for action planning';
      }
    }

    return {
      currentState,
      nextState,
      flowReason,
      confidence: this.calculateFlowConfidence(analysis, context)
    };
  }

  calculateFlowConfidence(analysis, context) {
    const intentConfidence = analysis.intent.confidence;
    const contextualRelevance = analysis.contextualRelevance.relevance;
    
    return (intentConfidence + contextualRelevance) / 2;
  }

  async generateResponse(analysis, conversationFlow, userState) {
    const responseStrategy = this.getResponseStrategy(conversationFlow.nextState, analysis);
    const personalityAdapter = this.adaptPersonality(analysis, userState);
    
    const baseResponse = await responseStrategy.generate(analysis, personalityAdapter);
    
    return {
      text: baseResponse.text,
      confidence: baseResponse.confidence,
      emotionalIndicators: this.generateEmotionalCues(analysis.emotionalTone),
      suggestedActions: this.generateFollowUpActions(analysis, conversationFlow),
      metrics: this.calculateResponseMetrics(analysis, conversationFlow)
    };
  }

  getResponseStrategy(state, analysis) {
    const strategies = {
      [this.conversationState.GREETING]: new GreetingStrategy(),
      [this.conversationState.CONTEXT_ESTABLISHMENT]: new ContextStrategy(),
      [this.conversationState.TASK_UNDERSTANDING]: new TaskStrategy(),
      [this.conversationState.SOLUTION_DISCUSSION]: new SolutionStrategy(),
      [this.conversationState.ACTION_PLANNING]: new PlanningStrategy(),
      [this.conversationState.FOLLOW_UP]: new FollowUpStrategy()
    };

    return strategies[state] || new DefaultStrategy();
  }

  adaptPersonality(analysis, userState) {
    const adaptation = {
      formality: this.determineFormality(analysis),
      empathy: this.determineEmpathyLevel(analysis.emotionalTone),
      decisiveness: this.determineDecisiveness(analysis.urgency),
      approachability: this.determineApproachability(userState)
    };

    return { ...this.personality, ...adaptation };
  }

  determineFormality(analysis) {
    if (analysis.intent.intent === 'CONVERSATION') return 'casual';
    if (analysis.urgency.urgency === 'high') return 'direct';
    return 'professional';
  }

  determineEmpathyLevel(emotionalTone) {
    if (emotionalTone.tone === 'stressed' || emotionalTone.tone === 'concerned') {
      return 0.9;
    }
    return this.personality.traits.empathy;
  }

  determineDecisiveness(urgency) {
    if (urgency.urgency === 'high') return 1.0;
    if (urgency.urgency === 'medium') return 0.8;
    return this.personality.traits.decisiveness;
  }

  determineApproachability(userState) {
    // Adjust based on user interaction history
    return this.personality.traits.approachability;
  }

  generateEmotionalCues(emotionalTone) {
    const cues = {
      neutral: ['👔'],
      positive: ['😊', '👍'],
      negative: ['🤔', '💭'],
      stressed: ['⚡', '🎯'],
      confident: ['💪', '🚀']
    };

    return cues[emotionalTone.tone] || cues.neutral;
  }

  generateFollowUpActions(analysis, conversationFlow) {
    const actions = [];

    if (analysis.intent.intent === 'TASK_EXECUTION') {
      actions.push('Create action plan', 'Assign team members', 'Set deadline');
    }

    if (analysis.urgency.urgency === 'high') {
      actions.push('Schedule immediate meeting', 'Escalate priority');
    }

    if (conversationFlow.nextState === this.conversationState.ACTION_PLANNING) {
      actions.push('Review timeline', 'Allocate resources', 'Define success metrics');
    }

    return actions;
  }

  calculateResponseMetrics(analysis, conversationFlow) {
    return {
      responseTime: Date.now(),
      confidence: conversationFlow.confidence,
      complexity: analysis.complexity.complexity,
      sentiment: analysis.sentiment.sentiment,
      intent: analysis.intent.intent
    };
  }

  async storeConversationContext(message, response, analysis) {
    const contextKey = 'conversation:context';
    const existingContext = await this.env.KV.get(contextKey);
    const context = existingContext ? JSON.parse(existingContext) : [];

    const contextEntry = {
      timestamp: Date.now(),
      message: {
        text: message.text,
        intent: analysis.intent,
        entities: analysis.entities,
        sentiment: analysis.sentiment
      },
      response: {
        text: response.text,
        confidence: response.confidence,
        suggestedActions: response.suggestedActions
      },
      analysis: {
        urgency: analysis.urgency,
        complexity: analysis.complexity,
        emotionalTone: analysis.emotionalTone
      }
    };

    context.push(contextEntry);

    // Keep last 20 entries for context
    if (context.length > 20) {
      context.shift();
    }

    await this.env.KV.put(contextKey, JSON.stringify(context), { 
      expirationTtl: 86400 * 7 // 7 days
    });
  }

  async getConversationContext() {
    const contextKey = 'conversation:context';
    const existingContext = await this.env.KV.get(contextKey);
    return existingContext ? JSON.parse(existingContext) : [];
  }
}

// Response Strategy Classes
class GreetingStrategy {
  async generate(analysis, personality) {
    const userName = 'CEO Remy'; // Would be extracted from context
    const greetings = [
      `Hello ${userName}! I'm ready to assist with MFM Corporation operations.`,
      `Good to connect with you, ${userName}. What can I help you achieve today?`,
      `Welcome ${userName}! I'm here to support your leadership and strategic decisions.`
    ];

    return {
      text: greetings[Math.floor(Math.random() * greetings.length)],
      confidence: 0.9
    };
  }
}

class ContextStrategy {
  async generate(analysis, personality) {
    const contextualResponses = [
      "I understand the context. Let me help you navigate this effectively.",
      "Based on what you've shared, I can see the bigger picture here.",
      "I'm getting a clear understanding of the situation. Let's proceed strategically."
    ];

    return {
      text: contextualResponses[Math.floor(Math.random() * contextualResponses.length)],
      confidence: 0.8
    };
  }
}

class TaskStrategy {
  async generate(analysis, personality) {
    const taskResponses = [
      "I can help coordinate this task with the appropriate team. Let me break this down.",
      "This requires careful planning. I'll outline the steps and assign the right resources.",
      "I see the objective clearly. Let me create an action plan with clear milestones."
    ];

    return {
      text: taskResponses[Math.floor(Math.random() * taskResponses.length)],
      confidence: 0.85
    };
  }
}

class SolutionStrategy {
  async generate(analysis, personality) {
    const solutionResponses = [
      "I've analyzed the situation and here's my recommended approach.",
      "Based on my assessment, here are the optimal solutions available to us.",
      "I can see multiple paths forward. Let me present the most strategic options."
    ];

    return {
      text: solutionResponses[Math.floor(Math.random() * solutionResponses.length)],
      confidence: 0.9
    };
  }
}

class PlanningStrategy {
  async generate(analysis, personality) {
    const planningResponses = [
      "Let's create a comprehensive action plan with clear timelines and responsibilities.",
      "I'll outline the strategic approach with measurable outcomes and success criteria.",
      "Here's the detailed roadmap for executing this initiative effectively."
    ];

    return {
      text: planningResponses[Math.floor(Math.random() * planningResponses.length)],
      confidence: 0.95
    };
  }
}

class FollowUpStrategy {
  async generate(analysis, personality) {
    const followUpResponses = [
      "How is the progress on this initiative? Any obstacles I should help address?",
      "Let me check in on the status and see if any adjustments are needed.",
      "I want to ensure we're on track. What updates can you share?"
    ];

    return {
      text: followUpResponses[Math.floor(Math.random() * followUpResponses.length)],
      confidence: 0.8
    };
  }

class DefaultStrategy {
  async generate(analysis, personality) {
    return {
      text: "I'm here to help with MFM Corporation operations. What would you like to discuss?",
      confidence: 0.7
    };
  }
}
