import { MFEServices } from '../types';

export interface ErrorReport {
  id: string;
  timestamp: Date;
  mfeName: string;
  error: {
    message: string;
    stack?: string;
    name: string;
  };
  context?: {
    url?: string;
    userAgent?: string;
    sessionId?: string;
    userId?: string;
    retryCount?: number;
  };
  errorInfo?: {
    componentStack?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'load-error' | 'runtime-error' | 'network-error' | 'timeout-error';
}

export interface ErrorReporterConfig {
  maxErrorsPerSession?: number;
  errorThrottleMs?: number;
  enableConsoleLog?: boolean;
  enableRemoteLogging?: boolean;
  remoteEndpoint?: string;
  onError?: (report: ErrorReport) => void;
}

export class ErrorReporter {
  private errors: ErrorReport[] = [];
  private errorCounts = new Map<string, number>();
  private lastErrorTime = new Map<string, number>();
  private config: Required<ErrorReporterConfig>;
  private services?: MFEServices;

  constructor(config: ErrorReporterConfig = {}, services?: MFEServices) {
    this.config = {
      maxErrorsPerSession: 100,
      errorThrottleMs: 5000,
      enableConsoleLog: true,
      enableRemoteLogging: false,
      remoteEndpoint: '',
      onError: () => {},
      ...config,
    };
    this.services = services;
  }

  reportError(
    mfeName: string,
    error: Error,
    type: ErrorReport['type'] = 'runtime-error',
    context?: ErrorReport['context'],
    errorInfo?: ErrorReport['errorInfo']
  ): ErrorReport | null {
    // Throttle similar errors
    const errorKey = `${mfeName}-${error.message}`;
    const lastTime = this.lastErrorTime.get(errorKey) || 0;
    const now = Date.now();

    if (now - lastTime < this.config.errorThrottleMs) {
      return null; // Throttled
    }

    this.lastErrorTime.set(errorKey, now);

    // Check max errors
    if (this.errors.length >= this.config.maxErrorsPerSession) {
      console.warn('Max error reports reached for session');
      return null;
    }

    // Create error report
    const report: ErrorReport = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      mfeName,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.getSessionId(),
        userId: this.services?.auth.getSession()?.userId,
        ...context,
      },
      errorInfo,
      severity: this.calculateSeverity(error, type),
      type,
    };

    // Store error
    this.errors.push(report);
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);

    // Log to console if enabled
    if (this.config.enableConsoleLog) {
      console.group(`🚨 MFE Error Report: ${mfeName}`);
      console.error('Error:', error);
      console.log('Report:', report);
      console.groupEnd();
    }

    // Log to MFE logger if available
    if (this.services?.logger) {
      this.services.logger.error(`MFE Error in ${mfeName}: ${error.message}`, report);
    }

    // Send to remote if enabled
    if (this.config.enableRemoteLogging && this.config.remoteEndpoint) {
      this.sendToRemote(report);
    }

    // Call custom handler
    this.config.onError(report);

    // Show notification for critical errors
    if (report.severity === 'critical' && this.services?.notification) {
      this.services.notification.error(
        'Critical Error',
        `${mfeName} encountered a critical error. Please refresh the page.`
      );
    }

    return report;
  }

  private calculateSeverity(
    error: Error,
    type: ErrorReport['type']
  ): ErrorReport['severity'] {
    // Network errors are usually medium severity
    if (type === 'network-error') return 'medium';
    
    // Timeout errors are low severity (can retry)
    if (type === 'timeout-error') return 'low';
    
    // Load errors are high severity
    if (type === 'load-error') return 'high';
    
    // Runtime errors depend on the error type
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'critical';
    }
    
    return 'medium';
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('mfe-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('mfe-session-id', sessionId);
    }
    return sessionId;
  }

  private async sendToRemote(report: ErrorReport): Promise<void> {
    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });
    } catch (error) {
      console.error('Failed to send error report to remote:', error);
    }
  }

  getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  getErrorsByMFE(mfeName: string): ErrorReport[] {
    return this.errors.filter(e => e.mfeName === mfeName);
  }

  getErrorCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    this.errorCounts.forEach((count, key) => {
      counts[key] = count;
    });
    return counts;
  }

  clearErrors(): void {
    this.errors = [];
    this.errorCounts.clear();
    this.lastErrorTime.clear();
  }

  getSummary(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    errorsByMFE: Record<string, number>;
  } {
    const summary = {
      totalErrors: this.errors.length,
      errorsByType: {} as Record<string, number>,
      errorsBySeverity: {} as Record<string, number>,
      errorsByMFE: {} as Record<string, number>,
    };

    this.errors.forEach(error => {
      // By type
      summary.errorsByType[error.type] = (summary.errorsByType[error.type] || 0) + 1;
      
      // By severity
      summary.errorsBySeverity[error.severity] = (summary.errorsBySeverity[error.severity] || 0) + 1;
      
      // By MFE
      summary.errorsByMFE[error.mfeName] = (summary.errorsByMFE[error.mfeName] || 0) + 1;
    });

    return summary;
  }
}

// Singleton instance
let errorReporter: ErrorReporter | null = null;

export function getErrorReporter(
  config?: ErrorReporterConfig,
  services?: MFEServices
): ErrorReporter {
  if (!errorReporter) {
    errorReporter = new ErrorReporter(config, services);
  }
  return errorReporter;
}