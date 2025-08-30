import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { MFEModule, ServiceContainer } from '@mfe-toolkit/core';
import { MFEErrorBoundary } from './MFEErrorBoundary';
import { getErrorReporter } from '../services/error-reporter';

interface MFELoaderProps {
  name: string;
  url: string;
  serviceContainer: ServiceContainer;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
  maxRetries?: number;
  retryDelay?: number;
  isolate?: boolean;
  errorBoundary?: boolean;
  errorFallback?: (error: Error, errorInfo: React.ErrorInfo, retry: () => void) => React.ReactNode;
}

interface LoaderState {
  loading: boolean;
  error: Error | null;
  retryCount: number;
}

// Isolated loading strategy - prevents unmounting during parent re-renders
const IsolatedLoaderStrategy: React.FC<MFELoaderProps> = ({
  name,
  url,
  serviceContainer,
  fallback = <div>Loading MFE...</div>,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mfeInstanceRef = useRef<any>(null);
  const serviceContainerRef = useRef<ServiceContainer | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Use ref to avoid stale closure
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    let isMounted = true;

    const loadAndMountMFE = async () => {
      try {
        serviceContainer.get('logger')?.debug(`[IsolatedLoader] Loading ${name} from ${url}`);

        // Import the MFE module
        const module = await import(/* @vite-ignore */ url);

        if (!module.default || typeof module.default.mount !== 'function') {
          throw new Error(`MFE ${name} does not export a valid module with mount function`);
        }

        // Only proceed if component is still mounted
        if (!isMounted) return;

        // Create an isolated container for the MFE
        const mfeContainer = document.createElement('div');
        mfeContainer.style.width = '100%';
        mfeContainer.setAttribute('data-mfe', name);
        mfeContainer.setAttribute('data-react-root', 'false'); // Mark as non-React content

        // Wait for our container to be ready
        if (containerRef.current) {
          // Clear any existing content
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(mfeContainer);

          serviceContainer.get('logger')?.info(`[IsolatedLoader] Mounting ${name}`);
          const container = serviceContainer; // Already a ServiceContainer
          serviceContainerRef.current = container;
          await module.default.mount(mfeContainer, container);
          mfeInstanceRef.current = module.default;

          // Store cleanup function
          if (module.default.unmount) {
            cleanupRef.current = () => {
              try {
                serviceContainer.get('logger')?.debug(`[IsolatedLoader] Unmounting ${name}`);
                const unmountContainer = serviceContainerRef.current || serviceContainer;
                module.default.unmount(unmountContainer);
                serviceContainerRef.current = null;
              } catch (err) {
                serviceContainer.get('logger')?.error(`Error unmounting ${name}:`, err);
              }
            };
          }

          setLoading(false);
          serviceContainer.get('logger')?.info(`[IsolatedLoader] ${name} mounted successfully`);
        }
      } catch (err) {
        if (!isMounted) return;

        const error = err instanceof Error ? err : new Error('Unknown error');
        serviceContainer.get('logger')?.error(`[IsolatedLoader] Error loading ${name}:`, error);

        // Report error to error reporter
        const errorReporter = getErrorReporter({}, serviceContainer);
        const errorType = error.message.includes('timeout')
          ? 'timeout-error'
          : error.message.includes('network')
            ? 'network-error'
            : 'load-error';

        errorReporter.reportError(name, error, errorType, {
          url,
        });

        setError(error);
        setLoading(false);
        onErrorRef.current?.(error);
      }
    };

    // Reset state when name/url changes
    setLoading(true);
    setError(null);

    // Cleanup previous MFE if any
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // Clear container
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Load immediately - DOM is already ready
    loadAndMountMFE();

    // Cleanup
    return () => {
      isMounted = false;

      // Only cleanup if component is truly unmounting
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }

      // Clean up the container
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [name, url, serviceContainer]); // Include serviceContainer but it should be stable

  if (error) {
    return (
      <div className="text-red-500 p-4">
        <h3>Error loading {name}</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <>
      {loading && fallback}
      <div
        ref={containerRef}
        style={{ width: '100%', display: loading ? 'none' : 'block' }}
        // Prevent React from touching this div's children
        suppressHydrationWarning
      />
    </>
  );
};

// Standard loading strategy - with retry logic and error reporting
const StandardLoaderStrategy: React.FC<MFELoaderProps> = ({
  name,
  url,
  serviceContainer,
  fallback = <div>Loading MFE...</div>,
  onError,
  maxRetries = 3,
  retryDelay = 1000,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<LoaderState>({
    loading: true,
    error: null,
    retryCount: 0,
  });
  const mfeRef = useRef<MFEModule | null>(null);
  const serviceContainerRef = useRef<ServiceContainer | null>(null);
  const mountedRef = useRef<boolean>(false);
  const loadingRef = useRef<boolean>(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const loadMFE = useCallback(async () => {
    // Prevent concurrent loads
    if (loadingRef.current) {
      serviceContainer
        .get('logger')
        ?.debug(`MFE ${name} is already loading, skipping duplicate load`);
      return;
    }

    // If already mounted, skip loading
    if (mountedRef.current && mfeRef.current) {
      serviceContainer.get('logger')?.debug(`MFE ${name} is already mounted, skipping load`);
      return;
    }

    loadingRef.current = true;

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      console.log(`[MFELoader] Starting to load MFE ${name} from URL: ${url}`);
      serviceContainer.get('logger')?.info(`Loading MFE ${name} from URL: ${url}`);
      const mfeModule = await import(/* @vite-ignore */ url);

      const mfe = mfeModule.default as MFEModule;

      if (!mfe || typeof mfe.mount !== 'function') {
        throw new Error(`MFE ${name} does not export a valid module with mount function`);
      }

      console.log(`[MFELoader] MFE ${name} loaded successfully, preparing to mount`);
      mfeRef.current = mfe;

      // Give React time to attach the ref, then mount
      await new Promise<void>((resolve, reject) => {
        // If already mounted (e.g., from a previous render), just resolve
        if (mountedRef.current) {
          console.log(`[MFELoader] MFE ${name} already mounted, skipping mount`);
          resolve();
          return;
        }

        const mountTimeout = setTimeout(() => {
          reject(new Error('Mount timeout - container ref not available'));
        }, 5000);

        // Mount immediately if container is ready
        const performMount = async () => {
          if (containerRef.current && mfeRef.current && !mountedRef.current) {
            try {
              console.log(`[MFELoader] Mounting MFE ${name} to container`);
              serviceContainer.get('logger')?.info(`Mounting MFE ${name}`);
              const container = serviceContainer; // Already a ServiceContainer
              serviceContainerRef.current = container;
              await mfeRef.current.mount(containerRef.current, container);
              mountedRef.current = true;
              clearTimeout(mountTimeout);
              resolve();
            } catch (mountError) {
              clearTimeout(mountTimeout);
              reject(new Error(`Failed to mount MFE: ${mountError}`));
            }
          }
        };

        if (containerRef.current && mfeRef.current && !mountedRef.current) {
          performMount();
        } else if (!containerRef.current) {
          // If container not ready, wait a frame
          requestAnimationFrame(async () => {
            if (containerRef.current && mfeRef.current && !mountedRef.current) {
              try {
                console.log(`[MFELoader] Mounting MFE ${name} to container (after frame)`);
                serviceContainer.get('logger')?.info(`Mounting MFE ${name}`);
                const container = serviceContainer; // Already a ServiceContainer
                serviceContainerRef.current = container;
                await mfeRef.current.mount(containerRef.current, container);
                mountedRef.current = true;
                clearTimeout(mountTimeout);
                resolve();
              } catch (mountError) {
                clearTimeout(mountTimeout);
                reject(new Error(`Failed to mount MFE: ${mountError}`));
              }
            } else {
              clearTimeout(mountTimeout);
              console.error(`[MFELoader] Container ref not available for ${name}`);
              reject(new Error('Container element not found'));
            }
          });
        } else {
          clearTimeout(mountTimeout);
          resolve(); // Already mounted
        }
      });

      setState((prev) => ({ ...prev, loading: false }));
      serviceContainer.get('logger')?.info(`MFE ${name} ready`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error loading MFE');

      console.error(`[MFELoader] Failed to load MFE ${name}:`, error);
      serviceContainer.get('logger')?.error(`Failed to load MFE ${name}: ${error.message}`);

      // Report error
      const errorReporter = getErrorReporter({}, serviceContainer);
      const errorType = error.message.includes('timeout')
        ? 'timeout-error'
        : error.message.includes('network')
          ? 'network-error'
          : 'load-error';

      errorReporter.reportError(name, error, errorType, {
        retryCount: state.retryCount,
        url,
      });

      // Handle retry logic
      if (state.retryCount < maxRetries) {
        serviceContainer
          .get('logger')
          ?.info(
            `Retrying MFE ${name} in ${retryDelay}ms (attempt ${state.retryCount + 1}/${maxRetries})`
          );

        setState((prev) => ({
          ...prev,
          error,
          loading: false,
          retryCount: prev.retryCount + 1,
        }));

        // Auto-retry after delay
        retryTimeoutRef.current = setTimeout(
          () => {
            loadMFE();
          },
          retryDelay * Math.pow(2, state.retryCount)
        ); // Exponential backoff
      } else {
        setState((prev) => ({ ...prev, error, loading: false }));
        if (onError) {
          onError(error);
        }
      }
    } finally {
      loadingRef.current = false;
    }
  }, [name, url, serviceContainer, state.retryCount, maxRetries, retryDelay, onError]);

  // Store previous name/url to detect actual changes
  const prevNameRef = useRef(name);
  const prevUrlRef = useRef(url);

  useEffect(() => {
    // Check if name or URL actually changed
    const nameChanged = prevNameRef.current !== name;
    const urlChanged = prevUrlRef.current !== url;

    if (nameChanged || urlChanged) {
      // Unmount previous MFE if it exists
      if (mfeRef.current && mfeRef.current.unmount && mountedRef.current) {
        try {
          serviceContainer.get('logger')?.info(`Unmounting previous MFE ${prevNameRef.current}`);
          const container = serviceContainerRef.current || serviceContainer;
          mfeRef.current.unmount(container);
          mountedRef.current = false;
          serviceContainerRef.current = null;
          mfeRef.current = null;
        } catch (err) {
          serviceContainer
            .get('logger')
            ?.error(`Error unmounting MFE ${prevNameRef.current}:`, err);
        }
      }

      // Update refs
      prevNameRef.current = name;
      prevUrlRef.current = url;
    }

    // Only load if not already loaded or mounted
    if (!mfeRef.current && !mountedRef.current && !loadingRef.current) {
      loadMFE();
    }

    // Minimal cleanup - don't unmount the MFE
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, url]); // Only re-run if name or url changes

  // Cleanup on actual component unmount
  useEffect(() => {
    return () => {
      // This cleanup only runs when component is truly unmounting
      if (mfeRef.current && mfeRef.current.unmount && mountedRef.current) {
        try {
          serviceContainer.get('logger')?.info(`Component unmounting, cleaning up MFE ${name}`);
          const container = serviceContainerRef.current || serviceContainer;
          mfeRef.current.unmount(container);
          mountedRef.current = false;
          serviceContainerRef.current = null;
          mfeRef.current = null;
        } catch (err) {
          serviceContainer.get('logger')?.error(`Error unmounting MFE ${name}:`, err);
        }
      }
      // Clear the container content
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = only on mount/unmount

  const handleManualRetry = useCallback(() => {
    setState((prev) => ({ ...prev, retryCount: 0 }));
    loadMFE();
  }, [loadMFE]);

  if (state.error && state.retryCount >= maxRetries) {
    return (
      <div
        className="mfe-error p-4 bg-red-50 border border-red-200 rounded"
        data-testid="mfe-error"
      >
        <h3 className="text-red-800 font-semibold">Failed to load MFE: {name}</h3>
        <p className="text-red-600 text-sm mt-1">{state.error.message}</p>
        <p className="text-red-500 text-xs mt-2">Retried {state.retryCount} times</p>
        <button
          onClick={handleManualRetry}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="mfe-loader-wrapper">
      <div ref={containerRef} className="mfe-container" style={{ minHeight: '1px' }}>
        {/* Container must always exist for MFE to mount */}
      </div>
      {state.loading && fallback}
      {state.error && state.retryCount < maxRetries && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800 text-sm">
            Retrying... (Attempt {state.retryCount + 1} of {maxRetries})
          </p>
        </div>
      )}
    </div>
  );
};

// Unified MFELoader that supports both standard and isolated loading strategies
export const MFELoader: React.FC<MFELoaderProps> = (props) => {
  const { errorBoundary = true, isolate = false, errorFallback, ...loaderProps } = props;

  const [retryKey, setRetryKey] = useState(0);

  const handleRetry = useCallback(() => {
    setRetryKey((prev) => prev + 1);
  }, []);

  // Choose loading strategy based on isolation needs
  const LoaderComponent = isolate ? IsolatedLoaderStrategy : StandardLoaderStrategy;

  const content = <LoaderComponent key={retryKey} {...loaderProps} />;

  // Optionally wrap in error boundary
  if (!errorBoundary) {
    return content;
  }

  return (
    <MFEErrorBoundary
      mfeName={props.name}
      services={props.serviceContainer}
      fallback={
        errorFallback ||
        ((error, _errorInfo, retry) => (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h3 className="text-red-800 font-semibold mb-2">
              MFE {props.name} crashed unexpectedly
            </h3>
            <p className="text-red-600 text-sm">{error.message}</p>
            <button
              onClick={() => {
                retry();
                handleRetry();
              }}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
            >
              Restart MFE
            </button>
          </div>
        ))
      }
    >
      {content}
    </MFEErrorBoundary>
  );
};
