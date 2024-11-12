"use client";

import { createContext, useState, useEffect, useCallback } from "react";
import {
  Search,
  LogOut,
  Plus,
  Leaf,
  Palette,
  Trash2,
  MoreVertical,
} from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClerk } from "@clerk/clerk-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useUserInfo } from "./context/UserContext";

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

type Theme = "light" | "dark" | "beige" | "lavender";

interface ThemeOption {
  name: Theme;
  primaryColor: string;
  secondaryColor: string;
  label: string;
}

const themeOptions: ThemeOption[] = [
  {
    name: "light",
    primaryColor: "#ffffff",
    secondaryColor: "#000000",
    label: "Light",
  },
  {
    name: "dark",
    primaryColor: "#1a1a1a",
    secondaryColor: "#ffffff",
    label: "Dark",
  },
  {
    name: "beige",
    primaryColor: "#f5f5dc",
    secondaryColor: "#8b4513",
    label: "Beige",
  },
  {
    name: "lavender",
    primaryColor: "#e6e6fa",
    secondaryColor: "#000000",
    label: "Lavender",
  },
];

export const SidebarUpdateContext = createContext<{
  updateSidebarTitle: (mindmapId: string, newTitle: string) => void;
}>({ updateSidebarTitle: () => {} });

export function AppSidebar() {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [theme, setTheme] = useState<Theme>("light");
  const [mindmaps, setMindmaps] = useState<Mindmap[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { userEmail, firstName, lastName } = useUserInfo();
  const { mindmap_id } = useParams<{ mindmap_id: string }>();

  const updateSidebarTitle = useCallback(
    (mindmapId: string, newTitle: string) => {
      setMindmaps((prevMindmaps) =>
        prevMindmaps.map((mindmap) =>
          mindmap._id === mindmapId ? { ...mindmap, title: newTitle } : mindmap
        )
      );
    },
    []
  );

  const getUserInitials = () => {
    if (!userEmail) return "U";
    const initials = `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`.toUpperCase();
    return initials || "U";
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") as Theme;
      if (
        savedTheme &&
        themeOptions.some((option) => option.name === savedTheme)
      ) {
        setTheme(savedTheme);
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setTheme("dark");
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove(
      ...themeOptions.map((option) => option.name)
    );
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleCreateMindmap = async () => {
    if (!userEmail) return;

    const newMindmapId = `${Date.now()}`;
    const requestBody = {
      mindmap_id: newMindmapId,
      user_email: userEmail,
      title: "Untitled Mindmap",
      description: "",
      tags: [],
      nodes: [],
    };

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("https://ideavine.onrender.com/mindmaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create mindmap");
      }

      const data = await response.json();
      setMindmaps((prevMindmaps) => [data.mindmap, ...prevMindmaps]);
      setActiveItem(newMindmapId);
      navigate(`/mindmap/${newMindmapId}`);
    } catch (err: any) {
      console.error("Error creating mindmap:", err);
      setError(err.message || "An error occurred while creating mindmap");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchActiveMindmap = async () => {
      if (!userEmail) return;
      try {
        if (mindmap_id) {
          setActiveItem(mindmap_id);
        }
      } catch (err: any) {
        console.error("Error fetching active mindmap:", err);
        setError(
          err.message || "An error occurred while fetching the active mindmap."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchActiveMindmap();
  }, [userEmail, mindmap_id]);

  useEffect(() => {
    const fetchMindmaps = async () => {
      if (!userEmail) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`https://ideavine.onrender.com/users/lookup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch user UID");
        }

        const data = await response.json();
        const userUid = data.user._id;

        await fetchMindmapsByUid(userUid);
      } catch (err: any) {
        console.error("Error fetching user UID:", err);
        setError(err.message || "An error occurred while fetching user UID");
        setLoading(false);
      }
    };

    const fetchMindmapsByUid = async (userUid: string) => {
      try {
        const response = await fetch(`https://ideavine.onrender.com/users/${userUid}/mindmaps`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch mindmaps");
        }

        const data = await response.json();
        const sortedMindmaps = data.mindmaps.sort(
          (
            a: { updated_at: string | number | Date },
            b: { updated_at: string | number | Date }
          ) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        setMindmaps(sortedMindmaps);
      } catch (err: any) {
        console.error("Error fetching mindmaps:", err);
        setError(err.message || "An error occurred while fetching mindmaps");
      } finally {
        setLoading(false);
      }
    };

    fetchMindmaps();
  }, [userEmail]);

  const handleDeleteMindmap = async (mindmapId: string) => {
    try {
      const response = await fetch(`https://ideavine.onrender.com/mindmaps/${mindmapId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });


      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete mindmap");
      }

      setMindmaps((prevMindmaps) =>
        prevMindmaps.filter((map) => map._id !== mindmapId)
      );

      if (activeItem === mindmapId) {
        const remainingMindmaps = mindmaps.filter(
          (map) => map._id !== mindmapId
        );
        if (remainingMindmaps.length > 0) {
          const newActiveMap = remainingMindmaps[0];
          setActiveItem(newActiveMap._id);
          navigate(`/mindmap/${newActiveMap._id}`);
        } else {
          // This is the last mindmap, create a new one
          await handleCreateMindmap();
        }
      }
    } catch (err: any) {
      console.error("Error deleting mindmap:", err.message);
    }
  };

  const filteredMindmaps = mindmaps.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SidebarUpdateContext.Provider value={{ updateSidebarTitle }}>
      <Sidebar className="border-r border-border/50 shadow-sm transition-colors duration-300">
        <SidebarHeader>
          <div className="flex items-center justify-between gap-2 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-sm">
                <Leaf className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-xl tracking-tight">
                IdeaVine
              </span>
            </div>
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
                <DropdownMenuLabel className="text-sm font-medium">
                  Choose theme
                </DropdownMenuLabel>
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
                      <span className="text-sm font-medium">
                        {option.label}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <ScrollArea className="h-[calc(100vh-8rem)] py-6">
            <div className="space-y-6">
              <div className="px-4">
                <Button
                  className="w-full justify-center gap-2 shadow-sm hover:shadow"
                  size="lg"
                  onClick={handleCreateMindmap}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4" />
                  {loading ? "Creating..." : "New Mind Map"}
                </Button>
              </div>

              <SidebarGroup>
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

                <SidebarGroupLabel className="px-4 text-sm font-medium text-foreground/70">
                  Recent Mind Maps
                </SidebarGroupLabel>

                <SidebarGroupContent className="px-2">
                  {loading ? (
                    <div className="px-4 py-2 text-sm text-muted-foreground">
                      Loading...
                    </div>
                  ) : error ? (
                    <div className="px-4 py-2 text-sm text-destructive">
                      {error}
                    </div>
                  ) : filteredMindmaps.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-muted-foreground">
                      No mindmaps found.
                    </div>
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
                              to={`/mindmap/${item._id}`}
                              className={cn(
                                "group relative flex items-center justify-between rounded-lg text-sm transition-all px-3 py-2",
                                "hover:bg-muted/50",
                                activeItem === item._id
                                  ? "bg-primary/5 dark:bg-primary/10"
                                  : "text-foreground"
                              )}
                            >
                              <div className="flex-1 min-w-0 mr-2">
                                <div className="flex flex-row items-center justify-between">
                                  <span className="font-medium">
                                    {item.title}
                                  </span>
                                </div>
                                {/* <div className="flex items-center gap-3 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {new Date(item.created_at).toLocaleDateString()}
                                </div>
                                {item.metadata.tags.length > 0 && (
                                  <div className="flex items-center gap-1.5">
                                    <Leaf className="h-3.5 w-3.5" />
                                    {item.metadata.tags.join(", ")}
                                  </div>
                                )}
                              </div> */}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className={cn(
                                      "h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100",
                                      "focus:opacity-100 active:opacity-100",
                                      "transition-opacity",
                                      activeItem === item._id
                                        ? "text-primary"
                                        : "text-muted-foreground"
                                    )}
                                  >
                                    <MoreVertical className="h-3.5 w-3.5" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  alignOffset={-4}
                                  className="w-[180px]"
                                >
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDeleteMindmap(item._id);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                    Delete {item.title}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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

        <SidebarFooter className="border-t border-border/50 p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 bg-background hover:bg-muted px-4 py-3 h-auto shadow-sm"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">
                    {firstName ? `${firstName} ${lastName || ""}` : userEmail}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {userEmail}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive cursor-pointer flex items-center"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
    </SidebarUpdateContext.Provider>
  );
}
