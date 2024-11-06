// src/components/MindMap.tsx

import React, { useEffect, useState, useCallback, useRef } from 'react';
import dagre from 'dagre';
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
  useOnSelectionChange,
  Panel,
  ReactFlowInstance,
  MarkerType,
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
  Search,
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./Sidebar";
import debounce from 'lodash.debounce'; // Import debounce
import { v4 as uuidv4 } from 'uuid'; // Import UUID for generating UID
import { useUserInfo } from './context/UserContext'; // Import useUserInfo
import { useParams, useNavigate } from 'react-router-dom'; // Import useParams and useNavigate
import { deriveEdgesFromNodes } from './utils/deriveEdges'; // Import helper function

// Define the structure of your custom node data
interface CustomNodeData {
  title: string;
  content: string;
  parents: string[];
  children: string[];
  depth: number;
  isHighlighted?: boolean;
}

// Define the props for your custom node component
interface CustomNodeProps extends NodeProps {
  data: CustomNodeData;
  isConnectable: boolean;
  selected: boolean;
}

// Custom Node Component
const CustomNode = ({ id, data, isConnectable, selected }: CustomNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nodeData, setNodeData] = useState<CustomNodeData>(data);
  const { setNodes, setEdges, getNode } = useReactFlow();
  const nodeRef = useRef<HTMLDivElement>(null);

  // Remove categorization refs and functions since we're using full-state updates
  // Removed: nodesToAddRef, nodesToUpdateRef, nodesToDeleteRef
  // Removed: addNodeToAddList, addNodeToUpdateList, addNodeToDeleteList

  // Handle double-click to edit the node
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

  // Handle blur (when editing is done)
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
    // No need to categorize updates; full-state sync handles it
  }, [id, nodeData, setNodes]);

  // Handle node deletion
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

    // No need to categorize deletions; full-state sync handles it
  }, [id, setNodes, setEdges]);

  // Handle adding a new node in a specific direction
  const handleAddNode = useCallback(
    (position: 'top' | 'bottom' | 'left' | 'right') => {
      const parentNode = getNode(id);
      if (!parentNode) return;

      const newNodeId = uuidv4(); // Use UUID for node ID

      const newNode: Node<CustomNodeData> = {
        id: newNodeId,
        type: 'customNode',
        data: { title: 'New Node', content: '', parents: [id], children: [], depth: data.depth + 1 },
        position: {
          x: parentNode.position.x + (position === 'left' ? -200 : position === 'right' ? 200 : 0),
          y: parentNode.position.y + (position === 'bottom' ? 100 : position === 'top' ? -100 : 0),
        },
      };

      setNodes((nds) => [...nds, newNode]);

      // Update parent node's children
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              data: { ...node.data, children: [...node.data.children, newNodeId] },
            };
          }
          return node;
        })
      );

      // Derive and add the new edge
      const newEdge: Edge = {
        id: uuidv4(),
        source: id,
        target: newNodeId,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };

      setEdges((eds) => addEdge(newEdge, eds));

      // No need to categorize additions; full-state sync handles it
    },
    [id, data.depth, getNode, setNodes, setEdges]
  );

  // Handle click outside to finish editing
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
      {/* Handles for connections */}
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 ${
                        selected ? 'border-primary' : 'border-gray-200'
                      } ${
                        data.isHighlighted ? 'bg-yellow-100' : ''
                      } transition-[background-color] duration-1000`}>
        {isEditing ? (
          // Editing Mode
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
          // Display Mode
          <div onDoubleClick={handleEdit}>
            <div className="font-bold">{data.title}</div>
            <div>{data.content}</div>
          </div>
        )}
      </div>
      {/* More Handles */}
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Left} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
      {/* Add Node Buttons */}
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

// Define the node types for ReactFlow
const nodeTypes = {
  customNode: CustomNode,
};

// Main MindMapContent Component
function MindMapContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView, setCenter, getNode } = useReactFlow();
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mapTitle, setMapTitle] = useState<string>('Untitled Mind Map');
  const [previousTitle, setPreviousTitle] = useState<string>('Untitled Mind Map');
  const [layoutOnNextRender, setLayoutOnNextRender] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [essayTitle, setEssayTitle] = useState('');
  const [essayContent, setEssayContent] = useState('');

  const [isRecordingLoading, setIsRecordingLoading] = useState(false);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const [isWriteLoading, setIsWriteLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');

  const { userEmail } = useUserInfo(); // Access userEmail from context
  const { mindmap_id } = useParams<{ mindmap_id: string }>(); // Extract mindmap_id from URL
  const navigate = useNavigate();

  // Remove categorization refs and functions since we're using full-state updates
  // Removed: nodesToAddRef, nodesToUpdateRef, nodesToDeleteRef
  // Removed: addNodeToAddList, addNodeToUpdateList, addNodeToDeleteList

  // Fetch or create mindmap based on URL
  useEffect(() => {
    const fetchOrCreateMindmap = async () => {
      if (mindmap_id) {
        // Fetch existing mindmap nodes
        try {
          console.log("Fetching your mindmap nodes...");
          const response = await fetch(`http://127.0.0.1:5000/mindmaps/${mindmap_id}/nodes`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              // Include authentication headers if required by backend
              // 'Authorization': `Bearer ${token}`
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch mindmap nodes');
          }

          const data = await response.json();
          console.log("Fetched nodes: ", data);
          const fetchedNodes: Node<CustomNodeData>[] = data.nodes.map((node: any) => ({
            id: node._id,
            type: 'customNode',
            data: {
              title: node.title,
              content: node.content,
              parents: node.parents,
              children: node.children,
              depth: node.depth,
            },
            position: {
              x: Number(node.position.x),
              y: Number(node.position.y),
            },
          }));

          // Derive edges from nodes
          const derivedEdges = deriveEdgesFromNodes(fetchedNodes);

          setNodes(fetchedNodes);
          setEdges(derivedEdges);
          setMapTitle(data.mindmap.title || 'Untitled Mind Map');
          setPreviousTitle(data.mindmap.title || 'Untitled Mind Map');

          // Fit the view to the nodes
          window.requestAnimationFrame(() => {
            fitView({ padding: 0.2, maxZoom: 0.8 });
          });

          console.log('Fetched Mindmap Nodes:', data);
        } catch (err: any) {
          console.error("Error fetching mindmap nodes:", err);
          toast({
            title: "Error",
            description: err.message || "An error occurred while fetching the mindmap.",
            variant: "destructive",
          });
          navigate('/'); // Redirect to home or another appropriate page
        }
      } else {
        // Create a new mindmap
        if (isCreating) return; // Prevent multiple creations or ongoing operations

        try {
          setIsCreating(true);
          const newMindmapId = uuidv4(); // Generate a new UUID

          // Define initial nodes
          const initialNodesData = [
            {
              id: '1',
              title: 'Main Idea',
              content: 'Start your mind map here',
              parents: [],
              children: [],
              depth: 0,
              position: { x: 250, y: 250 },
            },
          ];

          const fetchedNodes: Node<CustomNodeData>[] = initialNodesData.map((node: any) => ({
            id: node.id, // Use the provided ID ('1') or consider using UUIDs
            type: 'customNode',
            data: {
              title: node.title,
              content: node.content,
              parents: node.parents,
              children: node.children,
              depth: node.depth,
            },
            position: {
              x: Number(node.position.x),
              y: Number(node.position.y),
            },
          }));

          // Derive edges (initially empty since there's only one node)
          const derivedEdges = deriveEdgesFromNodes(fetchedNodes);

          // Send a request to backend to create the new mindmap
          const response = await fetch(`http://127.0.0.1:5000/mindmaps`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              mindmap_id: newMindmapId,
              user_email: userEmail,
              title: 'Untitled Mind Map',
              nodes: initialNodesData,
              edges: [],
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create mindmap');
          }

          // Optionally, get the created mindmap data from response
          const data = await response.json();
          console.log('Created Mindmap:', data);

          // Initialize state with the new mindmap
          setNodes(fetchedNodes);
          setEdges(derivedEdges);
          setMapTitle(data.title || 'Untitled Mind Map');
          setPreviousTitle(data.title || 'Untitled Mind Map');

          // Navigate to the new mindmap's URL
          navigate(`/mindmap/${newMindmapId}`);
        } catch (err: any) {
          console.error("Error creating mindmap:", err);
          toast({
            title: "Error",
            description: err.message || "An error occurred while creating the mindmap.",
            variant: "destructive",
          });
        } finally {
          setIsCreating(false);
        }
      }
    };

    fetchOrCreateMindmap();
  }, [mindmap_id, isCreating, navigate, fitView, setNodes, setEdges, toast, userEmail]);

  // Define the updateMindmapDB function for full-state synchronization
  const updateMindmapDB = useCallback(async () => {
    if (mindmap_id) {
      try {
        console.log("Updating Database for Mindmap ID: ", mindmap_id);

        // Prepare the payload with full state
        const payload = {
          title: mapTitle,
          nodes: nodes.map((node) => ({
            id: node.id,
            title: node.data.title,
            content: node.data.content,
            parents: node.data.parents,
            children: node.data.children,
            depth: node.data.depth,
            position: node.position,
          })),
          edges: edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: edge.type,
            markerEnd: edge.markerEnd,
          })),
        };

        console.log('Payload for full-state update:', payload);

        const response = await fetch(`http://127.0.0.1:5000/mindmaps/${mindmap_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update mindmap');
        }

        const data = await response.json();
        console.log('Mindmap updated successfully:', data);

        // Optionally, you can handle any response data here
      } catch (error: any) {
        console.error(error);
        // Show an error toast
        toast({
          title: "Update Failed",
          description: error.message || "There was an error saving your mindmap. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // Handle case where mindmap_id is not present
      console.log("No mindmap_id provided. Skipping update.");
    }
  }, [mindmap_id, mapTitle, nodes, edges, toast]);

  // Implement periodic full-state updates every 10 seconds
  useEffect(() => {
    if (mindmap_id && userEmail) { // Ensure mindmap_id and userEmail are set
      const interval = setInterval(() => {
        updateMindmapDB();
      }, 10000); // 10,000 milliseconds = 10 seconds

      // Initial immediate update
      updateMindmapDB();

      // Cleanup function to clear interval on unmount
      return () => clearInterval(interval);
    }
  }, [mindmap_id, userEmail, updateMindmapDB]);

  // Remove debouncedUpdateMindmapDB since we're using periodic updates
  // Removed: debouncedUpdateMindmapDB and related useEffect

  // Handle node connections
  const onConnect = useCallback(
    (params: Edge | Connection) => {
      const newEdge: Edge = {
        id: uuidv4(),
        source: params.source,
        target: params.target,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));

      // Update parent and child relationships
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

        // No need to categorize updates; full-state sync handles it
      }
    },
    [setEdges, setNodes]
  );

  // Handle node selection changes
  useOnSelectionChange({
    onChange: ({ nodes }) => {
      setSelectedNodes(nodes.map((node) => node.id));
    },
  });

  // Add a new node manually
  const onAddNode = useCallback(() => {
    const newNodeId = uuidv4(); // Use UUID for node ID
    const newNode: Node<CustomNodeData> = {
      id: newNodeId,
      type: 'customNode',
      data: { title: 'New Node', content: 'Double Click to edit', parents: [], children: [], depth: 0 },
      position: { x: Math.random() * 500, y: Math.random() * 500 },
    };
    setNodes((nds) => [...nds, newNode]);

    // No need to categorize additions; full-state sync handles it
  }, [setNodes]);

  // Auto layout the mind map using Dagre
  const onLayout = useCallback(() => {
    if (!reactFlowInstance.current) return;

    const nodeElements = reactFlowInstance.current.getNodes();
    const edgeElements = reactFlowInstance.current.getEdges();

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'TB' });

    // Add nodes to the dagre graph and get their actual dimensions
    nodeElements.forEach((node) => {
      const nodeElement = document.querySelector(`[data-id="${node.id}"]`);
      if (nodeElement) {
        const { width, height } = nodeElement.getBoundingClientRect();
        dagreGraph.setNode(node.id, { width, height });
      } else {
        // Fallback to default dimensions if the node element is not found
        dagreGraph.setNode(node.id, { width: 172, height: 36 });
      }
    });

    // Add edges to the dagre graph
    edgeElements.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    // Use dagre to calculate the layout
    dagre.layout(dagreGraph);

    // Update node positions based on the dagre layout
    const newNodes = nodeElements.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWithPosition.width / 2,
          y: nodeWithPosition.y - nodeWithPosition.height / 2,
        },
      };
    });

    setNodes(newNodes);

    // Center the view on the new layout
    window.requestAnimationFrame(() => {
      fitView({ padding: 0.2, maxZoom: 0.8 });
    });

    // No need to categorize node updates; full-state sync handles it
  }, [setNodes, fitView]);

  // Handle suggestions (e.g., AI-generated nodes)
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

      console.log('Suggested Node:', suggestedNode);

      // Generate a unique ID for the new node
      const newNodeId = uuidv4(); // Use UUID for node ID
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

      // Add the new node
      setNodes((nds) => [...nds, newNode]);

      // Update parent nodes' children
      setNodes((nds) =>
        nds.map((node) => {
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
        })
      );

      // Derive and add the new edges
      const newEdges: Edge[] = selectedNodes.map((parentId) => ({
        id: uuidv4(),
        source: parentId,
        target: newNodeId,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      }));

      setEdges((eds) => [...eds, ...newEdges]);

      // No need to categorize additions or updates; full-state sync handles it

      toast({
        title: "Suggestion added",
        description: "A new node has been created based on your selection.",
      });

      // Optionally, auto-layout after adding the new node
      setLayoutOnNextRender(true);
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
  }, [selectedNodes, nodes, setNodes, setEdges, toast, getNode]);

  // Handle writing/generating an essay from the mind map
  const handleWrite = useCallback(async () => {
    setIsWriteLoading(true);
    const allNodesData = nodes.map((node) => ({
      id: node.id,
      title: node.data.title,
      content: node.data.content,
      parents: node.data.parents,
      children: node.data.children,
      depth: node.data.depth,
      position: node.position,
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

  // Handle searching for nodes
  const handleSearch = useCallback(() => {
    if (!searchTerm) return;

    const matchingNodes = nodes.filter((node) =>
      node.data.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.data.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (matchingNodes.length > 0) {
      const firstMatch = matchingNodes[0];
      setCenter(firstMatch.position.x, firstMatch.position.y, { zoom: 1.5, duration: 1000 });

      // Highlight matching nodes
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          data: {
            ...node.data,
            isHighlighted: matchingNodes.some((n) => n.id === node.id),
          },
        }))
      );

      // Remove highlight after 3 seconds with fade-away effect
      setTimeout(() => {
        setNodes((nds) =>
          nds.map((node) => ({
            ...node,
            data: {
              ...node.data,
              isHighlighted: false,
            },
          }))
        );
      }, 3000);
    } else {
      toast({
        title: "No matches found",
        description: "Try a different search term.",
        variant: "destructive",
      });
    }
  }, [searchTerm, nodes, setCenter, setNodes, toast]);

  // Initialize ReactFlow instance
  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;

    // Adjust the initial fitView options
    instance.fitView({ padding: 0.2, maxZoom: 0.8 });
  }, []);

  // Handle recording (start/stop)
  const handleRecording = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  // Start recording audio
  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('MediaDevices API not supported.');
      return;
    }

    try {
      setIsRecordingLoading(true);
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
    }
  };

  // Stop recording audio
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

  // Handle audio upload to backend
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
        toast({
          title: "Audio Upload Failed",
          description: "There was an error uploading your audio. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const data = await response.json();
      const nodesFromBackend = data.nodes;
      console.log('Nodes from audio:', nodesFromBackend);

      const { newNodes, newEdges } = processBackendNodes(nodesFromBackend);

      setNodes((nds) => [...nds, ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);
      setIsRecordingLoading(false);

      setLayoutOnNextRender(true);
    } catch (err) {
      console.error('Error uploading audio:', err);
      setIsRecordingLoading(false);
      toast({
        title: "Audio Upload Failed",
        description: "There was an error uploading your audio. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Process nodes received from backend after audio processing or suggestion
  const processBackendNodes = (backendNodes: any[]) => {
    const newNodes: Node<CustomNodeData>[] = [];
    const nodeMap = new Map<string, Node<CustomNodeData>>();
    const levelMap = new Map<number, Node<CustomNodeData>[]>();

    // Generate a unique prefix to avoid ID conflicts
    const uniquePrefix = `audio-${Date.now()}-`;
    const existingNodeIds = new Set(nodes.map((node) => node.id));
    const idMap = new Map<string, string>();

    // First pass: Create new IDs and build idMap
    backendNodes.forEach((node) => {
      const oldId = node.id;
      let newId = uniquePrefix + oldId;

      // Ensure the new ID is unique among existing node IDs
      while (existingNodeIds.has(newId)) {
        newId = uniquePrefix + oldId + '-' + Math.random().toString(36).substr(2, 9);
      }

      idMap.set(oldId, newId);
      existingNodeIds.add(newId);
    });

    // Second pass: Create nodes with new IDs and update parents/children
    backendNodes.forEach((node) => {
      const newId = idMap.get(node.id)!;

      // Map old parent and child IDs to new IDs
      const parents = node.parents
        ? Array.isArray(node.parents)
          ? node.parents.map((pid: string) => idMap.get(pid) || pid)
          : node.parents
              .split(',')
              .map((id: string) => id.trim())
              .filter((id: string) => id.length > 0)
              .map((id: string) => idMap.get(id) || id)
        : [];

      const children = node.children
        ? Array.isArray(node.children)
          ? node.children.map((cid: string) => idMap.get(cid) || cid)
          : node.children
              .split(',')
              .map((id: string) => id.trim())
              .filter((id: string) => id.length > 0)
              .map((id: string) => idMap.get(id) || id)
        : [];

      const reactFlowNode: Node<CustomNodeData> = {
        id: newId,
        type: 'customNode',
        data: {
          title: node.title,
          content: node.content,
          parents,
          children,
          depth: node.depth,
        },
        position: { x: 0, y: 0 },
      };
      newNodes.push(reactFlowNode);
      nodeMap.set(newId, reactFlowNode);
    });

    console.log("New Nodes from Backend:", newNodes);

    // Derive edges from the new nodes
    const derivedEdges = deriveEdgesFromNodes(newNodes);

    console.log('Derived Edges from Backend Nodes:', derivedEdges);

    // No need to categorize additions or updates; full-state sync handles it

    return { newNodes, newEdges: derivedEdges };
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="w-full h-screen flex flex-col">
        {/* Top Bar */}
        <div className="relative flex items-center justify-between p-4 bg-background border-b">
          <SidebarTrigger className="w-10 h-10" variant={'outline'} />
          <div className="absolute left-1/2 transform -translate-x-1/2" style={{ maxWidth: 'calc(100%)' }}>
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
              onChange={(e) => setMapTitle(e.target.value)}
              onBlur={() => {
                if (mapTitle.trim() === '') {
                  setMapTitle(previousTitle);
                } else {
                  setPreviousTitle(mapTitle);
                }
                // No need to trigger an update manually; periodic sync handles it
              }}
              title={mapTitle}
            />
          </div>
          <div className="flex gap-2">
            {/* Recording Button */}
            <Button onClick={handleRecording} disabled={isRecordingLoading} className="relative overflow-hidden">
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
            {/* Suggest Button */}
            <Button onClick={handleSuggest}
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
            {/* Write Button */}
            <Button onClick={handleWrite} disabled={isWriteLoading} className="relative overflow-hidden">
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
        {/* Main Content */}
        <div className="flex-grow overflow-hidden flex">
          {/* ReactFlow Container */}
          <div className={`flex-grow transition-all duration-300 ${isSidebarOpen ? 'mr-96' : ''}`}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              proOptions={{ hideAttribution: true }}
              onInit={onInit}
            >
              <Controls />
              <Background />
              <MiniMap position="bottom-right" />
              <Panel position="top-right">
                <div className="flex gap-2 items-center">
                  {/* Search Input */}
                  <div className="relative w-full">
                    <Input
                      type="text"
                      placeholder="Search nodes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch();
                        }
                      }}
                      className="pr-10 w-full"
                    />
                    <Button
                      onClick={handleSearch}
                      className="absolute inset-y-0 right-0 px-2 items-center text-secondary bg-primary"
                      variant="outline"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* Add Node Button */}
                  <Button onClick={onAddNode}>Add Node</Button>
                  {/* Auto Layout Button */}
                  <Button onClick={onLayout}>Auto Layout</Button>
                </div>
              </Panel>
            </ReactFlow>
          </div>
          {/* Sidebar for Generated Essay */}
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

// Exported MindMap Component wrapped with ReactFlowProvider and React Router hooks
export default function MindMap() {
  return (
    <div className="w-full h-full">
      <ReactFlowProvider>
        <MindMapContent />
      </ReactFlowProvider>
    </div>
  );
}
