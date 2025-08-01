import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MFEServices, MFEModule } from '../types';
import { MFEErrorBoundary } from './MFEErrorBoundary';
import { getErrorReporter } from '../services/error-reporter';

interface MFELoaderProps {
  name: string;
  url: string;
  services: MFEServices;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
  maxRetries?: number;
  retryDelay?: number;
}

interface LoaderState {
  loading: boolean;
  error: Error | null;
  retryCount: number;
}

const MFELoaderContent: React.FC<MFELoaderProps> = ({
  name,
  url,
  services,
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
  const mountedRef = useRef<boolean>(false);
  const loadingRef = useRef<boolean>(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const loadMFE = useCallback(async () => {
    // Prevent concurrent loads
    if (loadingRef.current) {
      services.logger.debug(`MFE ${name} is already loading, skipping duplicate load`);
      return;
    }

    // If already mounted, skip loading
    if (mountedRef.current && mfeRef.current) {
      services.logger.debug(`MFE ${name} is already mounted, skipping load`);
      return;
    }

    loadingRef.current = true;

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      console.log(`[MFELoader] Starting to load MFE ${name} from URL: ${url}`);
      services.logger.info(`Loading MFE ${name} from URL: ${url}`);
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

        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          if (containerRef.current && mfeRef.current && !mountedRef.current) {
            try {
              console.log(`[MFELoader] Mounting MFE ${name} to container`);
              services.logger.info(`Mounting MFE ${name}`);
              mfeRef.current.mount(containerRef.current, services);
              mountedRef.current = true;
              clearTimeout(mountTimeout);
              resolve();
            } catch (mountError) {
              clearTimeout(mountTimeout);
              reject(new Error(`Failed to mount MFE: ${mountError}`));
            }
          } else if (!containerRef.current) {
            clearTimeout(mountTimeout);
            console.error(`[MFELoader] Container ref not available for ${name}`);
            reject(new Error('Container element not found'));
          } else {
            clearTimeout(mountTimeout);
            resolve(); // Already mounted
          }
        });
      });

      setState((prev) => ({ ...prev, loading: false }));
      services.logger.info(`MFE ${name} ready`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error loading MFE');

      console.error(`[MFELoader] Failed to load MFE ${name}:`, error);
      services.logger.error(`Failed to load MFE ${name}: ${error.message}`);

      // Report error
      const errorReporter = getErrorReporter({}, services);
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
        services.logger.info(
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
  }, [name, url, services, state.retryCount, maxRetries, retryDelay, onError]);

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
          services.logger.info(`Unmounting previous MFE ${prevNameRef.current}`);
          mfeRef.current.unmount();
          mountedRef.current = false;
          mfeRef.current = null;
        } catch (err) {
          services.logger.error(`Error unmounting MFE ${prevNameRef.current}:`, err);
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
          services.logger.info(`Component unmounting, cleaning up MFE ${name}`);
          mfeRef.current.unmount();
        } catch (err) {
          services.logger.error(`Error unmounting MFE ${name}:`, err);
        }
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

export const MFELoader: React.FC<MFELoaderProps> = (props) => {
  const [retryKey, setRetryKey] = useState(0);

  const handleRetry = useCallback(() => {
    setRetryKey((prev) => prev + 1);
  }, []);

  return (
    <MFEErrorBoundary
      mfeName={props.name}
      services={props.services}
      fallback={(error, _errorInfo, retry) => (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="text-red-800 font-semibold mb-2">MFE {props.name} crashed unexpectedly</h3>
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
      )}
    >
      <MFELoaderContent key={retryKey} {...props} />
    </MFEErrorBoundary>
  );
};
