'use client'

import { toast as sonnerToast } from 'sonner'

interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  className?: string
}

export function useToast() {
  const toast = ({ title, description, variant = "default", className }: ToastProps) => {
    if (variant === "destructive") {
      sonnerToast.error(title, {
        description,
        className: `${className} border-defi-red-500/50 bg-defi-red-500/10`,
      })
    } else {
      sonnerToast.success(title, {
        description,
        className: `${className} border-defi-green-500/50 bg-defi-green-500/10`,
      })
    }
  }

  return { toast }
} 