import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAppContext } from '@/context/AppContext';
import { 
  Bot, 
  BarChart, 
  Gift, 
  Settings, 
  Menu,
  TerminalSquare,
  Activity,
  ListTodo
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/tasks', label: 'مهامي اليومية', icon: ListTodo, shortLabel: 'Tasks' },
  { path: '/chat', label: 'AI Code Assistant', icon: Bot, shortLabel: 'Chat' },
  { path: '/analyze', label: 'Data Analyzer', icon: BarChart, shortLabel: 'Analyze' },
  { path: '/rewards', label: 'Rewards Researcher', icon: Gift, shortLabel: 'Rewards' },
];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { totalTokens, apiKey } = useAppContext();

  const isSettingsMissing = !apiKey && location !== '/settings';

  const NavLinks = ({ className, onItemClick }: { className?: string, onItemClick?: () => void }) => (
    <div className={cn("flex flex-col space-y-1", className)}>
      <Link href="/" className="mb-6 px-4">
        <div className="flex items-center space-x-2 space-x-reverse cursor-pointer">
          <TerminalSquare className="w-8 h-8 text-primary" />
          <span className="font-bold text-lg tracking-tight">Smart Assistant</span>
        </div>
      </Link>
      
      <div className="text-xs font-semibold text-muted-foreground px-4 mb-2 uppercase tracking-wider">
        Tools
      </div>

      {navItems.map((item) => {
        const isActive = location === item.path;
        return (
          <Link 
            key={item.path} 
            href={item.path}
            onClick={onItemClick}
            className={cn(
              "w-full flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-md text-sm font-medium transition-colors cursor-pointer",
              isActive 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <div className="flex-1" />

      <div className="mt-8 mb-2 px-4">
        <div className="flex items-center space-x-2 space-x-reverse py-3 border-t border-border mt-4">
          <Activity className="w-4 h-4 text-primary" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Tokens Used</span>
            <span className="text-sm font-mono font-medium">{totalTokens.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <Link href="/settings">
        <button 
          onClick={onItemClick}
          className={cn(
            "w-full flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-md text-sm font-medium transition-colors",
            location === '/settings'
              ? "bg-primary/10 text-primary" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            !apiKey && "text-destructive hover:bg-destructive/10"
          )}
        >
          <Settings className="w-5 h-5" />
          <span className="flex-1 text-left">Settings</span>
          {!apiKey && (
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          )}
        </button>
      </Link>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background" dir="ltr">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card">
        <NavLinks className="flex-1 py-6 px-4 flex flex-col h-full" />
      </aside>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <Link href="/">
            <div className="flex items-center space-x-2 space-x-reverse cursor-pointer">
              <TerminalSquare className="w-6 h-6 text-primary" />
              <span className="font-bold tracking-tight">Smart Assistant</span>
            </div>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <NavLinks className="py-6 px-4 h-full flex flex-col" />
            </SheetContent>
          </Sheet>
        </header>

        {/* Missing API Key Warning */}
        {isSettingsMissing && (
          <div className="bg-destructive/10 border-b border-destructive/20 p-3 px-4 flex items-center justify-between text-sm">
            <span className="text-destructive font-medium flex items-center">
              <span className="w-2 h-2 rounded-full bg-destructive mr-2 animate-pulse" />
              API Key is missing. Please configure it to use AI tools.
            </span>
            <Link href="/settings">
              <Button size="sm" variant="outline" className="h-8 border-destructive/30 hover:bg-destructive/20 text-destructive">
                Go to Settings
              </Button>
            </Link>
          </div>
        )}

        <main className="flex-1 overflow-auto relative">
          <div className="absolute inset-0 max-w-7xl mx-auto w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
