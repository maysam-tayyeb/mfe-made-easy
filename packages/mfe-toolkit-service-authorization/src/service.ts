/**
 * Authorization Service Implementation
 */

import type {
  AuthorizationService,
  AuthorizationConfig,
  AuthorizationContext,
  Policy,
  ResourceAccess,
} from './types';

export class AuthorizationServiceImpl implements AuthorizationService {
  private roles: Set<string>;
  private permissions: Set<string>;
  private scopes: Set<string>;
  private config: AuthorizationConfig;
  private listeners = new Set<(roles: string[], permissions: string[]) => void>();
  private cache = new Map<string, { result: boolean; timestamp: number }>();

  constructor(config: AuthorizationConfig = {}) {
    this.config = {
      enableCache: true,
      cacheTTL: 60000, // 1 minute default
      debug: false,
      ...config,
    };
    
    this.roles = new Set(config.defaultRoles || []);
    this.permissions = new Set(config.defaultPermissions || []);
    this.scopes = new Set();
  }

  /**
   * Permission checks
   */
  hasPermission(permission: string): boolean {
    return this.checkWithCache(`perm:${permission}`, () => {
      const result = this.permissions.has(permission) || this.permissions.has('*');
      
      if (this.config.debug) {
        console.log(`[AuthZ] hasPermission(${permission}): ${result}`);
      }
      
      return result;
    });
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }

  /**
   * Role checks
   */
  hasRole(role: string): boolean {
    return this.checkWithCache(`role:${role}`, () => {
      const result = this.roles.has(role) || this.roles.has('admin');
      
      if (this.config.debug) {
        console.log(`[AuthZ] hasRole(${role}): ${result}`);
      }
      
      return result;
    });
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(r => this.hasRole(r));
  }

  hasAllRoles(roles: string[]): boolean {
    return roles.every(r => this.hasRole(r));
  }

  /**
   * Resource access control
   */
  canAccess(resource: string, action: string): boolean {
    return this.checkWithCache(`access:${resource}:${action}`, () => {
      // Check for wildcard permissions
      if (this.permissions.has('*') || this.permissions.has(`${resource}:*`)) {
        return true;
      }
      
      // Check specific permission
      const permission = `${resource}:${action}`;
      const result = this.permissions.has(permission);
      
      if (this.config.debug) {
        console.log(`[AuthZ] canAccess(${resource}, ${action}): ${result}`);
      }
      
      return result;
    });
  }

  canAccessAny(resources: ResourceAccess[]): boolean {
    return resources.some(r => 
      r.actions.some(action => this.canAccess(r.resource, action))
    );
  }

  canAccessAll(resources: ResourceAccess[]): boolean {
    return resources.every(r => 
      r.actions.every(action => this.canAccess(r.resource, action))
    );
  }

  /**
   * Policy evaluation
   */
  evaluatePolicy(policy: Policy): boolean {
    if (this.config.policyEvaluator) {
      const context: AuthorizationContext = {
        roles: Array.from(this.roles),
        permissions: Array.from(this.permissions),
        scopes: Array.from(this.scopes),
      };
      return this.config.policyEvaluator(policy, context);
    }
    
    // Default policy evaluation
    return this.canAccess(policy.resource, policy.action);
  }

  evaluatePolicies(policies: Policy[]): boolean {
    return policies.every(p => this.evaluatePolicy(p));
  }

  /**
   * Get current authorization data
   */
  getPermissions(): string[] {
    return Array.from(this.permissions);
  }

  getRoles(): string[] {
    return Array.from(this.roles);
  }

  getScopes(): string[] {
    return Array.from(this.scopes);
  }

  /**
   * Update authorization data
   */
  updateAuthorization(roles: string[], permissions: string[]): void {
    this.roles = new Set(roles);
    this.permissions = new Set(permissions);
    this.clearCache();
    this.notifyListeners();
    
    if (this.config.debug) {
      console.log('[AuthZ] Authorization updated:', { roles, permissions });
    }
  }

  /**
   * Subscribe to authorization changes
   */
  subscribe(callback: (roles: string[], permissions: string[]) => void): () => void {
    this.listeners.add(callback);
    
    // Call immediately with current state
    callback(Array.from(this.roles), Array.from(this.permissions));
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Private helper methods
   */
  private checkWithCache(key: string, check: () => boolean): boolean {
    if (!this.config.enableCache) {
      return check();
    }
    
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < (this.config.cacheTTL || 60000)) {
      return cached.result;
    }
    
    const result = check();
    this.cache.set(key, { result, timestamp: Date.now() });
    return result;
  }

  private clearCache(): void {
    this.cache.clear();
  }

  private notifyListeners(): void {
    const roles = Array.from(this.roles);
    const permissions = Array.from(this.permissions);
    this.listeners.forEach(callback => callback(roles, permissions));
  }

  dispose(): void {
    this.listeners.clear();
    this.cache.clear();
  }
}

/**
 * Create an authorization service instance
 */
export function createAuthorizationService(config?: AuthorizationConfig): AuthorizationService {
  return new AuthorizationServiceImpl(config);
}