/**
 * Authorization Service Types
 */

/**
 * Policy for evaluating access control
 */
export interface Policy {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

/**
 * Resource access control
 */
export interface ResourceAccess {
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

/**
 * Authorization service interface
 */
export interface AuthorizationService {
  /**
   * Permission checks
   */
  hasPermission(permission: string): boolean;
  hasAnyPermission(permissions: string[]): boolean;
  hasAllPermissions(permissions: string[]): boolean;

  /**
   * Role checks
   */
  hasRole(role: string): boolean;
  hasAnyRole(roles: string[]): boolean;
  hasAllRoles(roles: string[]): boolean;

  /**
   * Resource access control
   */
  canAccess(resource: string, action: string): boolean;
  canAccessAny(resources: ResourceAccess[]): boolean;
  canAccessAll(resources: ResourceAccess[]): boolean;

  /**
   * Policy evaluation
   */
  evaluatePolicy?(policy: Policy): boolean;
  evaluatePolicies?(policies: Policy[]): boolean;

  /**
   * Get current authorization data
   */
  getPermissions(): string[];
  getRoles(): string[];
  getScopes?(): string[];

  /**
   * Update authorization data (usually from auth service)
   */
  updateAuthorization?(roles: string[], permissions: string[]): void;

  /**
   * Subscribe to authorization changes
   */
  subscribe?(callback: (roles: string[], permissions: string[]) => void): () => void;
}

/**
 * Authorization configuration
 */
export interface AuthorizationConfig {
  /**
   * Default roles if none provided
   */
  defaultRoles?: string[];

  /**
   * Default permissions if none provided
   */
  defaultPermissions?: string[];

  /**
   * Enable caching of permission checks
   */
  enableCache?: boolean;

  /**
   * Cache TTL in milliseconds
   */
  cacheTTL?: number;

  /**
   * Enable debug logging
   */
  debug?: boolean;

  /**
   * Custom policy evaluator
   */
  policyEvaluator?: (policy: Policy, context: AuthorizationContext) => boolean;
}

/**
 * Authorization context for policy evaluation
 */
export interface AuthorizationContext {
  userId?: string;
  roles: string[];
  permissions: string[];
  scopes?: string[];
  metadata?: Record<string, any>;
}

/**
 * Service key for registration
 */
export const AUTHZ_SERVICE_KEY = 'authz';
// Module augmentation for TypeScript support
declare module '@mfe-toolkit/core' {
  interface ServiceMap {
    authz: AuthorizationService;
  }
}
