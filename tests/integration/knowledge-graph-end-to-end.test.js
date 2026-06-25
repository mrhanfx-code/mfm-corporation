import { describe, it, expect, beforeEach } from 'vitest';
import { KnowledgeGraphManager } from '../../src/core/knowledge-graph.js';

describe('Knowledge Graph End-to-End Test', () => {
  let manager;
  let mockEnv;

  beforeEach(() => {
    mockEnv = { test: 'env' };
    manager = new KnowledgeGraphManager(mockEnv);
  });

  it('should extract and map all agent relationships from sample data', () => {
    const sampleObservations = [
      'Agent Developer uses [TOOL:git] to commit changes',
      'Agent Developer uses [TOOL:github] to push code',
      'COO team assigned Agent Developer to task',
      'COO team assigned Agent Manager to task',
      'CTO team assigned Agent Architect to task',
      'CTO team assigned Agent Security to task',
      'CMO team assigned Agent Marketing to task',
      'CFO team assigned Agent Finance to task',
      'CINO team assigned Agent Innovation to task',
      'Agent Developer and Agent Tester collaborate on feature',
      'Agent Architect reviews Agent Developer code',
      'Agent Security audits Agent Developer code',
      'Agent Manager coordinates with Agent Marketing',
      'Agent Finance approves budget for Agent Innovation',
      'Agent Tester uses [TOOL:jest] for testing',
      'Agent Architect uses [TOOL:figma] for design',
      'Agent Security uses [TOOL:sonarqube] for security scanning'
    ];

    const entities = manager.extractEntities(sampleObservations);
    const relationships = manager.detectRelationships(entities, sampleObservations);
    manager.buildGraph(entities, relationships);
    const graphData = manager.getVisualizationData();
    const statistics = manager.getStatistics();

    // Verify entities extracted
    expect(entities.size).toBeGreaterThan(0);
    
    const agents = Array.from(entities.values()).filter(e => e.type === 'agent');
    const teams = Array.from(entities.values()).filter(e => e.type === 'team');
    const tools = Array.from(entities.values()).filter(e => e.type === 'tool');

    expect(agents.length).toBeGreaterThan(0);
    expect(teams.length).toBeGreaterThan(0);
    expect(tools.length).toBeGreaterThan(0);

    // Verify specific agents
    const agentNames = agents.map(a => a.name);
    expect(agentNames).toContain('Developer');
    expect(agentNames).toContain('Manager');
    expect(agentNames).toContain('Architect');
    expect(agentNames).toContain('Security');
    expect(agentNames).toContain('Marketing');
    expect(agentNames).toContain('Finance');
    expect(agentNames).toContain('Innovation');
    expect(agentNames).toContain('Tester');

    // Verify specific teams
    const teamNames = teams.map(t => t.name);
    expect(teamNames).toContain('COO');
    expect(teamNames).toContain('CTO');
    expect(teamNames).toContain('CMO');
    expect(teamNames).toContain('CFO');
    expect(teamNames).toContain('CINO');

    // Verify specific tools
    const toolNames = tools.map(t => t.name);
    expect(toolNames).toContain('git');
    expect(toolNames).toContain('github');
    expect(toolNames).toContain('jest');
    expect(toolNames).toContain('figma');
    expect(toolNames).toContain('sonarqube');

    // Verify relationships
    expect(relationships.length).toBeGreaterThan(0);

    // Verify agent-team relationships
    const devTeamRelation = relationships.find(r => 
      (r.source === 'Developer' && r.target === 'COO') ||
      (r.source === 'COO' && r.target === 'Developer')
    );
    expect(devTeamRelation).toBeDefined();

    // Verify agent-tool relationships
    const devGitRelation = relationships.find(r => 
      (r.source === 'Developer' && r.target === 'git') ||
      (r.source === 'git' && r.target === 'Developer')
    );
    expect(devGitRelation).toBeDefined();

    // Verify graph statistics
    expect(statistics.totalNodes).toBeGreaterThan(0);
    expect(statistics.totalEdges).toBeGreaterThan(0);
    expect(statistics.nodeTypes.agent).toBeGreaterThan(0);
    expect(statistics.nodeTypes.team).toBeGreaterThan(0);
    expect(statistics.nodeTypes.tool).toBeGreaterThan(0);
  });

  it('should update graph in real-time with new observations', () => {
    const initialObservations = [
      'Agent Developer uses [TOOL:git]',
      'COO team assigned Agent Developer'
    ];

    const initialEntities = manager.extractEntities(initialObservations);
    const initialRelationships = manager.detectRelationships(initialEntities, initialObservations);
    manager.buildGraph(initialEntities, initialRelationships);
    const initialStats = manager.getStatistics();

    expect(initialStats.totalNodes).toBeGreaterThan(0);

    // Add new observations
    const newObservations = [
      'Agent Developer uses [TOOL:github]',
      'CTO team assigned Agent Architect'
    ];

    const updatedGraph = manager.updateGraph(newObservations);
    const updatedStats = manager.getStatistics();

    // Verify graph grew
    expect(updatedStats.totalNodes).toBeGreaterThanOrEqual(initialStats.totalNodes);
    expect(updatedStats.totalEdges).toBeGreaterThanOrEqual(initialStats.totalEdges);

    // Verify new entities added
    const agentNames = Array.from(manager.graph.nodes.values())
      .filter(n => n.type === 'agent')
      .map(n => n.name);
    expect(agentNames).toContain('Architect');

    const toolNames = Array.from(manager.graph.nodes.values())
      .filter(n => n.type === 'tool')
      .map(n => n.name);
    expect(toolNames).toContain('github');
  });

  it('should track entity mentions correctly', () => {
    const observations = [
      'Agent Developer mentioned in task 1',
      'Agent Developer mentioned in task 2',
      'Agent Developer mentioned in task 3',
      'Agent Developer mentioned in task 4',
      'Agent Developer mentioned in task 5'
    ];

    const entities = manager.extractEntities(observations);
    const relationships = manager.detectRelationships(entities, observations);
    manager.buildGraph(entities, relationships);

    const developer = manager.graph.nodes.get('Developer');
    expect(developer).toBeDefined();
    expect(developer.properties.mentions).toBe(5);
  });

  it('should get agent relationships correctly', () => {
    const observations = [
      'Agent Developer uses [TOOL:git]',
      'Agent Developer uses [TOOL:github]',
      'COO team assigned Agent Developer',
      'Agent Developer works with Agent Tester'
    ];

    const entities = manager.extractEntities(observations);
    const relationships = manager.detectRelationships(entities, observations);
    manager.buildGraph(entities, relationships);

    const devRelationships = manager.getAgentRelationships('Developer');
    expect(devRelationships.length).toBeGreaterThan(0);

    const relationshipTypes = devRelationships.map(r => r.type);
    expect(relationshipTypes).toContain('uses');
    expect(relationshipTypes).toContain('belongs_to');
  });

  it('should get team composition correctly', () => {
    const observations = [
      'COO team assigned Agent Developer, Agent Manager, and Agent Coordinator'
    ];

    const entities = manager.extractEntities(observations);
    const relationships = manager.detectRelationships(entities, observations);
    manager.buildGraph(entities, relationships);

    const cooMembers = manager.getTeamComposition('COO');
    expect(cooMembers.length).toBeGreaterThanOrEqual(1);
    expect(cooMembers).toContain('Developer');
  });

  it('should get tools used by agent correctly', () => {
    const observations = [
      'Agent Developer uses [TOOL:git]',
      'Agent Developer uses [TOOL:github]',
      'Agent Developer uses [TOOL:jest]'
    ];

    const entities = manager.extractEntities(observations);
    const relationships = manager.detectRelationships(entities, observations);
    manager.buildGraph(entities, relationships);

    const devTools = manager.getAgentTools('Developer');
    expect(devTools.length).toBe(3);
    expect(devTools).toContain('git');
    expect(devTools).toContain('github');
    expect(devTools).toContain('jest');
  });

  it('should handle complex multi-agent scenarios', () => {
    const complexObservations = [
      'Agent Developer uses [TOOL:git] and [TOOL:github]',
      'Agent Developer works with Agent Tester and Agent Architect',
      'COO team assigned Agent Developer and Agent Manager',
      'CTO team assigned Agent Architect and Agent Security',
      'Agent Architect uses [TOOL:figma] and [TOOL:sketch]',
      'Agent Security uses [TOOL:sonarqube] and [TOOL:owasp]',
      'Agent Tester uses [TOOL:jest] and [TOOL:cypress]',
      'Agent Manager coordinates with Agent Marketing and Agent Finance',
      'CMO team assigned Agent Marketing',
      'CFO team assigned Agent Finance'
    ];

    const entities = manager.extractEntities(complexObservations);
    const relationships = manager.detectRelationships(entities, complexObservations);
    manager.buildGraph(entities, relationships);
    const graphData = manager.getVisualizationData();
    const statistics = manager.getStatistics();

    // Verify all agents captured
    const agents = Array.from(entities.values()).filter(e => e.type === 'agent');
    const agentNames = agents.map(a => a.name);
    
    expect(agentNames).toContain('Developer');
    expect(agentNames).toContain('Tester');
    expect(agentNames).toContain('Architect');
    expect(agentNames).toContain('Security');
    expect(agentNames).toContain('Manager');
    expect(agentNames).toContain('Marketing');
    expect(agentNames).toContain('Finance');

    // Verify all tools captured
    const tools = Array.from(entities.values()).filter(e => e.type === 'tool');
    const toolNames = tools.map(t => t.name);
    
    expect(toolNames).toContain('git');
    expect(toolNames).toContain('github');
    expect(toolNames).toContain('figma');
    expect(toolNames).toContain('sketch');
    expect(toolNames).toContain('sonarqube');
    expect(toolNames).toContain('owasp');
    expect(toolNames).toContain('jest');
    expect(toolNames).toContain('cypress');

    // Verify all teams captured
    const teams = Array.from(entities.values()).filter(e => e.type === 'team');
    const teamNames = teams.map(t => t.name);
    
    expect(teamNames).toContain('COO');
    expect(teamNames).toContain('CTO');
    expect(teamNames).toContain('CMO');
    expect(teamNames).toContain('CFO');

    // Verify cross-team relationships
    expect(relationships.length).toBeGreaterThan(10);
  });
});
