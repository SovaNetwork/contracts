'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { TestToken } from '@/contracts/addresses'

interface TokenSelectorProps {
  selectedToken: TestToken
  onSelect: (token: TestToken) => void
  tokens: readonly TestToken[]
}

export function TokenSelector({ selectedToken, onSelect, tokens }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-16 justify-between bg-slate-800/50 border-slate-700 hover:border-defi-purple-500/50 hover:bg-slate-800/70"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${selectedToken.color} flex items-center justify-center text-white font-bold text-sm`}>
            {selectedToken.icon}
          </div>
          <div className="text-left">
            <div className="font-medium text-white">{selectedToken.symbol}</div>
            <div className="text-sm text-slate-400">{selectedToken.name}</div>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute top-full left-0 right-0 mt-2 z-50"
            >
              <Card className="defi-card border-slate-700 p-2">
                <div className="space-y-1">
                  {tokens.map((token) => (
                    <motion.button
                      key={token.symbol}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onSelect(token)
                        setIsOpen(false)
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors group"
                    >
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${token.color} flex items-center justify-center text-white font-bold text-sm`}>
                        {token.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-white group-hover:text-defi-purple-300 transition-colors">
                          {token.symbol}
                        </div>
                        <div className="text-sm text-slate-400">{token.name}</div>
                      </div>
                      {selectedToken.symbol === token.symbol && (
                        <Check className="h-4 w-4 text-defi-purple-400" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
} 