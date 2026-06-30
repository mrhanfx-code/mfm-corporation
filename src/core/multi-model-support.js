// Multi-Model Support — Abstracted model interface for easy switching

import { logger } from './logger.js';

class MultiModelManager {
  constructor(env) {
    this.env = env;
    this.models = new Map();
    this.defaultModel = 'claude-3-5-sonnet-20241022';
    this.modelStats = new Map();
  }

  registerModel(modelId, config) {
    const modelConfig = {
      id: modelId,
      name: config.name || modelId,
      provider: config.provider || 'anthropic',
      endpoint: config.endpoint,
      apiKey: config.apiKey,
      maxTokens: config.maxTokens || 4096,
      temperature: config.temperature || 0.7,
      capabilities: config.capabilities || [],
      costPerToken: config.costPerToken || 0,
      priority: config.priority || 'medium',
      available: config.available !== false
    };
    
    this.models.set(modelId, modelConfig);
    this.modelStats.set(modelId, {
      calls: 0,
      tokens: 0,
      errors: 0,
      lastUsed: null
    });
    
    logger.info(`Multi-Model: Registered model ${modelId}`, {
      name: modelConfig.name,
      provider: modelConfig.provider
    });
    
    return modelConfig;
  }

  async callModel(modelId, prompt, options = {}) {
    const modelConfig = this.models.get(modelId);
    if (!modelConfig) {
      throw new Error(`Model not found: ${modelId}`);
    }
    
    if (!modelConfig.available) {
      throw new Error(`Model not available: ${modelId}`);
    }
    
    logger.info(`Multi-Model: Calling model ${modelId}`, {
      promptLength: prompt.length,
      options
    });
    
    const stats = this.modelStats.get(modelId);
    stats.calls++;
    stats.lastUsed = new Date().toISOString();
    
    try {
      // In production, this would call the actual model API
      const response = await this.executeModelCall(modelConfig, prompt, options);
      
      stats.tokens += response.tokens || 0;
      
      logger.info(`Multi-Model: Model ${modelId} call successful`, {
        tokens: response.tokens,
        duration: response.duration
      });
      
      return response;
      
    } catch (error) {
      stats.errors++;
      logger.error(`Multi-Model: Model ${modelId} call failed`, {
        error: error.message
      });
      throw error;
    }
  }

  async executeModelCall(modelConfig, prompt, options) {
    // In production, this would make actual API calls
    // For now, return a mock response
    const startTime = Date.now();
    
    const response = {
      content: `Mock response from ${modelConfig.name}`,
      tokens: this.estimateTokens(prompt),
      model: modelConfig.id,
      finishReason: 'stop',
      duration: Date.now() - startTime
    };
    
    return response;
  }

  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  async callWithFallback(modelId, prompt, options = {}) {
    const modelConfig = this.models.get(modelId);
    if (!modelConfig) {
      throw new Error(`Model not found: ${modelId}`);
    }
    
    try {
      return await this.callModel(modelId, prompt, options);
    } catch (error) {
      logger.warn(`Multi-Model: Primary model ${modelId} failed, trying fallback`, {
        error: error.message
      });
      
      // Find fallback model
      const fallback = this.findFallbackModel(modelId);
      if (fallback) {
        return await this.callModel(fallback.id, prompt, options);
      }
      
      throw error;
    }
  }

  findFallbackModel(modelId) {
    const primaryModel = this.models.get(modelId);
    if (!primaryModel) return null;
    
    // Find model with same provider and highest priority
    const fallbacks = Array.from(this.models.values())
      .filter(m => m.provider === primaryModel.provider && m.id !== modelId && m.available)
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    
    return fallbacks[0] || null;
  }

  async callBestModel(prompt, options = {}) {
    const taskType = options.taskType || 'general';
    const bestModel = this.selectBestModel(taskType, options);
    
    return await this.callModel(bestModel.id, prompt, options);
  }

  selectBestModel(taskType, options) {
    const availableModels = Array.from(this.models.values())
      .filter(m => m.available);
    
    if (availableModels.length === 0) {
      throw new Error('No available models');
    }
    
    // Select based on task type and capabilities
    const taskRequirements = {
      coding: ['code-generation', 'code-analysis'],
      reasoning: ['reasoning', 'logic'],
      creative: ['creative-writing', 'storytelling'],
      analysis: ['data-analysis', 'text-analysis'],
      general: ['general-purpose']
    };
    
    const requiredCapabilities = taskRequirements[taskType] || taskRequirements.general;
    
    const suitableModels = availableModels.filter(model => {
      return requiredCapabilities.some(cap => model.capabilities.includes(cap));
    });
    
    if (suitableModels.length === 0) {
      // Fall back to any available model
      return availableModels[0];
    }
    
    // Select model with highest priority
    suitableModels.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    return suitableModels[0];
  }

  setDefaultModel(modelId) {
    const modelConfig = this.models.get(modelId);
    if (!modelConfig) {
      throw new Error(`Model not found: ${modelId}`);
    }
    
    this.defaultModel = modelId;
    logger.info(`Multi-Model: Set default model to ${modelId}`);
    
    return modelConfig;
  }

  getDefaultModel() {
    return this.models.get(this.defaultModel) || null;
  }

  getModel(modelId) {
    return this.models.get(modelId) || null;
  }

  getAllModels() {
    return Array.from(this.models.values());
  }

  getAvailableModels() {
    return Array.from(this.models.values()).filter(m => m.available);
  }

  getModelStats(modelId) {
    return this.modelStats.get(modelId) || null;
  }

  getAllModelStats() {
    const stats = {};
    
    for (const [modelId, stat] of this.modelStats) {
      const modelConfig = this.models.get(modelId);
      stats[modelId] = {
        name: modelConfig?.name || modelId,
        ...stat,
        available: modelConfig?.available || false
      };
    }
    
    return stats;
  }

  async compareModels(modelIds, prompt, options = {}) {
    const results = [];
    
    for (const modelId of modelIds) {
      try {
        const response = await this.callModel(modelId, prompt, options);
        results.push({
          modelId,
          success: true,
          response,
          duration: response.duration
        });
      } catch (error) {
        results.push({
          modelId,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  async optimizeModelSelection(taskType, options = {}) {
    const stats = this.getAllModelStats();
    
    // Calculate success rate for each model
    const modelPerformance = [];
    
    for (const [modelId, stat] of Object.entries(stats)) {
      const successRate = stat.calls > 0 ? (stat.calls - stat.errors) / stat.calls : 0;
      
      modelPerformance.push({
        modelId,
        successRate,
        totalCalls: stat.calls,
        avgTokens: stat.calls > 0 ? stat.tokens / stat.calls : 0
      });
    }
    
    // Sort by success rate
    modelPerformance.sort((a, b) => b.successRate - a.successRate);
    
    logger.info(`Multi-Model: Model performance analysis`, {
      topModel: modelPerformance[0]?.modelId,
      avgSuccessRate: modelPerformance.reduce((sum, m) => sum + m.successRate, 0) / modelPerformance.length
    });
    
    return modelPerformance;
  }

  updateModelAvailability(modelId, available) {
    const modelConfig = this.models.get(modelId);
    if (!modelConfig) {
      throw new Error(`Model not found: ${modelId}`);
    }
    
    modelConfig.available = available;
    
    logger.info(`Multi-Model: Updated availability for ${modelId}`, {
      available
    });
    
    return modelConfig;
  }

  getCostEstimate(modelId, promptTokens, completionTokens) {
    const modelConfig = this.models.get(modelId);
    if (!modelConfig) {
      throw new Error(`Model not found: ${modelId}`);
    }
    
    const costPerToken = modelConfig.costPerToken || 0;
    const totalTokens = promptTokens + completionTokens;
    
    return {
      modelId,
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCost: totalTokens * costPerToken
    };
  }
}

export { MultiModelManager };
