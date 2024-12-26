'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Globe, Link2, Lock, Share2, X } from 'lucide-react'

interface ShareDialogProps {
  title: string
  mindmapId: string | undefined
  isPublic: boolean
  onVisibilityChange: (isPublic: boolean) => void
}

export function ShareDialog({ title, mindmapId, isPublic, onVisibilityChange }: ShareDialogProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const mindmapUrl = `${window.location.origin}/mindmap/${mindmapId}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mindmapUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000) // Reset after 2 seconds
    }, (err) => {
      console.error('Could not copy text: ', err)
    })
  }

  const handleVisibilityChange = (checked: boolean) => {
    onVisibilityChange(checked)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader className="flex items-center justify-between">
          <DialogTitle className="text-xl font-normal">
            Share "{title}"
          </DialogTitle>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-sm absolute right-4 top-4"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          <div>
            <Label htmlFor="mindmap-link" className="text-sm font-medium mb-2 block">
              Mindmap link
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="mindmap-link"
                value={mindmapUrl}
                readOnly
                className={isPublic ? "" : "opacity-50 cursor-not-allowed"}
              />
              <Button
                variant="outline"
                onClick={handleCopyLink}
                disabled={!isPublic}
                className="w-[100px] transition-all"
              >
                {copied ? (
                  <>
                    <span className="mr-0">✓</span> Copied
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-0" />
                    Copy link
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center space-x-2">
              {isPublic ? (
                <Globe className="h-5 w-5 text-primary" />
              ) : (
                <Lock className="h-5 w-5 text-primary" />
              )}
              <Label htmlFor="public-switch" className="text-sm font-medium">
                {isPublic ? "Public" : "Private"}
              </Label>
            </div>
            <Switch
              id="public-switch"
              checked={isPublic}
              onCheckedChange={handleVisibilityChange}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <p className="text-sm text-muted-foreground">
            {isPublic
              ? "This mindmap is public. Anyone with this link can access it."
              : "This mindmap is private. Only you can access it."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}