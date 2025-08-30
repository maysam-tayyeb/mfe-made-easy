# @mfe-toolkit/service-authorization

Authorization service for MFE Toolkit - handles permissions, roles, and access control policies.

## Installation

```bash
npm install @mfe-toolkit/service-authorization
# or
pnpm add @mfe-toolkit/service-authorization
```

## Overview

The Authorization Service manages user permissions and access control, determining **WHAT** users can do in your application. It works seamlessly with the Authentication Service (which determines **WHO** the user is) to provide a complete security solution.

## Key Features

- 🛡️ **Role-Based Access Control (RBAC)**: Check user roles and permissions
- 🔒 **Resource Access Control**: Fine-grained resource and action permissions
- 📋 **Policy Evaluation**: Support for complex access policies
- ⚡ **Performance Optimized**: Built-in caching for permission checks
- 🔄 **Auto-sync with Auth**: Automatically syncs with authentication state
- 🎯 **Framework Agnostic**: Works with any frontend framework

## Usage

### Basic Setup

```typescript
import { createAuthorizationService } from '@mfe-toolkit/service-authorization';

// Create service with default configuration
const authzService = createAuthorizationService();

// Or with custom configuration
const authzService = createAuthorizationService({
  enableCache: true,
  cacheTTL: 60000, // Cache for 1 minute
  debug: true,      // Enable debug logging
  defaultRoles: ['guest'],
  defaultPermissions: ['read:public']
});
```

### Service Registration (MFE Container)

```typescript
import { createServiceRegistry } from '@mfe-toolkit/core';
import { authServiceProvider } from '@mfe-toolkit/service-authentication';
import { authorizationServiceProvider } from '@mfe-toolkit/service-authorization';

const registry = createServiceRegistry();

// Register auth first (authorization depends on it)
registry.registerProvider(authServiceProvider);
registry.registerProvider(authorizationServiceProvider); // Auto-syncs with auth

await registry.initialize();
```

### Using in MFEs

```typescript
// In your MFE module
export default {
  mount(element: HTMLElement, container: ServiceContainer) {
    const authz = container.get('authz');
    
    // Check permissions
    if (!authz?.hasPermission('admin:access')) {
      showAccessDeniedMessage();
      return;
    }
    
    // Check roles
    if (authz.hasRole('admin')) {
      showAdminPanel();
    }
    
    // Check resource access
    if (authz.canAccess('users', 'delete')) {
      showDeleteButton();
    }
  }
};
```

## API Reference

### `AuthorizationService` Interface

#### Permission Methods

##### `hasPermission(permission: string): boolean`
Checks if the user has a specific permission.

```typescript
if (authz.hasPermission('write')) {
  // User can write
}

if (authz.hasPermission('admin:users')) {
  // User has admin access to users
}
```

##### `hasAnyPermission(permissions: string[]): boolean`
Checks if the user has any of the specified permissions.

```typescript
if (authz.hasAnyPermission(['edit', 'admin'])) {
  // User can edit OR is admin
}
```

##### `hasAllPermissions(permissions: string[]): boolean`
Checks if the user has all of the specified permissions.

```typescript
if (authz.hasAllPermissions(['read', 'write', 'delete'])) {
  // User has full CRUD permissions
}
```

#### Role Methods

##### `hasRole(role: string): boolean`
Checks if the user has a specific role.

```typescript
if (authz.hasRole('moderator')) {
  // User is a moderator
}
```

##### `hasAnyRole(roles: string[]): boolean`
Checks if the user has any of the specified roles.

```typescript
if (authz.hasAnyRole(['admin', 'moderator'])) {
  // User is admin OR moderator
}
```

##### `hasAllRoles(roles: string[]): boolean`
Checks if the user has all of the specified roles.

```typescript
if (authz.hasAllRoles(['user', 'premium'])) {
  // User is both a regular user AND premium
}
```

#### Resource Access Methods

##### `canAccess(resource: string, action: string): boolean`
Checks if the user can perform a specific action on a resource.

```typescript
// Check if user can delete posts
if (authz.canAccess('posts', 'delete')) {
  showDeleteButton();
}

// Check if user can view analytics
if (authz.canAccess('analytics', 'view')) {
  showAnalyticsDashboard();
}
```

##### `canAccessAny(resources: ResourceAccess[]): boolean`
Checks if the user can access any of the specified resources.

```typescript
const resources = [
  { resource: 'posts', actions: ['edit'] },
  { resource: 'comments', actions: ['moderate'] }
];

if (authz.canAccessAny(resources)) {
  // User can edit posts OR moderate comments
}
```

##### `canAccessAll(resources: ResourceAccess[]): boolean`
Checks if the user can access all of the specified resources.

```typescript
const resources = [
  { resource: 'users', actions: ['read', 'write'] },
  { resource: 'settings', actions: ['update'] }
];

if (authz.canAccessAll(resources)) {
  // User has all required permissions
}
```

#### Policy Methods

##### `evaluatePolicy(policy: Policy): boolean`
Evaluates a complex access policy.

```typescript
const policy = {
  resource: 'documents',
  action: 'share',
  conditions: {
    department: 'engineering',
    level: 'senior'
  }
};

if (authz.evaluatePolicy(policy)) {
  // User meets all policy conditions
}
```

#### Data Access Methods

##### `getPermissions(): string[]`
Returns all permissions assigned to the user.

```typescript
const permissions = authz.getPermissions();
console.log('User permissions:', permissions);
// ['read', 'write', 'users:view', 'posts:edit']
```

##### `getRoles(): string[]`
Returns all roles assigned to the user.

```typescript
const roles = authz.getRoles();
console.log('User roles:', roles);
// ['user', 'moderator']
```

##### `updateAuthorization(roles: string[], permissions: string[]): void`
Updates the authorization data (usually called automatically by auth sync).

```typescript
// Manual update (rarely needed)
authz.updateAuthorization(
  ['admin', 'user'],
  ['read', 'write', 'delete', 'admin:all']
);
```

##### `subscribe(callback: (roles: string[], permissions: string[]) => void): () => void`
Subscribe to authorization changes.

```typescript
const unsubscribe = authz.subscribe((roles, permissions) => {
  console.log('Authorization updated:', { roles, permissions });
  updateUIBasedOnPermissions();
});

// Later, to unsubscribe
unsubscribe();
```

### Types

#### `Policy`
```typescript
interface Policy {
  resource: string;           // Resource identifier
  action: string;            // Action to perform
  conditions?: Record<string, any>; // Additional conditions
}
```

#### `ResourceAccess`
```typescript
interface ResourceAccess {
  resource: string;           // Resource identifier
  actions: string[];         // List of actions
  conditions?: Record<string, any>; // Optional conditions
}
```

#### `AuthorizationConfig`
```typescript
interface AuthorizationConfig {
  defaultRoles?: string[];        // Default roles if none provided
  defaultPermissions?: string[];  // Default permissions if none provided
  enableCache?: boolean;          // Enable caching (default: true)
  cacheTTL?: number;              // Cache TTL in ms (default: 60000)
  debug?: boolean;                // Enable debug logging
  policyEvaluator?: (            // Custom policy evaluator
    policy: Policy,
    context: AuthorizationContext
  ) => boolean;
}
```

## Common Patterns

### Permission Naming Conventions

```typescript
// Simple permissions
'read', 'write', 'delete', 'execute'

// Namespaced permissions
'admin:users'     // Admin access to users
'posts:edit'      // Edit posts
'settings:view'   // View settings

// Resource-based permissions
'users:create'    // Create users
'users:read'      // Read users
'users:update'    // Update users
'users:delete'    // Delete users

// Hierarchical permissions
'admin'           // Full admin access
'admin:*'         // All admin permissions
'posts:*'         // All post permissions
```

### React Hook Integration

```typescript
import { useEffect, useState } from 'react';

function useAuthorization() {
  const authz = useService('authz');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  
  useEffect(() => {
    if (!authz) return;
    
    // Get initial state
    setPermissions(authz.getPermissions());
    setRoles(authz.getRoles());
    
    // Subscribe to changes
    return authz.subscribe((newRoles, newPermissions) => {
      setRoles(newRoles);
      setPermissions(newPermissions);
    });
  }, [authz]);
  
  return {
    permissions,
    roles,
    hasPermission: authz?.hasPermission.bind(authz),
    hasRole: authz?.hasRole.bind(authz),
    canAccess: authz?.canAccess.bind(authz)
  };
}
```

### Protected Component

```typescript
function ProtectedComponent({ 
  permission, 
  role, 
  fallback = null, 
  children 
}) {
  const authz = useService('authz');
  
  if (permission && !authz?.hasPermission(permission)) {
    return fallback;
  }
  
  if (role && !authz?.hasRole(role)) {
    return fallback;
  }
  
  return children;
}

// Usage
<ProtectedComponent 
  permission="admin:access" 
  fallback={<AccessDenied />}
>
  <AdminPanel />
</ProtectedComponent>
```

### Conditional Rendering

```typescript
function UserActions({ userId }) {
  const authz = useService('authz');
  
  return (
    <div>
      <button onClick={() => viewUser(userId)}>
        View
      </button>
      
      {authz?.hasPermission('users:edit') && (
        <button onClick={() => editUser(userId)}>
          Edit
        </button>
      )}
      
      {authz?.hasRole('admin') && (
        <button onClick={() => deleteUser(userId)}>
          Delete
        </button>
      )}
      
      {authz?.canAccess('users', 'impersonate') && (
        <button onClick={() => impersonateUser(userId)}>
          Impersonate
        </button>
      )}
    </div>
  );
}
```

### Route Guards

```typescript
const routes = [
  {
    path: '/admin',
    element: <AdminPanel />,
    guard: (authz) => authz.hasRole('admin')
  },
  {
    path: '/settings',
    element: <Settings />,
    guard: (authz) => authz.hasPermission('settings:view')
  },
  {
    path: '/users/:id/edit',
    element: <EditUser />,
    guard: (authz) => authz.canAccess('users', 'edit')
  }
];

function RouteGuard({ route, children }) {
  const authz = useService('authz');
  
  if (route.guard && !route.guard(authz)) {
    return <Navigate to="/access-denied" />;
  }
  
  return children;
}
```

## Advanced Usage

### Custom Policy Evaluator

```typescript
const authzService = createAuthorizationService({
  policyEvaluator: (policy, context) => {
    // Custom logic for evaluating policies
    if (policy.resource === 'documents') {
      // Check document-specific conditions
      const userDept = context.metadata?.department;
      const requiredDept = policy.conditions?.department;
      
      if (requiredDept && userDept !== requiredDept) {
        return false;
      }
    }
    
    // Default to permission check
    return context.permissions.includes(`${policy.resource}:${policy.action}`);
  }
});
```

### Hierarchical Permissions

```typescript
// Implement permission hierarchy
const authzService = createAuthorizationService({
  policyEvaluator: (policy, context) => {
    const permission = `${policy.resource}:${policy.action}`;
    
    // Check for exact permission
    if (context.permissions.includes(permission)) {
      return true;
    }
    
    // Check for wildcard permissions
    if (context.permissions.includes('*')) {
      return true; // Super admin
    }
    
    if (context.permissions.includes(`${policy.resource}:*`)) {
      return true; // All actions on this resource
    }
    
    // Check parent permissions
    const parts = policy.resource.split(':');
    for (let i = parts.length - 1; i > 0; i--) {
      const parent = parts.slice(0, i).join(':');
      if (context.permissions.includes(`${parent}:*`)) {
        return true;
      }
    }
    
    return false;
  }
});
```

## Performance Considerations

1. **Caching**: Enable caching for frequently checked permissions
2. **Batch Checks**: Use `hasAllPermissions` or `hasAnyPermission` instead of multiple individual checks
3. **Early Returns**: Check the most restrictive permissions first
4. **Memoization**: Memoize permission checks in React components

## Security Best Practices

1. **Never trust client-side authorization alone** - Always validate on the server
2. **Use principle of least privilege** - Grant minimum required permissions
3. **Regular audits** - Review and audit permission assignments
4. **Separation of concerns** - Keep authentication and authorization separate
5. **Fail secure** - Default to denying access when in doubt
6. **Log authorization failures** - Monitor for potential security issues

## License

MIT