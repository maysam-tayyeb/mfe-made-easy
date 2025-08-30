import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
// Theme type is now part of the theme service
import { getThemeService } from '@/services/theme-service';
import {
  Moon,
  Sun,
  Menu,
  X,
  LayoutDashboard,
  AlertCircle,
  Sparkles,
  Package,
  Bell,
  MessageSquare,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon?: React.ReactNode;
}

export const Navigation: React.FC = () => {
  const location = useLocation();
  const [theme, setTheme] = useState<string>('light');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const themeService = getThemeService();

  useEffect(() => {
    const unsubscribe = themeService.subscribe((newTheme) => {
      setTheme(newTheme);
    });
    return unsubscribe;
  }, [themeService]);

  const cycleTheme = () => {
    if (themeService.cycleTheme) {
      themeService.cycleTheme();
    } else {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      themeService.setTheme(newTheme);
    }
  };

  const serviceItems: NavItem[] = [
    {
      path: '/services/event-bus',
      label: 'Event Bus',
      icon: <MessageSquare className="h-3.5 w-3.5" />,
    },
    {
      path: '/services/modal',
      label: 'Modal',
      icon: <Package className="h-3.5 w-3.5" />,
    },
    {
      path: '/services/notifications',
      label: 'Notifications',
      icon: <Bell className="h-3.5 w-3.5" />,
    },
    {
      path: '/error-boundary-demo',
      label: 'Error Handling',
      icon: <AlertCircle className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="mx-auto">
        <div className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 mr-8 group">
              <div className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all transform group-hover:scale-105">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-sm hidden sm:block" style={{ color: theme === 'dark' ? '#ffffff' : '#0f172a' }}>MFE Toolkit</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {/* Dashboard as top-level nav */}
              <Link
                to="/dashboard"
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200',
                  location.pathname === '/dashboard'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-800 hover:text-black hover:bg-slate-100/80 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-700/50'
                )}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </Link>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

              {/* Service items as root-level nav */}
              {serviceItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200',
                    location.pathname === item.path
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-800 hover:text-black hover:bg-slate-100/80 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-700/50'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={cycleTheme}
              aria-label="Toggle theme"
              className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
            >
              {theme === 'dark' ? 
                <Sun className="h-4 w-4 text-amber-400" /> : 
                <Moon className="h-4 w-4 text-slate-800" />
              }
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="block lg:!hidden h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
            >
              {mobileMenuOpen ? <X className="h-4 w-4 text-slate-800 dark:text-slate-200" /> : <Menu className="h-4 w-4 text-slate-800 dark:text-slate-200" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="px-3 pt-3 pb-4 space-y-2">
              {/* Dashboard as top-level item */}
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-all',
                  location.pathname === '/dashboard'
                    ? 'bg-blue-600 text-white font-semibold dark:bg-blue-700'
                    : 'text-slate-800 hover:text-black hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-700/70'
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>

              <div className="h-px bg-slate-200 dark:bg-slate-700 mx-3 my-2" />

              {/* Service items */}
              {serviceItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-all',
                    location.pathname === item.path
                      ? 'bg-blue-600 text-white font-semibold dark:bg-blue-700'
                      : 'text-slate-800 hover:text-black hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-700/70'
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
