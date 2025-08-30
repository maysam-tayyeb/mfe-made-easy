/**
 * Example: Type-safe Service Access with ServiceMap
 * 
 * This demonstrates how the ServiceContainer now provides full type safety
 * when accessing services using ServiceMap keys.
 */

import type { ServiceContainer } from '@mfe-toolkit/core';

// Import type augmentations to extend ServiceMap
import '@mfe-toolkit/service-authentication/types';
import '@mfe-toolkit/service-authorization/types';
import '@mfe-toolkit/service-modal/types';
import '@mfe-toolkit/service-notification/types';
import '@mfe-toolkit/service-theme/types';

export function demonstrateTypedServiceAccess(container: ServiceContainer) {
  // ✅ Type-safe access with autocomplete for service names
  const logger = container.require('logger'); // Type: Logger
  const auth = container.require('auth'); // Type: AuthService
  const authz = container.require('authz'); // Type: AuthorizationService
  const modal = container.require('modal'); // Type: ModalService
  const notification = container.require('notification'); // Type: NotificationService
  const theme = container.require('theme'); // Type: ThemeService
  const eventBus = container.require('eventBus'); // Type: EventBus
  
  // ✅ Full IntelliSense for service methods
  logger.info('Service access is now type-safe!');
  auth.isAuthenticated(); // Returns boolean
  authz.hasPermission('users:read'); // Returns boolean
  modal.open({ title: 'Test', content: 'Hello' }); // Type-checked config
  notification.success('Success', 'Operation completed');
  theme.setTheme('dark');
  eventBus.emit('test', { data: 'payload' });
  
  // ✅ Optional access with proper undefined handling
  const maybeAuth = container.get('auth'); // Type: AuthService | undefined
  if (maybeAuth) {
    maybeAuth.getSession(); // Safe to access after null check
  }
  
  // ❌ TypeScript errors for invalid service names
  // container.require('invalid'); // Error: Argument of type '"invalid"' is not assignable to parameter of type 'keyof ServiceMap'
  
  // ❌ TypeScript errors for incorrect method usage
  // notification.invalidMethod(); // Error: Property 'invalidMethod' does not exist on type 'NotificationService'
  
  // The implementation still accepts strings for backward compatibility,
  // but the interface provides full type safety through overloads
  const serviceName: string = 'auth'; // Dynamic string
  const dynamicService = container.get(serviceName); // Type: any | undefined (fallback overload)
  if (dynamicService) {
    // Use the service after checking it exists
    console.log('Service found:', serviceName);
  }
  
  return {
    logger,
    auth,
    authz,
    modal,
    notification,
    theme,
    eventBus
  };
}

/**
 * Benefits of using ServiceMap keys:
 * 
 * 1. **Type Safety**: Catch typos and invalid service names at compile time
 * 2. **IntelliSense**: Auto-complete for service names and methods
 * 3. **Refactoring**: Renaming services updates all references automatically
 * 4. **Documentation**: Hover over services to see their type definitions
 * 5. **Extensibility**: New services automatically appear in autocomplete
 *    when their type augmentation is imported
 */