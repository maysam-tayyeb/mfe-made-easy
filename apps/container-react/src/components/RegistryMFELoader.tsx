import React, { useEffect, useState } from 'react';
import { MFELoader } from '@mfe-toolkit/react';
import { useRegistry } from '@/hooks/useRegistry';
import { useServices } from '@/contexts/ServiceContext';
import type { MFEManifest } from '@mfe-toolkit/core';

interface RegistryMFELoaderProps {
  id: string;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
  maxRetries?: number;
  retryDelay?: number;
  isolate?: boolean;
  errorBoundary?: boolean;
  errorFallback?: (error: Error, errorInfo: React.ErrorInfo, retry: () => void) => React.ReactNode;
}

export function RegistryMFELoader({ id, fallback, ...props }: RegistryMFELoaderProps) {
  const { registry, isLoading: registryLoading, error: registryError } = useRegistry();
  const serviceContainer = useServices();
  const [manifest, setManifest] = useState<MFEManifest | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!registryLoading && !registryError) {
      try {
        const mfe = registry.get(id);
        if (mfe) {
          setManifest(mfe);
          setError(null);
        } else {
          // Fallback for service-demos that aren't in the registry yet
          // This is a temporary solution for development
          if (id.startsWith('mfe-modal-') || id.startsWith('mfe-notification-')) {
            const serviceType = id.includes('modal') ? 'modal' : 'notification';
            const fallbackManifest: MFEManifest = {
              name: id,
              version: '1.0.0',
              url: `http://localhost:8080/service-demos/${serviceType}/${id}/${id}.js`,
              dependencies: {
                runtime: {},
                peer: { '@mfe-toolkit/core': '^0.1.0' }
              },
              compatibility: {
                container: '^1.0.0',
                browsers: {
                  chrome: '>=90',
                  firefox: '>=88',
                  safari: '>=14',
                  edge: '>=90'
                }
              },
              capabilities: {
                emits: [],
                listens: [],
                features: []
              },
              requirements: {
                services: [
                  { name: serviceType, optional: false },
                  { name: 'logger', optional: true }
                ]
              },
              metadata: {
                displayName: `${id} (Fallback)`,
                description: `${serviceType} service demo`,
                icon: '📦',
                author: { name: 'MFE Toolkit Team' },
                category: 'service-demos',
                tags: [serviceType, 'demo']
              }
            };
            setManifest(fallbackManifest);
            setError(null);
          } else {
            setError(new Error(`MFE with id "${id}" not found in registry`));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(`Failed to get MFE "${id}" from registry`));
      }
    }
  }, [id, registry, registryLoading, registryError]);

  if (registryLoading) {
    return <>{fallback || <div>Loading registry...</div>}</>;
  }

  if (registryError || error) {
    const displayError = registryError || error;
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <h3 className="text-red-800 font-semibold">Failed to load MFE</h3>
        <p className="text-red-600 text-sm mt-1">{displayError?.message}</p>
      </div>
    );
  }

  if (!manifest) {
    return <>{fallback || <div>Loading MFE configuration...</div>}</>;
  }

  return (
    <MFELoader
      name={manifest.name}
      url={manifest.url}
      serviceContainer={serviceContainer}
      fallback={fallback}
      isolate={true}
      {...props}
    />
  );
}
