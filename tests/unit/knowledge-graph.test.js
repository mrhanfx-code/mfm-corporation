import { describe, it, expect, beforeEach } from 'vitest';
import { KnowledgeGraphManager } from '../../src/core/knowledge-graph.js';

describe('KnowledgeGraphManager', () => {
  let manager;
  let mockEnv;

  beforeEach(() => {
    mockEnv = { test: 'env' };
    manager = new KnowledgeGraphManager(mockEnv);
  });

  it('should extract entities from observations', () => {
    const observations = [
      'Agent Developer uses [TOOL:git] to commit changes',
      'COO team assigned Agent Developer to task',
      'CTO team reviews Agent Developer code'
    ];

    const entities = manager.extractEntities(observations);

    expect(entities.has('Developer')).toBe(true);
    expect(entities.has('COO')).toBe(true);
    expect(entities.has('CTO')).toBe(true);
    expect(entities.has('git')).toBe(true);
    expect(entities.get('Developer').type).toBe('agent');
    expect(entities.get('COO').type).toBe('team');
    expect(entities.get('git').type).toBe('tool');
  });

  it('should detect relationships between entities', () => {
    const observations = [
      'Agent Developer uses [TOOL:git]',
      'COO team assigned Agent Developer',
      'Agent Developer and Agent Tester collaborate'
    ];

    const entities = manager.extractEntities(observations);
    const relationships = manager.detectRelationships(entities, observations);

    expect(relationships.length).toBeGreaterThan(0);
    
    const devGitRelation = relationships.find(r => 
      (r.source === 'Developer' && r.target === 'git') ||
      (r.source === 'git' && r.target === 'Developer')
    );
    expect(devGitRelation).toBeDefined();
    expect(devGitRelation.weight).toBeGreaterThan(0);
  });

  it('should infer relationship types correctly', () => {
    const agentEntity = { type: 'agent', name: 'Developer' };
    const teamEntity = { type: 'team', name: 'COO' };
    const toolEntity = { type: 'tool', name: 'git' };

    const agentTeam = manager.inferRelationshipType(agentEntity, teamEntity, 1);
    expect(agentTeam).toBe('belongs_to');

    const teamAgent = manager.inferRelationshipType(teamEntity, agentEntity, 1);
    expect(teamAgent).toBe('has_member');

    const agentTool = manager.inferRelationshipType(agentEntity, toolEntity, 1);
    expect(agentTool).toBe('uses');

    const toolAgent = manager.inferRelationshipType(toolEntity, agentEntity, 1);
    expect(toolAgent).toBe('used_by');
  });

  it('should build knowledge graph from entities and relationships', () => {
    const observations = [
      'Agent Developer uses TOOL:git',
      'COO team assigned Agent Developer'
    ];

    const entities = manager.extractEntities(observations);
    const relationships = manager.detectRelationships(entities, observations);
    const graph = manager.buildGraph(entities, relationships);

    expect(graph.nodes.size).toBeGreaterThan(0);
    expect(graph.edges.size).toBeGreaterThan(0);
    expect(graph.nodes.has('Developer')).toBe(true);
  });

  it('should get visualization data', () => {
    const observations = [
      'Agent Developer uses TOOL:git',
      'COO team assigned Agent Developer'
    ];

    const entities = manager.extractEntities(observations);
    const relationships = manager.detectRelationships(entities, observations);
    manager.buildGraph(entities, relationships);

    const vizData = manager.getVisualizationData();

    expect(vizData.nodes).toBeDefined();
    expect(vizData.edges).toBeDefined();
    expect(vizData.metadata).toBeDefined();
    expect(vizData.metadata.nodeCount).toBeGreaterThan(0);
    expect(vizData.metadata.edgeCount).toBeGreaterThan(0);
  });

  it('should get agent relationships', () => {
    const observations = [
      'Agent Developer uses TOOL:git',
      'COO team assigned Agent Developer',
      'Agent Developer works with Agent Tester'
    ];

    const entities = manager.extractEntities(observations);
    const relationships = manager.detectRelationships(entities, observations);
    manager.buildGraph(entities, relationships);

    const devRelationships = manager.getAgentRelationships('Developer');
    expect(devRelationships.length).toBeGreaterThan(0);
  });

  it('should get team composition', () => {
    const observations = [
      'COO team assigned Agent Developer',
      'COO team assigned Agent Manager'
    ];

    const entities = manager.extractEntities(observations);
    const relationships = manager.detectRelationships(entities, observations);
    manager.buildGraph(entities, relationships);

    const cooMembers = manager.getTeamComposition('COO');
    expect(cooMembers.length).toBeGreaterThan(0);
  });

  it('should get tools used by agent', () => {
    const observations = [
      'Agent Developer uses [TOOL:git]',
      'Agent Developer uses [TOOL:github]'
    ];

    const entities = manager.extractEntities(observations);
    const relationships = manager.detectRelationships(entities, observations);
    manager.buildGraph(entities, relationships);

    const devTools = manager.getAgentTools('Developer');
    expect(devTools.length).toBeGreaterThan(0);
    expect(devTools).toContain('git');
  });

  it('should get graph statistics', () => {
    const observations = [
      'Agent Developer uses TOOL:git',
      'COO team assigned Agent Developer',
      'CTO team assigned Agent Tester'
    ];

    const entities = manager.extractEntities(observations);
    const relationships = manager.detectRelationships(entities, observations);
    manager.buildGraph(entities, relationships);

    const stats = manager.getStatistics();

    expect(stats.totalNodes).toBeGreaterThan(0);
    expect(stats.totalEdges).toBeGreaterThan(0);
    expect(stats.nodeTypes).toBeDefined();
    expect(stats.edgeTypes).toBeDefined();
  });

  it('should clear graph', () => {
    const observations = ['Agent Developer uses TOOL:git'];
    const entities = manager.extractEntities(observations);
    const relationships = manager.detectRelationships(entities, observations);
    manager.buildGraph(entities, relationships);

    expect(manager.graph.nodes.size).toBeGreaterThan(0);

    manager.clearGraph();

    expect(manager.graph.nodes.size).toBe(0);
    expect(manager.graph.edges.size).toBe(0);
  });

  it('should handle empty observations', () => {
    const entities = manager.extractEntities([]);
    const relationships = manager.detectRelationships(entities, []);
    const graph = manager.buildGraph(entities, relationships);

    expect(graph.nodes.size).toBe(0);
    expect(graph.edges.size).toBe(0);
  });

  it('should track entity mentions', () => {
    const observations = [
      'Agent Developer mentioned in task 1',
      'Agent Developer mentioned in task 2',
      'Agent Developer mentioned in task 3'
    ];

    const entities = manager.extractEntities(observations);
    const developer = entities.get('Developer');

    expect(developer).toBeDefined();
    expect(developer.properties.mentions).toBe(3);
  });
});
