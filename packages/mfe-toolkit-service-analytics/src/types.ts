/**
 * Type definitions for the analytics service
 * This file contains only types and module augmentation, no implementation
 */

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
}

export interface AnalyticsService {
  track(event: string, properties?: Record<string, any>): void;
  identify(userId: string, traits?: Record<string, any>): void;
  page(name?: string, properties?: Record<string, any>): void;
  group(groupId: string, traits?: Record<string, any>): void;
  alias(userId: string, previousId: string): void;
  reset(): void;
  setContext(context: Record<string, any>): void;
  getAnonymousId(): string;
}

export interface AnalyticsConfig {
  apiKey?: string;
  endpoint?: string;
  debug?: boolean;
  bufferSize?: number;
  flushInterval?: number;
}

export const ANALYTICS_SERVICE_KEY = 'analytics';

// Module augmentation for TypeScript support
declare module '@mfe-toolkit/core' {
  interface ServiceMap {
    analytics: AnalyticsService;
  }
}
