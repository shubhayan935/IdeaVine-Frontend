import React, { createContext, useState, useCallback, ReactNode } from 'react';

// Define the structure of a Mindmap
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

// Define the context shape
interface SidebarUpdateContextProps {
  mindmaps: Mindmap[];
  updateSidebarTitle: (mindmapId: string, newTitle: string) => void;
  setMindmaps: React.Dispatch<React.SetStateAction<Mindmap[]>>;
}

// Create the context
export const SidebarUpdateContext = createContext<SidebarUpdateContextProps>({
  mindmaps: [],
  updateSidebarTitle: () => {},
  setMindmaps: () => {},
});

// Context Provider Component
interface SidebarUpdateProviderProps {
  children: ReactNode;
}

export const SidebarUpdateProvider: React.FC<SidebarUpdateProviderProps> = ({ children }) => {
  const [mindmaps, setMindmaps] = useState<Mindmap[]>([]);

  // Function to update the title of a mindmap in the sidebar
  const updateSidebarTitle = useCallback((mindmapId: string, newTitle: string) => {
    setMindmaps((prevMindmaps) =>
      prevMindmaps.map((mindmap) =>
        mindmap._id === mindmapId ? { ...mindmap, title: newTitle } : mindmap
      )
    );
  }, []);

  return (
    <SidebarUpdateContext.Provider
      value={{
        mindmaps,
        updateSidebarTitle,
        setMindmaps,
      }}
    >
      {children}
    </SidebarUpdateContext.Provider>
  );
};
