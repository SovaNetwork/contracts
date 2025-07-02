'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useTheme } from './theme-provider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-10 h-10 p-0">
        <div className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else {
      setTheme('light')
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="w-10 h-10 p-0 hover:bg-white/50 transition-all duration-300 relative overflow-hidden"
    >
      {theme === 'light' ? (
        <Sun className="h-5 w-5 text-sova-black-500 transition-all duration-300 rotate-0 scale-100" />
      ) : (
        <Moon className="h-5 w-5 text-sova-mint-500 transition-all duration-300 rotate-0 scale-100" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export function ThemeToggleLarge() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else {
      setTheme('light')
    }
  }

  return (
    <Button
      variant="outline"
      onClick={toggleTheme}
      className="flex items-center gap-3 bg-gradient-to-r from-sova-mint-100 to-sova-mint-200 hover:from-sova-mint-200 hover:to-sova-mint-300 border-sova-mint-300 text-sova-black-500 font-medium transition-all duration-300"
    >
      {theme === 'light' ? (
        <>
          <Sun className="h-5 w-5" />
          Switch to Dark Mode
        </>
      ) : (
        <>
          <Moon className="h-5 w-5" />
          Switch to Light Mode
        </>
      )}
    </Button>
  )
} 