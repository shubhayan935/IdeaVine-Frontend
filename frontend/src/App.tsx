'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
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
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mic, StopCircle, Plus, Trash2, Check } from 'lucide-react'
import useSpeechRecognition from './useSpeechRecognition'

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
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    hasRecognitionSupport,
  } = useSpeechRecognition();
  const { project } = useReactFlow();

  const onConnect = useCallback(
    (params: Edge | Connection) => {
      setEdges((eds) => addEdge(params, eds));
      if (params.source && params.target) {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === params.source) {
              return {
                ...node,
                data: { ...node.data, children: [...node.data.children, params.target as string] },
              };
            }
            if (node.id === params.target) {
              return {
                ...node,
                data: { ...node.data, parents: [...node.data.parents, params.source] },
              };
            }
            return node;
          })
        );
      }
    },
    [setEdges, setNodes]
  );

  const handleRecording = () => {
    if (!isListening) {
      startListening();
    } else {
      stopListening();
    }
  };

  useEffect(() => {
    console.log(nodes);
  })

  useEffect(() => {
    if (transcript) {
      const viewportCenter = project({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });

      const newNode: Node<CustomNodeData> = {
        id: `node-${Date.now()}`,
        type: 'customNode',
        data: { title: transcript, content: '', parents: [], children: [] },
        position: viewportCenter,
      };
      setNodes((nds) => [...nds, newNode]);
    }
  }, [transcript, setNodes, project]);

  if (!hasRecognitionSupport) {
    return (
      <div className="p-4">
        <p className="text-red-500 mb-2">Your browser does not support speech recognition.</p>
        <p>Please use a modern browser like Chrome or Firefox, or manually add nodes using the interface.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        proOptions={{ hideAttribution: true }}
      >
        <Controls />
        <Background />
        {/* <MiniMap /> */}
      </ReactFlow>
      <div className="absolute bottom-4 right-4 z-10">
        <Button onClick={handleRecording}>
          {isListening ? (
            <StopCircle className="mr-2 h-4 w-4" />
          ) : (
            <Mic className="mr-2 h-4 w-4" />
          )}
          {isListening ? "Stop Recording" : "Start Recording"}
        </Button>
      </div>
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