"use client"

import { toast } from "sonner"

type ToastProps = {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export const useToast = () => {
  return {
    toast: (props: ToastProps) => {
      if (props.action) {
        return toast(props.title || props.description, {
          description: props.title ? props.description : undefined,
          action: {
            label: props.action.label,
            onClick: props.action.onClick,
          },
        })
      }
      return toast(props.title || props.description, {
        description: props.title ? props.description : undefined,
      })
    },
    success: (message: string, description?: string) => {
      return toast.success(message, {
        description,
      })
    },
    error: (message: string, description?: string) => {
      return toast.error(message, {
        description,
      })
    },
    info: (message: string, description?: string) => {
      return toast.info(message, {
        description,
      })
    },
    warning: (message: string, description?: string) => {
      return toast.warning(message, {
        description,
      })
    },
  }
}
