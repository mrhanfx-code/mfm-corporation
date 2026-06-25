// Code Mapping — Dependency extraction and impact analysis

import { logger } from './logger.js';

class CodeMappingManager {
  constructor(env) {
    this.env = env;
    this.dependencyGraph = new Map();
    this.fileMap = new Map();
    this.impactCache = new Map();
  }

  /**
   * Extract dependencies from code
   * @param {string} filePath - File path
   * @param {string} code - Code content
   * @param {string} language - Programming language
   * @returns {object} Dependencies
   */
  extractDependencies(filePath, code, language = 'javascript') {
    const dependencies = {
      imports: [],
      exports: [],
      internalCalls: [],
      externalCalls: [],
      fileDependencies: []
    };

    switch (language) {
      case 'javascript':
      case 'typescript':
        this.extractJSDependencies(code, dependencies);
        break;
      case 'python':
        this.extractPythonDependencies(code, dependencies);
        break;
      case 'java':
        this.extractJavaDependencies(code, dependencies);
        break;
      default:
        this.extractGenericDependencies(code, dependencies);
    }

    // Store in dependency graph
    this.dependencyGraph.set(filePath, dependencies);
    this.fileMap.set(filePath, {
      path: filePath,
      language,
      dependencies,
      lastAnalyzed: new Date().toISOString()
    });

    logger.debug(`Code Mapping: Extracted dependencies for ${filePath}`, {
      imports: dependencies.imports.length,
      exports: dependencies.exports.length
    });

    return dependencies;
  }

  extractJSDependencies(code, dependencies) {
    // Extract import statements
    const importRegex = /import\s+(?:.*\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      dependencies.imports.push(match[1]);
    }

    // Extract require statements
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    while ((match = requireRegex.exec(code)) !== null) {
      dependencies.imports.push(match[1]);
    }

    // Extract exports
    const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g;
    while ((match = exportRegex.exec(code)) !== null) {
      dependencies.exports.push(match[1]);
    }

    // Extract function calls
    const callRegex = /(\w+)\s*\(/g;
    const calledFunctions = new Set();
    while ((match = callRegex.exec(code)) !== null) {
      const func = match[1];
      if (!this.isJSKeyword(func) && !calledFunctions.has(func)) {
        calledFunctions.add(func);
        dependencies.internalCalls.push(func);
      }
    }
  }

  extractPythonDependencies(code, dependencies) {
    // Extract import statements
    const importRegex = /(?:from\s+(\S+)\s+)?import\s+(\S+)/g;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      if (match[1]) {
        dependencies.imports.push(match[1]);
      }
      dependencies.imports.push(match[2]);
    }

    // Extract function definitions
    const defRegex = /def\s+(\w+)/g;
    while ((match = defRegex.exec(code)) !== null) {
      dependencies.exports.push(match[1]);
    }

    // Extract function calls
    const callRegex = /(\w+)\s*\(/g;
    const calledFunctions = new Set();
    while ((match = callRegex.exec(code)) !== null) {
      const func = match[1];
      if (!this.isPythonKeyword(func) && !calledFunctions.has(func)) {
        calledFunctions.add(func);
        dependencies.internalCalls.push(func);
      }
    }
  }

  extractJavaDependencies(code, dependencies) {
    // Extract import statements
    const importRegex = /import\s+([\w.]+);/g;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      dependencies.imports.push(match[1]);
    }

    // Extract class definitions
    const classRegex = /(?:public|private|protected)?\s*(?:abstract\s+)?class\s+(\w+)/g;
    while ((match = classRegex.exec(code)) !== null) {
      dependencies.exports.push(match[1]);
    }

    // Extract method definitions
    const methodRegex = /(?:public|private|protected)?\s*(?:static\s+)?\w+\s+(\w+)\s*\(/g;
    while ((match = methodRegex.exec(code)) !== null) {
      dependencies.exports.push(match[1]);
    }
  }

  extractGenericDependencies(code, dependencies) {
    // Generic extraction - look for common patterns
    const patterns = [
      /include\s+['"]([^'"]+)['"]/g,
      /using\s+(\w+)/g,
      /#include\s+<([^>]+)>/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        dependencies.imports.push(match[1]);
      }
    }
  }

  isJSKeyword(word) {
    const keywords = ['if', 'else', 'for', 'while', 'return', 'function', 'class', 'const', 'let', 'var', 'import', 'export', 'default', 'from', 'require', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'super', 'extends', 'static', 'get', 'set'];
    return keywords.includes(word);
  }

  isPythonKeyword(word) {
    const keywords = ['if', 'else', 'elif', 'for', 'while', 'return', 'def', 'class', 'import', 'from', 'as', 'try', 'except', 'finally', 'with', 'lambda', 'yield', 'async', 'await', 'pass', 'break', 'continue', 'True', 'False', 'None'];
    return keywords.includes(word);
  }

  /**
   * Analyze impact of changes
   * @param {string} filePath - File being changed
   * @param {Array} changes - List of changes
   * @returns {object} Impact analysis
   */
  analyzeImpact(filePath, changes = []) {
    const cacheKey = `${filePath}:${JSON.stringify(changes)}`;
    
    if (this.impactCache.has(cacheKey)) {
      return this.impactCache.get(cacheKey);
    }

    const impact = {
      filePath,
      directImpact: [],
      indirectImpact: [],
      affectedFiles: [],
      riskLevel: 'low',
      recommendations: []
    };

    const fileData = this.fileMap.get(filePath);
    if (!fileData) {
      impact.riskLevel = 'unknown';
      this.impactCache.set(cacheKey, impact);
      return impact;
    }

    // Find files that depend on this file
    for (const [otherPath, otherData] of this.fileMap) {
      if (otherPath === filePath) continue;

      const deps = otherData.dependencies.imports;
      const fileName = filePath.split('/').pop().replace(/\.(js|py|java|ts)$/, '');

      // Check if other file imports this file (by path or filename)
      if (deps.some(dep => 
        dep.includes(filePath) || 
        dep.includes(fileName) ||
        dep.includes(`./${fileName}`) ||
        dep.includes(`../${fileName}`)
      )) {
        impact.affectedFiles.push(otherPath);
        impact.directImpact.push({
          file: otherPath,
          type: 'import',
          severity: 'high'
        });
      }
    }

    // Analyze indirect impacts
    for (const affectedFile of impact.affectedFiles) {
      const affectedData = this.fileMap.get(affectedFile);
      if (!affectedData) continue;

      const affectedFileName = affectedFile.split('/').pop().replace(/\.(js|py|java|ts)$/, '');

      for (const [otherPath, otherData] of this.fileMap) {
        if (otherPath === affectedFile || otherPath === filePath) continue;
        if (otherData.dependencies.imports.some(dep => 
          dep.includes(affectedFile) || 
          dep.includes(affectedFileName) ||
          dep.includes(`./${affectedFileName}`) ||
          dep.includes(`../${affectedFileName}`)
        )) {
          if (!impact.indirectImpact.some(i => i.file === otherPath)) {
            impact.indirectImpact.push({
              file: otherPath,
              type: 'transitive',
              severity: 'medium'
            });
          }
        }
      }
    }

    // Calculate risk level
    const totalImpact = impact.directImpact.length + impact.indirectImpact.length;
    if (totalImpact > 10) {
      impact.riskLevel = 'high';
    } else if (totalImpact > 5) {
      impact.riskLevel = 'medium';
    }

    // Generate recommendations
    if (impact.riskLevel === 'high') {
      impact.recommendations.push('Consider running full test suite');
      impact.recommendations.push('Review all affected files');
      impact.recommendations.push('Plan for potential rollback');
    } else if (impact.riskLevel === 'medium') {
      impact.recommendations.push('Run relevant tests');
      impact.recommendations.push('Review directly affected files');
    }

    this.impactCache.set(cacheKey, impact);

    logger.info(`Code Mapping: Analyzed impact for ${filePath}`, {
      affectedFiles: impact.affectedFiles.length,
      riskLevel: impact.riskLevel
    });

    return impact;
  }

  /**
   * Get dependency graph
   * @returns {object} Dependency graph
   */
  getDependencyGraph() {
    const graph = {};

    for (const [filePath, deps] of this.dependencyGraph) {
      graph[filePath] = {
        imports: deps.imports,
        exports: deps.exports,
        internalCalls: deps.internalCalls
      };
    }

    return graph;
  }

  /**
   * Get file dependencies
   * @param {string} filePath - File path
   * @returns {object|null} File dependencies
   */
  getFileDependencies(filePath) {
    return this.dependencyGraph.get(filePath) || null;
  }

  /**
   * Get all files
   * @returns {Array} All files
   */
  getAllFiles() {
    return Array.from(this.fileMap.values());
  }

  /**
   * Find circular dependencies
   * @returns {Array} Circular dependencies
   */
  findCircularDependencies() {
    const circular = [];
    const visited = new Set();
    const recursionStack = new Set();

    const dfs = (filePath, path = []) => {
      if (recursionStack.has(filePath)) {
        const cycleStart = path.indexOf(filePath);
        if (cycleStart !== -1) {
          circular.push(path.slice(cycleStart));
        }
        return;
      }

      if (visited.has(filePath)) return;

      visited.add(filePath);
      recursionStack.add(filePath);

      const deps = this.dependencyGraph.get(filePath);
      if (deps) {
        for (const imp of deps.imports) {
          // Try to find matching file in fileMap
          let importFile = null;
          const fileName = imp.split('/').pop().replace(/\.(js|py|java|ts)$/, '');
          
          for (const [mapPath] of this.fileMap) {
            const mapFileName = mapPath.split('/').pop().replace(/\.(js|py|java|ts)$/, '');
            if (mapFileName === fileName || imp.includes(mapPath)) {
              importFile = mapPath;
              break;
            }
          }
          
          if (importFile) {
            dfs(importFile, [...path, filePath]);
          }
        }
      }

      recursionStack.delete(filePath);
    };

    for (const filePath of this.fileMap.keys()) {
      if (!visited.has(filePath)) {
        dfs(filePath);
      }
    }

    return circular;
  }

  resolveImportPath(importPath) {
    // Simple resolution - in production, this would use actual file system
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      return importPath;
    }
    return null;
  }

  /**
   * Get refactoring suggestions
   * @param {string} filePath - File path
   * @returns {Array} Refactoring suggestions
   */
  getRefactoringSuggestions(filePath) {
    const suggestions = [];
    const fileData = this.fileMap.get(filePath);
    if (!fileData) return suggestions;

    const deps = fileData.dependencies;

    // Check for high coupling
    if (deps.imports.length > 10) {
      suggestions.push({
        type: 'reduce_coupling',
        message: 'File has many imports - consider refactoring to reduce coupling',
        severity: 'medium'
      });
    }

    // Check for unused exports
    const usedExports = new Set();
    const fileName = filePath.split('/').pop().replace(/\.(js|py|java|ts)$/, '');
    
    for (const [otherPath, otherData] of this.fileMap) {
      if (otherPath === filePath) continue;
      for (const imp of otherData.dependencies.imports) {
        if (imp.includes(filePath) || imp.includes(fileName)) {
          deps.exports.forEach(exp => usedExports.add(exp));
        }
      }
    }

    const unusedExports = deps.exports.filter(exp => !usedExports.has(exp));
    if (unusedExports.length > 0) {
      suggestions.push({
        type: 'remove_unused',
        message: `Unused exports found: ${unusedExports.join(', ')}`,
        severity: 'low'
      });
    }

    // Check for potential code duplication
    if (deps.internalCalls.length > 20) {
      suggestions.push({
        type: 'extract_function',
        message: 'Many function calls - consider extracting common logic',
        severity: 'low'
      });
    }

    return suggestions;
  }

  /**
   * Get mapping statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const files = this.getAllFiles();
    const totalImports = files.reduce((sum, f) => sum + f.dependencies.imports.length, 0);
    const totalExports = files.reduce((sum, f) => sum + f.dependencies.exports.length, 0);
    const circularDeps = this.findCircularDependencies();

    return {
      totalFiles: files.length,
      totalImports,
      totalExports,
      averageImports: files.length > 0 ? (totalImports / files.length).toFixed(1) : 0,
      averageExports: files.length > 0 ? (totalExports / files.length).toFixed(1) : 0,
      circularDependencies: circularDeps.length,
      languages: this.getLanguageBreakdown()
    };
  }

  getLanguageBreakdown() {
    const breakdown = {};
    for (const fileData of this.fileMap.values()) {
      const lang = fileData.language;
      breakdown[lang] = (breakdown[lang] || 0) + 1;
    }
    return breakdown;
  }

  /**
   * Clear all mapping data
   */
  clear() {
    this.dependencyGraph.clear();
    this.fileMap.clear();
    this.impactCache.clear();
    logger.info('Code Mapping: Cleared all mapping data');
  }
}

export { CodeMappingManager };
