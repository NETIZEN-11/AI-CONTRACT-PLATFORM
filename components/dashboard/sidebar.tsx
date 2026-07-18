'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: FileText, label: 'Contracts', href: '/contracts' },
  { icon: CheckSquare, label: 'Reviews', href: '/reviews' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden md:flex flex-col w-64 border-r border-border bg-card">
      {/* Logo */}
      <div className="h-16 border-b border-border flex items-center px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">AI</span>
          </div>
          <span>Contract AI</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-border p-4 space-y-2">
        <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-muted/50 transition text-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">JD</span>
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">John Doe</p>
              <p className="text-xs text-muted-foreground">Lawyer</p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4" />
        </button>
        <Button variant="ghost" className="w-full justify-start text-muted-foreground" size="sm">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
