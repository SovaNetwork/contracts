'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Wrap', href: '/wrap' },
    { name: 'Stake', href: '/stake' },
    { name: 'Redeem', href: '/redeem' },
    { name: 'Analytics', href: '/analytics' },
    { name: 'Admin', href: '/admin' },
  ];

  return (
    <header className="border-b border-border/40 bg-background/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink"></div>
            <h1 className="text-xl font-bold gradient-text">{APP_NAME}</h1>
          </Link>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-foreground/80 hover:text-foreground transition-colors relative py-2",
                  pathname === item.href && "text-foreground"
                )}
              >
                {item.name}
                {pathname === item.href && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-defi-purple to-defi-pink rounded-full" />
                )}
              </Link>
            ))}
          </nav>
          
          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            <ConnectButton />
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 flex flex-wrap gap-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "text-sm text-foreground/80 hover:text-foreground transition-colors px-3 py-1 rounded-md",
                pathname === item.href && "text-foreground bg-card/50"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
} 