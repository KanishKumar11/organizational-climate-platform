"use client"

import { CheckCircleIcon, CopyIcon, ExternalLinkIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface SuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  copyableText?: string
  copyableLabel?: string
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary'
    icon?: React.ReactNode
  }>
}

export function SuccessDialog({
  open,
  onOpenChange,
  title,
  description,
  copyableText,
  copyableLabel,
  actions = [],
}: SuccessDialogProps) {
  const handleCopy = async () => {
    if (copyableText) {
      try {
        await navigator.clipboard.writeText(copyableText)
        // You could add a toast notification here
      } catch (err) {
        console.error('Failed to copy text:', err)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <div className="flex flex-col items-center gap-4">
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-green-100 border-2 border-green-200"
            aria-hidden="true"
          >
            <CheckCircleIcon className="text-green-600 opacity-80" size={24} />
          </div>
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-semibold text-green-900">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>

        {copyableText && (
          <div className="space-y-2">
            {copyableLabel && (
              <Label htmlFor="copyable-text" className="text-sm font-medium">
                {copyableLabel}
              </Label>
            )}
            <div className="flex gap-2">
              <Input
                id="copyable-text"
                value={copyableText}
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="shrink-0"
              >
                <CopyIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {actions.length > 0 ? (
            <>
              {actions.map((action, index) => (
                <Button
                  key={index}
                  type="button"
                  variant={action.variant || 'default'}
                  className="flex-1"
                  onClick={() => {
                    action.onClick()
                    onOpenChange(false)
                  }}
                >
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </Button>
              ))}
              <DialogClose asChild>
                <Button type="button" variant="outline" className="flex-1">
                  Close
                </Button>
              </DialogClose>
            </>
          ) : (
            <DialogClose asChild>
              <Button type="button" className="flex-1">
                OK
              </Button>
            </DialogClose>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
