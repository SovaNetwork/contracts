"use client"

import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bitcoin, Menu, Sparkles, Shield, TrendingUp, ArrowDownUp, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

const navigation = [
  { name: 'Wrap', href: '/wrap', icon: Bitcoin },
  { name: 'Stake', href: '/stake', icon: TrendingUp },
  { name: 'Redeem', href: '/redeem', icon: ArrowDownUp },
  { name: 'Portfolio', href: '/portfolio', icon: BarChart3 },
  { name: 'Admin', href: '/admin', icon: Shield },
]

export function NavBar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className="fixed top-0 left-0 right-0 z-50 bg-obsidian-900/90 backdrop-blur-xl border-b border-obsidian-800/50"
    >
      <div className="neo-card border-0 rounded-none border-b border-obsidian-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3"
            >
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-bitcoin-500 to-bitcoin-600 flex items-center justify-center group-hover:from-bitcoin-400 group-hover:to-bitcoin-500 transition-all duration-300">
                    <Bitcoin className="w-6 h-6 text-obsidian-900" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse-glow" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">
                    <span className="aurora-text">Sova</span>
                    <span className="bitcoin-gradient-text">BTC</span>
                  </h1>
                </div>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant="ghost"
                      className={`
                        relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-xl
                        ${isActive 
                          ? 'text-bitcoin-400 bg-bitcoin-500/10 border border-bitcoin-500/20 shadow-lg' 
                          : 'text-obsidian-300 hover:text-obsidian-50 hover:bg-obsidian-800/50'
                        }
                      `}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.name}
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-bitcoin-500/10 to-bitcoin-600/10 border border-bitcoin-500/20"
                          transition={{ type: "spring", duration: 0.6 }}
                        />
                      )}
                    </Button>
                  </Link>
                )
              })}
            </div>

            {/* Connect Button & Mobile Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <ConnectButton
                  accountStatus={{
                    smallScreen: 'avatar',
                    largeScreen: 'full',
                  }}
                  chainStatus="icon"
                  showBalance={{
                    smallScreen: false,
                    largeScreen: true,
                  }}
                />
              </div>

              {/* Mobile menu button */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-obsidian-300 hover:text-obsidian-50 hover:bg-obsidian-800/50"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 bg-obsidian-900/95 backdrop-blur-xl border-l border-obsidian-800/50">
                  <div className="flex flex-col space-y-6 mt-8">
                    {/* Mobile Logo */}
                    <div className="flex items-center space-x-3 pb-6 border-b border-obsidian-800/30">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-bitcoin-500 to-bitcoin-600 flex items-center justify-center">
                        <Bitcoin className="w-5 h-5 text-obsidian-900" />
                      </div>
                      <div>
                        <h1 className="text-lg font-bold">
                          <span className="aurora-text">Sova</span>
                          <span className="bitcoin-gradient-text">BTC</span>
                        </h1>
                      </div>
                    </div>

                    {/* Mobile Navigation */}
                    <nav className="flex flex-col space-y-3">
                      {navigation.map((item) => {
                        const isActive = pathname === item.href
                        return (
                          <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
                            <Button
                              variant="ghost"
                              className={`
                                w-full justify-start px-4 py-3 text-left transition-all duration-300 rounded-xl
                                ${isActive 
                                  ? 'text-bitcoin-400 bg-bitcoin-500/10 border border-bitcoin-500/20' 
                                  : 'text-obsidian-300 hover:text-obsidian-50 hover:bg-obsidian-800/50'
                                }
                              `}
                            >
                              <item.icon className="w-5 h-5 mr-3" />
                              {item.name}
                              {isActive && (
                                <Badge className="ml-auto status-badge-success">
                                  Active
                                </Badge>
                              )}
                            </Button>
                          </Link>
                        )
                      })}
                    </nav>

                    {/* Mobile Connect Button */}
                    <div className="pt-6 border-t border-obsidian-800/30">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 text-sm text-obsidian-400">
                          <Sparkles className="w-4 h-4" />
                          <span>Connect your wallet</span>
                        </div>
                        <ConnectButton
                          accountStatus="full"
                          chainStatus="full"
                          showBalance={true}
                        />
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
