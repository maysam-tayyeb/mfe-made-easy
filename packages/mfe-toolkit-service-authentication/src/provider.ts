/**
 * Authentication Service Provider
 */

import type { ServiceProvider, ServiceContainer } from '@mfe-toolkit/core';
import { createAuthService } from './service';
import { AUTH_SERVICE_KEY, type AuthConfig, type AuthService } from './types';

export interface AuthProviderOptions extends AuthConfig {
  /**
   * Mock mode for development
   */
  mock?: boolean;
}

/**
 * Create an auth service provider
 */
export function createAuthProvider(options: AuthProviderOptions = {}): ServiceProvider<AuthService> {
  return {
    name: AUTH_SERVICE_KEY,
    version: '1.0.0',
    dependencies: ['logger'], // Optional dependency for logging
    
    create(container: ServiceContainer): AuthService {
      const logger = container.get('logger');
      
      // Create auth service
      const authService = createAuthService(options);
      
      // Add logging if available
      if (logger) {
        // Wrap methods with logging
        const originalLogin = authService.login?.bind(authService);
        if (originalLogin) {
          authService.login = async (credentials) => {
            logger.info('User login attempt');
            try {
              const session = await originalLogin(credentials);
              logger.info('User logged in successfully', { userId: session.userId });
              return session;
            } catch (error) {
              logger.error('Login failed', error);
              throw error;
            }
          };
        }
        
        const originalLogout = authService.logout?.bind(authService);
        if (originalLogout) {
          authService.logout = async () => {
            logger.info('User logout');
            await originalLogout();
          };
        }
      }
      
      return authService;
    },
    
    dispose(): void {
      // Cleanup if needed
    },
  };
}

// Export default provider for common use case
export const authServiceProvider = createAuthProvider();