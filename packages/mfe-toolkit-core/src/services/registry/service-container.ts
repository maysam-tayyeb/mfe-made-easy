/**
 * Service Container Implementation
 * Provides type-safe access to services with scoping support
 */

import type {
  ServiceContainer,
  ServiceInfo,
  ServiceMap,
  ServiceRegistry,
} from './types';

export class ServiceContainerImpl implements ServiceContainer {
  private services: Map<string, any>;
  private registry: ServiceRegistry | null;
  private disposed = false;

  constructor(registryOrServices: ServiceRegistry | Map<string, any>) {
    if ('get' in registryOrServices && 'has' in registryOrServices && 'listServices' in registryOrServices) {
      // It's a registry
      this.registry = registryOrServices as ServiceRegistry;
      this.services = new Map();
      // Copy services from registry
      for (const info of this.registry.listServices()) {
        const service = this.registry.get(info.name);
        if (service !== undefined) {
          this.services.set(info.name, service);
        }
      }
    } else {
      // It's a service map
      this.services = registryOrServices as Map<string, any>;
      this.registry = null;
    }
  }

  /**
   * Get a service by name (returns undefined if not found)
   */
  get<K extends keyof ServiceMap>(name: K): ServiceMap[K] | undefined;
  get<T = any>(name: string): T | undefined;
  get(name: string): any | undefined {
    this.checkDisposed();
    
    // Try local services first
    if (this.services.has(name)) {
      return this.services.get(name);
    }
    
    // Try registry if available
    if (this.registry) {
      return this.registry.get(name);
    }
    
    return undefined;
  }

  /**
   * Require a service by name (throws if not found)
   */
  require<K extends keyof ServiceMap>(name: K): ServiceMap[K];
  require<T = any>(name: string): T;
  require(name: string): any {
    const service = this.get(name);
    if (service === undefined) {
      throw new Error(`Required service "${name}" not found in container`);
    }
    return service;
  }

  /**
   * Check if a service exists
   */
  has(name: string): boolean {
    this.checkDisposed();
    return this.services.has(name) || (this.registry?.has(name) ?? false);
  }

  /**
   * List all available services
   */
  listAvailable(): ServiceInfo[] {
    this.checkDisposed();
    
    if (this.registry) {
      return this.registry.listServices();
    }
    
    // Create ServiceInfo from local services
    const services: ServiceInfo[] = [];
    for (const name of this.services.keys()) {
      services.push({
        name,
        status: 'ready',
      });
    }
    return services;
  }

  /**
   * Get all services as a map
   */
  getAllServices(): ServiceMap {
    this.checkDisposed();
    const result: any = {};
    this.services.forEach((value, key) => {
      result[key] = value;
    });
    return result as ServiceMap;
  }

  /**
   * Create a scoped container with overrides
   */
  createScoped(overrides: Record<string, any>): ServiceContainer {
    this.checkDisposed();
    
    // Create new map with parent services
    const scopedServices = new Map(this.services);
    
    // Apply overrides
    for (const [name, service] of Object.entries(overrides)) {
      if (service === undefined) {
        scopedServices.delete(name);
      } else {
        scopedServices.set(name, service);
      }
    }
    
    return new ServiceContainerImpl(scopedServices);
  }

  /**
   * Dispose of the container and its services
   */
  async dispose(): Promise<void> {
    if (this.disposed) return;
    
    this.disposed = true;
    this.services.clear();
    this.registry = null;
  }

  private checkDisposed(): void {
    if (this.disposed) {
      throw new Error('Container has been disposed');
    }
  }
}

/**
 * Factory function to create a service container
 */
export function createServiceContainer(services: Map<string, any> | Record<string, any>): ServiceContainer {
  const serviceMap = services instanceof Map ? services : new Map(Object.entries(services));
  return new ServiceContainerImpl(serviceMap);
}