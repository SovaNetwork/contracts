'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bitcoin, Menu } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
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
]

export function Header() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-white/10 defi-card backdrop-blur-xl"
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="relative"
          >
            <Bitcoin className="h-8 w-8 text-defi-purple-400" />
            <div className="absolute -inset-1 bg-defi-purple-500/20 rounded-full blur-sm group-hover:blur-md transition-all duration-300" />
          </motion.div>
          <motion.span 
            className="text-xl font-bold gradient-text"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            SovaBTC
          </motion.span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative px-4 py-2 rounded-lg transition-all duration-200"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-defi-purple-500/20 border border-defi-purple-500/30 rounded-lg"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className={`relative z-10 text-sm font-medium transition-colors duration-200 ${
                    isActive 
                      ? 'text-defi-purple-300' 
                      : 'text-slate-300 hover:text-white'
                  }`}>
                    {item.name}
                  </span>
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* Wallet Connection */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:block">
            <ConnectButton 
              showBalance={false}
              chainStatus="icon"
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
            />
          </div>
          <div className="sm:hidden">
            <ConnectButton 
              showBalance={false}
              chainStatus="none"
              accountStatus="avatar"
            />
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="defi-card border-white/10">
              <nav className="flex flex-col space-y-4 mt-8">
                {navigation.map((item) => (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                  >
                    <motion.div
                      whileHover={{ x: 10 }}
                      className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        pathname === item.href
                          ? 'bg-defi-purple-500/20 text-defi-purple-300 border border-defi-purple-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {item.name}
                    </motion.div>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  )
}