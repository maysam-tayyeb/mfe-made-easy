/**
 * Authorization Service Provider
 */

import type { ServiceProvider, ServiceContainer } from '@mfe-toolkit/core';
import { createAuthorizationService } from './service';
import { AUTHZ_SERVICE_KEY, type AuthorizationConfig, type AuthorizationService } from './types';

export interface AuthorizationProviderOptions extends AuthorizationConfig {
  /**
   * Whether to sync with authentication service
   */
  syncWithAuth?: boolean;
}

/**
 * Create an authorization service provider
 */
export function createAuthorizationProvider(
  options: AuthorizationProviderOptions = {}
): ServiceProvider<AuthorizationService> {
  return {
    name: AUTHZ_SERVICE_KEY,
    version: '1.0.0',
    dependencies: ['auth', 'logger'], // Depends on auth service
    
    create(container: ServiceContainer): AuthorizationService {
      const logger = container.get('logger');
      const authService = container.get('auth' as any);
      
      // Create authorization service
      const authzService = createAuthorizationService(options);
      
      // Sync with auth service if available
      if (authService && options.syncWithAuth !== false) {
        // Get initial session
        const session = (authService as any).getSession?.();
        if (session) {
          authzService.updateAuthorization?.(
            session.roles || [],
            session.permissions || []
          );
        }
        
        // Subscribe to auth changes
        if ((authService as any).subscribe) {
          (authService as any).subscribe((session: any) => {
            if (session) {
              authzService.updateAuthorization?.(
                session.roles || [],
                session.permissions || []
              );
              logger?.debug('[AuthZ] Synced with auth service', {
                roles: session.roles,
                permissions: session.permissions,
              });
            } else {
              // User logged out, clear authorization
              authzService.updateAuthorization?.([], []);
              logger?.debug('[AuthZ] Cleared authorization (user logged out)');
            }
          });
        }
      }
      
      // Add logging if available
      if (logger) {
        logger.info('[AuthZ] Authorization service initialized', {
          syncWithAuth: options.syncWithAuth !== false,
          cacheEnabled: options.enableCache !== false,
        });
      }
      
      return authzService;
    },
    
    dispose(): void {
      // Cleanup handled by service
    },
  };
}

// Export default provider for common use case
export const authorizationServiceProvider = createAuthorizationProvider();