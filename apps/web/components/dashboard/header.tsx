'use client';

import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { Button } from '@/components/ui/button';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right">
            <p className="text-sm font-medium">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user?.role || 'user'}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center text-white font-medium">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <Button variant="outline" size="sm" onClick={logout} className="ml-2">
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
