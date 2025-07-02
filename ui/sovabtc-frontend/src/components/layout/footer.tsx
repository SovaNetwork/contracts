'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Bitcoin, Github, Twitter, ExternalLink, FileText } from 'lucide-react'
import { EXTERNAL_LINKS } from '@/lib/constants'

const footerLinks = {
  protocol: [
    { name: 'Wrap Tokens', href: '/wrap' },
    { name: 'Bridge', href: '/bridge' },
    { name: 'Redeem', href: '/redeem' },
    { name: 'Stake', href: '/stake' },
  ],
  resources: [
    { name: 'Documentation', href: EXTERNAL_LINKS.DOCS, external: true },
    { name: 'GitHub', href: EXTERNAL_LINKS.GITHUB, external: true },
    { name: 'Security', href: '/security', external: false },
    { name: 'Terms', href: '/terms', external: false },
  ],
  community: [
    { name: 'Twitter', href: EXTERNAL_LINKS.TWITTER, external: true },
    { name: 'Discord', href: EXTERNAL_LINKS.DISCORD, external: true },
    { name: 'Telegram', href: '#', external: true },
    { name: 'Medium', href: '#', external: true },
  ],
}

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-sova rounded-full flex items-center justify-center shadow-sova">
                <Bitcoin className="w-5 h-5 text-sova-black" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-none text-sova-black dark:text-sova-mint-100">SovaBTC</span>
                <span className="text-xs text-muted-foreground leading-none">Protocol</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Multi-chain Bitcoin-backed tokens with LayerZero integration, 
              redemption queues, and custodial controls.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Testnet</Badge>
              <Badge variant="outline" className="text-xs">
                v1.0.0-beta
              </Badge>
            </div>
          </div>

          {/* Protocol Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Protocol</h4>
            <ul className="space-y-2">
              {footerLinks.protocol.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Resources</h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      {link.name}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Community Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Community</h4>
            <ul className="space-y-2">
              {footerLinks.community.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    {link.name}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>© 2024 SovaBTC Protocol</span>
            <span>•</span>
            <span>Built on Base, Ethereum & Sova</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={EXTERNAL_LINKS.GITHUB}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="w-9 h-9 p-0">
                <Github className="w-4 h-4" />
                <span className="sr-only">GitHub</span>
              </Button>
            </a>
            <a
              href={EXTERNAL_LINKS.TWITTER}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="w-9 h-9 p-0">
                <Twitter className="w-4 h-4" />
                <span className="sr-only">Twitter</span>
              </Button>
            </a>
            <Link href="/security">
              <Button variant="ghost" size="sm" className="w-9 h-9 p-0">
                <FileText className="w-4 h-4" />
                <span className="sr-only">Security</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

// Minimal footer for auth pages or modals
export function MinimalFooter() {
  return (
    <footer className="border-t py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-sova rounded-full flex items-center justify-center">
              <Bitcoin className="w-4 h-4 text-sova-black" />
            </div>
            <span className="font-semibold text-sova-black dark:text-sova-mint-100">SovaBTC</span>
            <Badge variant="secondary" className="text-xs bg-sova-mint-100 text-sova-mint-800">Testnet</Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a href={EXTERNAL_LINKS.DOCS} target="_blank" rel="noopener noreferrer">
              Docs
            </a>
            <a href={EXTERNAL_LINKS.GITHUB} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <span>© 2024 SovaBTC</span>
          </div>
        </div>
      </div>
    </footer>
  )
} 