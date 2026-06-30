import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileEnrichmentManager } from '../../src/core/file-enrichment.js';

describe('FileEnrichmentManager', () => {
  let manager;
  let mockEnv;

  beforeEach(() => {
    mockEnv = { test: 'env' };
    manager = new FileEnrichmentManager(mockEnv);
    vi.clearAllMocks();
  });

  it('should detect file type correctly', () => {
    const jsType = manager.detectFileType('test.js');
    const tsType = manager.detectFileType('test.ts');
    const jsonType = manager.detectFileType('test.json');
    const mdType = manager.detectFileType('test.md');
    const unknownType = manager.detectFileType('test.xyz');

    expect(jsType).toBe('javascript');
    expect(tsType).toBe('typescript');
    expect(jsonType).toBe('json');
    expect(mdType).toBe('markdown');
    expect(unknownType).toBe('unknown');
  });

  it('should get file name from path', () => {
    const name1 = manager.getFileName('/path/to/file.js');
    const name2 = manager.getFileName('C:\\path\\to\\file.js');
    const name3 = manager.getFileName('file.js');

    expect(name1).toBe('file.js');
    expect(name2).toBe('file.js');
    expect(name3).toBe('file.js');
  });

  it('should get file extension', () => {
    const ext1 = manager.getFileExtension('file.js');
    const ext2 = manager.getFileExtension('file.ts');
    const ext3 = manager.getFileExtension('file');

    expect(ext1).toBe('js');
    expect(ext2).toBe('ts');
    expect(ext3).toBe('');
  });

  it('should generate summary for analysis', () => {
    const analysis = {
      fileName: 'test.js',
      fileType: 'javascript',
      lineCount: 100,
      functions: ['func1', 'func2'],
      classes: ['Class1'],
      imports: ['module1', 'module2']
    };

    const summary = manager.generateSummary(analysis);

    expect(summary).toContain('test.js');
    expect(summary).toContain('javascript');
    expect(summary).toContain('100 lines');
    expect(summary).toContain('2 function(s)');
    expect(summary).toContain('1 class(es)');
    expect(summary).toContain('2 module(s)');
  });

  it('should calculate complexity', () => {
    const analysis1 = {
      lineCount: 50,
      functions: ['func1'],
      classes: [],
      imports: ['module1'],
      exports: ['export1']
    };

    const complexity1 = manager.calculateComplexity(analysis1);
    expect(complexity1).toBeGreaterThan(0);

    const analysis2 = {
      lineCount: 200,
      functions: ['func1', 'func2', 'func3'],
      classes: ['Class1', 'Class2'],
      imports: ['module1', 'module2'],
      exports: ['export1', 'export2']
    };

    const complexity2 = manager.calculateComplexity(analysis2);
    expect(complexity2).toBeGreaterThan(complexity1);
  });

  it('should analyze code file', () => {
    const content = `
import { logger } from './logger.js';
import { db } from './database.js';

export function testFunction() {
  return 'hello';
}

export const testVar = 'value';

class TestClass {
  constructor() {
    this.value = 123;
  }
}
`;

    const analysis = {
      imports: [],
      exports: [],
      functions: [],
      classes: [],
      dependencies: []
    };

    manager.analyzeCodeFile(content, analysis);

    expect(analysis.imports).toContain('./logger.js');
    expect(analysis.imports).toContain('./database.js');
    expect(analysis.exports).toContain('testFunction');
    expect(analysis.exports).toContain('testVar');
    expect(analysis.functions).toContain('testFunction');
    expect(analysis.classes).toContain('TestClass');
  });

  it('should analyze JSON file', () => {
    const content = JSON.stringify({
      name: 'test',
      version: '1.0.0',
      dependencies: {
        'package1': '^1.0.0',
        'package2': '^2.0.0'
      },
      devDependencies: {
        'dev-package': '^1.0.0'
      }
    });

    const analysis = {
      structure: null,
      dependencies: []
    };

    manager.analyzeJsonFile(content, analysis);

    expect(analysis.structure).toBeDefined();
    expect(analysis.dependencies).toContain('package1');
    expect(analysis.dependencies).toContain('package2');
    expect(analysis.dependencies).toContain('dev-package');
  });

  it('should analyze markdown file', () => {
    const content = `
# Heading 1

## Heading 2

Some text

\`\`\`javascript
const x = 1;
\`\`\`

\`\`\`python
def test():
    pass
\`\`\`
`;

    const analysis = {
      structure: {}
    };

    manager.analyzeMarkdownFile(content, analysis);

    expect(analysis.structure.headings).toBeDefined();
    expect(analysis.structure.headings.length).toBe(2);
    expect(analysis.structure.codeBlocks).toBeDefined();
    expect(analysis.structure.codeBlocks.length).toBe(2);
  });

  it('should build structure tree', () => {
    const analysis = {
      dirName: 'test-dir',
      directories: [
        { name: 'subdir1', path: '/path/subdir1' },
        { name: 'subdir2', path: '/path/subdir2' }
      ],
      files: [
        { name: 'file1.js', path: '/path/file1.js', size: 100, fileType: 'javascript' },
        { name: 'file2.ts', path: '/path/file2.ts', size: 200, fileType: 'typescript' }
      ]
    };

    const tree = manager.buildStructureTree(analysis);

    expect(tree.name).toBe('test-dir');
    expect(tree.type).toBe('directory');
    expect(tree.children).toHaveLength(4);
  });

  it('should clear cache', () => {
    manager.fileCache.set('test', { analysis: {}, timestamp: Date.now() });
    manager.dependencyCache.set('test', { dependencies: [], timestamp: Date.now() });

    expect(manager.fileCache.size).toBe(1);
    expect(manager.dependencyCache.size).toBe(1);

    manager.clearCache();

    expect(manager.fileCache.size).toBe(0);
    expect(manager.dependencyCache.size).toBe(0);
  });

  it('should get cache statistics', () => {
    manager.fileCache.set('test1', { analysis: {}, timestamp: Date.now() });
    manager.fileCache.set('test2', { analysis: {}, timestamp: Date.now() });
    manager.dependencyCache.set('test3', { dependencies: [], timestamp: Date.now() });

    const stats = manager.getCacheStatistics();

    expect(stats.fileCacheSize).toBe(2);
    expect(stats.dependencyCacheSize).toBe(1);
  });
});
