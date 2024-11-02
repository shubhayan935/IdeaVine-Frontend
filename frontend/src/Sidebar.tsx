"use client"

import React, { useState, useEffect } from 'react'
import { Search, LogOut, Plus, Leaf, Calendar, Clock, Settings, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
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
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Sample mindmap history data
const mindmapHistory = [
  { id: '1', title: 'Project Brainstorm', date: '2023-07-15', category: 'Work' },
  { id: '2', title: 'Vacation Planning', date: '2023-07-10', category: 'Personal' },
  { id: '3', title: 'Book Chapter Outline', date: '2023-07-05', category: 'Writing' },
  { id: '4', title: 'Weekly Goals', date: '2023-07-01', category: 'Planning' },
  { id: '5', title: 'Product Feature Ideas', date: '2023-06-28', category: 'Work' },
]

type Theme = 'light' | 'dark' | 'beige' | 'lavender' | 'pink'

interface ThemeOption {
  name: Theme
  primaryColor: string
  secondaryColor: string
  label: string
}

const themeOptions: ThemeOption[] = [
  { name: 'light', primaryColor: '#ffffff', secondaryColor: '#000000', label: 'Light' },
  { name: 'dark', primaryColor: '#1a1a1a', secondaryColor: '#ffffff', label: 'Dark' },
  { name: 'beige', primaryColor: '#8b4513', secondaryColor: '#f5f5dc', label: 'Beige' },
  { name: 'lavender', primaryColor: '#e6e6fa', secondaryColor: '#000000', label: 'Lavender' },
]

export function AppSidebar() {
  const [activeItem, setActiveItem] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [theme, setTheme] = useState<Theme>('light')

  const filteredHistory = mindmapHistory.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme
      if (savedTheme && themeOptions.some(option => option.name === savedTheme)) {
        setTheme(savedTheme)
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark')
      }
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.remove(...themeOptions.map(option => option.name))
    document.documentElement.classList.add(theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <Sidebar className="border-r border-border/50 shadow-sm transition-colors duration-300">
      <style jsx global>{`
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
      <SidebarHeader className="">
        <div className="flex items-center justify-between gap-2 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Leaf className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-xl tracking-tight">IdeaVine</span>
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
      <SidebarContent>
        <ScrollArea className="h-[calc(100vh-8rem)] py-6">
          <div className="space-y-6">
            <div className="px-4">
              <Button 
                className="w-full justify-start gap-2 shadow-sm hover:shadow" 
                size="lg"
              >
                <Plus className="h-4 w-4" />
                New Mind Map
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
                <SidebarMenu>
                  {filteredHistory.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={activeItem === item.id}
                        onClick={() => setActiveItem(item.id)}
                      >
                        <a
                          href={`#${item.id}`}
                          className={cn(
                            "group relative flex flex-col gap-2 rounded-lg text-sm transition-all hover:shadow",
                            activeItem === item.id
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-muted"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{item.title}</span>
                          </div>
                          <div className="flex items-center gap-3  text-xs">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              {item.date}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              {item.category}
                            </div>
                          </div>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
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
                <AvatarImage src="/avatars/user.png" alt="User" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">John Doe</span>
                <span className="text-xs text-muted-foreground">john@example.com</span>
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
            <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => console.log("Logging out...")}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}