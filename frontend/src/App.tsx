'use client';

import React, { useEffect, useState, useCallback, useRef, KeyboardEvent } from 'react';
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
import { Mic, StopCircle, Plus, Trash2, Check, Lightbulb, PenTool, LayoutGrid, List, X, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from './RichTextEditor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";

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
  const [viewMode, setViewMode] = useState<'mindmap' | 'bullet'>('mindmap');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [essayTitle, setEssayTitle] = useState('');
  const [essayContent, setEssayContent] = useState('');

  // Typesetting state
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('sans-serif');
  const [textAlign, setTextAlign] = useState('left');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  // Rich text editing refs
  const editorRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [isRecordingLoading, setIsRecordingLoading] = useState(false);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const [isWriteLoading, setIsWriteLoading] = useState(false);
  const { toast } = useToast();

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('MediaDevices API not supported.');
      return;
    }

    // setIsRecordingLoading(true);
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
      // console.log("recording loading true");
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
          depth: parents.length > 0 ? 1 : 0,
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
        node.data.depth = depth;
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

  const handleNodeChange = useCallback((nodeId: string, field: 'title' | 'content', value: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, [field]: value } };
        }
        return node;
      })
    );
  }, [setNodes]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>, nodeId: string, depth: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const newNodeId = `node-${Date.now()}`;
      const parentNode = nodes.find(n => n.id === nodeId);
      if (!parentNode) return;

      setNodes((nds) => [
        ...nds,
        {
          id: newNodeId,
          type: 'customNode',
          data: { title: '', content: '', parents: [parentNode.data.parents[0] || ''], children: [], depth: parentNode.data.depth },
          position: { x: 0, y: 0 },
        },
      ]);
      if (parentNode.data.parents[0]) {
        setEdges((eds) => [...eds, { id: `e${parentNode.data.parents[0]}-${newNodeId}`, source: parentNode.data.parents[0], target: newNodeId }]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Unindent
        setNodes((nds) => {
          const currentNode = nds.find((n) => n.id === nodeId);
          if (!currentNode || currentNode.data.parents.length === 0) return nds;

          const parentId = currentNode.data.parents[0];
          const grandparentId = nds.find((n) => n.id === parentId)?.data.parents[0];

          return nds.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  parents: grandparentId ? [grandparentId] : [],
                  depth: Math.max(node.data.depth - 1, 0),
                },
              };
            }
            if (node.id === parentId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  children: node.data.children.filter((id) => id !== nodeId),
                },
              };
            }
            if (node.id === grandparentId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  children: [...node.data.children, nodeId],
                },
              };
            }
            return node;
          });
        });

        setEdges((eds) => {
          const parentEdge = eds.find((e) => e.target === nodeId);
          if (!parentEdge) return eds;

          const grandparentEdge = eds.find((e) => e.target === parentEdge.source);
          if (!grandparentEdge) return eds.filter((e) => e.id !== parentEdge.id);

          return [
            ...eds.filter((e) => e.id !== parentEdge.id),
            { id: `e${grandparentEdge.source}-${nodeId}`, source: grandparentEdge.source, target: nodeId },
          ];
        });
      } else {
        // Indent
        setNodes((nds) => {
          const currentNodeIndex = nds.findIndex((n) => n.id === nodeId);
          if (currentNodeIndex <= 0) return nds;

          const previousSibling = nds[currentNodeIndex - 1];

          return nds.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  parents: [previousSibling.id],
                  depth: previousSibling.data.depth + 1,
                },
              };
            }
            if (node.id === previousSibling.id) {
              return {
                ...node,
                data: {
                  ...node.data,
                  children: [...node.data.children, nodeId],
                },
              };
            }
            return node;
          });
        });

        setEdges((eds) => [
          ...eds.filter((e) => e.target !== nodeId),
          { id: `e${previousSibling.id}-${nodeId}`, source: previousSibling.id, target: nodeId },
        ]);
      }
    }
  }, [nodes, setNodes, setEdges]);

  const applyTextFormatting = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  const renderBulletView = () => {
    const renderNode = (node: Node<CustomNodeData>, depth: number = 0) => {
      return (
        <div key={node.id} className="flex flex-col">
          <div
            className="flex items-center py-1"
            style={{ paddingLeft: `${depth * 20}px` }}
          >
            <div
              contentEditable
              ref={(el) => (editorRefs.current[node.id] = el)}
              suppressContentEditableWarning
              className="outline-none border-none bg-transparent flex-grow"
              style={{
                fontSize: `${fontSize}px`,
                fontFamily,
                textAlign,
                fontWeight: isBold ? 'bold' : 'normal',
                fontStyle: isItalic ? 'italic' : 'normal',
                textDecoration: isUnderline ? 'underline' : 'none',
              }}
              onBlur={(e) => handleNodeChange(node.id, 'title', e.currentTarget.innerHTML)}
              onKeyDown={(e) => handleKeyDown(e, node.id, depth)}
              dangerouslySetInnerHTML={{ __html: node.data.title }}
            />
          </div>
          {node.data.children.map((childId) => {
            const childNode = nodes.find((n) => n.id === childId);
            return childNode ? renderNode(childNode, depth + 1) : null;
          })}
        </div>
      );
    };

    const rootNodes = nodes.filter((node) => node.data.parents.length === 0);

    return (
      <div className="p-4 bg-white rounded-md shadow-md max-h-[calc(100vh-100px)] overflow-auto w-full">
        <div className="mb-4 flex flex-wrap gap-2">
          <Select onValueChange={(value) => setFontFamily(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Font Family" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sans-serif">Sans-serif</SelectItem>
              <SelectItem value="serif">Serif</SelectItem>
              <SelectItem value="monospace">Monospace</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2">
            <label>Font Size:</label>
            <Slider
              min={8}
              max={72}
              step={1}
              value={[fontSize]}
              onValueChange={(value) => setFontSize(value[0])}
              className="w-[100px]"
            />
            <span>{fontSize}px</span>
          </div>
          <ToggleGroup type="multiple" variant="outline">
            <ToggleGroupItem value="bold" aria-label="Toggle bold" onClick={() => { setIsBold(!isBold); applyTextFormatting('bold'); }}>
              <Bold className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Toggle italic" onClick={() => { setIsItalic(!isItalic); applyTextFormatting('italic'); }}>
              <Italic className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="underline" aria-label="Toggle underline" onClick={() => { setIsUnderline(!isUnderline); applyTextFormatting('underline'); }}>
              <Underline className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup type="single" value={textAlign} onValueChange={(value) => { if (value) { setTextAlign(value); applyTextFormatting('justify' + value); } }}>
            <ToggleGroupItem value="left" aria-label="Align left">
              <AlignLeft className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Align center">
              <AlignCenter className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Align right">
              <AlignRight className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="justify" aria-label="Justify">
              <AlignJustify className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        {rootNodes.map((node) => renderNode(node))}
      </div>
    );
  };

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="flex justify-between items-center p-4 bg-background border-b">
        <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'mindmap' | 'bullet')}>
          <ToggleGroupItem value="mindmap" aria-label="Switch to mind map view">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="bullet" aria-label="Switch to bullet point view">
            <List className="h-4 w-4" /> 
            {/* Commented the bullet view / text editor */}
          </ToggleGroupItem>
        </ToggleGroup>
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
          {viewMode === 'mindmap' ? (
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
              <MiniMap position="bottom-right"/>
            </ReactFlow>
          ) : (
            <RichTextEditor />
          )}
        </div>
        <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-lg transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
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
