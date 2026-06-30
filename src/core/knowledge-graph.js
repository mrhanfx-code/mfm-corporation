// Knowledge Graph Extraction — Agent relationship mapping and visualization

import { logger } from './logger.js';
import { saveMemory, getMemory } from '../tools/d1-store.js';

class KnowledgeGraphManager {
  constructor(env) {
    this.env = env;
    this.graph = {
      nodes: new Map(),
      edges: new Map()
    };
  }

  // Extract entities from observations
  extractEntities(observations) {
    const entities = new Map();
    
    for (const observation of observations) {
      // Extract agent names
      const agentMatches = observation.match(/Agent\s+(\w+)/gi);
      if (agentMatches) {
        for (const match of agentMatches) {
          const agentName = match.replace(/Agent\s+/i, '');
          entities.set(agentName, {
            type: 'agent',
            name: agentName,
            properties: {
              mentions: (entities.get(agentName)?.properties?.mentions || 0) + 1
            }
          });
        }
      }
      
      // Extract team names
      const teamMatches = observation.match(/(COO|CTO|CMO|CFO|CINO|CLO|CEO)/gi);
      if (teamMatches) {
        for (const match of teamMatches) {
          const teamName = match.toUpperCase();
          entities.set(teamName, {
            type: 'team',
            name: teamName,
            properties: {
              mentions: (entities.get(teamName)?.properties?.mentions || 0) + 1
            }
          });
        }
      }
      
      // Extract tools
      const toolMatches = observation.match(/\[TOOL:(\w+)\]/gi);
      if (toolMatches) {
        for (const match of toolMatches) {
          const toolName = match.replace(/\[TOOL:|\]/gi, '');
          entities.set(toolName, {
            type: 'tool',
            name: toolName,
            properties: {
              mentions: (entities.get(toolName)?.properties?.mentions || 0) + 1
            }
          });
        }
      }
    }
    
    return entities;
  }

  // Detect relationships between entities
  detectRelationships(entities, observations) {
    const relationships = [];
    
    const entityList = Array.from(entities.keys());
    
    for (let i = 0; i < entityList.length; i++) {
      for (let j = i + 1; j < entityList.length; j++) {
        const entity1 = entityList[i];
        const entity2 = entityList[j];
        
        // Check if entities appear together in observations
        let coOccurrenceCount = 0;
        for (const observation of observations) {
          if (observation.includes(entity1) && observation.includes(entity2)) {
            coOccurrenceCount++;
          }
        }
        
        if (coOccurrenceCount > 0) {
          const type = this.inferRelationshipType(
            entities.get(entity1),
            entities.get(entity2),
            coOccurrenceCount
          );
          
          relationships.push({
            source: entity1,
            target: entity2,
            type,
            weight: coOccurrenceCount,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    return relationships;
  }

  inferRelationshipType(entity1, entity2, coOccurrenceCount) {
    const type1 = entity1.type;
    const type2 = entity2.type;
    
    // Agent to Team relationship
    if (type1 === 'agent' && type2 === 'team') return 'belongs_to';
    if (type1 === 'team' && type2 === 'agent') return 'has_member';
    
    // Agent to Tool relationship
    if (type1 === 'agent' && type2 === 'tool') return 'uses';
    if (type1 === 'tool' && type2 === 'agent') return 'used_by';
    
    // Team to Team relationship
    if (type1 === 'team' && type2 === 'team') return 'collaborates_with';
    
    // Agent to Agent relationship
    if (type1 === 'agent' && type2 === 'agent') return 'interacts_with';
    
    // Default
    return 'related_to';
  }

  // Build knowledge graph
  buildGraph(entities, relationships) {
    // Add nodes
    for (const [id, entity] of entities) {
      this.graph.nodes.set(id, {
        id,
        type: entity.type,
        name: entity.name,
        properties: entity.properties
      });
    }
    
    // Add edges
    for (const relationship of relationships) {
      const edgeId = `${relationship.source}-${relationship.target}`;
      this.graph.edges.set(edgeId, relationship);
    }
    
    logger.info(`Knowledge Graph: Built graph with ${this.graph.nodes.size} nodes and ${this.graph.edges.size} edges`);
    
    return this.graph;
  }

  // Get graph visualization data
  getVisualizationData() {
    const nodes = Array.from(this.graph.nodes.values()).map(node => ({
      id: node.id,
      label: node.name,
      type: node.type,
      properties: node.properties
    }));
    
    const edges = Array.from(this.graph.edges.values()).map(edge => ({
      source: edge.source,
      target: edge.target,
      label: edge.type,
      weight: edge.weight
    }));
    
    return {
      nodes,
      edges,
      metadata: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Get agent relationships
  getAgentRelationships(agentName) {
    const relationships = [];
    
    for (const edge of this.graph.edges.values()) {
      if (edge.source === agentName || edge.target === agentName) {
        relationships.push(edge);
      }
    }
    
    return relationships;
  }

  // Get team composition
  getTeamComposition(teamName) {
    const members = [];
    
    for (const edge of this.graph.edges.values()) {
      if (edge.target === teamName && edge.type === 'belongs_to') {
        members.push(edge.source);
      }
    }
    
    return members;
  }

  // Get tools used by agent
  getAgentTools(agentName) {
    const tools = [];
    
    for (const edge of this.graph.edges.values()) {
      if (edge.source === agentName && edge.type === 'uses') {
        tools.push(edge.target);
      }
    }
    
    return tools;
  }

  // Save graph to memory
  async saveGraph() {
    try {
      const visualizationData = this.getVisualizationData();
      const memoryKey = `knowledge_graph:${Date.now()}`;
      await saveMemory(this.env, memoryKey, visualizationData);
      
      logger.info(`Knowledge Graph: Saved graph to memory`);
    } catch (error) {
      logger.error(`Knowledge Graph: Failed to save graph`, {
        error: error.message
      });
    }
  }

  // Load graph from memory
  async loadGraph() {
    try {
      // In production, load from memory/database
      logger.info(`Knowledge Graph: Loading graph from memory`);
    } catch (error) {
      logger.error(`Knowledge Graph: Failed to load graph`, {
        error: error.message
      });
    }
  }

  // Clear graph
  clearGraph() {
    this.graph.nodes.clear();
    this.graph.edges.clear();
    logger.info(`Knowledge Graph: Graph cleared`);
  }

  // Get graph statistics
  getStatistics() {
    const nodeTypes = new Map();
    const edgeTypes = new Map();
    
    for (const node of this.graph.nodes.values()) {
      const count = nodeTypes.get(node.type) || 0;
      nodeTypes.set(node.type, count + 1);
    }
    
    for (const edge of this.graph.edges.values()) {
      const count = edgeTypes.get(edge.type) || 0;
      edgeTypes.set(edge.type, count + 1);
    }
    
    return {
      totalNodes: this.graph.nodes.size,
      totalEdges: this.graph.edges.size,
      nodeTypes: Object.fromEntries(nodeTypes),
      edgeTypes: Object.fromEntries(edgeTypes)
    };
  }

  // Update graph with new observations in real-time
  updateGraph(newObservations) {
    const newEntities = this.extractEntities(newObservations);
    const newRelationships = this.detectRelationships(newEntities, newObservations);
    
    // Merge new entities
    for (const [id, entity] of newEntities) {
      if (this.graph.nodes.has(id)) {
        // Update existing entity
        const existing = this.graph.nodes.get(id);
        existing.properties.mentions = (existing.properties.mentions || 0) + (entity.properties.mentions || 0);
      } else {
        // Add new entity
        this.graph.nodes.set(id, {
          id,
          type: entity.type,
          name: entity.name,
          properties: entity.properties
        });
      }
    }
    
    // Merge new relationships
    for (const relationship of newRelationships) {
      const edgeId = `${relationship.source}-${relationship.target}`;
      if (this.graph.edges.has(edgeId)) {
        // Update existing relationship weight
        const existing = this.graph.edges.get(edgeId);
        existing.weight += relationship.weight;
        existing.timestamp = new Date().toISOString();
      } else {
        // Add new relationship
        this.graph.edges.set(edgeId, relationship);
      }
    }
    
    logger.info(`Knowledge Graph: Updated graph with ${newEntities.size} new entities and ${newRelationships.length} new relationships`);
    
    return this.getVisualizationData();
  }

  // Get graph changes since last update
  getChanges(sinceTimestamp) {
    const changes = {
      addedNodes: [],
      updatedNodes: [],
      addedEdges: [],
      updatedEdges: []
    };
    
    const since = new Date(sinceTimestamp);
    
    for (const edge of this.graph.edges.values()) {
      const edgeTime = new Date(edge.timestamp);
      if (edgeTime > since) {
        changes.updatedEdges.push(edge);
      }
    }
    
    return changes;
  }
}

export { KnowledgeGraphManager };
