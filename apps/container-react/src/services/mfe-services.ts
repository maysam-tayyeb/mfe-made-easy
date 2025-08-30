import {
  ServiceContainer,
  ServiceMap,
  createLogger,
  getErrorReporter,
  ServiceInfo,
} from '@mfe-toolkit/core';

// Import type augmentations to extend ServiceMap
import '@mfe-toolkit/service-authentication/types';
import '@mfe-toolkit/service-authorization/types';
import '@mfe-toolkit/service-modal/types';
import '@mfe-toolkit/service-notification/types';
import '@mfe-toolkit/service-theme/types';
import '@mfe-toolkit/service-analytics/types';
import { ContextBridgeRef } from './context-bridge';
import { createPlatformEventBus } from './platform-event-bus';

// Context bridge will be set by the App component
let contextBridge: ContextBridgeRef | null = null;
let bridgeReadyResolve: ((value: void) => void) | null = null;
let bridgeReadyPromise: Promise<void>;

const resetBridgePromise = () => {
  bridgeReadyPromise = new Promise<void>((resolve) => {
    bridgeReadyResolve = resolve;
  });
};

// Initialize the promise
resetBridgePromise();

export const setContextBridge = (bridge: ContextBridgeRef | null) => {
  contextBridge = bridge;
  if (bridge && bridgeReadyResolve) {
    bridgeReadyResolve();
    bridgeReadyResolve = null;
  } else if (!bridge) {
    // Reset for testing
    resetBridgePromise();
  }
};

/**
 * Creates a proxied service that automatically handles context bridge checks
 * and provides consistent error handling across all service methods
 */
const createProxiedService = <T extends object>(
  serviceName: string,
  getService: () => T,
  defaultReturnValues: Partial<Record<keyof T, any>> = {}
): T => {
  return new Proxy({} as T, {
    get(_, prop: string | symbol) {
      // Always return a function for method access
      return (...args: any[]) => {
        if (!contextBridge) {
          const message = `${serviceName}.${String(prop)} called before context bridge initialization`;
          console.warn(message);

          // Return default value if specified
          if (prop in defaultReturnValues) {
            return defaultReturnValues[prop as keyof T];
          }

          // For void methods, return undefined
          return undefined;
        }

        const service = getService();
        const method = (service as any)[prop];

        // If the property doesn't exist or isn't a function, return undefined
        if (!method || typeof method !== 'function') {
          return undefined;
        }

        return method.apply(service, args);
      };
    },
  });
};

const createAuthService = (): ServiceMap['auth'] => {
  return createProxiedService<ServiceMap['auth']>(
    'AuthService',
    () => contextBridge!.getAuthenticationService(),
    {
      getSession: null,
      isAuthenticated: false,
    }
  );
};

const createAuthorizationService = (): ServiceMap['authz'] => {
  return createProxiedService<ServiceMap['authz']>(
    'AuthorizationService',
    () => contextBridge!.getAuthorizationService(),
    {
      hasPermission: false,
      hasRole: false,
      hasAnyPermission: false,
      hasAnyRole: false,
      hasAllPermissions: false,
      hasAllRoles: false,
      canAccess: false,
      canAccessAny: false,
      canAccessAll: false,
      getPermissions: [],
      getRoles: [],
    }
  );
};

const createModalServiceImpl = (): ServiceMap['modal'] => {
  return createProxiedService<ServiceMap['modal']>('ModalService', () =>
    contextBridge!.getModalService()
  );
};

const createNotificationServiceImpl = (): ServiceMap['notification'] => {
  return createProxiedService<ServiceMap['notification']>('NotificationService', () =>
    contextBridge!.getNotificationService()
  );
};

const createThemeServiceImpl = (): ServiceMap['theme'] => {
  return createProxiedService<ServiceMap['theme']>(
    'ThemeService',
    () => contextBridge!.getThemeService(),
    {
      getTheme: 'light',
      setTheme: undefined,
      subscribe: () => () => {}, // Return empty unsubscribe function
      getAvailableThemes: () => ['light', 'dark'], // Default themes
      cycleTheme: undefined,
    }
  );
};

/**
 * Service container implementation that properly satisfies the interface
 */
class MFEServiceContainerImpl implements ServiceContainer {
  private eventBus = createPlatformEventBus();
  private serviceCache = new Map<string, any>();

  private getOrCreateService(name: string): any {
    // Check cache first
    if (this.serviceCache.has(name)) {
      return this.serviceCache.get(name);
    }

    let service: any;

    switch (name) {
      case 'logger':
        service = createLogger('MFE');
        break;
      case 'auth':
        service = createAuthService();
        break;
      case 'authz':
        service = createAuthorizationService();
        break;
      case 'eventBus':
        service = this.eventBus;
        break;
      case 'modal':
        service = createModalServiceImpl();
        break;
      case 'notification':
        service = createNotificationServiceImpl();
        break;
      case 'theme':
        service = createThemeServiceImpl();
        break;
      case 'errorReporter':
        service = getErrorReporter(
          {
            enableConsoleLog: true,
            maxErrorsPerSession: 100,
          },
          this
        );
        break;
      default:
        return undefined;
    }

    // Cache the service
    if (service !== undefined) {
      this.serviceCache.set(name, service);
    }

    return service;
  }

  // Implement ServiceContainer interface methods
  get<K extends keyof ServiceMap>(name: K): ServiceMap[K] | undefined;
  get(name: string): any | undefined;
  get(name: string): any | undefined {
    return this.getOrCreateService(name);
  }
  require<K extends keyof ServiceMap>(name: K): ServiceMap[K];
  require(name: string): any;
  require(name: string): any {
    const service = this.get(name);
    if (!service) {
      throw new Error(`Required service '${name}' not found`);
    }
    return service;
  }
  has(name: string): boolean {
    const knownServices = [
      'logger',
      'auth',
      'authz',
      'eventBus',
      'modal',
      'notification',
      'theme',
      'errorReporter',
    ];
    return knownServices.includes(name);
  }
  listAvailable(): ServiceInfo[] {
    return [
      { name: 'logger', version: '1.0.0', status: 'ready' as const },
      { name: 'auth', version: '1.0.0', status: 'ready' as const },
      { name: 'authz', version: '1.0.0', status: 'ready' as const },
      { name: 'eventBus', version: '1.0.0', status: 'ready' as const },
      { name: 'modal', version: '1.0.0', status: 'ready' as const },
      { name: 'notification', version: '1.0.0', status: 'ready' as const },
      { name: 'theme', version: '1.0.0', status: 'ready' as const },
      { name: 'errorReporter', version: '1.0.0', status: 'ready' as const },
    ];
  }
  getAllServices(): ServiceMap {
    const services: any = {};
    const serviceNames = ['logger', 'auth', 'authz', 'eventBus', 'modal', 'notification', 'theme'];

    for (const name of serviceNames) {
      const service = this.get(name);
      if (service) {
        services[name] = service;
      }
    }

    return services as ServiceMap;
  }
  createScoped(overrides: Record<string, any>): ServiceContainer {
    // Create a new container instance with overrides
    const scopedContainer = new MFEServiceContainerImpl();

    // Apply overrides to the scoped container's cache
    for (const [name, service] of Object.entries(overrides)) {
      scopedContainer.serviceCache.set(name, service);
    }

    return scopedContainer;
  }
  async dispose(): Promise<void> {
    // Clear cache and cleanup
    this.serviceCache.clear();
  }
}

export const createSharedServices = (): ServiceContainer => {
  // TypeScript validates that MFEServiceContainerImpl properly implements ServiceContainer
  return new MFEServiceContainerImpl();
};

// Container-specific utilities (not part of MFE contract)
export const isContextBridgeReady = () => contextBridge !== null;
export const waitForContextBridge = () => bridgeReadyPromise;

// Export for testing purposes
export const resetContextBridge = () => {
  setContextBridge(null);
};
