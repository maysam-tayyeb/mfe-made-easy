/**
 * Service Provider Utilities
 * Helper functions for creating service providers
 */

import type { ServiceProvider, ServiceContainer } from './types';

/**
 * Options for creating a service provider
 */
export interface CreateProviderOptions<T> {
  /** Unique name for this service */
  name: string;
  /** Service version */
  version: string;
  /** Services this provider depends on */
  dependencies?: string[];
  /** Factory function to create the service */
  factory: (container: ServiceContainer) => T | Promise<T>;
  /** Cleanup function when service is disposed */
  dispose?: () => void | Promise<void>;
}

/**
 * Create a service provider from a factory function
 */
export function createServiceProvider<T>(
  options: CreateProviderOptions<T>
): ServiceProvider<T> {
  return {
    name: options.name,
    version: options.version,
    dependencies: options.dependencies,
    create: options.factory,
    dispose: options.dispose,
  };
}

/**
 * Create a singleton service provider that creates the service only once
 */
export function createSingletonProvider<T>(
  options: CreateProviderOptions<T>
): ServiceProvider<T> {
  let instance: T | undefined;
  let creating = false;
  let createPromise: Promise<T> | undefined;

  return {
    name: options.name,
    version: options.version,
    dependencies: options.dependencies,
    
    async create(container: ServiceContainer): Promise<T> {
      // Return existing instance
      if (instance !== undefined) {
        return instance;
      }
      
      // Wait for ongoing creation
      if (creating && createPromise) {
        return createPromise;
      }
      
      // Create new instance
      creating = true;
      createPromise = Promise.resolve(options.factory(container)).then(service => {
        instance = service;
        creating = false;
        createPromise = undefined;
        return service;
      });
      
      return createPromise;
    },
    
    async dispose(): Promise<void> {
      if (options.dispose) {
        await options.dispose();
      }
      instance = undefined;
      creating = false;
      createPromise = undefined;
    },
  };
}

/**
 * Create a factory service provider that creates a new instance each time
 */
export function createFactoryProvider<T>(
  options: CreateProviderOptions<T>
): ServiceProvider<T> {
  const instances = new Set<T>();
  
  return {
    name: options.name,
    version: options.version,
    dependencies: options.dependencies,
    
    async create(container: ServiceContainer): Promise<T> {
      const instance = await options.factory(container);
      instances.add(instance);
      return instance;
    },
    
    async dispose(): Promise<void> {
      // Dispose all instances
      if (options.dispose) {
        await options.dispose();
      }
      instances.clear();
    },
  };
}

/**
 * Compose multiple providers into a single provider
 */
export function composeProviders(
  providers: ServiceProvider[]
): ServiceProvider<Record<string, any>> {
  // Collect all dependencies
  const allDependencies = new Set<string>();
  for (const provider of providers) {
    if (provider.dependencies) {
      for (const dep of provider.dependencies) {
        allDependencies.add(dep);
      }
    }
  }
  
  return {
    name: 'composed',
    version: '1.0.0',
    dependencies: Array.from(allDependencies),
    
    async create(container: ServiceContainer): Promise<Record<string, any>> {
      const services: Record<string, any> = {};
      
      for (const provider of providers) {
        const service = await provider.create(container);
        services[provider.name] = service;
      }
      
      return services;
    },
    
    async dispose(): Promise<void> {
      // Dispose in reverse order
      for (const provider of providers.reverse()) {
        if (provider.dispose) {
          await provider.dispose();
        }
      }
    },
  };
}