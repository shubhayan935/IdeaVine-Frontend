"use client"

import React, { useState } from 'react'
import { Search, LogOut } from "lucide-react"
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

// Sample mindmap history data
const mindmapHistory = [
  { id: '1', title: 'Project Brainstorm', date: '2023-07-15' },
  { id: '2', title: 'Vacation Planning', date: '2023-07-10' },
  { id: '3', title: 'Book Chapter Outline', date: '2023-07-05' },
  { id: '4', title: 'Weekly Goals', date: '2023-07-01' },
  { id: '5', title: 'Product Feature Ideas', date: '2023-06-28' },
]

export function AppSidebar() {
  const [activeItem, setActiveItem] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredHistory = mindmapHistory.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleLogout = () => {
    // Implement logout logic here
    console.log("Logging out...")
  }

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="h-16 flex items-center px-6 m-5">
        <span className="font-semibold text-lg md:text-xl">IdeaVine</span>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-[calc(100vh-8rem)] py-6">
          <SidebarGroup>
            <SidebarGroupLabel>Mindmap History</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-3 mb-4">
                <Input
                  type="search"
                  placeholder="Search mindmaps..."
                  className="w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  startDecorator={<Search className="h-4 w-4 text-muted-foreground" />}
                />
              </div>
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
                          "flex flex-col items-start gap-1 rounded-lg px-3 py-2 text-sm transition-colors",
                          activeItem === item.id
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <span className="font-medium">{item.title}</span>
                        <span className="text-xs opacity-75">{item.date}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <Button
          variant="destructive"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}