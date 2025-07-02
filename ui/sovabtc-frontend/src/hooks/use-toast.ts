import { useState } from 'react'

interface Toast {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = (toastData: Toast) => {
    // In a real implementation, this would integrate with a toast system
    // For now, we'll just console.log
    console.log('Toast:', toastData)
    
    // You could integrate with a toast library like react-hot-toast or sonner here
    setToasts(prev => [...prev, toastData])
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.slice(1))
    }, 5000)
  }

  return { toast, toasts }
} 