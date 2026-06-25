// Knowledge Graph Dashboard - Visualization component for agent relationships

export class KnowledgeGraphDashboard {
  constructor() {
    this.graphData = null;
    this.container = null;
  }

  /**
   * Initialize dashboard with container
   * @param {HTMLElement} container - DOM element to render graph
   */
  initialize(container) {
    this.container = container;
    this.renderEmptyState();
  }

  /**
   * Update graph data
   * @param {object} graphData - Knowledge graph visualization data
   */
  updateGraph(graphData) {
    this.graphData = graphData;
    this.render();
  }

  /**
   * Render empty state
   */
  renderEmptyState() {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="knowledge-graph-empty">
        <h3>Knowledge Graph</h3>
        <p>No graph data available. Extract agent interactions to visualize relationships.</p>
      </div>
    `;
  }

  /**
   * Render graph visualization
   */
  render() {
    if (!this.container || !this.graphData) return;

    const { nodes, edges, metadata } = this.graphData;

    this.container.innerHTML = `
      <div class="knowledge-graph-container">
        <div class="graph-header">
          <h3>Knowledge Graph</h3>
          <div class="graph-stats">
            <span class="stat-item">
              <strong>${metadata.nodeCount}</strong> Nodes
            </span>
            <span class="stat-item">
              <strong>${metadata.edgeCount}</strong> Edges
            </span>
            <span class="stat-item">
              <strong>${new Date(metadata.timestamp).toLocaleString()}</strong>
            </span>
          </div>
        </div>
        
        <div class="graph-visualization">
          ${this.renderNodes(nodes)}
          ${this.renderEdges(edges)}
        </div>
        
        <div class="graph-legend">
          <h4>Legend</h4>
          <div class="legend-item">
            <span class="legend-color agent"></span>
            <span>Agent</span>
          </div>
          <div class="legend-item">
            <span class="legend-color team"></span>
            <span>Team</span>
          </div>
          <div class="legend-item">
            <span class="legend-color tool"></span>
            <span>Tool</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render nodes
   * @param {Array} nodes - Graph nodes
   * @returns {string} HTML string
   */
  renderNodes(nodes) {
    return nodes.map(node => `
      <div class="graph-node ${node.type}" data-id="${node.id}" data-type="${node.type}">
        <div class="node-label">${node.label}</div>
        <div class="node-type">${node.type}</div>
        ${node.properties && node.properties.mentions ? `
          <div class="node-mentions">${node.properties.mentions} mentions</div>
        ` : ''}
      </div>
    `).join('');
  }

  /**
   * Render edges
   * @param {Array} edges - Graph edges
   * @returns {string} HTML string
   */
  renderEdges(edges) {
    return edges.map(edge => `
      <div class="graph-edge" data-source="${edge.source}" data-target="${edge.target}">
        <div class="edge-label">${edge.label}</div>
        <div class="edge-weight">weight: ${edge.weight}</div>
      </div>
    `).join('');
  }

  /**
   * Get graph data as JSON
   * @returns {string} JSON string
   */
  exportAsJSON() {
    if (!this.graphData) return null;
    return JSON.stringify(this.graphData, null, 2);
  }

  /**
   * Get graph statistics
   * @returns {object} Graph statistics
   */
  getStatistics() {
    if (!this.graphData) return null;
    
    const nodeTypes = {};
    const edgeTypes = {};
    
    for (const node of this.graphData.nodes) {
      nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
    }
    
    for (const edge of this.graphData.edges) {
      edgeTypes[edge.label] = (edgeTypes[edge.label] || 0) + 1;
    }
    
    return {
      totalNodes: this.graphData.nodes.length,
      totalEdges: this.graphData.edges.length,
      nodeTypes,
      edgeTypes,
      timestamp: this.graphData.metadata.timestamp
    };
  }

  /**
   * Clear graph
   */
  clear() {
    this.graphData = null;
    this.renderEmptyState();
  }
}

// CSS styles for the dashboard
export const knowledgeGraphStyles = `
.knowledge-graph-container {
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  font-family: Arial, sans-serif;
}

.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #ddd;
}

.graph-header h3 {
  margin: 0;
  color: #333;
}

.graph-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  font-size: 14px;
  color: #666;
}

.stat-item strong {
  color: #333;
}

.graph-visualization {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
  min-height: 200px;
  background: white;
  padding: 15px;
  border-radius: 4px;
}

.graph-node {
  padding: 10px;
  border-radius: 4px;
  border: 2px solid #ddd;
  cursor: pointer;
  transition: all 0.2s;
}

.graph-node:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.graph-node.agent {
  background: #e3f2fd;
  border-color: #2196f3;
}

.graph-node.team {
  background: #fff3e0;
  border-color: #ff9800;
}

.graph-node.tool {
  background: #e8f5e9;
  border-color: #4caf50;
}

.node-label {
  font-weight: bold;
  margin-bottom: 5px;
}

.node-type {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.node-mentions {
  font-size: 11px;
  color: #999;
}

.graph-edge {
  padding: 8px;
  background: #f9f9f9;
  border-left: 3px solid #999;
  border-radius: 2px;
  font-size: 12px;
}

.edge-label {
  font-weight: bold;
  margin-bottom: 3px;
}

.edge-weight {
  color: #666;
}

.graph-legend {
  margin-top: 20px;
  padding: 15px;
  background: white;
  border-radius: 4px;
}

.graph-legend h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.legend-color.agent {
  background: #2196f3;
}

.legend-color.team {
  background: #ff9800;
}

.legend-color.tool {
  background: #4caf50;
}

.knowledge-graph-empty {
  padding: 40px;
  text-align: center;
  color: #666;
}

.knowledge-graph-empty h3 {
  margin-bottom: 10px;
  color: #333;
}
`;
