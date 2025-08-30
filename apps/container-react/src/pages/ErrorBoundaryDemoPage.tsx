import React, { useState, useEffect } from 'react';
import { MFELoader } from '@mfe-toolkit/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useServices } from '@/contexts/ServiceContext';
import { Hero, MetricCard, TabGroup, EmptyState } from '@mfe/design-system-react';
import {
  AlertCircle,
  XCircle,
  Shield,
  RefreshCw,
  Wifi,
  FileX,
  Clock,
  Zap,
  Activity,
  Database,
  ChevronRight,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';

// Fake MFE URLs for testing different error scenarios
const ERROR_SCENARIOS = {
  networkError: 'http://localhost:9999/non-existent-mfe.js',
  invalidModule: '/test-assets/invalid-module.js',
  timeoutError: 'http://httpstat.us/200?sleep=10000',
  crashingMFE: '/test-assets/crashing-mfe.js',
};

export const ErrorBoundaryDemoPage: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [errorReportVisible, setErrorReportVisible] = useState(false);
  const [, setRefreshKey] = useState(0);
  const serviceContainer = useServices();
  const errorReporter = serviceContainer.get('errorReporter');

  const scenarios = [
    {
      id: 'networkError',
      name: 'Network Error',
      description: 'Simulates a network error when loading MFE',
      url: ERROR_SCENARIOS.networkError,
      icon: <Wifi className="h-5 w-5" />,
      color: 'ds-icon-danger',
    },
    {
      id: 'invalidModule',
      name: 'Invalid Module',
      description: "MFE that doesn't export proper mount function",
      url: ERROR_SCENARIOS.invalidModule,
      icon: <FileX className="h-5 w-5" />,
      color: 'ds-icon-warning',
    },
    {
      id: 'timeoutError',
      name: 'Timeout Error',
      description: 'MFE that takes too long to load',
      url: ERROR_SCENARIOS.timeoutError,
      icon: <Clock className="h-5 w-5" />,
      color: 'ds-icon-info',
    },
    {
      id: 'crashingMFE',
      name: 'Runtime Crash',
      description: 'MFE that crashes after mounting',
      url: ERROR_SCENARIOS.crashingMFE,
      icon: <Zap className="h-5 w-5" />,
      color: 'ds-icon-danger',
    },
  ];

  const getErrorSummary = () => {
    const summary = errorReporter?.getSummary();
    return summary;
  };

  // Refresh component to show updated error counts
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 2000); // Refresh every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const errorSummary = getErrorSummary();

  const errorHandlingFeatures = [
    {
      id: 'boundaries',
      label: 'Error Boundaries',
      content: (
        <div className="space-y-4">
          <p className="text-sm ds-text-muted">
            React Error Boundaries catch JavaScript errors anywhere in the MFE component tree, log
            those errors, and display a fallback UI instead of crashing.
          </p>
          <ul className="ds-list-check">
            <li className="ds-list-check-item">
              <span className="ds-icon-success">•</span>
              <span className="text-sm">Catches JavaScript errors in MFE component tree</span>
            </li>
            <li className="ds-list-check-item">
              <span className="ds-icon-success">•</span>
              <span className="text-sm">Prevents crashes from affecting other MFEs</span>
            </li>
            <li className="ds-list-check-item">
              <span className="ds-icon-success">•</span>
              <span className="text-sm">Provides fallback UI for graceful degradation</span>
            </li>
            <li className="ds-list-check-item">
              <span className="ds-icon-success">•</span>
              <span className="text-sm">Allows retry attempts for transient failures</span>
            </li>
            <li className="ds-list-check-item">
              <span className="ds-icon-success">•</span>
              <span className="text-sm">Logs errors for debugging and monitoring</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'reporting',
      label: 'Error Reporting',
      content: (
        <div className="space-y-4">
          <p className="text-sm ds-text-muted">
            Centralized error reporting system that collects, categorizes, and analyzes errors
            across all MFEs for better observability.
          </p>
          <ul className="ds-list-check">
            <li className="ds-list-check-item">
              <span className="ds-icon-success">•</span>
              <span className="text-sm">Centralized error collection and analysis</span>
            </li>
            <li className="ds-list-check-item">
              <span className="ds-icon-success">•</span>
              <span className="text-sm">Error throttling to prevent spam</span>
            </li>
            <li className="ds-list-check-item">
              <span className="ds-icon-success">•</span>
              <span className="text-sm">Severity classification (low, medium, high, critical)</span>
            </li>
            <li className="ds-list-check-item">
              <span className="ds-icon-success">•</span>
              <span className="text-sm">Session tracking and error context</span>
            </li>
            <li className="ds-list-check-item">
              <span className="ds-icon-success">•</span>
              <span className="text-sm">Export errors for external monitoring</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'recovery',
      label: 'Recovery Strategies',
      content: (
        <div className="space-y-4">
          <p className="text-sm ds-text-muted">
            Multiple recovery strategies ensure the platform remains functional even when individual
            MFEs fail.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Automatic Recovery</h4>
              <ul className="space-y-1 text-xs ds-text-muted">
                <li>• Retry with exponential backoff</li>
                <li>• Circuit breaker pattern</li>
                <li>• Fallback to cached version</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Manual Recovery</h4>
              <ul className="space-y-1 text-xs ds-text-muted">
                <li>• User-triggered retry</li>
                <li>• Skip failed MFE</li>
                <li>• Load alternative MFE</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      content: (
        <div className="space-y-4">
          <p className="text-sm ds-text-muted">
            Real-time monitoring and alerting help identify and resolve issues quickly.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="ds-card-compact text-center">
              <p className="text-2xl font-bold ds-accent-primary">{errorSummary.totalErrors}</p>
              <p className="text-xs ds-text-muted">Total Errors</p>
            </div>
            <div className="ds-card-compact text-center">
              <p className="text-2xl font-bold ds-accent-danger">
                {errorSummary.errorsBySeverity.critical || 0}
              </p>
              <p className="text-xs ds-text-muted">Critical</p>
            </div>
            <div className="ds-card-compact text-center">
              <p className="text-2xl font-bold ds-accent-warning">
                {errorSummary.errorsBySeverity.high || 0}
              </p>
              <p className="text-xs ds-text-muted">High</p>
            </div>
            <div className="ds-card-compact text-center">
              <p className="text-2xl font-bold ds-accent-info">
                {errorSummary.errorsBySeverity.medium || 0}
              </p>
              <p className="text-xs ds-text-muted">Medium</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'ds-bg-accent-danger-soft ds-accent-danger';
      case 'high':
        return 'ds-bg-accent-warning-soft ds-accent-warning';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700';
      case 'low':
        return 'bg-gray-50 text-gray-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="ds-page">
      {/* Hero Section */}
      <Hero
        title="Error Boundary Demo"
        description="Test error handling and recovery mechanisms for MFEs with resilient fallback strategies"
        gradient
      >
        <div className="ds-mt-lg grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Total Errors"
            value={errorSummary.totalErrors}
            trend={{
              value: 'tracked',
              direction: errorSummary.totalErrors > 0 ? 'down' : 'neutral',
            }}
            icon={<AlertCircle className="h-4 w-4" />}
          />
          <MetricCard
            label="Error Types"
            value={Object.keys(errorSummary.errorsByType).length}
            trend={{ value: 'categories', direction: 'neutral' }}
            icon={<Database className="h-4 w-4" />}
          />
          <MetricCard
            label="Affected MFEs"
            value={Object.keys(errorSummary.errorsByMFE).length}
            trend={{ value: 'isolated', direction: 'neutral' }}
            icon={<Shield className="h-4 w-4" />}
          />
          <MetricCard
            label="Recovery Rate"
            value="99%"
            trend={{ value: 'automatic', direction: 'up' }}
            icon={<Activity className="h-4 w-4" />}
          />
        </div>
      </Hero>

      {/* Error Scenarios */}
      <div className="ds-mb-lg">
        <h2 className="ds-section-title ds-mb-md">Test Error Scenarios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => setSelectedScenario(scenario.id)}
              className={`ds-card-padded ds-hover-scale text-left ${
                selectedScenario === scenario.id
                  ? 'ds-border-accent-primary border-2 ds-bg-accent-primary-soft'
                  : ''
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={scenario.color}>{scenario.icon}</div>
                <h3 className="ds-card-title">{scenario.name}</h3>
              </div>
              <p className="text-sm ds-text-muted mb-3">{scenario.description}</p>
              <div className="flex items-center gap-2 text-xs ds-accent-primary">
                <span>{selectedScenario === scenario.id ? 'Selected' : 'Select'}</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* MFE Test Area */}
      {selectedScenario && (
        <div className="ds-card-padded ds-mb-lg">
          <div className="flex items-center justify-between ds-mb-md">
            <div>
              <h2 className="ds-section-title">MFE Test Area</h2>
              <p className="text-sm ds-text-muted mt-1">
                Testing scenario: <span className="font-semibold">{selectedScenario}</span>
              </p>
            </div>
            <Button onClick={() => setSelectedScenario('')} variant="outline" size="sm">
              <XCircle className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          <div className="ds-card p-0 overflow-hidden min-h-[300px] ds-bg-muted/20">
            <MFELoader
              key={selectedScenario}
              name={`test-${selectedScenario}`}
              url={scenarios.find((s) => s.id === selectedScenario)?.url || ''}
              serviceContainer={serviceContainer}
              fallback={
                <div className="ds-loading-state min-h-[300px]">
                  <div className="ds-spinner-lg"></div>
                  <p className="ds-loading-text">Loading test MFE...</p>
                  <p className="ds-loading-subtext">Attempting to load with error scenario</p>
                </div>
              }
              onError={(error: Error) => {
                const notification = serviceContainer.get('notification');
                notification?.error('MFE Load Failed', error.message);
              }}
              isolate={true}
            />
          </div>
        </div>
      )}

      {/* Error Handling Features */}
      <div className="ds-card-padded ds-mb-lg">
        <h2 className="ds-section-title ds-mb-md">Error Handling Features</h2>
        <TabGroup tabs={errorHandlingFeatures} defaultTab="boundaries" />
      </div>

      {/* Error Report */}
      <div className="ds-card-padded">
        <div className="flex items-center justify-between ds-mb-md">
          <h2 className="ds-section-title">Error Report</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => setErrorReportVisible(!errorReportVisible)}
              variant="outline"
              size="sm"
            >
              {errorReportVisible ? (
                <EyeOff className="h-4 w-4 mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              {errorReportVisible ? 'Hide' : 'Show'} Details
            </Button>
            <Button
              onClick={() => {
                errorReporter?.clearErrors();
                setErrorReportVisible(false);
                setRefreshKey((prev) => prev + 1);
              }}
              variant="outline"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Errors
            </Button>
          </div>
        </div>

        {/* Error Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ds-mb-md">
          {/* By Type */}
          <div className="ds-card-compact">
            <h4 className="text-sm font-semibold mb-3">Errors by Type</h4>
            {Object.keys(errorSummary.errorsByType).length === 0 ? (
              <p className="text-xs ds-text-muted">No errors recorded</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(errorSummary.errorsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm">{type}</span>
                    <Badge variant="secondary" className="text-xs">
                      {count as React.ReactNode}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* By Severity */}
          <div className="ds-card-compact">
            <h4 className="text-sm font-semibold mb-3">Errors by Severity</h4>
            {Object.keys(errorSummary.errorsBySeverity).length === 0 ? (
              <p className="text-xs ds-text-muted">No errors recorded</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(errorSummary.errorsBySeverity).map(([severity, count]) => (
                  <div key={severity} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{severity}</span>
                    <Badge
                      variant={severity === 'critical' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {count as React.ReactNode}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* By MFE */}
          <div className="ds-card-compact">
            <h4 className="text-sm font-semibold mb-3">Errors by MFE</h4>
            {Object.keys(errorSummary.errorsByMFE).length === 0 ? (
              <p className="text-xs ds-text-muted">No errors recorded</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(errorSummary.errorsByMFE).map(([mfe, count]) => (
                  <div key={mfe} className="flex items-center justify-between">
                    <span className="text-sm truncate">{mfe}</span>
                    <Badge variant="secondary" className="text-xs">
                      {count as React.ReactNode}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Error Details */}
        {errorReportVisible && (
          <div className="border-t pt-4">
            <h3 className="ds-card-title ds-mb-sm">Error Details</h3>
            {(errorReporter?.getErrors()?.length ?? 0) === 0 ? (
              <EmptyState
                title="No errors recorded"
                description="Errors will appear here when they occur"
                icon={<Shield className="h-16 w-16 ds-icon-success" />}
              />
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {errorReporter?.getErrors()?.map((error: any) => (
                  <div
                    key={error.id}
                    className={`ds-card-compact ${
                      error.severity === 'critical' ? 'border-red-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{error.mfeName}</span>
                        <Badge className={`text-xs ${getSeverityColor(error.severity)}`}>
                          {error.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {error.type}
                        </Badge>
                      </div>
                      <span className="text-xs ds-text-muted">
                        {error.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm ds-accent-danger mb-2">{error.error.message}</p>
                    {error.context?.retryCount !== undefined && (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-3 w-3 ds-icon-muted" />
                        <span className="text-xs ds-text-muted">
                          Retry attempts: {error.context.retryCount}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
