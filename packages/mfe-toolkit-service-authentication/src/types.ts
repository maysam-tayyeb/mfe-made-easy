/**
 * Authentication Service Types
 */

export interface AuthSession {
  userId: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  isAuthenticated: boolean;
  expiresAt?: number;
  refreshToken?: string;
}

export interface AuthService {
  /**
   * Get the current authentication session
   */
  getSession(): AuthSession | null;

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean;

  /**
   * Get access token
   */
  getAccessToken?(): string | null;

  /**
   * Get refresh token
   */
  getRefreshToken?(): string | null;

  /**
   * Login user
   */
  login?(credentials: LoginCredentials): Promise<AuthSession>;

  /**
   * Logout user
   */
  logout?(): Promise<void>;

  /**
   * Refresh authentication token
   */
  refresh?(): Promise<AuthSession>;

  /**
   * Subscribe to auth state changes
   */
  subscribe?(callback: (session: AuthSession | null) => void): () => void;
}

export interface LoginCredentials {
  username?: string;
  email?: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthConfig {
  /**
   * API endpoint for authentication
   */
  apiUrl?: string;

  /**
   * Storage key for auth session
   */
  storageKey?: string;

  /**
   * Use localStorage instead of sessionStorage
   */
  persist?: boolean;

  /**
   * Token refresh interval in milliseconds
   */
  refreshInterval?: number;

  /**
   * Callback when session expires
   */
  onSessionExpired?: () => void;
}

/**
 * Service key for registration
 */
export const AUTH_SERVICE_KEY = 'auth';

// Module augmentation for TypeScript support
declare module '@mfe-toolkit/core' {
  interface ServiceMap {
    auth: AuthService;
  }
}
