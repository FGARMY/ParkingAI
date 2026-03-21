"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useAppStore, api } from '@/lib/store'
import { useEffect } from 'react'
import axios from 'axios'

export function TopNav() {
  const pathname = usePathname();
  const { apiStatus, setApiStatus } = useAppStore();

  const navLinks = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  ];

  // Set API status (Hugging Face is Serverless, assume connected)
  useEffect(() => {
    setApiStatus('connected');
  }, [setApiStatus]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground font-bold">
            P
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">Park_AI</span>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/');

            return (
              <a
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                  isActive ? "text-primary" : "text-neutral-dark"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.name}
              </a>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <Badge
            variant="outline"
            className="hidden sm:flex items-center gap-2 px-3 py-1 font-normal bg-background"
          >
            <div className={cn(
              "h-2 w-2 rounded-full",
              apiStatus === 'connected' ? "bg-success" :
                apiStatus === 'degraded' ? "bg-warning" : "bg-danger"
            )} />
            {apiStatus === 'connected' ? 'API Connected' :
              apiStatus === 'degraded' ? 'API Degraded' : 'API Disconnected'}
          </Badge>

          <div className="flex bg-neutral h-9 w-9 items-center justify-center rounded-full text-neutral-dark hover:bg-neutral-dark/10 cursor-pointer transition-colors">
            <User className="h-5 w-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
