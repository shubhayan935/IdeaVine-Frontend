'use client'

import { useState, useEffect, createContext } from 'react'
import { Plus, Leaf ,Users, Home, User2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { useNavigate } from 'react-router-dom'
import { useUserInfo } from './context/UserContext'
import { ThemeToggle, ThemeProvider } from './ThemeProvider'

interface Mindmap {
  _id: string
  user_uid: string
  title: string
  description: string
  created_at: string
  updated_at: string
  last_accessed: string
  metadata: {
    total_nodes: number
    max_depth: number
    tags: string[]
  }
  shared_with?: string[]
}

type Theme = "light" | "dark"

interface ThemeOption {
  name: Theme
  primaryColor: string
  secondaryColor: string
  label: string
}

const themeOptions: ThemeOption[] = [
  { name: "light", primaryColor: "#ffffff", secondaryColor: "#000000", label: "Light" },
  { name: "dark", primaryColor: "#1a1a1a", secondaryColor: "#ffffff", label: "Dark" },
]

export const SidebarUpdateContext = createContext<{
  updateSidebarTitle: (mindmapId: string, newTitle: string) => void
  activeFilter: string
  setActiveFilter: (filter: string) => void
}>({
  updateSidebarTitle: () => {},
  activeFilter: 'all',
  setActiveFilter: () => {},
})

export function AppSidebar() {
  const [___, setActiveItem] = useState<string | null>(null)
  const [____, _] = useState("")
  const [theme, setTheme] = useState<Theme>("dark")
  const [______, setMindmaps] = useState<Mindmap[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [__, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const navigate = useNavigate()
  const { userEmail } = useUserInfo()

  const updateSidebarTitle = (mindmapId: string, newTitle: string) => {
    setMindmaps((prevMindmaps) =>
      prevMindmaps.map((mindmap) =>
        mindmap._id === mindmapId ? { ...mindmap, title: newTitle } : mindmap
      )
    )
  }

  // const getUserInitials = () => {
  //   if (!userEmail) return "U"
  //   const initials = `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase()
  //   return initials || "U"
  // }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") as Theme
      if (savedTheme && themeOptions.some((option) => option.name === savedTheme)) {
        setTheme(savedTheme)
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setTheme("dark")
      }
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.remove(...themeOptions.map((option) => option.name))
    document.documentElement.classList.add(theme)
    localStorage.setItem("theme", theme)
  }, [theme])

  // const handleLogout = async () => {
  //   try {
  //     await signOut()
  //     navigate("/")
  //   } catch (error) {
  //     console.error("Error logging out:", error)
  //   }
  // }

  const handleCreateMindmap = async () => {
    if (!userEmail) return

    const newMindmapId = `mindmap_${Date.now()}`;
  
    const requestBody = {
      "mindmap_id": newMindmapId,
      "user_email": userEmail,
      "title": "Untitled Mind Map",
      "description": "",
      "tags": [],
      "nodes": []
    };

    console.log(requestBody);

    try {
      setLoading(true)
      setError(null)

      console.log(requestBody);

      const response = await fetch("https://ideavine.onrender.com/mindmaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create mindmap")
      }

      const data = await response.json()
      setMindmaps((prevMindmaps) => [data.mindmap, ...prevMindmaps])
      setActiveItem(newMindmapId)
      navigate(`/mindmap/${newMindmapId}`)
    } catch (err: any) {
      console.error("Error creating mindmap:", err)
      setError(err.message || "An error occurred while creating mindmap")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchMindmaps = async () => {
      if (!userEmail) return

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`https://ideavine.onrender.com/users/lookup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch user UID")
        }

        const data = await response.json()
        const userUid = data.user._id

        const mindmapsResponse = await fetch(`https://ideavine.onrender.com/users/${userUid}/mindmaps`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        if (!mindmapsResponse.ok) {
          const errorData = await mindmapsResponse.json()
          throw new Error(errorData.error || "Failed to fetch mindmaps")
        }

        const mindmapsData = await mindmapsResponse.json()
        const sortedMindmaps = mindmapsData.mindmaps.sort(
          (a: Mindmap, b: Mindmap) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
        setMindmaps(sortedMindmaps)
      } catch (err: any) {
        console.error("Error fetching mindmaps:", err)
        setError(err.message || "An error occurred while fetching mindmaps")
      } finally {
        setLoading(false)
      }
    }

    fetchMindmaps()
  }, [userEmail])

  // const handleDeleteMindmap = async (mindmapId: string) => {
  //   try {
  //     const response = await fetch(`https://ideavine.onrender.com/mindmaps/${mindmapId}`, {
  //       method: "DELETE",
  //       headers: { "Content-Type": "application/json" },
  //     })

  //     if (!response.ok) {
  //       const errorData = await response.json()
  //       throw new Error(errorData.error || "Failed to delete mindmap")
  //     }

  //     setMindmaps((prevMindmaps) => prevMindmaps.filter((map) => map._id !== mindmapId))

  //     if (activeItem === mindmapId) {
  //       const remainingMindmaps = mindmaps.filter((map) => map._id !== mindmapId)
  //       if (remainingMindmaps.length > 0) {
  //         const newActiveMap = remainingMindmaps[0]
  //         setActiveItem(newActiveMap._id)
  //         navigate(`/mindmap/${newActiveMap._id}`)
  //       } else {
  //         // This is the last mindmap, create a new one
  //         await handleCreateMindmap()
  //       }
  //     }
  //   } catch (err: any) {
  //     console.error("Error deleting mindmap:", err.message)
  //   }
  // }

  // const filteredMindmaps = mindmaps.filter((item) =>
  //   item.title.toLowerCase().includes(searchTerm.toLowerCase())
  // )

  const menuItems = [
    { id: 'all', label: 'All projects', icon: Home },
    { id: 'your', label: 'Your projects', icon: User2 },
    { id: 'shared', label: 'Shared with you', icon: Users },
    // { id: 'archived', label: 'Archived', icon: Archive },
    // { id: 'trash', label: 'Trash', icon: Trash2 },
  ]

  return (
    <ThemeProvider>
      <SidebarUpdateContext.Provider value={{ updateSidebarTitle, activeFilter, setActiveFilter }}>
        <Sidebar className="border-r border-border/50 shadow-sm transition-colors duration-300">
          <SidebarHeader>
            <div className="flex items-center justify-between gap-2 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-sm">
                  <Leaf className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-xl tracking-tight">IdeaVine</span>
              </div>
              <ThemeToggle />
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
                    {loading ? "Loading..." : "New Mind Map"}
                  </Button>
                </div>

                <SidebarGroup>
                  {/* <SidebarGroupLabel className="px-4 text-md font-medium text-foreground/70">
                    Filters
                  </SidebarGroupLabel> */}
                  <nav className="space-y-4 p-2">
                    {menuItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <Button
                          key={item.id}
                          variant="ghost"
                          className={cn(
                            "w-full justify-start text-base font-normal h-10 rounded-full",
                            activeFilter === item.id
                              ? "bg-slate-200 dark:bg-slate-800 font-medium"
                              : "bg-transparent hover:bg-slate-200 dark:hover:bg-slate-600"
                          )}
                          onClick={() => setActiveFilter(item.id)}
                        >
                          <Icon className="h-5 w-5 mr-3" />
                          {item.label}
                        </Button>
                      )
                    })}
                  </nav>
                </SidebarGroup>
              </div>
            </ScrollArea>
          </SidebarContent>

          {/* <SidebarFooter className="border-t border-border/50 p-4">
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
                    <span className="text-xs text-muted-foreground">{userEmail}</span>
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
          </SidebarFooter> */}
        </Sidebar>
      </SidebarUpdateContext.Provider>
    </ThemeProvider>
  )
}