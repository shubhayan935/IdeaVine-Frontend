// src/context/MindmapContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUserInfo } from './UserContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// Define the Mindmap interface based on backend response
interface Mindmap {
  _id: string;
  user_uid: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  last_accessed: string;
  metadata: {
    total_nodes: number;
    max_depth: number;
    tags: string[];
  };
}

// Define the context interface
interface MindmapContextType {
  mindmaps: Mindmap[];
  fetchMindmaps: () => void;
  addMindmap: (mindmap: Mindmap) => void;
  updateMindmap: (updatedMindmap: Mindmap) => void;
  deleteMindmap: (mindmapId: string) => void;
}

const MindmapContext = createContext<MindmapContextType | undefined>(undefined);

export const useMindmap = (): MindmapContextType => {
  const context = useContext(MindmapContext);
  if (!context) {
    throw new Error('useMindmap must be used within a MindmapProvider');
  }
  return context;
};

interface MindmapProviderProps {
  children: ReactNode;
}

export const MindmapProvider: React.FC<MindmapProviderProps> = ({ children }) => {
  const [mindmaps, setMindmaps] = useState<Mindmap[]>([]);
  const { userEmail } = useUserInfo();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Function to fetch mindmaps from the backend
  const fetchMindmaps = async () => {
    if (!userEmail) return;

    try {
      const response = await fetch(`http://127.0.0.1:5000/users/lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user UID');
      }

      const data = await response.json();
      const userUid = data.user._id;

      // Fetch mindmaps by user UID
      const mindmapsResponse = await fetch(`${BACKEND_API_URL}/users/${userUid}/mindmaps`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!mindmapsResponse.ok) {
        const errorData = await mindmapsResponse.json();
        throw new Error(errorData.error || 'Failed to fetch mindmaps');
      }

      const mindmapsData = await mindmapsResponse.json();
      setMindmaps(mindmapsData.mindmaps);
    } catch (err: any) {
      console.error('Error fetching mindmaps:', err);
      toast({
        title: 'Error',
        description: err.message || 'An error occurred while fetching mindmaps.',
        variant: 'destructive',
      });
    }
  };

  // Fetch mindmaps on mount
  useEffect(() => {
    fetchMindmaps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  // Function to add a new mindmap to the context
  const addMindmap = (mindmap: Mindmap) => {
    setMindmaps((prev) => [...prev, mindmap]);
  };

  // Function to update an existing mindmap in the context
  const updateMindmap = (updatedMindmap: Mindmap) => {
    setMindmaps((prev) =>
      prev.map((mindmap) => (mindmap._id === updatedMindmap._id ? updatedMindmap : mindmap))
    );
  };

  // Function to delete a mindmap from the context
  const deleteMindmap = (mindmapId: string) => {
    setMindmaps((prev) => prev.filter((mindmap) => mindmap._id !== mindmapId));
  };

  return (
    <MindmapContext.Provider
      value={{
        mindmaps,
        fetchMindmaps,
        addMindmap,
        updateMindmap,
        deleteMindmap,
      }}
    >
      {children}
    </MindmapContext.Provider>
  );
};
