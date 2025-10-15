import * as React from "react"
import { Dialog, DialogContent } from "./dialog"
import { Button } from "./button"
import { X } from "lucide-react"

interface PhotoViewerProps {
  src: string
  alt?: string
  isOpen: boolean
  onClose: () => void
}

export function PhotoViewer({ src, alt, isOpen, onClose }: PhotoViewerProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <img
            src={src}
            alt={alt || "Photo"}
            className="w-full h-auto max-h-[80vh] object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.svg";
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
