'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Leaf, Search, Plus, MoreHorizontal, Trash2, LogOut, Settings, Moon, Sun } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { useUserInfo } from './context/UserContext'
import { useNavigate, Link } from 'react-router-dom'
import { useClerk } from '@clerk/clerk-react'
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AppSidebar, SidebarUpdateContext } from './Sidebar'
import { SidebarProvider } from './components/ui/sidebar'

interface Mindmap {
  _id: string
  title: string
  updated_at: string
  preview_url?: string
}

export default function IdeaVineIntegratedDashboard() {
  const [mindmaps, setMindmaps] = useState<Mindmap[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const { userEmail, firstName, lastName } = useUserInfo()
  const navigate = useNavigate()
  const { signOut } = useClerk()

  useEffect(() => {
    if (userEmail) {
      fetchMindmaps()
    }
  }, [userEmail])

  const fetchMindmaps = async () => {
    try {
      const response = await fetch(`https://ideavine.onrender.com/users/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      })

      if (!response.ok) throw new Error("Failed to fetch user UID")

      const data = await response.json()
      const userUid = data.user._id

      const mindmapsResponse = await fetch(`https://ideavine.onrender.com/users/${userUid}/mindmaps`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (!mindmapsResponse.ok) throw new Error("Failed to fetch mindmaps")

      const mindmapsData = await mindmapsResponse.json()
      const sortedMindmaps = mindmapsData.mindmaps.sort((a: Mindmap, b: Mindmap) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
      setMindmaps(sortedMindmaps)
    } catch (err) {
      console.error("Error fetching mindmaps:", err)
    }
  }

  const handleDeleteMindmap = async (mindmapId: string) => {
    try {
      const response = await fetch(`https://ideavine.onrender.com/mindmaps/${mindmapId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) throw new Error("Failed to delete mindmap")

      setMindmaps(prevMindmaps => prevMindmaps.filter(m => m._id !== mindmapId))
    } catch (err) {
      console.error("Error deleting mindmap:", err)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const filteredMindmaps = mindmaps.filter(mindmap =>
    mindmap.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // const toggleTheme = () => {
  //   setTheme(theme === 'dark' ? 'light' : 'dark')
  // }

  const getUserInitials = () => {
    if (!userEmail) return "U"
    const initials = `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase()
    return initials || "U"
  }

  return (
    <SidebarProvider>
      <div className="flex w-full h-screen bg-background text-foreground">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex-1 pr-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 w-4 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search in IdeaVine"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={toggleTheme}>
                      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle theme</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider> */}
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
                      <span className="text-xs text-muted-foreground" style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>{userEmail}</span>
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
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Your Mind Maps</h1>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMindmaps.map(mindmap => (
                <motion.div
                  key={mindmap._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card 
                    className="overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                    onClick={() => navigate(`/mindmap/${mindmap._id}`)}
                  >
                    <CardHeader className="p-0">
                      <div className="relative aspect-video bg-muted overflow-hidden">
                        {/* <img
                          src={mindmap.preview_url || `/placeholder.svg?height=200&width=400`}
                          alt={`Preview of ${mindmap.title}`}
                          className="w-full h-full object-cover"
                        /> */}
                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                          <Leaf className="h-12 w-12" />
                        </div>
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                          <span className="text-primary-foreground font-semibold">Open Mindmap</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <h2 className="text-lg font-semibold mb-2">{mindmap.title}</h2>
                      <p className="text-xs text-muted-foreground">
                        Last updated: {new Date(mindmap.updated_at).toLocaleString()}
                      </p>
                    </CardContent>
                    <CardFooter className="bg-muted/50 flex justify-end items-center p-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-muted-foreground hover:text-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMindmap(mindmap._id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete mindmap</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}