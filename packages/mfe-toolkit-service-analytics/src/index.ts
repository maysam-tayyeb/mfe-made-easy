/**
 * @mfe-toolkit/service-analytics
 * Analytics tracking service for MFE Toolkit
 */

import type { ServiceProvider, ServiceContainer } from '@mfe-toolkit/core';
import type { AnalyticsService, AnalyticsEvent, AnalyticsConfig } from './types';
import { ANALYTICS_SERVICE_KEY } from './types';

// Re-export types for backward compatibility
export type { AnalyticsService, AnalyticsEvent, AnalyticsConfig } from './types';
export { ANALYTICS_SERVICE_KEY } from './types';

// Implementation
class AnalyticsServiceImpl implements AnalyticsService {
  private config: AnalyticsConfig;
  private context: Record<string, any> = {};
  private userId?: string;
  private anonymousId: string;
  private buffer: AnalyticsEvent[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      debug: false,
      bufferSize: 20,
      flushInterval: 10000,
      ...config,
    };
    
    this.anonymousId = this.generateAnonymousId();
    
    if (this.config.flushInterval) {
      this.startFlushTimer();
    }
  }

  track(event: string, properties?: Record<string, any>): void {
    const analyticsEvent: AnalyticsEvent = {
      name: event,
      properties: {
        ...this.context,
        ...properties,
      },
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.getSessionId(),
    };
    
    if (this.config.debug) {
      console.log('[Analytics] Track:', analyticsEvent);
    }
    
    this.buffer.push(analyticsEvent);
    
    if (this.buffer.length >= (this.config.bufferSize || 20)) {
      this.flush();
    }
  }

  identify(userId: string, traits?: Record<string, any>): void {
    this.userId = userId;
    
    if (traits) {
      this.context = { ...this.context, userTraits: traits };
    }
    
    this.track('identify', { userId, ...traits });
  }

  page(name?: string, properties?: Record<string, any>): void {
    this.track('page_view', {
      page_name: name || window?.location?.pathname,
      ...properties,
    });
  }

  group(groupId: string, traits?: Record<string, any>): void {
    this.context = { ...this.context, groupId, groupTraits: traits };
    this.track('group', { groupId, ...traits });
  }

  alias(userId: string, previousId: string): void {
    this.track('alias', { userId, previousId });
  }

  reset(): void {
    this.userId = undefined;
    this.context = {};
    this.anonymousId = this.generateAnonymousId();
    this.buffer = [];
  }

  setContext(context: Record<string, any>): void {
    this.context = { ...this.context, ...context };
  }

  getAnonymousId(): string {
    return this.anonymousId;
  }

  private generateAnonymousId(): string {
    return `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSessionId(): string {
    // Simple session ID - in production would use more sophisticated approach
    if (typeof window !== 'undefined' && window.sessionStorage) {
      let sessionId = sessionStorage.getItem('analytics-session-id');
      if (!sessionId) {
        sessionId = `session-${Date.now()}`;
        sessionStorage.setItem('analytics-session-id', sessionId);
      }
      return sessionId;
    }
    return 'no-session';
  }

  private flush(): void {
    if (this.buffer.length === 0) return;
    
    const events = [...this.buffer];
    this.buffer = [];
    
    if (this.config.endpoint) {
      // In production, would send to analytics endpoint
      fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey || '',
        },
        body: JSON.stringify({ events }),
      }).catch(error => {
        if (this.config.debug) {
          console.error('[Analytics] Failed to send events:', error);
        }
        // Re-add events to buffer for retry
        this.buffer.unshift(...events);
      });
    } else if (this.config.debug) {
      console.log('[Analytics] Flushing events:', events);
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  dispose(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Provider
export function createAnalyticsProvider(config?: AnalyticsConfig): ServiceProvider<AnalyticsService> {
  return {
    name: ANALYTICS_SERVICE_KEY,
    version: '1.0.0',
    dependencies: ['logger'],
    
    create(container: ServiceContainer): AnalyticsService {
      const logger = container.get('logger');
      const service = new AnalyticsServiceImpl(config);
      
      if (logger) {
        logger.info('Analytics service initialized');
        
        // Track errors
        if (typeof window !== 'undefined') {
          window.addEventListener('error', (event) => {
            service.track('error', {
              message: event.message,
              source: event.filename,
              line: event.lineno,
              column: event.colno,
            });
          });
        }
      }
      
      return service;
    },
    
    dispose(): void {
      // Cleanup handled by service
    },
  };
}

export const analyticsServiceProvider = createAnalyticsProvider();

// Module augmentation is now in ./types.ts for lighter imports
