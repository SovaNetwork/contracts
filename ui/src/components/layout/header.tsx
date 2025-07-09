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
    { name: 'Swap', href: '/swap' },
    { name: 'Bridge', href: '/bridge' },
    { name: 'Stake', href: '/stake' },
    { name: 'Queue', href: '/redemption-queue' },
    { name: 'Analytics', href: '/analytics' },
    { name: 'Admin', href: '/admin' },
  ];

  return (
    <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-[10000000]" style={{ zIndex: 10000000 }}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-all duration-200 group">
            <div className="h-8 w-8 rounded-full bg-sova-gradient shadow-sova-glow group-hover:shadow-sova-glow-lg transition-all duration-200"></div>
            <h1 className="text-xl font-bold gradient-text">{APP_NAME}</h1>
          </Link>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "nav-link",
                  pathname === item.href && "active"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          
          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            <ConnectButton 
              showBalance={false}
              chainStatus="icon"
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
            />
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 flex flex-wrap gap-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "text-sm px-3 py-2 rounded-lg transition-all duration-200",
                "hover:bg-card/50 hover:text-foreground",
                pathname === item.href 
                  ? "text-sova-mint-400 bg-card/40 border border-sova-mint-500/30" 
                  : "text-foreground/70"
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