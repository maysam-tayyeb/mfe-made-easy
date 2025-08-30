/**
 * Service Registry Implementation
 * Manages service registration, dependency resolution, and lifecycle
 */

import type {
  ServiceRegistry,
  ServiceProvider,
  ServiceInfo,
  ServiceMetadata,
  RegisterOptions,
  ServiceContainer,
} from './types';
import { ServiceContainerImpl } from './service-container';

export class ServiceRegistryImpl implements ServiceRegistry {
  private services = new Map<string, any>();
  private providers = new Map<string, ServiceProvider>();
  private metadata = new Map<string, ServiceMetadata>();
  private status = new Map<string, ServiceInfo['status']>();
  private initializationPromise: Promise<void> | null = null;

  /**
   * Register a service instance
   */
  register<T>(name: string, service: T, options: RegisterOptions = {}): void {
    if (!options.override && this.services.has(name)) {
      throw new Error(`Service "${name}" is already registered`);
    }

    this.services.set(name, service);
    this.status.set(name, 'ready');
    
    if (options.metadata) {
      this.metadata.set(name, options.metadata);
    }
  }

  /**
   * Register a service provider for lazy initialization
   */
  registerProvider(provider: ServiceProvider, options: RegisterOptions = {}): void {
    const { name } = provider;
    
    if (!options.override && (this.providers.has(name) || this.services.has(name))) {
      throw new Error(`Service "${name}" is already registered`);
    }

    this.providers.set(name, provider);
    this.status.set(name, 'registered');
    
    const metadata: ServiceMetadata = {
      version: provider.version,
      dependencies: provider.dependencies,
      ...options.metadata,
    };
    this.metadata.set(name, metadata);
  }

  /**
   * Get a service by name
   */
  get<T = any>(name: string): T | undefined {
    return this.services.get(name);
  }

  /**
   * Check if a service is registered
   */
  has(name: string): boolean {
    return this.services.has(name) || this.providers.has(name);
  }

  /**
   * List all registered services
   */
  listServices(): ServiceInfo[] {
    const services: ServiceInfo[] = [];
    
    // Add registered services
    for (const [name] of this.services.entries()) {
      services.push({
        name,
        status: this.status.get(name) || 'ready',
        metadata: this.metadata.get(name),
      });
    }
    
    // Add providers that haven't been initialized
    for (const [name, provider] of this.providers.entries()) {
      if (!this.services.has(name)) {
        services.push({
          name,
          version: provider.version,
          status: this.status.get(name) || 'registered',
          metadata: this.metadata.get(name),
        });
      }
    }
    
    return services;
  }

  /**
   * Get service metadata
   */
  getMetadata(name: string): ServiceMetadata | undefined {
    return this.metadata.get(name);
  }

  /**
   * Initialize all providers
   */
  async initialize(): Promise<void> {
    // Return existing promise if already initializing
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  private async doInitialize(): Promise<void> {
    // Create a temporary container for dependency resolution
    const container = this.createContainer();
    
    // Sort providers by dependencies
    const sorted = this.topologicalSort();
    
    // Initialize providers in order
    for (const name of sorted) {
      const provider = this.providers.get(name);
      if (!provider || this.services.has(name)) {
        continue;
      }
      
      try {
        this.status.set(name, 'initializing');
        
        // Check dependencies
        if (provider.dependencies) {
          for (const dep of provider.dependencies) {
            if (!this.has(dep)) {
              throw new Error(`Missing dependency "${dep}" for service "${name}"`);
            }
          }
        }
        
        // Create the service
        const service = await provider.create(container);
        this.services.set(name, service);
        this.status.set(name, 'ready');
      } catch (error) {
        this.status.set(name, 'error');
        throw new Error(`Failed to initialize service "${name}": ${error}`);
      }
    }
  }

  /**
   * Topological sort for dependency resolution
   */
  private topologicalSort(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const sorted: string[] = [];
    
    const visit = (name: string) => {
      if (visited.has(name)) return;
      
      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected involving service "${name}"`);
      }
      
      visiting.add(name);
      
      const provider = this.providers.get(name);
      if (provider?.dependencies) {
        for (const dep of provider.dependencies) {
          if (this.providers.has(dep)) {
            visit(dep);
          }
        }
      }
      
      visiting.delete(name);
      visited.add(name);
      sorted.push(name);
    };
    
    for (const name of this.providers.keys()) {
      visit(name);
    }
    
    return sorted;
  }

  /**
   * Create a service container from this registry
   */
  createContainer(): ServiceContainer {
    return new ServiceContainerImpl(this);
  }

  /**
   * Dispose of all services
   */
  async dispose(): Promise<void> {
    // Dispose providers in reverse order
    const sorted = this.topologicalSort().reverse();
    
    for (const name of sorted) {
      const provider = this.providers.get(name);
      if (provider?.dispose) {
        try {
          await provider.dispose();
        } catch (error) {
          console.error(`Error disposing service "${name}":`, error);
        }
      }
    }
    
    // Clear all maps
    this.services.clear();
    this.providers.clear();
    this.metadata.clear();
    this.status.clear();
    this.initializationPromise = null;
  }
}

/**
 * Factory function to create a service registry
 */
export function createServiceRegistry(): ServiceRegistry {
  return new ServiceRegistryImpl();
}