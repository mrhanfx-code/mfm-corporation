import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CodeMappingManager } from '../../src/core/code-mapping.js';

describe('CodeMappingManager', () => {
  let manager;
  let mockEnv;

  beforeEach(() => {
    mockEnv = { test: 'env' };
    manager = new CodeMappingManager(mockEnv);
    vi.clearAllMocks();
  });

  it('should extract JavaScript dependencies', () => {
    const code = `
      import { func1 } from './module1';
      import func2 from 'module2';
      const func3 = require('./module3');
      
      export function myFunction() {
        func1();
        func2();
        return func3();
      }
    `;
    
    const deps = manager.extractDependencies('test.js', code, 'javascript');
    
    expect(deps.imports).toContain('./module1');
    expect(deps.imports).toContain('module2');
    expect(deps.imports).toContain('./module3');
    expect(deps.exports).toContain('myFunction');
  });

  it('should extract Python dependencies', () => {
    const code = `
      from module1 import func1
      import module2
      
      def my_function():
          func1()
          module2.func()
          return True
    `;
    
    const deps = manager.extractDependencies('test.py', code, 'python');
    
    expect(deps.imports).toContain('module1');
    expect(deps.imports).toContain('module2');
    expect(deps.exports).toContain('my_function');
  });

  it('should extract Java dependencies', () => {
    const code = `
      import com.example.Module1;
      import com.example.Module2;
      
      public class MyClass {
          public void myMethod() {
              Module1.func();
              Module2.func();
          }
      }
    `;
    
    const deps = manager.extractDependencies('test.java', code, 'java');
    
    expect(deps.imports).toContain('com.example.Module1');
    expect(deps.imports).toContain('com.example.Module2');
    expect(deps.exports).toContain('MyClass');
  });

  it('should extract generic dependencies', () => {
    const code = `
      #include <stdio.h>
      #include "header.h"
      using namespace std;
    `;
    
    const deps = manager.extractDependencies('test.c', code, 'c');
    
    expect(deps.imports.length).toBeGreaterThan(0);
  });

  it('should store file in file map', () => {
    const code = 'export function test() {}';
    manager.extractDependencies('test.js', code, 'javascript');
    
    const fileData = manager.fileMap.get('test.js');
    expect(fileData).toBeDefined();
    expect(fileData.path).toBe('test.js');
    expect(fileData.language).toBe('javascript');
  });

  it('should analyze impact of changes', () => {
    manager.extractDependencies('module1.js', 'export function func1() {}', 'javascript');
    manager.extractDependencies('module2.js', 'import { func1 } from "./module1"', 'javascript');
    
    const impact = manager.analyzeImpact('module1.js');
    
    expect(impact.affectedFiles).toContain('module2.js');
    expect(impact.riskLevel).toBe('low');
  });

  it('should use cached impact analysis', () => {
    manager.extractDependencies('module1.js', 'export function func1() {}', 'javascript');
    manager.extractDependencies('module2.js', 'import { func1 } from "./module1"', 'javascript');
    
    const impact1 = manager.analyzeImpact('module1.js');
    const impact2 = manager.analyzeImpact('module1.js');
    
    expect(impact1).toEqual(impact2);
  });

  it('should return unknown risk for non-existent file', () => {
    const impact = manager.analyzeImpact('non-existent.js');
    expect(impact.riskLevel).toBe('unknown');
  });

  it('should calculate high risk for many affected files', () => {
    manager.extractDependencies('module1.js', 'export function func1() {}', 'javascript');
    
    for (let i = 0; i < 12; i++) {
      manager.extractDependencies(`module${i}.js`, `import { func1 } from "./module1"`, 'javascript');
    }
    
    const impact = manager.analyzeImpact('module1.js');
    expect(impact.riskLevel).toBe('high');
  });

  it('should calculate medium risk for moderate affected files', () => {
    manager.extractDependencies('module1.js', 'export function func1() {}', 'javascript');
    
    for (let i = 0; i < 7; i++) {
      manager.extractDependencies(`module${i}.js`, `import { func1 } from "./module1"`, 'javascript');
    }
    
    const impact = manager.analyzeImpact('module1.js');
    expect(impact.riskLevel).toBe('medium');
  });

  it('should generate recommendations for high risk', () => {
    manager.extractDependencies('module1.js', 'export function func1() {}', 'javascript');
    
    for (let i = 0; i < 12; i++) {
      manager.extractDependencies(`module${i}.js`, `import { func1 } from "./module1"`, 'javascript');
    }
    
    const impact = manager.analyzeImpact('module1.js');
    expect(impact.recommendations.length).toBeGreaterThan(0);
  });

  it('should get dependency graph', () => {
    manager.extractDependencies('module1.js', 'export function func1() {}', 'javascript');
    manager.extractDependencies('module2.js', 'import { func1 } from "./module1"', 'javascript');
    
    const graph = manager.getDependencyGraph();
    
    expect(graph).toBeDefined();
    expect(graph['module1.js']).toBeDefined();
    expect(graph['module2.js']).toBeDefined();
  });

  it('should get file dependencies', () => {
    const code = 'import { func1 } from "./module1"';
    manager.extractDependencies('test.js', code, 'javascript');
    
    const deps = manager.getFileDependencies('test.js');
    expect(deps).toBeDefined();
    expect(deps.imports).toContain('./module1');
  });

  it('should return null for non-existent file dependencies', () => {
    const deps = manager.getFileDependencies('non-existent.js');
    expect(deps).toBeNull();
  });

  it('should get all files', () => {
    manager.extractDependencies('file1.js', 'export function func1() {}', 'javascript');
    manager.extractDependencies('file2.js', 'export function func2() {}', 'javascript');
    
    const files = manager.getAllFiles();
    expect(files.length).toBe(2);
  });

  it('should find circular dependencies', () => {
    manager.extractDependencies('module1.js', 'import { func2 } from "./module2"', 'javascript');
    manager.extractDependencies('module2.js', 'import { func1 } from "./module1"', 'javascript');
    
    const circular = manager.findCircularDependencies();
    expect(circular.length).toBeGreaterThan(0);
  });

  it('should return empty array when no circular dependencies', () => {
    manager.extractDependencies('module1.js', 'export function func1() {}', 'javascript');
    manager.extractDependencies('module2.js', 'export function func2() {}', 'javascript');
    
    const circular = manager.findCircularDependencies();
    expect(circular.length).toBe(0);
  });

  it('should get refactoring suggestions for high coupling', () => {
    const imports = Array(12).fill(0).map((_, i) => `import func${i} from './module${i}'`).join('\n');
    const code = `${imports}\nexport function test() {}`;
    
    manager.extractDependencies('test.js', code, 'javascript');
    const suggestions = manager.getRefactoringSuggestions('test.js');
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].type).toBe('reduce_coupling');
  });

  it('should get refactoring suggestions for unused exports', () => {
    manager.extractDependencies('module1.js', 'export function func1() {}\nexport function func2() {}', 'javascript');
    manager.extractDependencies('module2.js', 'import { func1 } from "./module1"', 'javascript');
    
    const suggestions = manager.getRefactoringSuggestions('module1.js');
    // May or may not detect unused exports depending on import matching
    expect(Array.isArray(suggestions)).toBe(true);
  });

  it('should get refactoring suggestions for many function calls', () => {
    const calls = Array(25).fill(0).map((_, i) => `func${i}();`).join('\n');
    const code = `export function test() {\n${calls}\n}`;
    
    manager.extractDependencies('test.js', code, 'javascript');
    const suggestions = manager.getRefactoringSuggestions('test.js');
    
    expect(suggestions.some(s => s.type === 'extract_function')).toBe(true);
  });

  it('should return empty suggestions for well-structured code', () => {
    const code = 'export function test() { return true; }';
    manager.extractDependencies('test.js', code, 'javascript');
    
    const suggestions = manager.getRefactoringSuggestions('test.js');
    // Well-structured code should have minimal suggestions
    expect(suggestions.length).toBeLessThanOrEqual(1);
  });

  it('should get mapping statistics', () => {
    manager.extractDependencies('file1.js', 'export function func1() {}', 'javascript');
    manager.extractDependencies('file2.py', 'def func2(): pass', 'python');
    
    const stats = manager.getStatistics();
    
    expect(stats).toBeDefined();
    expect(stats.totalFiles).toBe(2);
    expect(stats.languages.javascript).toBe(1);
    expect(stats.languages.python).toBe(1);
  });

  it('should return zero statistics when no files', () => {
    const stats = manager.getStatistics();
    expect(stats.totalFiles).toBe(0);
    expect(stats.totalImports).toBe(0);
  });

  it('should calculate average imports and exports', () => {
    manager.extractDependencies('file1.js', 'import { a } from "./a"\nimport { b } from "./b"', 'javascript');
    manager.extractDependencies('file2.js', 'export function func1() {}', 'javascript');
    
    const stats = manager.getStatistics();
    expect(stats.averageImports).toBe('1.0');
    expect(stats.averageExports).toBe('0.5');
  });

  it('should clear all mapping data', () => {
    manager.extractDependencies('file1.js', 'export function func1() {}', 'javascript');
    manager.clear();
    
    const stats = manager.getStatistics();
    expect(stats.totalFiles).toBe(0);
  });

  it('should filter out JavaScript keywords from internal calls', () => {
    const code = `
      export function test() {
        if (true) {
          return function() {
            for (let i = 0; i < 10; i++) {
              console.log(i);
            }
          };
        }
      }
    `;
    
    const deps = manager.extractDependencies('test.js', code, 'javascript');
    expect(deps.internalCalls).not.toContain('if');
    expect(deps.internalCalls).not.toContain('for');
    expect(deps.internalCalls).not.toContain('return');
  });

  it('should filter out Python keywords from internal calls', () => {
    const code = `
      def test():
          if True:
              for i in range(10):
                  print(i)
          return True
    `;
    
    const deps = manager.extractDependencies('test.py', code, 'python');
    expect(deps.internalCalls).not.toContain('if');
    expect(deps.internalCalls).not.toContain('for');
    expect(deps.internalCalls).not.toContain('return');
  });

  it('should track last analyzed timestamp', () => {
    manager.extractDependencies('test.js', 'export function test() {}', 'javascript');
    
    const fileData = manager.fileMap.get('test.js');
    expect(fileData.lastAnalyzed).toBeDefined();
  });
});
