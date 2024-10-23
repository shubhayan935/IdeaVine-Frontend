'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  NodeProps,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mic, StopCircle, Plus, Trash2, Check, Lightbulb, PenTool } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface CustomNodeData {
  title: string;
  content: string;
  parents: string[];
  children: string[];
}

interface CustomNodeProps extends NodeProps {
  data: CustomNodeData;
}

const CustomNode = ({ id, data }: CustomNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nodeData, setNodeData] = useState<CustomNodeData>(data);
  const { setNodes, setEdges, getNode } = useReactFlow();
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, draggable: false };
        }
        return node;
      })
    );
  }, [id, setNodes]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...nodeData }, draggable: true };
        }
        return node;
      })
    );
  }, [id, nodeData, setNodes]);

  const handleDelete = useCallback(() => {
    setNodes((nds) => {
      const updatedNodes = nds.filter((node) => node.id !== id);
      return updatedNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          parents: node.data.parents.filter((parentId) => parentId !== id),
          children: node.data.children.filter((childId) => childId !== id),
        },
      }));
    });
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  }, [id, setNodes, setEdges]);

  const handleAddNode = useCallback(
    (position: 'top' | 'bottom' | 'left' | 'right') => {
      const parentNode = getNode(id);
      if (!parentNode) return;

      const newNodeId = `${id}-${position}-${Date.now()}`;

      const newNode: Node<CustomNodeData> = {
        id: newNodeId,
        type: 'customNode',
        data: { title: 'New Node', content: '', parents: [id], children: [] },
        position: {
          x: parentNode.position.x + (position === 'left' ? -200 : position === 'right' ? 200 : 0),
          y: parentNode.position.y + (position === 'bottom' ? 100 : position === 'top' ? -100 : 0),
        },
      };

      setNodes((nds) => [
        ...nds.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, children: [...node.data.children, newNodeId] } }
            : node
        ),
        newNode,
      ]);
      setEdges((eds) =>
        addEdge({ id: `e${id}-${newNodeId}`, source: id, target: newNodeId }, eds)
      );
    },
    [id, getNode, setNodes, setEdges]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (nodeRef.current && !nodeRef.current.contains(event.target as Node) && isEditing) {
        handleBlur();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, handleBlur]);

  return (
    <div className="relative" ref={nodeRef}>
      <Handle type="target" position={Position.Top} />
      <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-gray-200">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <Input
              value={nodeData.title}
              onChange={(e) => setNodeData({ ...nodeData, title: e.target.value })}
              autoFocus
            />
            <Textarea
              value={nodeData.content}
              onChange={(e) => setNodeData({ ...nodeData, content: e.target.value })}
            />
            <div className="flex justify-between">
              <Button onClick={handleDelete} variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button onClick={handleBlur} variant="default" size="sm">
                <Check className="h-4 w-4 mr-2" />
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div onDoubleClick={handleEdit}>
            <div className="font-bold">{data.title}</div>
            <div>{data.content}</div>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      {['top', 'right', 'bottom', 'left'].map((position) => (
        <div
          key={position}
          className={`absolute ${
            position === 'top'
              ? '-top-4 left-1/2 transform -translate-x-1/2'
              : position === 'right'
              ? 'top-1/2 -right-4 transform -translate-y-1/2'
              : position === 'bottom'
              ? '-bottom-4 left-1/2 transform -translate-x-1/2'
              : 'top-1/2 -left-4 transform -translate-y-1/2'
          } opacity-0 hover:opacity-100 transition-opacity`}
        >
          <Button
            size="sm"
            variant="outline"
            className="rounded-full p-1"
            onClick={() => handleAddNode(position as 'top' | 'right' | 'bottom' | 'left')}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};

const nodeTypes = {
  customNode: CustomNode,
};

const initialNodes: Node<CustomNodeData>[] = [
  {
    id: '1',
    type: 'customNode',
    data: { title: 'Main Idea', content: 'Start your mind map here', parents: [], children: [] },
    position: { x: 250, y: 0 },
  },
];

function MindMapContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { project } = useReactFlow();
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isWriteDialogOpen, setIsWriteDialogOpen] = useState(false);
  const [writtenContent, setWrittenContent] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('MediaDevices API not supported.');
      return;
    }
  
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
  
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
  
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioUpload(audioBlob);
      };
  
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };  

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRecording = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const processBackendNodes = (backendNodes: any[]) => {
    const newNodes: Node<CustomNodeData>[] = [];
    const newEdgesMap = new Map<string, Edge>();
    const nodeMap = new Map<string, Node<CustomNodeData>>();
  
    backendNodes.forEach((node) => {
      const parents = node.parents
        ? node.parents
            .split(',')
            .map((id: string) => id.trim())
            .filter((id: string) => id.length > 0)
        : [];
      const children = node.children
        ? node.children
            .split(',')
            .map((id: string) => id.trim())
            .filter((id: string) => id.length > 0)
        : [];
  
      const reactFlowNode: Node<CustomNodeData> = {
        id: node.id,
        type: 'customNode',
        data: {
          title: node.title,
          content: node.content,
          parents,
          children,
        },
        position: { x: 0, y: 0 },
      };
      newNodes.push(reactFlowNode);
      nodeMap.set(node.id, reactFlowNode);
    });
  
    newNodes.forEach((node) => {
      const { id, data } = node;
      data.parents.forEach((parentId) => {
        const edgeId = `e${parentId}-${id}`;
        if (!newEdgesMap.has(edgeId)) {
          newEdgesMap.set(edgeId, {
            id: edgeId,
            source: parentId,
            target: id,
          });
        }
      });
  
      data.children.forEach((childId) => {
        const edgeId = `e${id}-${childId}`;
        if (!newEdgesMap.has(edgeId)) {
          newEdgesMap.set(edgeId, {
            id: edgeId,
            source: id,
            target: childId,
          });
        }
      });
    });
  
    const positionedNodes = positionNodes(newNodes, nodeMap);
  
    const newEdges = Array.from(newEdgesMap.values());
  
    return { newNodes: positionedNodes, newEdges };
  };

  const positionNodes = (
    nodes: Node<CustomNodeData>[],
    nodeMap: Map<string, Node<CustomNodeData>>
  ) => {
    const positionedNodes: Node<CustomNodeData>[] = [];
    const visited = new Set<string>();
  
    const positionNode = (nodeId: string, depth: number, index: number) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
  
      const node = nodeMap.get(nodeId);
      if (node) {
        node.position = {
          x: depth * 200,
          y: index * 100,
        };
        positionedNodes.push(node);
  
        let childIndex = 0;
        node.data.children.forEach((childId) => {
          positionNode(childId, depth + 1, index + childIndex);
          childIndex += 1;
        });
      }
    };
  
    nodes.forEach((node) => {
      if (node.data.parents.length === 0) {
        positionNode(node.id, 0, positionedNodes.length);
      }
    });
  
    nodes.forEach((node) => {
      if (!visited.has(node.id)) {
        positionNode(node.id, 0, positionedNodes.length);
      }
    });
  
    return positionedNodes;
  };
  
  const handleAudioUpload = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'recording.webm');

    try {
      const response = await fetch('http://127.0.0.1:5000/process_audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.error('Failed to upload audio');
        return;
      }

      const data = await response.json();
      const nodesFromBackend = data.nodes;
      console.log(nodesFromBackend);

      const { newNodes, newEdges } = processBackendNodes(nodesFromBackend);

      setNodes((nds) => [...nds, ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);
    } catch (err) {
      console.error('Error uploading audio:', err);
    }
  };

  const onConnect = useCallback(
    (params: Edge | Connection) => {
      setEdges((eds) => addEdge(params, eds));
      if (params.source && params.target) {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === params.source && !node.data.children.includes(params.target as string)) {
              return {
                ...node,
                data: { ...node.data, children: [...node.data.children, params.target as string] },
              };
            }
            if (node.id === params.target && !node.data.parents.includes(params.source as string)) {
              return {
                ...node,
                data:  { ...node.data, parents:  [...node.data.parents, params.source as string] },
              };
            }
            return node;
          })
        );
      }
    },
    [setEdges, setNodes]
  );

  const onSelectionChange = useCallback((elements: { nodes: Node[]; edges: Edge[] }) => {
    setSelectedNodes(elements.nodes.map((node) => node.id));
  }, []);

  const handleSuggest = useCallback(async () => {
    if (selectedNodes.length === 0) {
      console.log('No nodes selected for suggestion');
      return;
    }

    const selectedNodesData = nodes
      .filter((node) => selectedNodes.includes(node.id))
      .map((node) => ({
        id: node.id,
        title: node.data.title,
        content: node.data.content,
      }));

    try {
      const response = await fetch('http://127.0.0.1:5000/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nodes: selectedNodesData }),
      });

      if (!response.ok) {
        console.error('Failed to get suggestion');
        return;
      }

      const data = await response.json();
      const suggestedNode = data.node;

      // Update the id and position of the suggested node
      const newNodeId = `suggested-${Date.now()}`;
      const newPosition = { x: Math.random() * 500, y: Math.random() * 500 };

      const newNode: Node<CustomNodeData> = {
        id: newNodeId,
        type: 'customNode',
        data: {
          title: suggestedNode.title,
          content: suggestedNode.content,
          parents: selectedNodes,
          children: [],
        },
        position: newPosition,
      };

      // Add the new node and update parent nodes
      setNodes((nds) => [
        ...nds.map((node) => {
          if (selectedNodes.includes(node.id)) {
            return {
              ...node,
              data: {
                ...node.data,
                children: [...node.data.children, newNodeId],
              },
            };
          }
          return node;
        }),
        newNode,
      ]);

      // Add new edges
      setEdges((eds) => [
        ...eds,
        ...selectedNodes.map((parentId) => ({
          id: `e${parentId}-${newNodeId}`,
          source: parentId,
          target: newNodeId,
        })),
      ]);

    } catch (err) {
      console.error('Error getting suggestion:', err);
    }
  }, [selectedNodes, nodes, setNodes, setEdges]);

  const handleWrite = useCallback(() => {
    const allNodesData = nodes.map((node) => ({
      id: node.id,
      title: node.data.title,
      content: node.data.content,
      parents: node.data.parents,
      children: node.data.children,
    }));

    // Placeholder response
    const placeholderContent = `This is a placeholder response for the write function.

Based on your mind map, here's a summary of the content:

${allNodesData.map(node => `- ${node.title}: ${node.content}`).join('\n')}

In a full implementation, this content would be generated by the backend based on the structure and content of your mind map.`;

    setWrittenContent(placeholderContent);
    setIsWriteDialogOpen(true);
  }, [nodes]);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        proOptions={{ hideAttribution: true }}
      >
        <Controls />
        <Background />
        <MiniMap position="top-right"/>
      </ReactFlow>
      <div className="absolute bottom-4 right-4 z-10 flex gap-2">
        <Button onClick={handleRecording}>
          {isRecording ? (
            <StopCircle className="mr-2 h-4 w-4" />
          ) : (
            <Mic className="mr-2 h-4 w-4" />
          )}
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Button>
        <Button onClick={handleSuggest} disabled={selectedNodes.length === 0}>
          <Lightbulb className="mr-2 h-4 w-4" />
          Suggest
        </Button>
        <Button onClick={handleWrite}>
          <PenTool className="mr-2 h-4 w-4" />
          Write
        </Button>
      </div>
      <Dialog open={isWriteDialogOpen} onOpenChange={setIsWriteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Written Content</DialogTitle>
            <DialogDescription>
              Here's the written content based on your mind map:
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            <p>{writtenContent}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MindMap() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlowProvider>
        <MindMapContent />
      </ReactFlowProvider>
    </div>
  );
}