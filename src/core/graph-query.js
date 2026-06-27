/**
 * Graph Query Module
 * Provides graph query functionality for MFM-Corporation codebase
 */

/**
 * Search for nodes by label
 */
export function searchNodesByLabel(graph, searchTerm) {
  if (!graph || !graph.nodes) {
    return [];
  }

  const term = searchTerm.toLowerCase();
  return graph.nodes.filter(node => 
    node.label && node.label.toLowerCase().includes(term)
  );
}

/**
 * Find neighbors of a node
 */
export function findNeighbors(graph, nodeId, maxDepth = 1) {
  if (!graph || !graph.edges) {
    return [];
  }

  const neighbors = new Set();
  const visited = new Set();
  const queue = [{ id: nodeId, depth: 0 }];

  while (queue.length > 0) {
    const { id, depth } = queue.shift();

    if (depth > maxDepth || visited.has(id)) {
      continue;
    }

    visited.add(id);

    // Find outgoing edges
    graph.edges
      .filter(edge => edge.source === id)
      .forEach(edge => {
        neighbors.add(edge.target);
        if (depth < maxDepth) {
          queue.push({ id: edge.target, depth: depth + 1 });
        }
      });

    // Find incoming edges
    graph.edges
      .filter(edge => edge.target === id)
      .forEach(edge => {
        neighbors.add(edge.source);
        if (depth < maxDepth) {
          queue.push({ id: edge.source, depth: depth + 1 });
        }
      });
  }

  return Array.from(neighbors).map(id => 
    graph.nodes.find(node => node.id === id)
  ).filter(Boolean);
}

/**
 * Find shortest path between two nodes using BFS
 */
export function findShortestPath(graph, sourceId, targetId) {
  if (!graph || !graph.edges) {
    return null;
  }

  if (sourceId === targetId) {
    return [sourceId];
  }

  const queue = [[sourceId]];
  const visited = new Set([sourceId]);

  while (queue.length > 0) {
    const path = queue.shift();
    const currentId = path[path.length - 1];

    // Find neighbors
    const neighbors = new Set();
    
    graph.edges
      .filter(edge => edge.source === currentId)
      .forEach(edge => neighbors.add(edge.target));
    
    graph.edges
      .filter(edge => edge.target === currentId)
      .forEach(edge => neighbors.add(edge.source));

    for (const neighborId of neighbors) {
      if (neighborId === targetId) {
        return [...path, neighborId];
      }

      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push([...path, neighborId]);
      }
    }
  }

  return null; // No path found
}

/**
 * Find nodes by file type
 */
export function findNodesByFileType(graph, fileType) {
  if (!graph || !graph.nodes) {
    return [];
  }

  return graph.nodes.filter(node => node.file_type === fileType);
}

/**
 * Find nodes by source file
 */
export function findNodesBySourceFile(graph, sourceFile) {
  if (!graph || !graph.nodes) {
    return [];
  }

  return graph.nodes.filter(node => 
    node.source_file && node.source_file.includes(sourceFile)
  );
}

/**
 * Get node degree (number of connections)
 */
export function getNodeDegree(graph, nodeId) {
  if (!graph || !graph.edges) {
    return 0;
  }

  const outgoing = graph.edges.filter(edge => edge.source === nodeId).length;
  const incoming = graph.edges.filter(edge => edge.target === nodeId).length;
  
  return outgoing + incoming;
}

/**
 * Find high-degree nodes (God Nodes)
 */
export function findGodNodes(graph, threshold = 10) {
  if (!graph || !graph.nodes) {
    return [];
  }

  return graph.nodes
    .map(node => ({
      ...node,
      degree: getNodeDegree(graph, node.id)
    }))
    .filter(node => node.degree >= threshold)
    .sort((a, b) => b.degree - a.degree);
}

/**
 * Find edges between two nodes
 */
export function findEdgesBetween(graph, sourceId, targetId) {
  if (!graph || !graph.edges) {
    return [];
  }

  return graph.edges.filter(edge => 
    (edge.source === sourceId && edge.target === targetId) ||
    (edge.source === targetId && edge.target === sourceId)
  );
}

/**
 * Get subgraph for a set of nodes
 */
export function getSubgraph(graph, nodeIds) {
  if (!graph || !graph.nodes || !graph.edges) {
    return { nodes: [], edges: [] };
  }

  const nodeIdSet = new Set(nodeIds);
  
  const nodes = graph.nodes.filter(node => nodeIdSet.has(node.id));
  const edges = graph.edges.filter(edge => 
    nodeIdSet.has(edge.source) && nodeIdSet.has(edge.target)
  );

  return { nodes, edges };
}

/**
 * Query graph with natural language (simple keyword matching)
 */
export function queryGraph(graph, query) {
  const startTime = Date.now();
  
  if (!graph || !graph.nodes) {
    return { nodes: [], edges: [], metrics: { queryTime: 0, nodesFound: 0 } };
  }

  const keywords = query.toLowerCase().split(/\s+/);
  
  // Find nodes matching keywords
  const matchedNodes = graph.nodes.filter(node => {
    const nodeText = `${node.label} ${node.source_file || ''}`.toLowerCase();
    return keywords.some(keyword => nodeText.includes(keyword));
  });

  // Get subgraph for matched nodes
  const nodeIds = matchedNodes.map(node => node.id);
  const result = getSubgraph(graph, nodeIds);
  
  const queryTime = Date.now() - startTime;
  
  return {
    ...result,
    metrics: {
      queryTime,
      nodesFound: matchedNodes.length,
      keywords: keywords.length
    }
  };
}
