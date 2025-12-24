import { Graph, GraphNode, Link, Section } from '../types';

export function buildGraph(sections: Section[], links: Link[]): Graph {
  const nodes: Record<string, GraphNode> = {};
  const occurrences: Record<string, Link[]> = {};
  
  sections.forEach(section => {
    nodes[section.id] = {
      id: section.id,
      outgoing: {},
      incoming: {}
    };
    occurrences[section.id] = [];
  });
  
  links.forEach(link => {
    const sourceId = link.sourceId;
    const targetId = link.ref.id;
    
    if (!occurrences[targetId]) {
      occurrences[targetId] = [];
    }
    occurrences[targetId].push(link);
    
    if (nodes[sourceId]) {
      nodes[sourceId].outgoing[targetId] = (nodes[sourceId].outgoing[targetId] || 0) + 1;
      
      if (nodes[targetId]) {
        nodes[targetId].incoming[sourceId] = (nodes[targetId].incoming[sourceId] || 0) + 1;
      }
    }
  });
  
  return { nodes, occurrences };
}

export function detectCycles(graph: Graph): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function dfs(nodeId: string, path: string[]): void {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);
    
    const node = graph.nodes[nodeId];
    if (node) {
      for (const outgoingId of Object.keys(node.outgoing)) {
        if (!visited.has(outgoingId)) {
          dfs(outgoingId, [...path]);
        } else if (recursionStack.has(outgoingId)) {
          const cycleStart = path.indexOf(outgoingId);
          cycles.push([...path.slice(cycleStart), outgoingId]);
        }
      }
    }
    
    recursionStack.delete(nodeId);
  }
  
  Object.keys(graph.nodes).forEach(nodeId => {
    if (!visited.has(nodeId)) {
      dfs(nodeId, []);
    }
  });
  
  return cycles;
}
