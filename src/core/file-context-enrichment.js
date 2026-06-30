// File Context Enrichment — Related files, known bugs, and patterns detection

import { logger } from './logger.js';
import { saveMemory, getMemory } from '../tools/d1-store.js';
import { HybridSearchManager } from './hybrid-search.js';

class FileContextEnrichmentManager {
  constructor(env) {
    this.env = env;
    this.hybridSearch = new HybridSearchManager(env);
    this.fileIndex = new Map();
  }

  async enrichFileContext(filePath, content, options = {}) {
    const { includeRelated = true, includeKnownBugs = true, includePatterns = true } = options;
    
    logger.info(`File Context Enrichment: Enriching context for ${filePath}`);
    
    const enrichment = {
      filePath,
      content,
      enrichedAt: new Date().toISOString(),
      relatedFiles: [],
      knownBugs: [],
      patterns: [],
      dependencies: [],
      totalEnrichmentSize: 0
    };
    
    // Index the file for search
    await this.indexFile(filePath, content);
    
    // Get related files
    if (includeRelated) {
      enrichment.relatedFiles = await this.getRelatedFiles(filePath, content);
    }
    
    // Get known bugs
    if (includeKnownBugs) {
      enrichment.knownBugs = await this.getKnownBugs(filePath, content);
    }
    
    // Get patterns
    if (includePatterns) {
      enrichment.patterns = this.detectPatterns(content);
    }
    
    // Get dependencies
    enrichment.dependencies = this.extractDependencies(content);
    
    // Calculate total enrichment size
    enrichment.totalEnrichmentSize = this.calculateEnrichmentSize(enrichment);
    
    // Save enrichment
    await this.saveEnrichment(filePath, enrichment);
    
    logger.info(`File Context Enrichment: Enrichment complete for ${filePath}`, {
      relatedFiles: enrichment.relatedFiles.length,
      knownBugs: enrichment.knownBugs.length,
      patterns: enrichment.patterns.length
    });
    
    return enrichment;
  }

  async indexFile(filePath, content) {
    const docId = `file:${filePath}`;
    await this.hybridSearch.indexDocument(docId, content, {
      type: 'file',
      path: filePath
    });
    
    this.fileIndex.set(filePath, {
      docId,
      content,
      indexedAt: new Date().toISOString()
    });
  }

  async getRelatedFiles(filePath, content, limit = 10) {
    try {
      // Search for related files using hybrid search
      const query = this.extractKeyTerms(content);
      const searchResults = await this.hybridSearch.hybridSearch(query, { limit });
      
      // Filter out the current file
      const relatedFiles = searchResults
        .filter(result => result.docId !== `file:${filePath}`)
        .map(result => ({
          path: result.docId.replace('file:', ''),
          relevance: result.score,
          snippet: result.content.substring(0, 200)
        }));
      
      return relatedFiles;
    } catch (error) {
      logger.error(`File Context Enrichment: Failed to get related files`, {
        error: error.message
      });
      return [];
    }
  }

  extractKeyTerms(content) {
    // Extract function names, class names, and key terms
    const terms = [];
    
    // Extract function names
    const functionMatches = content.match(/function\s+(\w+)/g);
    if (functionMatches) {
      functionMatches.forEach(match => {
        const name = match.replace('function ', '');
        terms.push(name);
      });
    }
    
    // Extract class names
    const classMatches = content.match(/class\s+(\w+)/g);
    if (classMatches) {
      classMatches.forEach(match => {
        const name = match.replace('class ', '');
        terms.push(name);
      });
    }
    
    // Extract variable names (simple heuristic)
    const varMatches = content.match(/(?:const|let|var)\s+(\w+)/g);
    if (varMatches) {
      varMatches.forEach(match => {
        const name = match.replace(/(?:const|let|var)\s+/, '');
        if (name.length > 3) {
          terms.push(name);
        }
      });
    }
    
    return terms.join(' ');
  }

  async getKnownBugs(filePath, content) {
    try {
      // Search for known bugs related to this file
      const query = `bug error issue ${filePath}`;
      const searchResults = await this.hybridSearch.hybridSearch(query, { limit: 5 });
      
      return searchResults.map(result => ({
        description: result.content,
        relevance: result.score,
        source: result.docId
      }));
    } catch (error) {
      logger.error(`File Context Enrichment: Failed to get known bugs`, {
        error: error.message
      });
      return [];
    }
  }

  detectPatterns(content) {
    const patterns = [];
    
    // Detect async/await pattern
    if (content.includes('async') && content.includes('await')) {
      patterns.push({
        type: 'async_pattern',
        description: 'Uses async/await pattern',
        confidence: 0.9
      });
    }
    
    // Detect promise chain
    if (content.includes('.then(') && content.includes('.catch(')) {
      patterns.push({
        type: 'promise_chain',
        description: 'Uses promise chaining',
        confidence: 0.8
      });
    }
    
    // Detect error handling
    if (content.includes('try') && content.includes('catch')) {
      patterns.push({
        type: 'error_handling',
        description: 'Has error handling',
        confidence: 0.9
      });
    }
    
    // Detect event emitter
    if (content.includes('on(') || content.includes('emit(')) {
      patterns.push({
        type: 'event_emitter',
        description: 'Uses event emitter pattern',
        confidence: 0.7
      });
    }
    
    // Detect singleton pattern
    if (content.includes('getInstance') || (content.includes('module.exports') && content.includes('new'))) {
      patterns.push({
        type: 'singleton',
        description: 'Possible singleton pattern',
        confidence: 0.6
      });
    }
    
    // Detect factory pattern
    if (content.includes('create') || content.includes('build')) {
      patterns.push({
        type: 'factory',
        description: 'Possible factory pattern',
        confidence: 0.5
      });
    }
    
    return patterns;
  }

  extractDependencies(content) {
    const dependencies = [];
    
    // Extract import statements
    const importMatches = content.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g);
    if (importMatches) {
      importMatches.forEach(match => {
        const dependency = match.match(/from\s+['"]([^'"]+)['"]/)[1];
        dependencies.push({
          type: 'import',
          name: dependency
        });
      });
    }
    
    // Extract require statements
    const requireMatches = content.match(/require\(['"]([^'"]+)['"]\)/g);
    if (requireMatches) {
      requireMatches.forEach(match => {
        const dependency = match.match(/require\(['"]([^'"]+)['"]\)/)[1];
        dependencies.push({
          type: 'require',
          name: dependency
        });
      });
    }
    
    return dependencies;
  }

  calculateEnrichmentSize(enrichment) {
    let size = 0;
    
    for (const file of enrichment.relatedFiles) {
      size += file.snippet.length;
    }
    
    for (const bug of enrichment.knownBugs) {
      size += bug.description.length;
    }
    
    for (const pattern of enrichment.patterns) {
      size += pattern.description.length;
    }
    
    return size;
  }

  async saveEnrichment(filePath, enrichment) {
    try {
      const memoryKey = `file_enrichment:${filePath}`;
      await saveMemory(this.env, memoryKey, enrichment);
    } catch (error) {
      logger.error(`File Context Enrichment: Failed to save enrichment`, {
        error: error.message
      });
    }
  }

  async getEnrichment(filePath) {
    try {
      const memoryKey = `file_enrichment:${filePath}`;
      const data = await getMemory(this.env, memoryKey, 1);
      
      if (data && data.length > 0) {
        return data[0];
      }
      
      return null;
    } catch (error) {
      logger.error(`File Context Enrichment: Failed to get enrichment`, {
        error: error.message
      });
      return null;
    }
  }

  async batchEnrichFiles(files) {
    logger.info(`File Context Enrichment: Batch enriching ${files.length} files`);
    
    const enrichments = [];
    
    for (const file of files) {
      const enrichment = await this.enrichFileContext(file.path, file.content);
      enrichments.push(enrichment);
    }
    
    logger.info(`File Context Enrichment: Batch enrichment complete`, {
      total: enrichments.length
    });
    
    return enrichments;
  }

  getEnrichmentStatistics() {
    const stats = {
      totalFiles: this.fileIndex.size,
      totalEnrichments: 0,
      averageRelatedFiles: 0,
      averageKnownBugs: 0,
      averagePatterns: 0
    };
    
    // In production, this would calculate actual statistics
    return stats;
  }
}

export { FileContextEnrichmentManager };
