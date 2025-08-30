/**
 * @mfe-toolkit/service-auth
 * Authentication service for MFE Toolkit
 */

// Export types
export type {
  AuthService,
  AuthSession,
  AuthConfig,
  LoginCredentials,
} from './types';

export { AUTH_SERVICE_KEY } from './types';

// Export service implementation
export { AuthServiceImpl, createAuthService } from './service';

// Export provider
export { createAuthProvider, authServiceProvider, type AuthProviderOptions } from './provider';

// Module augmentation is now in ./types.ts for lighter imports