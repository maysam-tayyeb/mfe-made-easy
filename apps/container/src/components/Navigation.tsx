import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MFE_CONFIG, Theme } from '@mfe/shared';
import { getGlobalStateManager } from '@mfe/universal-state';
import { Moon, Sun } from 'lucide-react';

export const Navigation: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  const stateManager = getGlobalStateManager();

  useEffect(() => {
    // Subscribe to theme changes
    const currentTheme = stateManager.get<Theme>('theme') || 'light';
    setTheme(currentTheme);

    const unsubscribe = stateManager.subscribe<Theme>('theme', (value) => {
      setTheme(value || 'light');
    });

    return unsubscribe;
  }, [stateManager]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    stateManager.set('theme', newTheme, 'navigation');
  };

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/mfe-communication', label: 'MFE Communication' },
    { path: '/universal-state-demo', label: 'State Demo' },
    { path: '/error-boundary-demo', label: 'Error Demo' },
    {
      path: `/mfe/${MFE_CONFIG.serviceExplorer.id}`,
      label: MFE_CONFIG.serviceExplorer.displayName,
    },
    {
      path: `/mfe/${MFE_CONFIG.legacyServiceExplorer.id}`,
      label: MFE_CONFIG.legacyServiceExplorer.displayName,
    },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4 md:space-x-8">
            <Link to="/" className="text-lg md:text-xl font-bold">
              MFE Platform
            </Link>
            <div className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    location.pathname === item.path
                      ? 'text-foreground border-b-2 border-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Menu</span>
              {mobileMenuOpen ? '✕' : '☰'}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block px-4 py-2 text-sm font-medium transition-colors hover:bg-muted',
                  location.pathname === item.path
                    ? 'text-primary bg-muted'
                    : 'text-muted-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};
