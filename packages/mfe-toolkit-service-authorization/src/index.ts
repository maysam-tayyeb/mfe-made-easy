/**
 * @mfe-toolkit/service-authorization
 * Authorization service for MFE Toolkit
 */

// Export types
export type {
  AuthorizationService,
  AuthorizationConfig,
  AuthorizationContext,
  Policy,
  ResourceAccess,
} from './types';

export { AUTHZ_SERVICE_KEY } from './types';

// Export service implementation
export { AuthorizationServiceImpl, createAuthorizationService } from './service';

// Export provider
export {
  createAuthorizationProvider,
  authorizationServiceProvider,
  type AuthorizationProviderOptions,
} from './provider';

// Module augmentation for type safety
// Module augmentation is now in ./types.ts for lighter imports
