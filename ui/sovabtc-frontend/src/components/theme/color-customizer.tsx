'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Palette,
  RefreshCw,
  Download,
  Upload,
  Copy,
  Check,
  Sparkles,
  Sun,
  Moon,
  Monitor
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'

// Predefined color themes
const PRESET_THEMES = [
  {
    name: 'Sova Mint',
    description: 'Original Sova brand colors',
    className: '',
    colors: {
      primary: '128 65% 70%',
      primaryLight: '128 55% 80%',
      primaryDark: '128 75% 60%',
    }
  },
  {
    name: 'Ocean Blue',
    description: 'Calming blue tones',
    className: 'theme-blue',
    colors: {
      primary: '210 100% 60%',
      primaryLight: '210 80% 70%',
      primaryDark: '210 100% 50%',
    }
  },
  {
    name: 'Royal Purple',
    description: 'Rich purple palette',
    className: 'theme-purple',
    colors: {
      primary: '270 95% 65%',
      primaryLight: '270 75% 75%',
      primaryDark: '270 95% 55%',
    }
  },
  {
    name: 'Sunset Orange',
    description: 'Warm orange gradient',
    className: 'theme-orange',
    colors: {
      primary: '25 95% 60%',
      primaryLight: '25 85% 70%',
      primaryDark: '25 95% 50%',
    }
  },
  {
    name: 'Rose Pink',
    description: 'Elegant rose tones',
    className: 'theme-rose',
    colors: {
      primary: '330 85% 65%',
      primaryLight: '330 65% 75%',
      primaryDark: '330 85% 55%',
    }
  },
  {
    name: 'Forest Green',
    description: 'Natural emerald green',
    className: 'theme-emerald',
    colors: {
      primary: '160 85% 45%',
      primaryLight: '160 65% 55%',
      primaryDark: '160 85% 35%',
    }
  }
]

const COLOR_EXAMPLES = [
  { label: 'Primary Button', element: 'button', class: 'btn-primary' },
  { label: 'Card Border', element: 'div', class: 'card-featured' },
  { label: 'Focus Ring', element: 'input', class: 'input-modern' },
  { label: 'Link Text', element: 'span', class: 'text-gradient' },
]

export function ColorCustomizer() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('')
  const [customColors, setCustomColors] = useState({
    primary: '128 65% 70%',
    primaryLight: '128 55% 80%',
    primaryDark: '128 75% 60%',
  })
  const [copied, setCopied] = useState(false)
  const { theme, setTheme } = useTheme()

  // Apply theme changes to the root element
  useEffect(() => {
    const root = document.documentElement
    
    // Remove all theme classes
    PRESET_THEMES.forEach(preset => {
      if (preset.className) {
        root.classList.remove(preset.className)
      }
    })
    
    // Apply selected theme
    if (selectedTheme) {
      const themeData = PRESET_THEMES.find(t => t.name === selectedTheme)
      if (themeData?.className) {
        root.classList.add(themeData.className)
      }
      
      // Update custom colors to match preset
      if (themeData) {
        setCustomColors(themeData.colors)
      }
    }
  }, [selectedTheme])

  // Apply custom CSS variables
  useEffect(() => {
    const root = document.documentElement
    const style = root.style
    
    style.setProperty('--primary', customColors.primary)
    style.setProperty('--primary-light', customColors.primaryLight)
    style.setProperty('--primary-dark', customColors.primaryDark)
    style.setProperty('--shadow-color', `${customColors.primary.split(' ')[0]}deg ${customColors.primary.split(' ')[1]} ${customColors.primary.split(' ')[2]}`)
  }, [customColors])

  const handleThemeSelect = (themeName: string) => {
    setSelectedTheme(themeName)
  }

  const handleColorChange = (colorKey: keyof typeof customColors, value: string) => {
    setCustomColors((prev: typeof customColors) => ({
      ...prev,
      [colorKey]: value
    }))
    setSelectedTheme('') // Clear preset selection when customizing
  }

  const resetToDefault = () => {
    setSelectedTheme('Sova Mint')
    setCustomColors({
      primary: '128 65% 70%',
      primaryLight: '128 55% 80%',
      primaryDark: '128 75% 60%',
    })
  }

  const exportTheme = () => {
    const themeData = {
      selectedTheme,
      customColors,
      darkMode: theme === 'dark'
    }
    
    const dataStr = JSON.stringify(themeData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'sovabtc-theme.json'
    link.click()
    
    URL.revokeObjectURL(url)
  }

  const copyThemeConfig = async () => {
    const config = `
:root {
  --primary: ${customColors.primary};
  --primary-light: ${customColors.primaryLight};
  --primary-dark: ${customColors.primaryDark};
}
    `.trim()
    
    try {
      await navigator.clipboard.writeText(config)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Palette className="w-4 h-4" />
          Customize Colors
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Theme Customizer
          </DialogTitle>
          <DialogDescription>
            Customize the color scheme across the entire application. Changes apply instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Theme Mode Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Appearance Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  className="gap-2"
                >
                  <Sun className="w-4 h-4" />
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className="gap-2"
                >
                  <Moon className="w-4 h-4" />
                  Dark
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('system')}
                  className="gap-2"
                >
                  <Monitor className="w-4 h-4" />
                  System
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preset Themes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preset Themes</CardTitle>
              <CardDescription>
                Choose from pre-designed color schemes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PRESET_THEMES.map((preset) => (
                  <Card
                    key={preset.name}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedTheme === preset.name && "ring-2 ring-primary"
                    )}
                    onClick={() => handleThemeSelect(preset.name)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{preset.name}</h4>
                        {selectedTheme === preset.name && (
                          <Badge variant="default" className="text-xs">Active</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {preset.description}
                      </p>
                      <div className="flex gap-2">
                        <div 
                          className="w-6 h-6 rounded-full border shadow-sm"
                          style={{ backgroundColor: `hsl(${preset.colors.primary})` }}
                        />
                        <div 
                          className="w-6 h-6 rounded-full border shadow-sm"
                          style={{ backgroundColor: `hsl(${preset.colors.primaryLight})` }}
                        />
                        <div 
                          className="w-6 h-6 rounded-full border shadow-sm"
                          style={{ backgroundColor: `hsl(${preset.colors.primaryDark})` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Color Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Live Preview</CardTitle>
              <CardDescription>
                See how your colors look across different components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Example Button */}
                <div className="space-y-2">
                  <Label>Primary Button</Label>
                  <Button className="btn-primary w-full">
                    Start Wrapping
                  </Button>
                </div>

                {/* Example Card */}
                <div className="space-y-2">
                  <Label>Featured Card</Label>
                  <div className="card-featured p-4">
                    <div className="font-medium">Portfolio Balance</div>
                    <div className="text-sm text-muted-foreground">Total value</div>
                  </div>
                </div>

                {/* Example Input */}
                <div className="space-y-2">
                  <Label>Input Field</Label>
                  <input 
                    className="input-modern w-full" 
                    placeholder="Enter amount..."
                    onFocus={(e) => e.target.blur()} // Prevent actual focus for demo
                  />
                </div>

                {/* Example Text */}
                <div className="space-y-2">
                  <Label>Gradient Text</Label>
                  <div className="text-gradient text-xl font-bold">
                    SovaBTC Protocol
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button onClick={resetToDefault} variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Reset to Default
                </Button>
                
                <Button onClick={exportTheme} variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export Theme
                </Button>
                
                <Button onClick={copyThemeConfig} variant="outline" size="sm" className="gap-2">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy CSS'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Compact version for header
export function ColorCustomizerCompact() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 px-2">
          <Palette className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Theme</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-2">
          {PRESET_THEMES.slice(0, 6).map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              className="h-12 flex-col gap-1 p-2"
              onClick={() => {
                const root = document.documentElement
                PRESET_THEMES.forEach(t => t.className && root.classList.remove(t.className))
                if (preset.className) root.classList.add(preset.className)
              }}
            >
              <div 
                className="w-4 h-4 rounded-full border"
                style={{ backgroundColor: `hsl(${preset.colors.primary})` }}
              />
              <span className="text-xs">{preset.name.split(' ')[0]}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}