/**
 * Authentication Service Implementation
 */

import type { AuthService, AuthSession, AuthConfig, LoginCredentials } from './types';

export class AuthServiceImpl implements AuthService {
  private session: AuthSession | null = null;
  private config: AuthConfig;
  private listeners = new Set<(session: AuthSession | null) => void>();
  private refreshTimer?: NodeJS.Timeout;

  constructor(config: AuthConfig = {}) {
    this.config = {
      storageKey: 'mfe-auth-session',
      persist: false,
      ...config,
    };
    
    // Load session from storage
    this.loadSession();
    
    // Setup refresh timer if configured
    if (this.config.refreshInterval && this.session) {
      this.setupRefreshTimer();
    }
  }

  getSession(): AuthSession | null {
    return this.session;
  }

  isAuthenticated(): boolean {
    if (!this.session) return false;
    
    // Check if session is expired
    if (this.session.expiresAt && Date.now() > this.session.expiresAt) {
      this.clearSession();
      return false;
    }
    
    return this.session.isAuthenticated;
  }

  getAccessToken(): string | null {
    // In a real implementation, this would return the JWT access token
    // For now, return a mock token if authenticated
    if (this.session && this.session.isAuthenticated) {
      return `mock-access-token-${this.session.userId}`;
    }
    return null;
  }

  getRefreshToken(): string | null {
    // In a real implementation, this would return the refresh token
    // For now, return the refresh token from session if available
    return this.session?.refreshToken || null;
  }

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    // In a real implementation, this would call an API
    // For now, create a mock session
    const session: AuthSession = {
      userId: 'user-123',
      username: credentials.username || credentials.email || 'user',
      email: credentials.email || `${credentials.username}@example.com`,
      roles: ['user'],
      permissions: ['read', 'write'],
      isAuthenticated: true,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    };
    
    this.setSession(session);
    return session;
  }

  async logout(): Promise<void> {
    this.clearSession();
    
    // In a real implementation, might call API to invalidate token
    if (this.config.apiUrl) {
      // await fetch(`${this.config.apiUrl}/logout`, { method: 'POST' });
    }
  }

  async refresh(): Promise<AuthSession> {
    if (!this.session) {
      throw new Error('No session to refresh');
    }
    
    // In a real implementation, this would call an API
    // For now, just extend the expiration
    const refreshedSession = {
      ...this.session,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000),
    };
    
    this.setSession(refreshedSession);
    return refreshedSession;
  }

  subscribe(callback: (session: AuthSession | null) => void): () => void {
    this.listeners.add(callback);
    
    // Call immediately with current state
    callback(this.session);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  private setSession(session: AuthSession): void {
    this.session = session;
    this.saveSession();
    this.notifyListeners();
    
    // Setup refresh timer
    if (this.config.refreshInterval) {
      this.setupRefreshTimer();
    }
  }

  private clearSession(): void {
    this.session = null;
    this.removeSession();
    this.notifyListeners();
    
    // Clear refresh timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
    
    // Call expiration callback
    if (this.config.onSessionExpired) {
      this.config.onSessionExpired();
    }
  }

  private loadSession(): void {
    if (typeof window === 'undefined') return;
    
    const storage = this.config.persist ? localStorage : sessionStorage;
    const stored = storage.getItem(this.config.storageKey!);
    
    if (stored) {
      try {
        this.session = JSON.parse(stored);
        
        // Check if expired
        if (this.session && this.session.expiresAt && Date.now() > this.session.expiresAt) {
          this.clearSession();
        }
      } catch (error) {
        console.error('Failed to load auth session:', error);
        this.clearSession();
      }
    }
  }

  private saveSession(): void {
    if (typeof window === 'undefined' || !this.session) return;
    
    const storage = this.config.persist ? localStorage : sessionStorage;
    storage.setItem(this.config.storageKey!, JSON.stringify(this.session));
  }

  private removeSession(): void {
    if (typeof window === 'undefined') return;
    
    const storage = this.config.persist ? localStorage : sessionStorage;
    storage.removeItem(this.config.storageKey!);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.session));
  }

  private setupRefreshTimer(): void {
    // Clear existing timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    // Setup new timer
    if (this.config.refreshInterval && this.session) {
      this.refreshTimer = setInterval(() => {
        this.refresh().catch(error => {
          console.error('Failed to refresh auth session:', error);
          this.clearSession();
        });
      }, this.config.refreshInterval);
    }
  }

  dispose(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    this.listeners.clear();
  }
}

/**
 * Create an auth service instance
 */
export function createAuthService(config?: AuthConfig): AuthService {
  return new AuthServiceImpl(config);
}