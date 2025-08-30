/**
 * Service Registry Module
 * Central module for service registration and dependency injection
 */

// Export types
export type {
  ServiceRegistry,
  ServiceContainer,
  ServiceProvider,
  ServiceMetadata,
  ServiceInfo,
  ServiceMap,
  RegisterOptions,
  Logger,
  EventBus,
  EventPayload,
  MFEModule,
} from './types';

// Export implementations
export { ServiceRegistryImpl, createServiceRegistry } from './service-registry';
export { ServiceContainerImpl, createServiceContainer } from './service-container';
export {
  createServiceProvider,
  createSingletonProvider,
  createFactoryProvider,
  composeProviders,
  type CreateProviderOptions,
} from './service-provider';