'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bitcoin, Menu, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

const navigation = [
  { name: 'Wrap', href: '/wrap' },
  { name: 'Redeem', href: '/redeem' },
  { name: 'Stake', href: '/stake' },
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'Admin', href: '/admin' },
]

export function Header() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-white/10 defi-card backdrop-blur-3xl"
    >
      <div className="container flex h-18 items-center justify-between px-6">
        {/* Enhanced Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="relative"
          >
            <div className="relative">
              <Bitcoin className="h-9 w-9 text-defi-purple-400 relative z-10" />
              <div className="absolute -inset-2 bg-defi-purple-500/20 rounded-full blur-md group-hover:bg-defi-purple-500/30 transition-all duration-300" />
              <div className="absolute -inset-1 bg-defi-purple-500/30 rounded-full blur-sm group-hover:bg-defi-purple-500/40 transition-all duration-300" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-defi-pink-400 animate-pulse" />
          </motion.div>
          <div className="flex flex-col">
            <motion.span 
              className="text-xl font-bold gradient-text"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              SovaBTC
            </motion.span>
            <span className="text-xs text-defi-gray-400 font-medium">Next-Gen DeFi</span>
          </div>
        </Link>

        {/* Enhanced Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative px-5 py-3 rounded-xl transition-all duration-300 defi-focus-ring group"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-defi-gradient-subtle border border-defi-purple-500/30 rounded-xl shadow-purple-glow/20"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className={`relative z-10 text-sm font-semibold transition-all duration-200 ${
                    isActive 
                      ? 'text-defi-purple-300' 
                      : 'text-defi-gray-300 group-hover:text-white'
                  }`}>
                    {item.name}
                  </span>
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 rounded-xl bg-defi-gradient-glow opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* Enhanced Wallet Connection */}
        <div className="flex items-center space-x-4">
          {isMounted ? (
            <>
              <div className="hidden sm:block">
                <div className="relative">
                  <ConnectButton 
                    showBalance={false}
                    chainStatus="icon"
                    accountStatus={{
                      smallScreen: 'avatar',
                      largeScreen: 'full',
                    }}
                  />
                  {/* Glow effect for connected state */}
                  <div className="absolute inset-0 rounded-lg bg-defi-gradient-glow opacity-0 -z-10 transition-opacity duration-300" />
                </div>
              </div>
              <div className="sm:hidden">
                <ConnectButton 
                  showBalance={false}
                  chainStatus="none"
                  accountStatus="avatar"
                />
              </div>
            </>
          ) : (
            <div className="h-10 w-32 bg-defi-gray-700/50 rounded-lg defi-skeleton" />
          )}

          {/* Enhanced Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="defi-button-secondary">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="defi-card border-white/10 backdrop-blur-3xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="relative">
                  <Bitcoin className="h-8 w-8 text-defi-purple-400" />
                  <div className="absolute -inset-1 bg-defi-purple-500/20 rounded-full blur-sm" />
                </div>
                <span className="text-lg font-bold gradient-text">SovaBTC</span>
              </div>
              
              <nav className="flex flex-col space-y-3">
                {navigation.map((item) => (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                  >
                    <motion.div
                      whileHover={{ x: 6, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center px-4 py-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                        pathname === item.href
                          ? 'bg-defi-gradient-subtle text-defi-purple-300 border border-defi-purple-500/30 shadow-purple-glow/20'
                          : 'text-defi-gray-300 hover:text-white hover:bg-defi-gradient-glow'
                      }`}
                    >
                      <span>{item.name}</span>
                      {pathname === item.href && (
                        <div className="ml-auto w-2 h-2 bg-defi-purple-400 rounded-full animate-pulse" />
                      )}
                    </motion.div>
                  </Link>
                ))}
              </nav>
              
              {/* Mobile menu footer */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="defi-separator mb-4" />
                <div className="text-center">
                  <p className="text-xs text-defi-gray-400">
                    Next-Gen Bitcoin DeFi
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  )
}