"use client"

import { useState } from "react"
import { CircleAlertIcon, Trash2Icon, AlertTriangleIcon, InfoIcon } from "lucide-react"

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

export interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'warning' | 'info'
  onConfirm: () => void | Promise<void>
  loading?: boolean
}

const variantConfig = {
  default: {
    icon: InfoIcon,
    iconColor: "text-blue-600",
    confirmVariant: "default" as const,
  },
  destructive: {
    icon: CircleAlertIcon,
    iconColor: "text-red-600",
    confirmVariant: "destructive" as const,
  },
  warning: {
    icon: AlertTriangleIcon,
    iconColor: "text-orange-600",
    confirmVariant: "default" as const,
  },
  info: {
    icon: InfoIcon,
    iconColor: "text-blue-600",
    confirmVariant: "default" as const,
  },
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  loading = false,
}: ConfirmationDialogProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  const handleConfirm = async () => {
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      // Error handling is done by the parent component
      console.error('Confirmation action failed:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="flex flex-col items-center gap-4">
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-full border-2"
            aria-hidden="true"
          >
            <Icon className={`${config.iconColor} opacity-80`} size={24} />
          </div>
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-semibold">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <DialogClose asChild>
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              disabled={loading}
            >
              {cancelText}
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant={config.confirmVariant}
            className="flex-1"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook for easier usage
export function useConfirmationDialog() {
  const [dialogState, setDialogState] = useState<{
    open: boolean
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive' | 'warning' | 'info'
    onConfirm: () => void | Promise<void>
    loading?: boolean
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  })

  const showConfirmation = (config: Omit<typeof dialogState, 'open'>) => {
    setDialogState({ ...config, open: true })
  }

  const hideConfirmation = () => {
    setDialogState(prev => ({ ...prev, open: false }))
  }

  const ConfirmationDialogComponent = () => (
    <ConfirmationDialog
      {...dialogState}
      onOpenChange={hideConfirmation}
    />
  )

  return {
    showConfirmation,
    hideConfirmation,
    ConfirmationDialog: ConfirmationDialogComponent,
  }
}
