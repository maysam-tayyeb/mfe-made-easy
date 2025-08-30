# @mfe-toolkit/service-authentication

Authentication service for MFE Toolkit - handles user identity verification, session management, and token management.

## Installation

```bash
npm install @mfe-toolkit/service-authentication
# or
pnpm add @mfe-toolkit/service-authentication
```

## Overview

The Authentication Service is responsible for managing user authentication state, handling login/logout flows, and managing authentication tokens. It follows the principle of separation of concerns by focusing solely on **WHO** the user is, while authorization (WHAT they can do) is handled by the separate Authorization Service.

## Key Features

- 🔐 **Session Management**: Secure session storage with configurable persistence
- 🔑 **Token Management**: Access and refresh token handling
- 🔄 **Auto-refresh**: Configurable automatic token refresh
- 📢 **Event Subscription**: React to authentication state changes
- 💾 **Storage Options**: Choose between localStorage and sessionStorage
- 🎯 **Framework Agnostic**: Works with any frontend framework

## Usage

### Basic Setup

```typescript
import { createAuthService } from '@mfe-toolkit/service-authentication';

// Create service with default configuration
const authService = createAuthService();

// Or with custom configuration
const authService = createAuthService({
  apiUrl: 'https://api.example.com/auth',
  storageKey: 'my-app-session',
  persist: true, // Use localStorage instead of sessionStorage
  refreshInterval: 300000, // Refresh every 5 minutes
  onSessionExpired: () => {
    console.log('Session expired!');
    window.location.href = '/login';
  }
});
```

### Service Registration (MFE Container)

```typescript
import { createServiceRegistry } from '@mfe-toolkit/core';
import { authServiceProvider } from '@mfe-toolkit/service-authentication';

const registry = createServiceRegistry();
registry.registerProvider(authServiceProvider);
await registry.initialize();
```

### Using in MFEs

```typescript
// In your MFE module
export default {
  mount(element: HTMLElement, container: ServiceContainer) {
    const auth = container.get('auth');
    
    if (!auth?.isAuthenticated()) {
      // Redirect to login or show auth prompt
      return;
    }
    
    const session = auth.getSession();
    console.log(`Welcome, ${session.username}!`);
  }
};
```

## API Reference

### `AuthService` Interface

#### Methods

##### `getSession(): AuthSession | null`
Returns the current authentication session or null if not authenticated.

```typescript
const session = authService.getSession();
if (session) {
  console.log(`User ID: ${session.userId}`);
  console.log(`Username: ${session.username}`);
}
```

##### `isAuthenticated(): boolean`
Checks if the user is currently authenticated and the session is valid.

```typescript
if (authService.isAuthenticated()) {
  // User is logged in
} else {
  // User needs to authenticate
}
```

##### `getAccessToken(): string | null`
Returns the current access token for API requests.

```typescript
const token = authService.getAccessToken();
fetch('/api/data', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

##### `getRefreshToken(): string | null`
Returns the refresh token if available.

```typescript
const refreshToken = authService.getRefreshToken();
```

##### `login(credentials: LoginCredentials): Promise<AuthSession>`
Authenticates a user with the provided credentials.

```typescript
try {
  const session = await authService.login({
    username: 'john.doe',
    password: 'secure-password',
    rememberMe: true
  });
  console.log('Login successful!', session);
} catch (error) {
  console.error('Login failed:', error);
}
```

##### `logout(): Promise<void>`
Logs out the current user and clears the session.

```typescript
await authService.logout();
// User is now logged out
```

##### `refresh(): Promise<AuthSession>`
Refreshes the authentication token.

```typescript
try {
  const newSession = await authService.refresh();
  console.log('Token refreshed successfully');
} catch (error) {
  console.error('Token refresh failed:', error);
}
```

##### `subscribe(callback: (session: AuthSession | null) => void): () => void`
Subscribe to authentication state changes.

```typescript
const unsubscribe = authService.subscribe((session) => {
  if (session) {
    console.log('User logged in:', session.username);
  } else {
    console.log('User logged out');
  }
});

// Later, to unsubscribe
unsubscribe();
```

### Types

#### `AuthSession`
```typescript
interface AuthSession {
  userId: string;
  username: string;
  email: string;
  roles: string[];        // User roles (for authorization service)
  permissions: string[];  // User permissions (for authorization service)
  isAuthenticated: boolean;
  expiresAt?: number;     // Token expiration timestamp
  refreshToken?: string;  // Refresh token if available
}
```

#### `LoginCredentials`
```typescript
interface LoginCredentials {
  username?: string;      // Username or email
  email?: string;         // Alternative to username
  password: string;       // User password
  rememberMe?: boolean;   // Persist session across browser sessions
}
```

#### `AuthConfig`
```typescript
interface AuthConfig {
  apiUrl?: string;              // API endpoint for authentication
  storageKey?: string;          // Key for storing session (default: 'mfe-auth-session')
  persist?: boolean;            // Use localStorage instead of sessionStorage
  refreshInterval?: number;     // Auto-refresh interval in milliseconds
  onSessionExpired?: () => void; // Callback when session expires
}
```

## Integration with Authorization Service

The Authentication Service works seamlessly with the Authorization Service:

```typescript
import { authServiceProvider } from '@mfe-toolkit/service-authentication';
import { authorizationServiceProvider } from '@mfe-toolkit/service-authorization';

// Register both services
registry.registerProvider(authServiceProvider);
registry.registerProvider(authorizationServiceProvider); // Auto-syncs with auth

// The authorization service automatically:
// 1. Reads roles/permissions from auth session
// 2. Updates when auth state changes
// 3. Clears when user logs out
```

## Examples

### React Hook Integration

```typescript
import { useEffect, useState } from 'react';

function useAuth() {
  const [session, setSession] = useState(null);
  const auth = useService('auth');
  
  useEffect(() => {
    if (!auth) return;
    
    // Get initial session
    setSession(auth.getSession());
    
    // Subscribe to changes
    return auth.subscribe(setSession);
  }, [auth]);
  
  return {
    session,
    isAuthenticated: !!session,
    login: auth?.login,
    logout: auth?.logout
  };
}
```

### Protected Route Component

```typescript
function ProtectedRoute({ children }) {
  const auth = useService('auth');
  
  if (!auth?.isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  
  return children;
}
```

### API Request Interceptor

```typescript
// Axios interceptor example
axios.interceptors.request.use((config) => {
  const token = authService.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
axios.interceptors.response.use(
  response => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await authService.refresh();
        // Retry the original request
        return axios(error.config);
      } catch {
        await authService.logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

## Security Best Practices

1. **Never store sensitive data in localStorage** if not necessary
2. **Use HTTPS** for all authentication requests
3. **Implement CSRF protection** for authentication endpoints
4. **Set appropriate token expiration times**
5. **Clear sessions on logout** completely
6. **Validate tokens server-side** for every protected request
7. **Use secure, httpOnly cookies** when possible

## License

MIT