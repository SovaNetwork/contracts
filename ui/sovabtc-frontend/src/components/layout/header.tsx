'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ConnectWallet } from '@/components/web3/connect-wallet'
import { NetworkInfo } from '@/components/web3/network-switcher'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Menu, Bitcoin, ArrowLeftRight, Coins, TrendingUp, Settings, ExternalLink, Shield, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EXTERNAL_LINKS } from '@/lib/constants'
import { useIsOwner } from '@/hooks/use-admin'

const navigationItems = [
  {
    name: 'Wrap',
    href: '/wrap',
    icon: Bitcoin,
    description: 'Wrap BTC tokens into SovaBTC',
  },
  {
    name: 'Bridge',
    href: '/bridge',
    icon: ArrowLeftRight,
    description: 'Bridge SovaBTC across chains',
  },
  {
    name: 'Redeem',
    href: '/redeem',
    icon: Coins,
    description: 'Redeem SovaBTC for BTC tokens',
  },
  {
    name: 'Stake',
    href: '/stake',
    icon: TrendingUp,
    description: 'Stake SovaBTC to earn rewards',
  },
  {
    name: 'Portfolio',
    href: '/portfolio',
    icon: Settings,
    description: 'View your portfolio and history',
  },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [colorMenuOpen, setColorMenuOpen] = useState(false)
  const pathname = usePathname()
  const { isOwner } = useIsOwner()

  // Color theme presets
  const colorThemes = [
    { name: 'Sova Mint', class: '', color: '#84F29B' },
    { name: 'Ocean Blue', class: 'theme-blue', color: '#3B82F6' },
    { name: 'Royal Purple', class: 'theme-purple', color: '#8B5CF6' },
    { name: 'Sunset Orange', class: 'theme-orange', color: '#F97316' },
    { name: 'Rose Pink', class: 'theme-rose', color: '#EC4899' },
    { name: 'Forest Green', class: 'theme-emerald', color: '#10B981' },
  ]

  const applyColorTheme = (themeClass: string) => {
    const root = document.documentElement
    // Remove all theme classes
    colorThemes.forEach(theme => {
      if (theme.class) root.classList.remove(theme.class)
    })
    // Apply new theme
    if (themeClass) root.classList.add(themeClass)
    setColorMenuOpen(false)
  }

  // Close color menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (colorMenuOpen && !target.closest('.color-menu-container')) {
        setColorMenuOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [colorMenuOpen])

  // Admin navigation item - only shown for owners, points to secret path
  const adminNavItem = {
    name: 'Admin',
    href: '/admin-x7k9j2n8', // Secret admin path
    icon: Shield,
    description: 'Protocol administration panel',
  }

  const allNavigationItems = isOwner ? [...navigationItems, adminNavItem] : navigationItems

  return (
    <header className="sticky top-0 z-50 w-full border-b border-sova-mint-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex h-20 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 rounded-xl flex items-center justify-center shadow-2xl shadow-sova-mint-500/25">
              <Bitcoin className="w-7 h-7 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl leading-none text-sova-black-500">SovaBTC</span>
              <span className="text-sm text-sova-black-400 leading-none font-medium">Protocol</span>
            </div>
          </Link>
          <Badge className="hidden sm:flex bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 text-white border-none font-medium shadow-lg">
            Testnet
          </Badge>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2">
          {allNavigationItems.map((item) => {
            const isActive = pathname === item.href
            const isAdminItem = item.href.includes('/admin-')
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "flex items-center gap-2 font-medium transition-all duration-200",
                    isActive && "bg-gradient-to-r from-sova-mint-500 to-sova-mint-600 text-white shadow-lg",
                    !isActive && "hover:bg-sova-mint-50 hover:text-sova-black-500",
                    isAdminItem && "bg-gradient-to-r from-red-500 to-red-600 text-white border border-red-600 shadow-lg hover:from-red-600 hover:to-red-700"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Right side - Network Info + Theme Toggle + Wallet Connect */}
        <div className="flex items-center gap-4">
          {/* Network Info (Desktop) */}
          <div className="hidden sm:block">
            <NetworkInfo />
          </div>

          {/* Color Theme Selector */}
          <div className="relative color-menu-container">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setColorMenuOpen(!colorMenuOpen)}
              className="gap-2 bg-gradient-to-r from-sova-mint-100 to-sova-mint-200 hover:from-sova-mint-200 hover:to-sova-mint-300 text-sova-black-600"
            >
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Colors</span>
            </Button>
            
            {colorMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-card border border-border rounded-lg shadow-xl z-50 p-4">
                <div className="text-sm font-medium mb-3">Choose Color Theme</div>
                <div className="grid grid-cols-2 gap-2">
                  {colorThemes.map((theme) => (
                    <Button
                      key={theme.name}
                      variant="outline"
                      size="sm"
                      onClick={() => applyColorTheme(theme.class)}
                      className="flex items-center gap-2 justify-start h-10"
                    >
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: theme.color }}
                      />
                      <span className="text-xs">{theme.name}</span>
                    </Button>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    Changes apply instantly across all pages
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <div className="p-1 bg-gradient-to-r from-sova-mint-100 to-sova-mint-200 rounded-lg">
            <ThemeToggle />
          </div>

          {/* Wallet Connection */}
          <ConnectWallet />

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm" className="p-2 hover:bg-sova-mint-50">
                <Menu className="w-6 h-6 text-sova-black-500" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Bitcoin className="w-5 h-5" />
                  SovaBTC Protocol
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                {/* Network Info (Mobile) */}
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">Network</div>
                  <NetworkInfo />
                </div>

                {/* Navigation Items */}
                <nav className="space-y-2">
                  {allNavigationItems.map((item) => {
                    const isActive = pathname === item.href
                    const isAdminItem = item.href.includes('/admin-')
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-accent",
                          isActive && "bg-accent",
                          isAdminItem && "bg-red-50 border border-red-200 dark:bg-red-900/30 dark:border-red-800"
                        )}
                      >
                        <item.icon className={cn("w-5 h-5", isAdminItem && "text-red-600 dark:text-red-400")} />
                        <div>
                          <div className={cn("font-medium", isAdminItem && "text-red-700 dark:text-red-300")}>
                            {item.name}
                            {isAdminItem && (
                              <Badge variant="outline" className="ml-2 text-xs bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800">
                                Admin
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </nav>

                {/* External Links */}
                <div className="pt-4 border-t">
                  <div className="text-sm font-medium mb-2">External Links</div>
                  <div className="space-y-2">
                    <a
                      href={EXTERNAL_LINKS.DOCS}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-sm">Documentation</span>
                    </a>
                    <a
                      href={EXTERNAL_LINKS.GITHUB}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <ExternalLink className="w-4 w-4" />
                      <span className="text-sm">GitHub</span>
                    </a>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

// Breadcrumb component for page navigation
export function PageHeader({ 
  title, 
  description, 
  children 
}: { 
  title: string
  description?: string
  children?: React.ReactNode 
}) {
  return (
    <div className="border-b border-sova-mint-200 bg-gradient-to-r from-white to-sova-mint-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-sova-black-500">{title}</h1>
            {description && (
              <p className="text-sova-black-600 mt-2 text-lg">{description}</p>
            )}
          </div>
          {children && (
            <div className="flex items-center gap-2">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 