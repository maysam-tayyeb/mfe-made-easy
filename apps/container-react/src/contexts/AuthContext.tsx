import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useAuthService } from './ServiceContext';
import type { AuthSession } from '@mfe-toolkit/service-authentication/types';

interface AuthContextType {
  session: AuthSession | null;
  loading: boolean;
  setSession: (session: AuthSession | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Default demo session
const defaultSession: AuthSession = {
  userId: '1',
  username: 'demo-user',
  email: 'demo@example.com',
  roles: ['user'],
  permissions: ['read', 'write'],
  isAuthenticated: true,
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const authService = useAuthService();
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize session from auth service
  useEffect(() => {
    if (authService) {
      const currentSession = authService.getSession();
      setSessionState(currentSession || defaultSession);
      
      // Subscribe to auth changes if available
      const unsubscribe = authService.subscribe?.((newSession) => {
        setSessionState(newSession);
      });
      
      setLoading(false);
      return unsubscribe;
    } else {
      // Fallback to default session if no auth service
      setSessionState(defaultSession);
      setLoading(false);
    }
  }, [authService]);

  const setSession = useCallback((newSession: AuthSession | null) => {
    setSessionState(newSession);
    // Update auth service if available
    if (authService && newSession) {
      // In a real app, this would update the auth service
      // For now, we just update local state
    }
  }, [authService]);

  const logout = useCallback(() => {
    if (authService?.logout) {
      authService.logout();
    } else {
      setSessionState(null);
    }
  }, [authService]);

  const value: AuthContextType = {
    session,
    loading,
    setSession,
    setLoading,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};