import { useState, useEffect } from 'react';
import { MFERegistryService, RegistryOptions } from '@mfe-toolkit/core';
import { getRegistrySingleton } from '@/services/registry-singleton';

export interface UseRegistryOptions extends RegistryOptions {
  loadOnMount?: boolean;
  onLoadSuccess?: () => void;
  onLoadError?: (error: Error) => void;
  useSingleton?: boolean;
}

export interface UseRegistryResult {
  registry: MFERegistryService;
  isLoading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

export function useRegistry(options: UseRegistryOptions = {}): UseRegistryResult {
  const {
    loadOnMount = true,
    onLoadSuccess,
    onLoadError,
    useSingleton = true,
    ...registryOptions
  } = options;

  const [registry] = useState(() => {
    // Use singleton by default to prevent multiple instances
    if (useSingleton) {
      return getRegistrySingleton();
    }

    // Create new instance if explicitly requested
    const registryUrl = import.meta.env.VITE_MFE_REGISTRY_URL || '/mfe-registry.json';
    const environment = import.meta.env.MODE;

    return new MFERegistryService({
      url: registryUrl,
      cacheDuration: environment === 'production' ? 30 * 60 * 1000 : 5 * 60 * 1000,
      ...registryOptions,
    });
  });

  const [isLoading, setIsLoading] = useState(loadOnMount);
  const [error, setError] = useState<Error | null>(null);

  const loadRegistry = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await registry.loadFromUrl();
      onLoadSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load registry');
      console.error('Failed to load MFE registry:', error);
      setError(error);
      onLoadError?.(error);

      // Fallback to hardcoded registry for development
      if (import.meta.env.DEV) {
        registry.register({
          name: 'example',
          version: '1.0.0',
          url: 'http://localhost:3001/mfe-example.js',
          dependencies: {
            runtime: {
              'react': '^18.0.0',
              'react-dom': '^18.0.0'
            },
            peer: {}
          },
          compatibility: {
            container: '^1.0.0'
          },
          capabilities: {
            emits: [],
            listens: [],
            features: []
          },
          requirements: {
            services: []
          },
          metadata: {
            displayName: 'Example MFE',
            description: 'Example microfrontend'
          }
        });
        registry.register({
          name: 'react17',
          version: '1.0.0',
          url: 'http://localhost:3002/react17-mfe.js',
          dependencies: {
            runtime: {
              'react': '^17.0.0',
              'react-dom': '^17.0.0'
            },
            peer: {}
          },
          compatibility: {
            container: '^1.0.0'
          },
          capabilities: {
            emits: [],
            listens: [],
            features: []
          },
          requirements: {
            services: []
          },
          metadata: {
            displayName: 'React 17 MFE',
            description: 'React 17 microfrontend'
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (loadOnMount) {
      loadRegistry();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    registry,
    isLoading,
    error,
    reload: loadRegistry,
  };
}
