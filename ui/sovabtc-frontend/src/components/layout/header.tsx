'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ConnectWallet } from '@/components/web3/connect-wallet'
import { NetworkInfo } from '@/components/web3/network-switcher'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Menu, Bitcoin, ArrowLeftRight, Coins, TrendingUp, Settings, ExternalLink, Shield } from 'lucide-react'
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
  const pathname = usePathname()
  const { isOwner } = useIsOwner()

  // Admin navigation item - only shown for owners, points to secret path
  const adminNavItem = {
    name: 'Admin',
    href: '/admin-x7k9j2n8', // Secret admin path
    icon: Shield,
    description: 'Protocol administration panel',
  }

  const allNavigationItems = isOwner ? [...navigationItems, adminNavItem] : navigationItems

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/40 supports-[backdrop-filter]:bg-background/80 shadow-elevation-2 dark:shadow-sova-md transition-all duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex h-16 lg:h-20 items-center justify-between">
        {/* Logo with enhanced styling */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group transition-all duration-300 hover:scale-105">
            <div className="relative w-10 h-10 lg:w-12 lg:h-12 bg-gradient-sova rounded-xl flex items-center justify-center shadow-sova transition-all duration-300 group-hover:shadow-sova-md group-hover:animate-glow">
              <Bitcoin className="w-5 h-5 lg:w-7 lg:h-7 text-primary-foreground transition-transform duration-300 group-hover:rotate-12" />
              <div className="absolute inset-0 bg-gradient-sova rounded-xl opacity-0 group-hover:opacity-20 animate-pulse-sova"></div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg lg:text-xl leading-none text-foreground transition-colors duration-300 group-hover:text-primary">
                SovaBTC
              </span>
              <span className="text-xs lg:text-sm text-muted-foreground leading-none font-medium group-hover:text-primary/80 transition-colors duration-300">
                Protocol
              </span>
            </div>
          </Link>
          <Badge className="hidden sm:flex bg-gradient-sova text-primary-foreground border-none font-medium shadow-sova animate-pulse-sova">
            Testnet
          </Badge>
        </div>

        {/* Desktop Navigation with enhanced styling */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {allNavigationItems.map((item) => {
            const isActive = pathname === item.href
            const isAdminItem = item.href.includes('/admin-')
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "relative flex items-center gap-2 font-medium transition-all duration-300 group overflow-hidden",
                    isActive && "bg-gradient-sova text-primary-foreground shadow-sova",
                                         !isActive && "hover:bg-primary/10 hover:text-primary hover:shadow-elevation-2 hover:scale-105 active:scale-95",
                                         isAdminItem && "bg-gradient-to-r from-error-500 to-error-600 text-white border border-error-600 shadow-lg hover:from-error-600 hover:to-error-700 hover:shadow-xl"
                  )}
                >
                  <item.icon className={cn(
                    "w-4 h-4 transition-transform duration-300",
                    !isActive && "group-hover:scale-110"
                  )} />
                  {item.name}
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-foreground rounded-full" />
                  )}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Right side with enhanced styling */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Network Info (Desktop) */}
          <div className="hidden sm:block">
            <NetworkInfo />
          </div>

          {/* Theme Toggle with modern styling */}
          <div className="relative p-1 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20 shadow-inner-sova">
            <ThemeToggle />
          </div>

          {/* Wallet Connection */}
          <ConnectWallet />

          {/* Mobile Menu Button with enhanced animation */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative p-2 hover:bg-primary/10 hover:scale-110 transition-all duration-300 group"
              >
                <Menu className={cn(
                  "w-5 h-5 text-foreground transition-all duration-300",
                  mobileMenuOpen && "rotate-90"
                )} />
                <span className="sr-only">Toggle menu</span>
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-20 bg-gradient-sova transition-opacity duration-300" />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-[300px] sm:w-[400px] glass border-l border-border/40">
              <SheetHeader className="space-y-4">
                <SheetTitle className="flex items-center gap-2 text-lg">
                  <Bitcoin className="w-5 h-5 text-primary" />
                  SovaBTC Protocol
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Network Info (Mobile) with card styling */}
                <div className="card-modern p-4 border border-border/40">
                  <div className="text-sm font-medium mb-3 text-foreground">Network</div>
                  <NetworkInfo />
                </div>

                {/* Navigation Items with enhanced mobile styling */}
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
                          "flex items-center gap-3 p-4 rounded-xl transition-all duration-300 group relative overflow-hidden",
                          isActive && "bg-gradient-sova text-primary-foreground shadow-sova",
                          !isActive && "hover:bg-primary/10 hover:shadow-elevation-2 hover:scale-105",
                          isAdminItem && "bg-error-50 border border-error-200 dark:bg-error-900/30 dark:border-error-800"
                        )}
                      >
                        <div className={cn(
                          "p-2 rounded-lg transition-all duration-300",
                          isActive && "bg-primary-foreground/20",
                          !isActive && "bg-primary/10 group-hover:bg-primary/20",
                          isAdminItem && "bg-error-100 dark:bg-error-900/50"
                        )}>
                          <item.icon className={cn(
                            "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                            isAdminItem && "text-error-600 dark:text-error-400"
                          )} />
                        </div>
                        <div className="flex-1">
                          <div className={cn(
                            "font-medium transition-colors duration-300",
                            isAdminItem && "text-error-700 dark:text-error-300"
                          )}>
                            {item.name}
                            {isAdminItem && (
                              <Badge variant="outline" className="ml-2 text-xs bg-error-100 text-error-700 border-error-300 dark:bg-error-900/30 dark:text-error-300 dark:border-error-800">
                                Admin
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1 transition-colors duration-300 group-hover:text-foreground/80">
                            {item.description}
                          </div>
                        </div>
                        {!isActive && (
                          <div className="absolute inset-0 bg-gradient-sova opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                        )}
                      </Link>
                    )
                  })}
                </nav>

                {/* External Links with modern card styling */}
                <div className="pt-4 border-t border-border/40">
                  <div className="text-sm font-medium mb-3 text-foreground">External Links</div>
                  <div className="space-y-2">
                    <a
                      href={EXTERNAL_LINKS.DOCS}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-all duration-300 hover:scale-105 group"
                    >
                      <ExternalLink className="w-4 h-4 text-primary transition-transform duration-300 group-hover:scale-110" />
                      <span className="text-sm font-medium">Documentation</span>
                    </a>
                    <a
                      href={EXTERNAL_LINKS.GITHUB}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-all duration-300 hover:scale-105 group"
                    >
                      <ExternalLink className="w-4 h-4 text-primary transition-transform duration-300 group-hover:scale-110" />
                      <span className="text-sm font-medium">GitHub</span>
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

// Enhanced Breadcrumb component for page navigation
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
    <div className="relative border-b border-border/40 bg-gradient-to-r from-background via-primary/5 to-background overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-sova-glow opacity-30" />
      <div className="absolute inset-0 bg-noise opacity-[0.02] mix-blend-overlay" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8 lg:py-12 relative">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold tracking-tight text-foreground animate-fade-in">
              {title}
            </h1>
            {description && (
              <p className="text-muted-foreground text-base lg:text-lg max-w-2xl animate-fade-in animation-delay-200">
                {description}
              </p>
            )}
          </div>
          {children && (
            <div className="flex items-center gap-3 animate-fade-in animation-delay-400">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 