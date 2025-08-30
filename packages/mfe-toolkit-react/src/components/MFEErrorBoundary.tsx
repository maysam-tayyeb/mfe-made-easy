import React, { Component, ErrorInfo, ReactNode } from 'react';
import type { ServiceContainer } from '@mfe-toolkit/core';
import { getErrorReporter } from '../services/error-reporter';

interface Props {
  children: ReactNode;
  mfeName: string;
  services?: ServiceContainer;
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class MFEErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { mfeName, services, onError } = this.props;
    const { retryCount } = this.state;

    // Log error to console
    console.error(`MFE Error Boundary caught error in ${mfeName}:`, error, errorInfo);

    // Report error using error reporter
    if (services) {
      const errorReporter = getErrorReporter({}, services);
      errorReporter.reportError(mfeName, error, 'runtime-error', {
        retryCount,
        componentStack: errorInfo?.componentStack || undefined,
      });
    }

    // Log to MFE logger service if available
    const logger = services?.get('logger');
    if (logger) {
      logger.error(`MFE ${mfeName} crashed: ${error.message}`, {
        error,
        errorInfo,
        componentStack: errorInfo.componentStack,
      });
    }

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Update state with error details
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    const { retryCount } = this.state;
    const { services, mfeName } = this.props;

    const logger = services?.get('logger');
    if (logger) {
      logger.info(`Retrying MFE ${mfeName} (attempt ${retryCount + 1})`);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: retryCount + 1,
    });
  };

  render() {
    const { hasError, error, errorInfo, retryCount } = this.state;
    const { children, fallback, mfeName } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, errorInfo!, this.handleRetry);
      }

      // Default fallback UI
      return (
        <div className="mfe-error-boundary">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800">MFE Loading Error</h3>
                <p className="mt-1 text-sm text-red-700">
                  Failed to load <strong>{mfeName}</strong> microfrontend.
                </p>

                {/* Error details in development */}
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                      Show error details
                    </summary>
                    <div className="mt-2 text-xs">
                      <p className="font-mono text-red-600">{error.message}</p>
                      {errorInfo && (
                        <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto max-h-40 text-red-800">
                          {errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </details>
                )}

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={this.handleRetry}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Retry {retryCount > 0 && `(${retryCount})`}
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// Higher-order component for functional components
export function withMFEErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  mfeName: string,
  errorBoundaryProps?: Omit<Props, 'children' | 'mfeName'>
) {
  return (props: P) => (
    <MFEErrorBoundary mfeName={mfeName} {...errorBoundaryProps}>
      <Component {...props} />
    </MFEErrorBoundary>
  );
}
