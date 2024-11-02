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
import {
  Mic,
  StopCircle,
  Plus,
  Trash2,
  Check,
  Lightbulb,
  PenTool,
  X,
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "./Sidebar"

interface CustomNodeData {
  title: string;
  content: string;
  parents: string[];
  children: string[];
  depth: number;
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
        data: { title: 'New Node', content: '', parents: [id], children: [], depth: data.depth + 1 },
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
    [id, getNode, setNodes, setEdges, data.depth]
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
    data: { title: 'Main Idea', content: 'Start your mind map here', parents: [], children: [], depth: 0 },
    position: { x: 250, y: 0 },
  },
];

function MindMapContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { project } = useReactFlow();
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [writtenContent, setWrittenContent] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mapTitle, setMapTitle] = useState<string>('Untitled Mind Map');
  const [previousTitle, setPreviousTitle] = useState<string>('Untitled Mind Map');

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [essayTitle, setEssayTitle] = useState('');
  const [essayContent, setEssayContent] = useState('');

  const [isRecordingLoading, setIsRecordingLoading] = useState(false);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const [isWriteLoading, setIsWriteLoading] = useState(false);
  const { toast } = useToast();

  const handleTitleBlur = () => {
    if (mapTitle.trim() === '') {
      setMapTitle(previousTitle);
    } else {
      setPreviousTitle(mapTitle);
    }
  };

  // Handler for when the map title changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMapTitle(e.target.value);
  };

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
      setIsRecordingLoading(false);
      toast({
        title: "Recording started",
        description: "Your audio is now being recorded.",
      });
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setIsRecordingLoading(false);
      toast({
        title: "Recording failed",
        description: "Unable to access the microphone. Please check your permissions.",
        variant: "destructive",
      });
    } finally {
      setIsRecordingLoading(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setIsRecordingLoading(true);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({
        title: "Recording stopped",
        description: "Your audio is being processed.",
      });
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
    const levelMap = new Map<number, Node<CustomNodeData>[]>();
    
    // First pass: Create nodes and build the node map
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
          depth: 0, // Will be calculated in the next pass
        },
        position: { x: 0, y: 0 },
      };
      newNodes.push(reactFlowNode);
      nodeMap.set(node.id, reactFlowNode);
    });
  
    // Second pass: Create edges and calculate depths
    newNodes.forEach((node) => {
      const { id, data } = node;
      
      // Calculate node depth based on longest path from root
      const calculateDepth = (nodeId: string, visited = new Set<string>()): number => {
        if (visited.has(nodeId)) return 0;
        visited.add(nodeId);
        
        const currentNode = nodeMap.get(nodeId);
        if (!currentNode) return 0;
        
        if (currentNode.data.parents.length === 0) return 0;
        
        const parentDepths = currentNode.data.parents.map(parentId => 
          calculateDepth(parentId, visited)
        );
        
        return 1 + Math.max(...parentDepths, 0);
      };
  
      const depth = calculateDepth(id);
      node.data.depth = depth;
      
      // Group nodes by their depth level
      if (!levelMap.has(depth)) {
        levelMap.set(depth, []);
      }
      levelMap.get(depth)?.push(node);
  
      // Create edges
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
    });
  
    // Position nodes based on their depth and relative position within their level
    const NODE_HORIZONTAL_SPACING = 300; // Space between nodes at the same level
    const NODE_VERTICAL_SPACING = 150;   // Space between levels
    const START_X = 100;                 // Starting X position
    const START_Y = 100;                 // Starting Y position
  
    levelMap.forEach((nodes, level) => {
      const levelWidth = nodes.length * NODE_HORIZONTAL_SPACING;
      nodes.forEach((node, index) => {
        // Center nodes horizontally within their level
        const x = START_X + (index * NODE_HORIZONTAL_SPACING) - (levelWidth / 2) + (NODE_HORIZONTAL_SPACING / 2);
        const y = START_Y + (level * NODE_VERTICAL_SPACING);
        
        node.position = { x, y };
      });
    });
  
    // Apply slight position adjustments to minimize edge crossings
    const optimizePositions = () => {
      levelMap.forEach((nodes) => {
        nodes.forEach((node) => {
          if (node.data.parents.length > 0) {
            // Calculate the average X position of parents
            const parentXPositions = node.data.parents
              .map(parentId => nodeMap.get(parentId)?.position.x ?? 0);
            const avgParentX = parentXPositions.reduce((a, b) => a + b, 0) / parentXPositions.length;
            
            // Move node slightly towards average parent position to reduce edge crossings
            node.position.x = node.position.x * 0.7 + avgParentX * 0.3;
          }
        });
      });
    };
  
    // Run position optimization multiple times for better results
    for (let i = 0; i < 3; i++) {
      optimizePositions();
    }
  
    const newEdges = Array.from(newEdgesMap.values());
    return { newNodes, newEdges };
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
      setIsRecordingLoading(false);
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
                data: { ...node.data, parents: [...node.data.parents, params.source as string] },
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
      toast({
        title: "No nodes selected",
        description: "Please select at least one node to get a suggestion.",
        variant: "destructive",
      });
      return;
    }

    setIsSuggestLoading(true);
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
        throw new Error('Failed to get suggestion');
      }

      const data = await response.json();
      const suggestedNode = data;

      console.log(suggestedNode);

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
          depth: Math.max(...selectedNodes.map(id => nodes.find(n => n.id === id)?.data.depth ?? 0)) + 1,
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

      toast({
        title: "Suggestion added",
        description: "A new node has been created based on your selection.",
      });
    } catch (err) {
      console.error('Error getting suggestion:', err);
      toast({
        title: "Suggestion failed",
        description: "Unable to generate a suggestion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSuggestLoading(false);
    }
  }, [selectedNodes, nodes, setNodes, setEdges, toast]);

  const handleWrite = useCallback(async () => {
    setIsWriteLoading(true);
    const allNodesData = nodes.map((node) => ({
      id: node.id,
      title: node.data.title,
      content: node.data.content,
      parents: node.data.parents,
      children: node.data.children,
      depth: node.data.depth,
    }));

    try {
      const response = await fetch('http://127.0.0.1:5000/write', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nodes: allNodesData }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate essay');
      }

      const data = await response.json();
      setEssayTitle(data.title);
      setEssayContent(data.content);
      setIsSidebarOpen(true);
    } catch (err) {
      console.error('Error generating essay:', err);
      toast({
        title: "Essay generation failed",
        description: "Unable to generate the essay. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsWriteLoading(false);
    }
  }, [nodes, toast]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="w-full h-screen flex flex-col">
        {/* Top Bar */}
        <div className="relative flex items-center justify-between p-4 bg-background border-b">
          {/* Left Side (Empty or can be used for future icons) */}
          <SidebarTrigger className="w-10 h-10" variant={'outline'}/>

          {/* Center: Editable Map Title */}
          <div
            className="absolute left-1/2 transform -translate-x-1/2"
            style={{ maxWidth: 'calc(100%)' }} // Adjust to prevent overlap
          >
            <Input
              className="text-center text-lg font-bold bg-transparent border-none outline-none p-0 m-0"
              style={{
                width: 'auto',
                minWidth: '50px',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                padding: '10px',
              }}
              value={mapTitle}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              title={mapTitle} // Shows full title on hover
            />
          </div>

          {/* Right Side: Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleRecording}
              disabled={isRecordingLoading}
              className="relative overflow-hidden"
            >
              {isRecordingLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-primary">
                  <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin"></div>
                </div>
              ) : isRecording ? (
                <>
                  <StopCircle className="mr-2 h-4 w-4 animate-pulse" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Start Recording
                </>
              )}
            </Button>
            <Button
              onClick={handleSuggest}
              disabled={selectedNodes.length === 0 || isSuggestLoading}
              className="relative overflow-hidden"
            >
              {isSuggestLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-primary">
                  <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Suggest
                </>
              )}
            </Button>
            <Button
              onClick={handleWrite}
              disabled={isWriteLoading}
              className="relative overflow-hidden"
            >
              {isWriteLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-primary">
                  <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  <PenTool className="mr-2 h-4 w-4" />
                  Write
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="flex-grow overflow-hidden flex">
          <div className={`flex-grow transition-all duration-300 ${isSidebarOpen ? 'mr-64' : ''}`}>
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
              <MiniMap position="bottom-right" />
            </ReactFlow>
          </div>
          <div
            className={`fixed top-0 right-0 h-full w-96 bg-white shadow-lg transform transition-transform duration-300 ${
              isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Generated Essay</h2>
                <Button variant="outline" size="sm" onClick={() => setIsSidebarOpen(false)}>
                  <X className="h-6 w-6 text-black" />
                </Button>
              </div>
              <Textarea
                value={essayTitle}
                onChange={(e) => setEssayTitle(e.target.value)}
                className="mb-4 font-semibold text-xl resize-none overflow-auto h-auto"
                placeholder="Essay Title"
                rows={1}
                onInput={(e) => {
                  e.currentTarget.style.height = 'auto';
                  e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                }}
              />
              <Textarea
                value={essayContent}
                onChange={(e) => setEssayContent(e.target.value)}
                className="w-full h-[calc(100vh-200px)]"
                placeholder="Essay Content"
              />
              <p className="text-xs text-gray-500 mt-2">
                This write feature is intended to help you understand and organize the ideas from your mind map. It should not be used as a substitute for your own creative writing and thought.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function MindMap() {
  return (
    <div className="w-full h-full">
      <ReactFlowProvider>
        <MindMapContent />
      </ReactFlowProvider>
    </div>
  );
}
