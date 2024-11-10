// src/utils/deriveEdges.tsx

import { Edge } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';

interface CustomNodeData {
  title: string;
  content: string;
  parents: string[];
  children: string[];
  depth: number;
  isHighlighted?: boolean;
}

interface CustomNode {
  id: string;
  data: CustomNodeData;
}

export const deriveEdgesFromNodes = (nodes: CustomNode[]): Edge[] => {
  const edges: Edge[] = [];
  const edgeSet = new Set<string>(); // To prevent duplicate edges

  nodes.forEach((node) => {
    const { id: targetId, data } = node;

    // Create edges from parents to this node
    data.parents.forEach((parentId) => {
      const edgeKey = `${parentId}-${targetId}`;
      if (!edgeSet.has(edgeKey)) {
        edges.push({
          id: uuidv4(), // Ensure unique edge IDs
          source: parentId,
          target: targetId,
        });
        edgeSet.add(edgeKey);
      }
    });

    // Optionally, create edges from this node to its children
    /*
    data.children.forEach((childId) => {
      const edgeKey = `${node.id}-${childId}`;
      if (!edgeSet.has(edgeKey)) {
        edges.push({
          id: uuidv4(),
          source: node.id,
          target: childId,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        });
        edgeSet.add(edgeKey);
      }
    });
    */
  });

  return edges;
};
