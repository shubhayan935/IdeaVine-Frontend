// src/components/AppSidebar.tsx

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Search, LogOut, Plus, Leaf, Calendar, Palette, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClerk } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserInfo } from './context/UserContext'; // Correct import
import { v4 as uuidv4 } from 'uuid'; // Import UUID

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

// Define Theme types
type Theme = 'light' | 'dark' | 'beige' | 'lavender' | 'pink';

interface ThemeOption {
  name: Theme;
  primaryColor: string;
  secondaryColor: string;
  label: string;
}

const themeOptions: ThemeOption[] = [
  { name: 'light', primaryColor: '#ffffff', secondaryColor: '#000000', label: 'Light' },
  { name: 'dark', primaryColor: '#1a1a1a', secondaryColor: '#ffffff', label: 'Dark' },
  { name: 'beige', primaryColor: '#f5f5dc', secondaryColor: '#8b4513', label: 'Beige' },
  { name: 'lavender', primaryColor: '#e6e6fa', secondaryColor: '#000000', label: 'Lavender' },
];

export function AppSidebar() {
  // State for active mindmap item
  const [activeItem, setActiveItem] = useState<string | null>(null);
  
  // State for search term
  const [searchTerm, setSearchTerm] = useState("");
  
  // State for theme management
  const [theme, setTheme] = useState<Theme>('light');

  // State to hold fetched mindmaps
  const [mindmaps, setMindmaps] = useState<Mindmap[]>([]);
  
  // State for loading and error handling
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Destructure signOut from useClerk
  const { signOut } = useClerk();
  
  // Initialize navigate for routing
  const navigate = useNavigate();
  
  // Use useUserInfo hook to get user info
  const { userEmail, firstName, lastName } = useUserInfo();
  console.log(userEmail, firstName, lastName);

  // Function to derive user initials for AvatarFallback
  const getUserInitials = () => {
    if (!userEmail) return "U";

    // Optionally, use firstName and lastName for initials
    const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    return initials || "U";
  };

  // Effect to load saved theme or system preference on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme && themeOptions.some(option => option.name === savedTheme)) {
        setTheme(savedTheme);
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
      }
    }
  }, []);

  // Effect to apply theme changes to the document and localStorage
  useEffect(() => {
    document.documentElement.classList.remove(...themeOptions.map(option => option.name));
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Handle user logout
  const handleLogout = async () => {
    try {
      await signOut(); // Sign out the user
      console.log("User logged out:", userEmail || "Unknown"); // Optional: Log the email
      navigate('/'); // Redirect to the landing page
    } catch (error) {
      console.error("Error logging out:", error);
      // Optionally, display an error message to the user
    }
  };

  // Function to create a new mindmap
  const handleCreateMindmap = async () => {
    if (!userEmail) {
      console.log('creating a new mindmap, FAILED.')
      return;
    }

    const mindmap_id = `uuid_mindmap-${Date.now()}`; // Format: uuid_mindmap-timestamp
    const title = "Untitled Mindmap"; // Default title, can be modified
    const description = ""; // Default description
    const tags: string[] = []; // Default tags
    const nodes = []; // Initial nodes, can be empty or have a default node

    const requestBody = {
      mindmap_id,
      user_email: userEmail,
      title,
      description,
      tags,
      nodes,
    };

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://127.0.0.1:5000/mindmaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include authentication headers if required by backend
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create mindmap');
      }

      const data = await response.json();
      console.log('Mindmap created successfully:', data);

      // Optionally, you can add the new mindmap to the state
      setMindmaps((prevMindmaps) => [...prevMindmaps, data.mindmap]);

      // Navigate to the new mindmap page
      navigate(`/mindmap/${mindmap_id}`);
    } catch (err: any) {
      console.error("Error creating mindmap:", err);
      setError(err.message || 'An error occurred while creating mindmap');
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch mindmaps based on user_email
  useEffect(() => {
    const fetchMindmaps = async () => {
      if (!userEmail) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`http://127.0.0.1:5000/users/lookup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Include authentication headers if required by backend
            // 'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ email: userEmail }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch user UID');
        }

        const data = await response.json();
        const userUid = data.user._id;

        // After getting userUid, fetch mindmaps
        await fetchMindmapsByUid(userUid);
      } catch (err: any) {
        console.error("Error fetching user UID:", err);
        setError(err.message || 'An error occurred while fetching user UID');
        setLoading(false);
      }
    };

    const fetchMindmapsByUid = async (userUid: string) => {
      try {
        const response = await fetch(`http://127.0.0.1:5000/users/${userUid}/mindmaps`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Include authentication headers if required by backend
            // 'Authorization': `Bearer ${token}`
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch mindmaps');
        }

        const data = await response.json();
        setMindmaps(data.mindmaps);
        console.log('Fetched mindmaps:', data.mindmaps);
      } catch (err: any) {
        console.error("Error fetching mindmaps:", err);
        setError(err.message || 'An error occurred while fetching mindmaps');
      } finally {
        setLoading(false);
      }
    };

    fetchMindmaps();
  }, [userEmail]);

  // Filtered mindmaps based on search term
  const filteredMindmaps = mindmaps.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Sidebar className="border-r border-border/50 shadow-sm transition-colors duration-300">
      <style jsx global>{`
        /* Your existing global styles */
        :root {
          --background-transition-duration: 300ms;
        }
        
        *, *::before, *::after {
          transition: background-color var(--background-transition-duration) ease,
                      border-color var(--background-transition-duration) ease;
        }

        /* Exclude text elements from color transition */
        h1, h2, h3, h4, h5, h6, p, span, a, button, input, textarea {
          transition: none;
        }

        /* Light theme (default) */
        :root {
          --background: 0 0% 100%;
          --foreground: 0 0% 0%;
          --card: 0 0% 100%;
          --card-foreground: 0 0% 0%;
          --popover: 0 0% 100%;
          --popover-foreground: 0 0% 0%;
          --primary: 0 0% 0%;
          --primary-foreground: 0 0% 100%;
          --secondary: 0 0% 96%;
          --secondary-foreground: 0 0% 0%;
          --muted: 0 0% 96%;
          --muted-foreground: 0 0% 45%;
          --accent: 0 0% 96%;
          --accent-foreground: 0 0% 0%;
          --destructive: 0 84.2% 60.2%;
          --destructive-foreground: 0 0% 100%;
          --border: 0 0% 89%;
          --input: 0 0% 89%;
          --ring: 0 0% 0%;
          --radius: 0.5rem;
        }

        /* Dark theme */
        .dark {
          --background: 0 0% 10%;
          --foreground: 0 0% 100%;
          --card: 0 0% 10%;
          --card-foreground: 0 0% 100%;
          --popover: 0 0% 10%;
          --popover-foreground: 0 0% 100%;
          --primary: 0 0% 100%;
          --primary-foreground: 0 0% 10%;
          --secondary: 0 0% 15%;
          --secondary-foreground: 0 0% 100%;
          --muted: 0 0% 15%;
          --muted-foreground: 0 0% 65%;
          --accent: 0 0% 15%;
          --accent-foreground: 0 0% 100%;
          --destructive: 0 62.8% 30.6%;
          --destructive-foreground: 0 0% 100%;
          --border: 0 0% 20%;
          --input: 0 0% 20%;
          --ring: 0 0% 100%;
          --radius: 0.5rem;
        }

        /* Beige theme */
        .beige {
          --background: 37 36% 90%;
          --foreground: 24 70% 31%;
          --card: 37 36% 90%;
          --card-foreground: 24 70% 31%;
          --popover: 37 36% 90%;
          --popover-foreground: 24 70% 31%;
          --primary: 24 70% 31%;
          --primary-foreground: 37 36% 90%;
          --secondary: 34 30% 85%;
          --secondary-foreground: 24 70% 31%;
          --muted: 34 30% 85%;
          --muted-foreground: 24 40% 45%;
          --accent: 34 30% 85%;
          --accent-foreground: 24 70% 31%;
          --destructive: 0 85% 60%;
          --destructive-foreground: 37 36% 90%;
          --border: 34 30% 80%;
          --input: 34 30% 80%;
          --ring: 24 70% 31%;
        }

        /* Lavender theme */
        .lavender {
          --background: 240 67% 94%;
          --foreground: 0 0% 0%;
          --card: 240 67% 94%;
          --card-foreground: 0 0% 0%;
          --popover: 240 67% 94%;
          --popover-foreground: 0 0% 0%;
          --primary: 0 0% 0%;
          --primary-foreground: 240 67% 94%;
          --secondary: 240 30% 88%;
          --secondary-foreground: 0 0% 0%;
          --muted: 240 30% 88%;
          --muted-foreground: 0 0% 45%;
          --accent: 240 30% 88%;
          --accent-foreground: 0 0% 0%;
          --destructive: 0 84.2% 60.2%;
          --destructive-foreground: 240 67% 94%;
          --border: 240 30% 84%;
          --input: 240 30% 84%;
          --ring: 0 0% 0%;
        }

        /* Styles for ReactFlow nodes */
        .react-flow__node {
          background-color: hsl(var(--card));
          color: hsl(var(--card-foreground));
        }

        .react-flow__node-custom {
          background-color: hsl(var(--card));
          color: hsl(var(--card-foreground));
        }
      `}</style>
      {/* Sidebar Header */}
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Leaf className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-xl tracking-tight">IdeaVine</span>
          </div>
          {/* Theme Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg bg-secondary hover:bg-secondary/80"
              >
                <Palette className="h-4 w-4" />
                <span className="sr-only">Select theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              side="right" 
              sideOffset={22} 
              className="w-56 shadow-lg"
            >
              <DropdownMenuLabel className="text-sm font-medium">Choose theme</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {themeOptions.map((option) => (
                <DropdownMenuItem
                  key={option.name}
                  onClick={() => setTheme(option.name)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center w-full gap-3">
                    <div className="flex items-center justify-center">
                      <div
                        className="w-5 h-5 rounded-l-md border-r border-border/50 shadow-sm"
                        style={{ backgroundColor: option.primaryColor }}
                      />
                      <div
                        className="w-5 h-5 rounded-r-md shadow-sm"
                        style={{ backgroundColor: option.secondaryColor }}
                      />
                    </div>
                    <span className="text-sm font-medium">{option.label}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarHeader>
      
      {/* Sidebar Content */}
      <SidebarContent>
        <ScrollArea className="h-[calc(100vh-8rem)] py-6">
          <div className="space-y-6">
            {/* New Mind Map Button */}
            <div className="px-4">
              <Button 
                className="w-full justify-center gap-2 shadow-sm hover:shadow" 
                size="lg"
                onClick={handleCreateMindmap} // Updated handler
                disabled={loading} // Disable while loading
              >
                <Plus className="h-4 w-4" />
                {loading ? "Creating..." : "New Mind Map"}
              </Button>
            </div>
            
            {/* Search and Recent Mind Maps */}
            <SidebarGroup>
              {/* Search Input */}
              <div className="px-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search mindmaps..."
                    className="pl-9 shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Recent Mind Maps Label */}
              <SidebarGroupLabel className="px-4 text-sm font-medium text-foreground/70">
                Recent Mind Maps
              </SidebarGroupLabel>
              
              {/* Recent Mind Maps Content */}
              <SidebarGroupContent className="px-2">
                {/* Loading State */}
                {loading ? (
                  <div className="px-4 py-2 text-sm text-muted-foreground">Loading...</div>
                ) : error ? (
                  <div className="px-4 py-2 text-sm text-destructive">{error}</div>
                ) : filteredMindmaps.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-muted-foreground">No mindmaps found.</div>
                ) : (
                  <SidebarMenu>
                    {filteredMindmaps.map((item: Mindmap) => (
                      <SidebarMenuItem key={item._id}>
                        <SidebarMenuButton
                          asChild
                          isActive={activeItem === item._id}
                          onClick={() => setActiveItem(item._id)}
                        >
                          <Link
                            to={`/mindmap/${item._id}`} // Navigate to specific mindmap page
                            className={cn(
                              "group relative flex flex-col gap-2 rounded-lg text-sm transition-all hover:shadow",
                              activeItem === item._id
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-muted"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{item.title}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(item.created_at).toLocaleDateString()}
                              </div>
                              {/* Optional: Display tags or other metadata */}
                              {item.metadata.tags.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <Leaf className="h-3.5 w-3.5" />
                                  {item.metadata.tags.join(', ')}
                                </div>
                              )}
                            </div>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        </ScrollArea>
      </SidebarContent>
      
      {/* Sidebar Footer with User Dropdown */}
      <SidebarFooter className="border-t border-border/50 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 bg-background hover:bg-muted px-4 py-3 h-auto shadow-sm"
            >
              <Avatar className="h-8 w-8">
                {userEmail ? (
                  <>
                    {/* Conditionally render AvatarImage if user has an avatar URL */}
                    {/* Assuming you have user.imageUrl accessible */}
                    {/* If not, it will fallback to initials */}
                    {/* Replace `user.imageUrl` with the correct property if different */}
                    {/* Example: {user.imageUrl ? (
                      <AvatarImage src={user.imageUrl} alt="User" />
                    ) : ( */}
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    {/* )} */}
                  </>
                ) : (
                  <AvatarFallback>U</AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col items-start">
                {userEmail ? (
                  <>
                    <span className="text-sm font-medium">
                      {firstName ? `${firstName} ${lastName || ''}` : userEmail}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {userEmail}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium">Guest</span>
                    <span className="text-xs text-muted-foreground">guest@example.com</span>
                  </>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive cursor-pointer flex items-center" 
              onClick={handleLogout} // Attach handleLogout here
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
