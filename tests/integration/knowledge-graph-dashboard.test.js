import { describe, it, expect, beforeEach } from 'vitest';
import { KnowledgeGraphDashboard } from '../../src/tools/knowledge-graph-dashboard.js';

describe('KnowledgeGraphDashboard', () => {
  let dashboard;
  let mockContainer;

  beforeEach(() => {
    dashboard = new KnowledgeGraphDashboard();
    mockContainer = {
      innerHTML: ''
    };
  });

  it('should initialize with container', () => {
    dashboard.initialize(mockContainer);
    expect(dashboard.container).toBe(mockContainer);
    expect(mockContainer.innerHTML).toContain('No graph data available');
  });

  it('should update graph data', () => {
    const graphData = {
      nodes: [
        { id: 'agent1', label: 'Developer', type: 'agent', properties: { mentions: 5 } },
        { id: 'team1', label: 'COO', type: 'team', properties: { mentions: 3 } }
      ],
      edges: [
        { source: 'agent1', target: 'team1', label: 'belongs_to', weight: 2 }
      ],
      metadata: {
        nodeCount: 2,
        edgeCount: 1,
        timestamp: new Date().toISOString()
      }
    };

    dashboard.initialize(mockContainer);
    dashboard.updateGraph(graphData);

    expect(dashboard.graphData).toBe(graphData);
    expect(mockContainer.innerHTML).toContain('Developer');
    expect(mockContainer.innerHTML).toContain('COO');
    expect(mockContainer.innerHTML).toContain('Nodes');
    expect(mockContainer.innerHTML).toContain('Edges');
  });

  it('should render empty state when no data', () => {
    dashboard.initialize(mockContainer);
    dashboard.renderEmptyState();

    expect(mockContainer.innerHTML).toContain('No graph data available');
  });

  it('should render nodes with correct styling', () => {
    const graphData = {
      nodes: [
        { id: 'agent1', label: 'Developer', type: 'agent', properties: { mentions: 5 } },
        { id: 'team1', label: 'COO', type: 'team', properties: { mentions: 3 } },
        { id: 'tool1', label: 'git', type: 'tool', properties: { mentions: 2 } }
      ],
      edges: [],
      metadata: { nodeCount: 3, edgeCount: 0, timestamp: new Date().toISOString() }
    };

    dashboard.initialize(mockContainer);
    dashboard.updateGraph(graphData);

    expect(mockContainer.innerHTML).toContain('graph-node agent');
    expect(mockContainer.innerHTML).toContain('graph-node team');
    expect(mockContainer.innerHTML).toContain('graph-node tool');
  });

  it('should render edges', () => {
    const graphData = {
      nodes: [
        { id: 'agent1', label: 'Developer', type: 'agent' },
        { id: 'team1', label: 'COO', type: 'team' }
      ],
      edges: [
        { source: 'agent1', target: 'team1', label: 'belongs_to', weight: 5 }
      ],
      metadata: { nodeCount: 2, edgeCount: 1, timestamp: new Date().toISOString() }
    };

    dashboard.initialize(mockContainer);
    dashboard.updateGraph(graphData);

    expect(mockContainer.innerHTML).toContain('graph-edge');
    expect(mockContainer.innerHTML).toContain('belongs_to');
    expect(mockContainer.innerHTML).toContain('weight: 5');
  });

  it('should export graph as JSON', () => {
    const graphData = {
      nodes: [{ id: 'agent1', label: 'Developer', type: 'agent' }],
      edges: [],
      metadata: { nodeCount: 1, edgeCount: 0, timestamp: new Date().toISOString() }
    };

    dashboard.initialize(mockContainer);
    dashboard.updateGraph(graphData);

    const json = dashboard.exportAsJSON();
    const parsed = JSON.parse(json);

    expect(parsed).toEqual(graphData);
  });

  it('should return null when exporting without data', () => {
    dashboard.initialize(mockContainer);
    const json = dashboard.exportAsJSON();
    expect(json).toBeNull();
  });

  it('should get statistics', () => {
    const graphData = {
      nodes: [
        { id: 'agent1', label: 'Developer', type: 'agent' },
        { id: 'agent2', label: 'Tester', type: 'agent' },
        { id: 'team1', label: 'COO', type: 'team' }
      ],
      edges: [
        { source: 'agent1', target: 'team1', label: 'belongs_to' },
        { source: 'agent2', target: 'team1', label: 'belongs_to' }
      ],
      metadata: { nodeCount: 3, edgeCount: 2, timestamp: new Date().toISOString() }
    };

    dashboard.initialize(mockContainer);
    dashboard.updateGraph(graphData);

    const stats = dashboard.getStatistics();

    expect(stats.totalNodes).toBe(3);
    expect(stats.totalEdges).toBe(2);
    expect(stats.nodeTypes.agent).toBe(2);
    expect(stats.nodeTypes.team).toBe(1);
    expect(stats.edgeTypes.belongs_to).toBe(2);
  });

  it('should return null for statistics without data', () => {
    dashboard.initialize(mockContainer);
    const stats = dashboard.getStatistics();
    expect(stats).toBeNull();
  });

  it('should clear graph', () => {
    const graphData = {
      nodes: [{ id: 'agent1', label: 'Developer', type: 'agent' }],
      edges: [],
      metadata: { nodeCount: 1, edgeCount: 0, timestamp: new Date().toISOString() }
    };

    dashboard.initialize(mockContainer);
    dashboard.updateGraph(graphData);
    expect(dashboard.graphData).not.toBeNull();

    dashboard.clear();
    expect(dashboard.graphData).toBeNull();
    expect(mockContainer.innerHTML).toContain('No graph data available');
  });

  it('should handle node mentions display', () => {
    const graphData = {
      nodes: [
        { id: 'agent1', label: 'Developer', type: 'agent', properties: { mentions: 10 } }
      ],
      edges: [],
      metadata: { nodeCount: 1, edgeCount: 0, timestamp: new Date().toISOString() }
    };

    dashboard.initialize(mockContainer);
    dashboard.updateGraph(graphData);

    expect(mockContainer.innerHTML).toContain('10 mentions');
  });

  it('should display legend', () => {
    const graphData = {
      nodes: [
        { id: 'agent1', label: 'Developer', type: 'agent' },
        { id: 'team1', label: 'COO', type: 'team' },
        { id: 'tool1', label: 'git', type: 'tool' }
      ],
      edges: [],
      metadata: { nodeCount: 3, edgeCount: 0, timestamp: new Date().toISOString() }
    };

    dashboard.initialize(mockContainer);
    dashboard.updateGraph(graphData);

    expect(mockContainer.innerHTML).toContain('Legend');
    expect(mockContainer.innerHTML).toContain('Agent');
    expect(mockContainer.innerHTML).toContain('Team');
    expect(mockContainer.innerHTML).toContain('Tool');
  });
});
