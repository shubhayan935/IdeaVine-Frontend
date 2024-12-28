// src/components/MindMap.tsx

import { useEffect, useState, useCallback, useRef, useContext } from "react";
import dagre from "dagre";
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
  XYPosition,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  Menu,
  Leaf,
  LogOut,
  Upload,
  FileUp,
  FileText, 
  Video, 
  Music, 
  Image,
  File,
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { SidebarProvider } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogDescription, } from "@/components/ui/dialog";
import { SidebarUpdateContext } from "./Sidebar";
import { v4 as uuidv4 } from "uuid";
import { useMediaQuery } from "react-responsive";
import { useUserInfo } from "./context/UserContext";
import { ShareDialog } from "./ShareDialog"
import { useParams, useNavigate } from "react-router-dom";
import { deriveEdgesFromNodes } from "./utils/deriveEdges";
import {
  NodeOperationsProvider,
  NodeOperationsContext,
} from "./context/NodeOperationsContext";
import { useClerk } from '@clerk/clerk-react'

// Define the structure of your custom node data
interface CustomNodeData {
  id?: string;
  title: string;
  content: string;
  parents: string[];
  children: string[];
  depth: number;
  isHighlighted?: boolean;
  position?: XYPosition | undefined;
  node_type?: string;
  source?: string;
}

const SourceIndicator: React.FC<{ type: string; source: string }> = ({ source }) => {
  let Icon = Lightbulb;
  let bgColor = 'bg-gray-200';
  let tooltipContent = 'Node source unknown';

  switch (source) {
    case 'audio_transcription':
      Icon = Mic;
      bgColor = 'bg-blue-200';
      tooltipContent = 'Node created from a voice recording';
      break;
    case 'uploaded_audio':
      Icon = Mic;
      bgColor = 'bg-orange-200';
      tooltipContent = 'Node created from uploaded audio';
      break;
    case 'pdf_extraction':
      Icon = FileText;
      bgColor = 'bg-red-200';
      tooltipContent = 'Node created from uploaded PDF';
      break;
    case 'video_analysis':
      Icon = Video;
      bgColor = 'bg-purple-200';
      tooltipContent = 'Node created from uploaded video';
      break;
    case 'image_analysis':
      Icon = Image;
      bgColor = 'bg-green-200';
      tooltipContent = 'Node created from uploaded image';
      break;
    case 'ai_synthesis':
      Icon = Lightbulb;
      bgColor = 'bg-yellow-200';
      tooltipContent = 'Node suggested by IdeaVine';
      break;
    case 'user_input':
      Icon = PenTool;
      bgColor = 'bg-indigo-200';
      tooltipContent = 'Node created manually';
      break;
  }

  return (
    <TooltipProvider delayDuration={50}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`absolute top-0 right-0 p-1 rounded-tr-md rounded-bl-md ${bgColor} cursor-pointer`}>
            <Icon className="h-5 w-5 text-gray-700" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" align="end">
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

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
  const { setNodes } = useReactFlow();
  const nodeRef = useRef<HTMLDivElement>(null);

  const nodeOperations = useContext(NodeOperationsContext);
  if (!nodeOperations) {
    throw new Error(
      "NodeOperationsContext is undefined. Make sure to wrap your component with NodeOperationsProvider."
    );
  }

  const { addNodeToDB, updateNodeInDB, deleteNodeFromDB } = nodeOperations;

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
          // Call the updateNodeInDB function to handle backend update
          updateNodeInDB({
            id: node.id,
            title: nodeData.title,
            content: nodeData.content,
            parents: node.data.parents,
            children: node.data.children,
            depth: node.data.depth,
            position: node.position,
            node_type: node.data.type,
            source: node.data.source,
          });
          return { ...node, data: { ...nodeData }, draggable: true };
        }
        return node;
      })
    );
  }, [id, nodeData, setNodes, updateNodeInDB]); // Ensure updateNodeInDB is in dependencies

  const handleDelete = useCallback(() => {
    deleteNodeFromDB(id);
  }, [id, deleteNodeFromDB]);

  // Handle adding a new node in a specific direction
  const handleAddNode = useCallback(
    (position: "top" | "bottom" | "left" | "right") => {
      console.log("here daddy");
      addNodeToDB(id, position);
    },
    [id, addNodeToDB]
  );

  // Handle click outside to finish editing
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        nodeRef.current &&
        !nodeRef.current.contains(event.target as HTMLElement) &&
        isEditing
      ) {
        handleBlur();
      }
    };

    if (isEditing) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing, handleBlur]);

  return (
    <div className="relative" ref={nodeRef}>
      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <div
        className={`px-4 py-2 shadow-md rounded-md bg-white border-2 ${
          selected ? "border-primary" : "border-gray-200"
        } ${
          data.isHighlighted ? "bg-yellow-100" : ""
        } transition-[background-color] duration-1000`}
      >
        <SourceIndicator type={data.node_type || ''} source={data.source || ''} />
        {isEditing ? (
          // Editing Mode
          <div className="flex flex-col gap-2">
            <Input
              value={nodeData.title}
              onChange={(e) =>
                setNodeData({ ...nodeData, title: e.target.value })
              }
              autoFocus
            />
            <Textarea
              value={nodeData.content}
              onChange={(e) =>
                setNodeData({ ...nodeData, content: e.target.value })
              }
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
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Left}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
      />
      {/* Add Node Buttons */}
      {["top", "right", "bottom", "left"].map((position) => (
        <div
          key={position}
          className={`absolute ${
            position === "top"
              ? "-top-4 left-1/2 transform -translate-x-1/2"
              : position === "right"
              ? "top-1/2 -right-4 transform -translate-y-1/2"
              : position === "bottom"
              ? "-bottom-4 left-1/2 transform -translate-x-1/2"
              : "top-1/2 -left-4 transform -translate-y-1/2"
          } opacity-0 hover:opacity-100 transition-opacity`}
        >
          <Button
            size="sm"
            variant="outline"
            className="rounded-full p-1"
            onClick={() =>
              handleAddNode(position as "top" | "right" | "bottom" | "left")
            }
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
  const { fitView, setCenter } = useReactFlow();
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mapTitle, setMapTitle] = useState<string>("Untitled Mind Map");
  const { updateSidebarTitle } = useContext(SidebarUpdateContext);
  const [previousTitle, setPreviousTitle] = useState<string>("Untitled Mind Map");
  const [layoutOnNextRender, setLayoutOnNextRender] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [essayTitle, setEssayTitle] = useState("");
  const [essayContent, setEssayContent] = useState("");

  const [isRecordingLoading, setIsRecordingLoading] = useState(false);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const [isWriteLoading, setIsWriteLoading] = useState(false);
  const [isCreating] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [currentMatch, setCurrentMatch] = useState(0);

  const { userEmail, firstName, lastName } = useUserInfo(); // Access userEmail from context
  const { mindmap_id } = useParams<{ mindmap_id: string }>(); // Extract mindmap_id from URL
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 768 });
  // const isTablet = useMediaQuery({ minWidth: 769, maxWidth: 1024 });

  const [isPublic, setIsPublic] = useState(false)

  // const { theme, setTheme } = useTheme();
  const { signOut } = useClerk()

  const [uploadType, setUploadType] = useState<"PDF" | "Video" | "Audio" | "Image" | "Document" | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)

  const handleUpload = (type: "PDF" | "Video" | "Audio" | "Image" | "Document") => {
    setUploadType(type)
    setIsUploadDialogOpen(true)
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    let fileSizeLimit;
    
    switch (uploadType) {
      case "PDF":
      case "Video":
      case "Document":
        fileSizeLimit = 100 * 1024 * 1024; // 100MB
        break;
      case "Audio":
        fileSizeLimit = 50 * 1024 * 1024; // 50MB
        break;
      case "Image":
        fileSizeLimit = 20 * 1024 * 1024; // 20MB
        break;
      default:
        return;
    }
  
    if (file.size > fileSizeLimit) {
      alert(`File size exceeds the limit of ${fileSizeLimit / (1024 * 1024)}MB`);
      return;
    }

    try {
      switch (uploadType) {
        case "Image":
          await handleImageUpload(files);
          break;
        case "Audio":
          const audioBlob = new Blob([file], { type: file.type });
          await handleAudioUpload(audioBlob, "audio_extraction", "uploaded_audio");
          setIsUploadDialogOpen(false);
          break;
        case "PDF":
          await handlePdfUpload(files);
          break;
        default:
          console.log(`${uploadType} upload not yet implemented`);
      }
    } catch (error) {
      console.error(`Error uploading ${uploadType}:`, error);
      alert(`Failed to upload ${uploadType}. Please try again.`);
    } finally {
      setIsUploadDialogOpen(false);
    }
  };

  // Utility functions to manage node operations
  // const addNodeToAddList = (node: any) => {
  //   nodesToAddRef.current.push(node);
  // };

  // const addNodeToUpdateList = (node: any) => {
  //   // Prevent duplicate updates
  //   nodesToUpdateRef.current = nodesToUpdateRef.current.filter(
  //     (n) => n.node_id !== node.node_id
  //   );
  //   nodesToUpdateRef.current.push(node);
  // };

  // const addNodeToDeleteList = (nodeId: string) => {
  //   // Prevent duplicate deletions
  //   if (!nodesToDeleteRef.current.includes(nodeId)) {
  //     nodesToDeleteRef.current.push(nodeId);
  //   }
  // };

  // Fetch or create mindmap based on URL
  useEffect(() => {
    const fetchOrCreateMindmap = async () => {
      if (mindmap_id) {
        // Fetch existing mindmap nodes
        try {
          const response = await fetch(`https://ideavine.onrender.com/mindmaps/${mindmap_id}/nodes`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              // Include authentication headers if required by backend
              // 'Authorization': `Bearer ${token}`
              'X-User-Email': userEmail || '',
            },
          });

          if (response.status === 403) {
            // Access denied
            navigate('/mindmap/access-denied');
            return;
          }

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch mindmap nodes");
          }

          const data = await response.json();
          const fetchedNodes: Node<CustomNodeData>[] = data.nodes.map(
            (node: any) => ({
              id: node._id,
              type: "customNode",
              data: {
                title: node.title,
                content: node.content,
                parents: node.parents,
                children: node.children,
                depth: node.depth,
                node_type: node.metadata.type,
                source: node.metadata.source,
              },
              position: {
                x: Number(node.position.x),
                y: Number(node.position.y),
              },
            })
          );

          // Derive edges from nodes
          const derivedEdges = deriveEdgesFromNodes(fetchedNodes);

          setNodes(fetchedNodes);
          setEdges(derivedEdges);
          setMapTitle(data.mindmap.title || "Untitled Mind Map");
          setPreviousTitle(data.mindmap.title || "Untitled Mind Map");

          // Optionally, fit the view to the nodes
          window.requestAnimationFrame(() => {
            fitView({ padding: 0.2, maxZoom: 0.8 });
          });
        } catch (err: any) {
          console.error("Error fetching mindmap nodes:", err);
          navigate("/"); // Redirect to home or another appropriate page
        }
      }
    };

    fetchOrCreateMindmap();
  }, [
    mindmap_id,
    isCreating,
    navigate,
    fitView,
    setNodes,
    setEdges,
    userEmail,
  ]);

  // Update Node in Database
  const updateNodeInDB = useCallback(
    async (node: Partial<CustomNodeData>) => {
      try {
        // Send update request to backend
        const response = await fetch(`https://ideavine.onrender.com/mindmaps/${mindmap_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({"nodes_to_update": [{
            node_id: node.id,
            type:'customNode',
            title: node.title,
            content: node.content,
            parents: node.parents,
            children: node.children,
            position: node.position,
        }]}),
        });

        if (!response.ok) {
          throw new Error("Failed to update node in the database.");
        }
      } catch (error: any) {
        console.error("Error updating node:", error);
      }
    },
    [mindmap_id]
  );

  // Delete Node from Database
  const deleteNodeFromDB = useCallback(
    async (nodeId: string) => {
      try {
        // Send delete request for node
        const response = await fetch(`https://ideavine.onrender.com/mindmaps/${mindmap_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({"nodes_to_delete": [nodeId]}),
        });

        if (!response.ok) {
          throw new Error("Failed to delete node from the database.");
        }

        // Delete associated edges from frontend
        setEdges((eds) =>
          eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
        );
      } catch (error: any) {
        console.error("Error deleting node:", error);
      }
    },
    [mindmap_id, setEdges]
  );

  const onNodesDelete = useCallback(
    (deletedNodes: any[]) => {
      // Delete each node from the database
      deletedNodes.forEach((node) => {
        deleteNodeFromDB(node.id);
      });
    },
    [deleteNodeFromDB]
  );

  const handleNodesChange = useCallback(
    (changes: any[]) => {
      changes.forEach((change) => {
        if (change.type === "position") {
          // Update the node's position in the database if it was dragged
          const node = nodes.find((n) => n.id === change.id);
          if (node) {
            updateNodeInDB({
              id: node.id,
              title: node.data?.title,
              content: node.data?.content,
              parents: node.data?.parents,
              children: node.data?.children,
              depth: node.data?.depth,
              position: change.position,
            });
          }
        }
      });
    },
    [nodes, updateNodeInDB]
  );

  // Update Mindmap Title in Database
  const updateMindmapTitle = useCallback(
    async (title: string) => {
      try {
        const response = await fetch(`https://ideavine.onrender.com/mindmaps/${mindmap_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title }),
        });

        if (!response.ok) {
          throw new Error("Failed to update mindmap title.");
        }

        // Update the sidebar title via context
        if (mindmap_id) {
          updateSidebarTitle(mindmap_id, title);
        }
      } catch (error: any) {
        console.error("Error updating mindmap title:", error);
      }
    },
    [mindmap_id, updateSidebarTitle]
  );

  // Effect to update sidebar title immediately on mapTitle change
  useEffect(() => {
    if (mapTitle && updateSidebarTitle && mindmap_id) {
      updateSidebarTitle(mindmap_id, mapTitle); // Update sidebar title immediately
    }
  }, [mapTitle, mindmap_id, updateSidebarTitle]);

  // Update Mindmap Title on Blur
  const handleTitleBlur = useCallback(() => {
    if (mapTitle.trim() === "") {
      setMapTitle(previousTitle);
    } else {
      setPreviousTitle(mapTitle);
      updateMindmapTitle(mapTitle);
    }
  }, [
    mapTitle,
    previousTitle,
    updateMindmapTitle,
    mindmap_id,
    updateSidebarTitle,
  ]);

  useOnSelectionChange({
    onChange: ({ nodes }) => {
      setSelectedNodes(nodes.map((node) => node.id));
    },
  });

  // Handle node connections
  const onConnect = useCallback(
    async (params: Edge | Connection) => {
      const newEdge: Edge = {
        id: uuidv4(),
        source: params.source!,
        target: params.target!,
      };
      setEdges((eds) => addEdge(newEdge, eds));

      // Send edge to backend
      try {
        const response = await fetch(`https://ideavine.onrender.com/mindmaps/${mindmap_id}/edges`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            _id: newEdge.id,
            mindmap_id: mindmap_id,
            source: newEdge.source,
            target: newEdge.target,
            type: newEdge.type,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to add edge to the database.");
        }
      } catch (error: any) {
        console.error("Error adding edge:", error);
      }
    },
    [mindmap_id, setEdges]
  );

  // Add a new node manually (e.g., via a button)
  const onAddNodeManually = useCallback(async () => {
    const newNodeId = uuidv4(); // Use UUID for node ID
    const newNode: Node<CustomNodeData> = {
      id: newNodeId,
      type: "customNode",
      data: {
        title: "New Node",
        content: "Double Click to edit",
        parents: [],
        children: [],
        depth: 0,
      },
      position: { x: Math.random() * 500, y: Math.random() * 500 },
    };
    setNodes((nds) => [...nds, newNode]);

    let nodesToAdd = {
      "nodes_to_add": [
        {
          _id: newNodeId,
          mindmap_id: mindmap_id,
          user_email: userEmail,
          title: newNode.data.title,
          content: newNode.data.content,
          position: newNode.position,
          parents: newNode.data.parents,
          children: newNode.data.children,
          depth: newNode.data.depth,
          node_type: "manual",
          source: "user_input",
        },
      ],
    };

    // Send add node request to backend
    try {
      const response = await fetch(`https://ideavine.onrender.com/mindmaps/${mindmap_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nodesToAdd),
      });

      if (!response.ok) {
        throw new Error("Failed to add node to the database.");
      }
    } catch (error: any) {
      console.error("Error adding node:", error);
    }
  }, [mindmap_id, setNodes, userEmail]);

  // Auto layout the mind map using Dagre
  const onLayout = useCallback(async () => {
    if (!reactFlowInstance.current) return;
  
    const nodeElements = reactFlowInstance.current.getNodes();
    const edgeElements = reactFlowInstance.current.getEdges();
  
    // Initialize dagre graph
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    // Configure layout direction and spacing
    dagreGraph.setGraph({ 
      rankdir: 'TB',  // Top to bottom layout
      nodesep: 100,   // Horizontal spacing between nodes
      ranksep: 150,   // Vertical spacing between ranks
      edgesep: 80,    // Minimum edge spacing
      marginx: 50,    // Horizontal margin
      marginy: 50     // Vertical margin
    });
  
    // Add nodes with dimensions
    nodeElements.forEach((node) => {
      const nodeElement = document.querySelector(`[data-id="${node.id}"]`);
      let width = 200;  // Default width
      let height = 100; // Default height
      
      if (nodeElement) {
        const rect = nodeElement.getBoundingClientRect();
        width = Math.max(rect.width, 200);  // Minimum width
        height = Math.max(rect.height, 100); // Minimum height
      }
      
      // Add padding to dimensions
      width += 50;
      height += 50;
      
      dagreGraph.setNode(node.id, { width, height });
    });
  
    // Add edges
    edgeElements.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });
  
    // Calculate layout
    dagre.layout(dagreGraph);
  
    // Apply positions to nodes with animation
    const newNodes = nodeElements.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWithPosition.width / 2,
          y: nodeWithPosition.y - nodeWithPosition.height / 2,
        },
        style: {
          ...node.style,
        },
      };
    });
  
    setNodes(newNodes);
  
    // Center view with animation
    window.requestAnimationFrame(() => {
      fitView({ 
        padding: 0.2, 
        maxZoom: 0.8,
        duration: 800,
      });
    });
  
    // Update node positions in the backend
    for (const node of newNodes) {
      await updateNodeInDB(node);
    }
  }, [fitView, setNodes, updateNodeInDB]);

  // Handle suggestions (e.g., AI-generated nodes)
  const handleSuggest = useCallback(async () => {
    if (selectedNodes.length === 0) {
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
      const response = await fetch('https://ideavine.onrender.com/synthesize', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nodes: selectedNodesData }),
      });

      if (!response.ok) {
        throw new Error("Failed to get suggestion");
      }

      const data = await response.json();
      const suggestedNode = data;

      // Generate a unique ID for the new node
      const newNodeId = uuidv4(); // Use UUID for node ID
      const newPosition = { x: Math.random() * 500, y: Math.random() * 500 };

      const newNode: Node<CustomNodeData> = {
        id: newNodeId,
        type: "customNode",
        data: {
          title: suggestedNode.title,
          content: suggestedNode.content,
          parents: selectedNodes,
          children: [],
          depth:
            Math.max(
              ...selectedNodes.map(
                (id) => nodes.find((n) => n.id === id)?.data.depth ?? 0
              )
            ) + 1,
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
      }));

      setEdges((eds) => [...eds, ...newEdges]);

      // Send add node request to backend
      const nodeResponse = await fetch(`https://ideavine.onrender.com/mindmaps/${mindmap_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({"nodes_to_add": [{
          _id: newNodeId,
          mindmap_id: mindmap_id,
          user_email: userEmail,
          title: newNode.data.title,
          content: newNode.data.content,
          position: newNode.position,
          parents: newNode.data.parents,
          children: newNode.data.children,
          depth: newNode.data.depth,
          node_type: "ai_suggested",
          source: "ai_synthesis",
        }]}),
      });

      if (!nodeResponse.ok) {
        throw new Error("Failed to add suggested node to the database.");
      }

      // Send add edges to backend
      // for (const edge of newEdges) {
      //   const edgeResponse = await fetch(`https://ideavine.onrender.com/mindmaps/${mindmap_id}/edges`, {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify({
      //       _id: edge.id,
      //       mindmap_id: mindmap_id,
      //       source: edge.source,
      //       target: edge.target,
      //       type: edge.type,
      //     }),
      //   });

      //   if (!edgeResponse.ok) {
      //     throw new Error('Failed to add edge to the database.');
      //   }
      // }

      // Optionally, auto-layout after adding the new node
      // setLayoutOnNextRender(true);
    } catch (err: any) {
      console.error("Error getting suggestion:", err);
    } finally {
      setIsSuggestLoading(false);
    }
  }, [selectedNodes, nodes, setNodes, setEdges, mindmap_id, userEmail]);

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
    }));

    try {
      const response = await fetch('https://ideavine.onrender.com/write', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nodes: allNodesData }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate essay");
      }

      const data = await response.json();
      setEssayTitle(data.title);
      setEssayContent(data.content);
      setIsSidebarOpen(true);
    } catch (err) {
      console.error("Error generating essay:", err);
    } finally {
      setIsWriteLoading(false);
    }
  }, [nodes]);

  const handleSearch = useCallback(() => {
    const matches = nodes.filter(
      node =>
        node.data.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.data.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    setSearchResults(matches.map(node => node.id));
    setCurrentMatch(matches.length > 0 ? 0 : -1);
  
    if (matches.length > 0) {
      const firstMatch = matches[0];
      highlightAndCenter(firstMatch.id);
    }
  }, [searchTerm, nodes]);
  
  const highlightAndCenter = useCallback((nodeId: string) => {
    const matchNode = nodes.find(node => node.id === nodeId);
    if (matchNode) {
      setCenter(matchNode.position.x, matchNode.position.y, { 
        zoom: 1.5, 
        duration: 1000 
      });
  
      setNodes(nds => 
        nds.map(node => ({
          ...node,
          data: {
            ...node.data,
            isHighlighted: node.id === nodeId
          }
        }))
      );
  
      setTimeout(() => {
        setNodes(nds =>
          nds.map(node => ({
            ...node,
            data: {
              ...node.data,
              isHighlighted: false
            }
          }))
        );
      }, 3000);
    }
  }, [nodes, setCenter, setNodes]);
  
  const navigateSearch = useCallback((direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;
  
    let nextMatch;
    if (direction === 'next') {
      nextMatch = (currentMatch + 1) % searchResults.length;
    } else {
      nextMatch = currentMatch - 1;
      if (nextMatch < 0) nextMatch = searchResults.length - 1;
    }
  
    setCurrentMatch(nextMatch);
    highlightAndCenter(searchResults[nextMatch]);
  }, [currentMatch, searchResults, highlightAndCenter]);

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
      console.error("MediaDevices API not supported.");
      return;
    }

    try {
      setIsRecordingLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await handleAudioUpload(audioBlob, "audio_generated", "audio_transcription");
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsRecordingLoading(false);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setIsRecordingLoading(false);
    }
  };

  // Stop recording audio
  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      setIsRecordingLoading(true);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Handle audio upload to backend
  const handleAudioUpload = async (audioBlob: Blob, nodeType: string, nodeSource: string) => {
    const formData = new FormData();

    formData.append("audio_file", audioBlob, "recording.webm");

    try {
      const response = await fetch('https://ideavine.onrender.com/process_audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.error("Failed to upload audio");
        return;
      }

      const data = await response.json();
      const nodesFromBackend = data.nodes;

      const { newNodes, newEdges } = processBackendNodes(nodesFromBackend, nodeType, nodeSource);

      setNodes((nds) => [...nds, ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);
      setIsRecordingLoading(false);

      // Optionally, auto-layout after adding nodes
      setLayoutOnNextRender(true);
    } catch (err) {
      console.error("Error uploading audio:", err);
      setIsRecordingLoading(false);
    }
  };

  const handlePdfUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const fileSizeLimit = 100 * 1024 * 1024; // 100MB
  
    if (file.size > fileSizeLimit) {
      alert(`File size exceeds the limit of 100MB`);
      return;
    }
  
    // Create FormData
    const formData = new FormData();
    formData.append('pdf_file', file);
  
    try {
      const response = await fetch('https://ideavine.onrender.com/process_pdf', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error('Failed to process PDF');
      }
  
      const data = await response.json();
      const nodesFromBackend = data.nodes;
  
      // Process the nodes and add them to the mind map
      const { newNodes, newEdges } = processBackendNodes(
        nodesFromBackend,
        'pdf_generated',
        'pdf_extraction'
      );
  
      setNodes(nds => [...nds, ...newNodes]);
      setEdges(eds => [...eds, ...newEdges]);
      
      // Auto layout after adding new nodes
      setLayoutOnNextRender(true);
      
      // Close the upload dialog
      setIsUploadDialogOpen(false);
    } catch (error) {
      console.error('Error processing PDF:', error);
      alert('Failed to process PDF. Please try again.');
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const fileSizeLimit = 20 * 1024 * 1024; // 20MB
  
    if (file.size > fileSizeLimit) {
      alert(`File size exceeds the limit of 20MB`);
      return;
    }
  
    // Create FormData
    const formData = new FormData();
    formData.append('image_file', file);
  
    try {
      const response = await fetch('https://ideavine.onrender.com/process_image', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error('Failed to process image');
      }
  
      const data = await response.json();
      console.log(data);
      const nodesFromBackend = data.nodes;
  
      // Process the nodes and add them to the mind map
      const { newNodes, newEdges } = processBackendNodes(
        nodesFromBackend,
        'image_generated',
        'image_analysis'
      );
  
      setNodes(nds => [...nds, ...newNodes]);
      setEdges(eds => [...eds, ...newEdges]);
      
      // Auto layout after adding new nodes
      setLayoutOnNextRender(true);
      
      // Close the upload dialog
      setIsUploadDialogOpen(false);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    }
  };

  // Process nodes received from backend after processing
  const processBackendNodes = useCallback(
    (backendNodes: any[], nodeType: string, nodeSource: string) => {
      const newNodes: Node<CustomNodeData>[] = [];
      const nodeMap = new Map<string, Node<CustomNodeData>>();

      // Generate a unique prefix to avoid ID conflicts
      const uniquePrefix = `${nodeType}-${Date.now()}-`;
      const existingNodeIds = new Set(nodes.map((node) => node.id));
      const idMap = new Map<string, string>();

      // First pass: Create new IDs and build idMap
      backendNodes.forEach((node) => {
        const oldId = node.id;
        let newId = uniquePrefix + oldId;

        // Ensure the new ID is unique among existing node IDs
        while (existingNodeIds.has(newId)) {
          newId =
            uniquePrefix +
            oldId +
            "-" +
            Math.random().toString(36).substr(2, 9);
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
                .split(",")
                .map((id: string) => id.trim())
                .filter((id: string) => id.length > 0)
                .map((id: string) => idMap.get(id) || id)
          : [];

        const children = node.children
          ? Array.isArray(node.children)
            ? node.children.map((cid: string) => idMap.get(cid) || cid)
            : node.children
                .split(",")
                .map((id: string) => id.trim())
                .filter((id: string) => id.length > 0)
                .map((id: string) => idMap.get(id) || id)
          : [];

        const reactFlowNode: Node<CustomNodeData> = {
          id: newId,
          type: "customNode",
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

      // Derive edges from the new nodes
      const derivedEdges = deriveEdgesFromNodes(newNodes);

      console.log(`nodeType is ${nodeType} and nodeSource is ${nodeSource}`)
      // Send new nodes to backend
      newNodes.forEach(async (node) => {
        try {
          const response = await fetch(`https://ideavine.onrender.com/mindmaps/${mindmap_id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({"nodes_to_add": [{
              _id: node.id,
              mindmap_id: mindmap_id,
              user_email: userEmail,
              title: node.data.title,
              content: node.data.content,
              position: node.position,
              parents: node.data.parents,
              children: node.data.children,
              depth: node.data.depth,
              node_type: nodeType,
              source: nodeSource,
            }]}),
          });

          if (!response.ok) {
            throw new Error("Failed to add node to the database.");
          }
        } catch (error: any) {
          console.error("Error adding backend node:", error);
        }
      });

      // Send new edges to backend
      // derivedEdges.forEach(async (edge) => {
      //   try {
      //     const response = await fetch(`https://ideavine.onrender.com/mindmaps/${mindmap_id}/edges`, {
      //       method: 'POST',
      //       headers: {
      //         'Content-Type': 'application/json',
      //       },
      //       body: JSON.stringify({
      //         _id: edge.id,
      //         mindmap_id: mindmap_id,
      //         source: edge.source,
      //         target: edge.target,
      //         type: edge.type,
      //       }),
      //     });

      //     if (!response.ok) {
      //       throw new Error('Failed to add edge to the database.');
      //     }
      //   } catch (error: any) {
      //     console.error("Error adding edge:", error);
      //   }
      // });

      return { newNodes, newEdges: derivedEdges };
    },
    [nodes, mindmap_id, userEmail]
  );

  // Auto layout trigger
  useEffect(() => {
    if (layoutOnNextRender) {
      onLayout();
      setLayoutOnNextRender(false);
    }
  }, [layoutOnNextRender, onLayout]);


  const handleVisibilityChange = (newIsPublic: boolean) => {
    setIsPublic(newIsPublic)
    // Here you would typically update the backend with the new visibility status
    console.log("Updating map visibility:", newIsPublic)
  }

  const getUserInitials = () => {
    if (!userEmail) return "U"
    const initials = `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase()
    return initials || "U"
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <NodeOperationsProvider
      nodes={nodes}
      setNodes={setNodes}
      edges={edges}
      setEdges={setEdges}
    >
      <SidebarProvider>
        {/* <AppSidebar /> */}
        <div className="w-full h-screen flex flex-col">
          {/* Top Bar */}
          <div className="relative flex items-center justify-between p-4 bg-background border-b select-none">
            <a href="/mindmap">
              <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-sm">
                    <Leaf className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-semibold text-xl tracking-tight">IdeaVine</span>
              </div>
            </a>
            <div className="absolute left-1/2 transform -translate-x-1/2 max-w-[50%] md:max-w-[60%] lg:max-w-[70%]">
              <Input
                className="text-center text-lg font-bold bg-transparent border-none outline-none p-0 m-0 select-text"
                style={{
                  width: "auto",
                  minWidth: "50px",
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  padding: "10px",
                }}
                value={mapTitle}
                onChange={(e) => setMapTitle(e.target.value)}
                onBlur={handleTitleBlur}
                title={mapTitle}
              />
            </div>
            {isMobile ? (
              <Button onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <Menu className="h-6 w-6" />
              </Button>
            ) : (
              <div className="flex items-center space-x-4">
                <ShareDialog
                  title={mapTitle}
                  mindmapId={mindmap_id}
                  isPublic={isPublic}
                  onVisibilityChange={handleVisibilityChange}
                />
                {/* <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button> */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <span className="font-medium">
                        {firstName ? `${firstName} ${lastName || ""}` : userEmail}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex flex-col items-start">
                      <span className="text-xs text-muted-foreground" style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "200px"
                      }}>{userEmail}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          {/* Main Content */}
          <div className="flex-grow overflow-hidden flex">
            {/* ReactFlow Container */}
            <div
              className={`flex-grow transition-all duration-300 ${
                isSidebarOpen ? "mr-96" : ""
              }`}
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={(changes) => {
                  onNodesChange(changes); // Call the onNodesChange from useNodesState for state management
                  handleNodesChange(changes); // Call our custom handler for database update
                }}
                onEdgesChange={onEdgesChange}
                onNodesDelete={onNodesDelete}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                proOptions={{ hideAttribution: true }}
                onInit={onInit}
              >
                <Controls />
                <Background />
                <MiniMap position="bottom-right" />
                <Panel position="top-left">
                  <div className="flex gap-2 select-none">
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
                          Stop
                        </>
                      ) : (
                        <>
                          <Mic className="mr-2 h-4 w-4" />
                          Record
                        </>
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                      <DropdownMenuItem onSelect={() => handleUpload("PDF")}>
                        <FileText className="mr-2 h-4 w-4" />
                        PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleUpload("Video")}>
                        <Video className="mr-2 h-4 w-4" />
                        Video
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleUpload("Audio")}>
                        <Music className="mr-2 h-4 w-4" />
                        Audio
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleUpload("Image")}>
                        <Image className="mr-2 h-4 w-4" />
                        Image
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleUpload("Document")}>
                        <File className="mr-2 h-4 w-4" />
                        Document
                      </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                </Panel>
                <Panel position="top-right">
                  <div className="flex gap-2 select-none">
                    <div className="relative flex gap-2">
                      <div className="relative flex items-center">
                        <Input
                          type="text"
                          placeholder="Search nodes..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            handleSearch();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const nextMatch = (currentMatch + 1) % searchResults.length;
                              setCurrentMatch(nextMatch);
                              highlightAndCenter(searchResults[nextMatch]);
                            }
                          }}
                          className="pr-24"
                        />
                        {/* {searchResults.length > 0 && (
                          <span className="absolute right-20 text-sm text-gray-500">
                            {currentMatch + 1} of {searchResults.length}
                          </span>
                        )} */}
                        <div className="absolute right-0 flex">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateSearch('prev')}
                            disabled={searchResults.length === 0 || searchTerm.length === 0}
                            className="px-2 border-none bg-transparent"
                          >
                            ←
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateSearch('next')}
                            disabled={searchResults.length === 0 || searchTerm.length === 0}
                            className="px-2 border-none bg-transparent"
                          >
                            →
                          </Button>
                        </div>
                      </div>
                      {/* <Button onClick={handleSearch} className="shrink-0">
                        <Search className="h-4 w-4" />
                      </Button> */}
                    </div>
                    <Button onClick={onAddNodeManually}>
                      <Plus className="mr-0 h-4 w-4" />
                      Add Node
                    </Button>
                    <Button onClick={onLayout}>Auto Layout</Button>
                  </div>
                </Panel>
              </ReactFlow>
            </div>
            {/* Sidebar for Generated Essay */}
            <div
              className={`fixed top-0 right-0 h-full w-96 bg-white shadow-lg transform transition-transform duration-300 ${
                isSidebarOpen ? "translate-x-0" : "translate-x-full"
              } select-none`}
            >
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">Generated Essay</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSidebarOpen(false)}
                  >
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
                    e.currentTarget.style.height = "auto";
                    e.currentTarget.style.height =
                      e.currentTarget.scrollHeight + "px";
                  }}
                />
                <Textarea
                  value={essayContent}
                  onChange={(e) => setEssayContent(e.target.value)}
                  className="w-full h-[calc(100vh-200px)]"
                  placeholder="Essay Content"
                />
                <p className="text-xs text-gray-500 mt-2">
                  This write feature is intended to help you understand and
                  organize the ideas from your mind map. It should not be used
                  as a substitute for your own creative writing and thought.
                </p>
              </div>
            </div>
          </div>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload {uploadType}</DialogTitle>
                <DialogDescription>
                  Please upload your {uploadType} not larger than {
                    uploadType === "PDF" || uploadType === "Video" ? "100MB" :
                    uploadType === "Audio" ? "50MB" : "20MB"
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileUp className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  </div>
                  <input id="dropzone-file" type="file" className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
                </label>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarProvider>
    </NodeOperationsProvider>
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
