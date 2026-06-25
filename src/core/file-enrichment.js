// File Enrichment — Enhanced file context analysis for better understanding

import { logger } from './logger.js';
import { readdir, stat, readFile } from 'fs/promises';
import { join, extname } from 'path';

class FileEnrichmentManager {
  constructor(env) {
    this.env = env;
    this.fileCache = new Map();
    this.dependencyCache = new Map();
  }

  /**
   * Analyze file structure and context
   * @param {string} filePath - Path to the file
   * @returns {Promise<object>} File analysis result
   */
  async analyzeFile(filePath) {
    try {
      // Check cache first
      if (this.fileCache.has(filePath)) {
        const cached = this.fileCache.get(filePath);
        if (Date.now() - cached.timestamp < 300000) { // 5 minute cache
          return cached.analysis;
        }
      }

      const analysis = {
        filePath,
        fileName: this.getFileName(filePath),
        extension: this.getFileExtension(filePath),
        fileType: this.detectFileType(filePath),
        size: 0,
        lineCount: 0,
        structure: null,
        imports: [],
        exports: [],
        dependencies: [],
        functions: [],
        classes: [],
        summary: '',
        complexity: 0,
        lastModified: null
      };

      // Get file stats
      const fileStats = await stat(filePath);
      analysis.size = fileStats.size;
      analysis.lastModified = fileStats.mtime.toISOString();

      // Read file content
      const content = await readFile(filePath, 'utf-8');
      if (content) {
        analysis.lineCount = content.split('\n').length;
        
        // Analyze based on file type
        if (analysis.fileType === 'javascript' || analysis.fileType === 'typescript') {
          this.analyzeCodeFile(content, analysis);
        } else if (analysis.fileType === 'json') {
          this.analyzeJsonFile(content, analysis);
        } else if (analysis.fileType === 'markdown') {
          this.analyzeMarkdownFile(content, analysis);
        }
        
        // Generate summary
        analysis.summary = this.generateSummary(analysis);
        analysis.complexity = this.calculateComplexity(analysis);
      }

      // Cache the result
      this.fileCache.set(filePath, {
        analysis,
        timestamp: Date.now()
      });

      logger.info(`File Enrichment: Analyzed file`, {
        filePath,
        fileType: analysis.fileType,
        lineCount: analysis.lineCount
      });

      return analysis;
    } catch (error) {
      logger.error(`File Enrichment: Failed to analyze file`, {
        filePath,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Analyze directory structure
   * @param {string} dirPath - Path to the directory
   * @returns {Promise<object>} Directory analysis result
   */
  async analyzeDirectory(dirPath) {
    try {
      const analysis = {
        dirPath,
        dirName: this.getFileName(dirPath),
        files: [],
        directories: [],
        totalFiles: 0,
        totalSize: 0,
        fileTypes: {},
        structure: null
      };

      const entries = await readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);
        const stats = await stat(fullPath);

        if (entry.isDirectory()) {
          analysis.directories.push({
            name: entry.name,
            path: fullPath
          });
        } else {
          const fileAnalysis = {
            name: entry.name,
            path: fullPath,
            size: stats.size,
            extension: extname(entry.name).slice(1),
            fileType: this.detectFileType(fullPath)
          };

          analysis.files.push(fileAnalysis);
          analysis.totalFiles++;
          analysis.totalSize += stats.size;

          // Track file types
          const ext = fileAnalysis.extension || 'none';
          analysis.fileTypes[ext] = (analysis.fileTypes[ext] || 0) + 1;
        }
      }

      // Build structure tree
      analysis.structure = this.buildStructureTree(analysis);

      logger.info(`File Enrichment: Analyzed directory`, {
        dirPath,
        totalFiles: analysis.totalFiles,
        totalSize: analysis.totalSize
      });

      return analysis;
    } catch (error) {
      logger.error(`File Enrichment: Failed to analyze directory`, {
        dirPath,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Detect dependencies in a file
   * @param {string} filePath - Path to the file
   * @returns {Promise<Array>} List of dependencies
   */
  async detectDependencies(filePath) {
    try {
      if (this.dependencyCache.has(filePath)) {
        const cached = this.dependencyCache.get(filePath);
        if (Date.now() - cached.timestamp < 300000) {
          return cached.dependencies;
        }
      }

      const analysis = await this.analyzeFile(filePath);
      if (!analysis) return [];

      const dependencies = [...analysis.imports, ...analysis.dependencies];

      this.dependencyCache.set(filePath, {
        dependencies,
        timestamp: Date.now()
      });

      return dependencies;
    } catch (error) {
      logger.error(`File Enrichment: Failed to detect dependencies`, {
        filePath,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Generate file summary
   * @param {object} analysis - File analysis result
   * @returns {string} File summary
   */
  generateSummary(analysis) {
    const parts = [];

    parts.push(`${analysis.fileName} is a ${analysis.fileType} file`);
    parts.push(`with ${analysis.lineCount} lines`);

    if (analysis.functions.length > 0) {
      parts.push(`containing ${analysis.functions.length} function(s)`);
    }

    if (analysis.classes.length > 0) {
      parts.push(`and ${analysis.classes.length} class(es)`);
    }

    if (analysis.imports.length > 0) {
      parts.push(`importing ${analysis.imports.length} module(s)`);
    }

    return parts.join(' ') + '.';
  }

  /**
   * Calculate file complexity
   * @param {object} analysis - File analysis result
   * @returns {number} Complexity score
   */
  calculateComplexity(analysis) {
    let complexity = 0;

    // Base complexity from line count
    complexity += Math.min(analysis.lineCount / 100, 10);

    // Function complexity
    complexity += analysis.functions.length * 2;

    // Class complexity
    complexity += analysis.classes.length * 3;

    // Import complexity
    complexity += analysis.imports.length * 1;

    // Export complexity
    complexity += analysis.exports.length * 1;

    return Math.round(complexity);
  }

  /**
   * Analyze code file (JavaScript/TypeScript)
   * @param {string} content - File content
   * @param {object} analysis - Analysis object to populate
   */
  analyzeCodeFile(content, analysis) {
    // Extract imports
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      analysis.imports.push(match[1]);
    }

    // Extract exports
    const exportRegex = /export\s+(?:default\s+)?(?:const|let|var|function|class)\s+(\w+)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      analysis.exports.push(match[1]);
    }

    // Extract functions
    const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\(|(\w+)\s*\([^)]*\)\s*=>)/g;
    while ((match = functionRegex.exec(content)) !== null) {
      const funcName = match[1] || match[2] || match[3];
      if (funcName) {
        analysis.functions.push(funcName);
      }
    }

    // Extract classes
    const classRegex = /class\s+(\w+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      analysis.classes.push(match[1]);
    }

    // Detect common dependencies
    if (content.includes('require(')) {
      const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
      while ((match = requireRegex.exec(content)) !== null) {
        analysis.dependencies.push(match[1]);
      }
    }
  }

  /**
   * Analyze JSON file
   * @param {string} content - File content
   * @param {object} analysis - Analysis object to populate
   */
  analyzeJsonFile(content, analysis) {
    try {
      const json = JSON.parse(content);
      analysis.structure = json;

      if (json.dependencies) {
        analysis.dependencies = Object.keys(json.dependencies);
      }

      if (json.devDependencies) {
        analysis.dependencies.push(...Object.keys(json.devDependencies));
      }
    } catch (error) {
      // Invalid JSON, skip parsing
    }
  }

  /**
   * Analyze Markdown file
   * @param {string} content - File content
   * @param {object} analysis - Analysis object to populate
   */
  analyzeMarkdownFile(content, analysis) {
    // Extract headings
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings = [];
    let match;
    while ((match = headingRegex.exec(content)) !== null) {
      headings.push({
        level: match[1].length,
        text: match[2]
      });
    }

    analysis.structure = { headings };

    // Extract code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const codeBlocks = [];
    while ((match = codeBlockRegex.exec(content)) !== null) {
      codeBlocks.push({
        language: match[1] || 'text',
        content: match[2]
      });
    }

    analysis.structure.codeBlocks = codeBlocks;
  }

  /**
   * Build structure tree from directory analysis
   * @param {object} analysis - Directory analysis
   * @returns {object} Structure tree
   */
  buildStructureTree(analysis) {
    return {
      name: analysis.dirName,
      type: 'directory',
      children: [
        ...analysis.directories.map(dir => ({
          name: dir.name,
          type: 'directory',
          path: dir.path
        })),
        ...analysis.files.map(file => ({
          name: file.name,
          type: 'file',
          path: file.path,
          size: file.size,
          fileType: file.fileType
        }))
      ]
    };
  }

  /**
   * Get file name from path
   * @param {string} filePath - File path
   * @returns {string} File name
   */
  getFileName(filePath) {
    return filePath.split(/[/\\]/).pop();
  }

  /**
   * Get file extension
   * @param {string} filePath - File path
   * @returns {string} File extension
   */
  getFileExtension(filePath) {
    return extname(filePath).slice(1);
  }

  /**
   * Detect file type
   * @param {string} filePath - File path
   * @returns {string} File type
   */
  detectFileType(filePath) {
    const ext = this.getFileExtension(filePath).toLowerCase();
    
    const typeMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'json': 'json',
      'md': 'markdown',
      'html': 'html',
      'css': 'css',
      'py': 'python',
      'java': 'java',
      'go': 'go',
      'rs': 'rust',
      'sql': 'sql',
      'yaml': 'yaml',
      'yml': 'yaml',
      'xml': 'xml'
    };

    return typeMap[ext] || 'unknown';
  }

  /**
   * Clear file cache
   */
  clearCache() {
    this.fileCache.clear();
    this.dependencyCache.clear();
    logger.info(`File Enrichment: Cleared cache`);
  }

  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getCacheStatistics() {
    return {
      fileCacheSize: this.fileCache.size,
      dependencyCacheSize: this.dependencyCache.size
    };
  }
}

export { FileEnrichmentManager };
