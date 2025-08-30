# @mfe-toolkit/service-analytics

Analytics tracking service for MFE Toolkit - provides centralized analytics and telemetry across microfrontends.

## Installation

```bash
npm install @mfe-toolkit/service-analytics
# or
pnpm add @mfe-toolkit/service-analytics
```

## Overview

The Analytics Service provides a unified way to track user interactions, page views, and custom events across your microfrontend architecture. It supports multiple analytics providers and includes intelligent batching and privacy controls.

## Key Features

- 📊 **Event Tracking**: Track custom events with properties
- 👤 **User Identification**: Associate events with users
- 📄 **Page Tracking**: Automatic or manual page view tracking
- 🎯 **Segmentation**: Group users and track cohorts
- ⚡ **Performance**: Intelligent batching and queuing
- 🔒 **Privacy First**: GDPR/CCPA compliant with consent management
- 🎭 **Framework Agnostic**: Works with any frontend framework

## Usage

### Basic Setup

```typescript
import { createAnalyticsService } from '@mfe-toolkit/service-analytics';

// Create service with configuration
const analyticsService = createAnalyticsService({
  apiKey: 'your-api-key',
  endpoint: 'https://analytics.example.com',
  debug: true,
  bufferSize: 20,
  flushInterval: 10000 // 10 seconds
});
```

### Service Registration (MFE Container)

```typescript
import { createServiceRegistry } from '@mfe-toolkit/core';
import { analyticsServiceProvider } from '@mfe-toolkit/service-analytics';

const registry = createServiceRegistry();

// Register with configuration
registry.registerProvider(
  createAnalyticsProvider({
    apiKey: process.env.ANALYTICS_API_KEY,
    endpoint: process.env.ANALYTICS_ENDPOINT,
    debug: process.env.NODE_ENV === 'development'
  })
);

await registry.initialize();
```

### Using in MFEs

```typescript
// In your MFE module
export default {
  mount(element: HTMLElement, container: ServiceContainer) {
    const analytics = container.get('analytics');
    
    // Track page view
    analytics?.page('Dashboard');
    
    // Track custom event
    analytics?.track('Button Clicked', {
      button: 'signup',
      location: 'header'
    });
    
    // Identify user
    analytics?.identify('user-123', {
      email: 'user@example.com',
      plan: 'premium'
    });
  }
};
```

## API Reference

### `AnalyticsService` Interface

#### Core Methods

##### `track(event: string, properties?: Record<string, any>): void`
Tracks a custom event with optional properties.

```typescript
analytics.track('Product Viewed', {
  productId: 'SKU-123',
  productName: 'Premium Widget',
  price: 99.99,
  category: 'Widgets'
});

analytics.track('Checkout Started', {
  cartValue: 299.97,
  itemCount: 3,
  couponApplied: true
});
```

##### `identify(userId: string, traits?: Record<string, any>): void`
Identifies a user and associates them with traits.

```typescript
analytics.identify('user-456', {
  email: 'john@example.com',
  name: 'John Doe',
  plan: 'enterprise',
  company: 'Acme Corp',
  createdAt: '2024-01-15'
});
```

##### `page(name?: string, properties?: Record<string, any>): void`
Tracks a page view.

```typescript
// Track current page
analytics.page();

// Track named page
analytics.page('Product Details', {
  productId: 'SKU-123',
  referrer: 'search'
});
```

##### `group(groupId: string, traits?: Record<string, any>): void`
Associates a user with a group (company, organization, etc.).

```typescript
analytics.group('company-789', {
  name: 'Acme Corporation',
  industry: 'Technology',
  employees: 500,
  plan: 'enterprise'
});
```

##### `alias(userId: string, previousId: string): void`
Links two user identities (useful after signup).

```typescript
// Link anonymous user to authenticated user
analytics.alias('user-123', 'anonymous-456');
```

##### `reset(): void`
Clears the current user and resets to anonymous tracking.

```typescript
// On logout
analytics.reset();
```

##### `setContext(context: Record<string, any>): void`
Sets global context that will be included with all events.

```typescript
analytics.setContext({
  app_version: '2.1.0',
  environment: 'production',
  feature_flags: {
    newUI: true,
    betaFeatures: false
  }
});
```

##### `getAnonymousId(): string`
Returns the current anonymous ID for the user.

```typescript
const anonId = analytics.getAnonymousId();
console.log(`Anonymous ID: ${anonId}`);
```

### Types

#### `AnalyticsEvent`
```typescript
interface AnalyticsEvent {
  name: string;                    // Event name
  properties?: Record<string, any>; // Event properties
  timestamp?: number;              // Event timestamp
  userId?: string;                 // User ID if identified
  sessionId?: string;              // Session ID
}
```

#### `AnalyticsConfig`
```typescript
interface AnalyticsConfig {
  apiKey?: string;         // API key for analytics provider
  endpoint?: string;       // Analytics endpoint URL
  debug?: boolean;         // Enable debug logging
  bufferSize?: number;     // Events to buffer before flush
  flushInterval?: number;  // Auto-flush interval in ms
}
```

## Common Use Cases

### E-commerce Tracking

```typescript
class EcommerceAnalytics {
  constructor(private analytics: AnalyticsService) {}
  
  trackProductView(product: Product) {
    this.analytics.track('Product Viewed', {
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      category: product.category,
      brand: product.brand
    });
  }
  
  trackAddToCart(product: Product, quantity: number) {
    this.analytics.track('Product Added', {
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      quantity: quantity,
      cart_value: product.price * quantity
    });
  }
  
  trackPurchase(order: Order) {
    this.analytics.track('Order Completed', {
      order_id: order.id,
      total: order.total,
      tax: order.tax,
      shipping: order.shipping,
      coupon: order.couponCode,
      products: order.items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price
      }))
    });
  }
}
```

### User Engagement Tracking

```typescript
function trackEngagement(analytics: AnalyticsService) {
  // Track time on page
  const startTime = Date.now();
  
  window.addEventListener('beforeunload', () => {
    const timeOnPage = Math.round((Date.now() - startTime) / 1000);
    analytics.track('Page Engagement', {
      time_on_page: timeOnPage,
      page_url: window.location.href,
      scroll_depth: getScrollDepth()
    });
  });
  
  // Track scroll depth
  let maxScroll = 0;
  window.addEventListener('scroll', throttle(() => {
    const scrollPercent = getScrollPercent();
    if (scrollPercent > maxScroll) {
      maxScroll = scrollPercent;
      if (scrollPercent >= 25 && scrollPercent < 50) {
        analytics.track('Scroll Milestone', { depth: 25 });
      } else if (scrollPercent >= 50 && scrollPercent < 75) {
        analytics.track('Scroll Milestone', { depth: 50 });
      } else if (scrollPercent >= 75) {
        analytics.track('Scroll Milestone', { depth: 75 });
      }
    }
  }, 1000));
}
```

### Form Analytics

```typescript
class FormAnalytics {
  private formStartTime: number;
  private fieldInteractions: Record<string, number> = {};
  
  constructor(
    private analytics: AnalyticsService,
    private formName: string
  ) {}
  
  trackFormStart() {
    this.formStartTime = Date.now();
    this.analytics.track('Form Started', {
      form_name: this.formName
    });
  }
  
  trackFieldFocus(fieldName: string) {
    if (!this.fieldInteractions[fieldName]) {
      this.fieldInteractions[fieldName] = 0;
    }
    this.fieldInteractions[fieldName]++;
  }
  
  trackFormSubmit(success: boolean, errors?: string[]) {
    const completionTime = Math.round((Date.now() - this.formStartTime) / 1000);
    
    this.analytics.track('Form Submitted', {
      form_name: this.formName,
      success: success,
      completion_time: completionTime,
      field_interactions: this.fieldInteractions,
      error_count: errors?.length || 0,
      errors: errors
    });
  }
  
  trackFormAbandon() {
    const timeSpent = Math.round((Date.now() - this.formStartTime) / 1000);
    
    this.analytics.track('Form Abandoned', {
      form_name: this.formName,
      time_spent: timeSpent,
      last_field: Object.keys(this.fieldInteractions).pop()
    });
  }
}
```

### Feature Adoption

```typescript
function trackFeatureUsage(analytics: AnalyticsService) {
  // Track feature discovery
  analytics.track('Feature Discovered', {
    feature: 'advanced-search',
    discovery_method: 'tooltip'
  });
  
  // Track feature usage
  analytics.track('Feature Used', {
    feature: 'advanced-search',
    usage_count: 1,
    filters_applied: ['date', 'category', 'price']
  });
  
  // Track feature value
  analytics.track('Feature Value Realized', {
    feature: 'advanced-search',
    results_found: 42,
    time_saved_seconds: 120
  });
}
```

### Error Tracking

```typescript
function setupErrorTracking(analytics: AnalyticsService) {
  // Track JavaScript errors
  window.addEventListener('error', (event) => {
    analytics.track('JavaScript Error', {
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      error: event.error?.stack,
      user_agent: navigator.userAgent
    });
  });
  
  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    analytics.track('Unhandled Promise Rejection', {
      reason: event.reason?.toString(),
      promise: event.promise,
      stack: event.reason?.stack
    });
  });
  
  // Track API errors
  function trackAPIError(endpoint: string, error: any) {
    analytics.track('API Error', {
      endpoint: endpoint,
      status_code: error.status,
      error_message: error.message,
      request_id: error.requestId
    });
  }
}
```

## Framework Integration

### React Hook

```typescript
import { useEffect, useCallback } from 'react';
import { useService } from '@mfe-toolkit/react';

function useAnalytics() {
  const analytics = useService('analytics');
  
  const track = useCallback((event: string, properties?: any) => {
    analytics?.track(event, properties);
  }, [analytics]);
  
  const page = useCallback((name?: string, properties?: any) => {
    analytics?.page(name, properties);
  }, [analytics]);
  
  // Auto-track page views
  useEffect(() => {
    analytics?.page();
  }, [analytics]);
  
  return { track, page, analytics };
}

// Usage
function ProductPage({ productId }) {
  const { track } = useAnalytics();
  
  useEffect(() => {
    track('Product Viewed', { product_id: productId });
  }, [productId]);
  
  const handleAddToCart = () => {
    track('Add to Cart', { product_id: productId });
  };
}
```

### Vue Composable

```typescript
import { inject, onMounted } from 'vue';

export function useAnalytics() {
  const analytics = inject('analytics');
  
  const track = (event: string, properties?: any) => {
    analytics?.track(event, properties);
  };
  
  const page = (name?: string, properties?: any) => {
    analytics?.page(name, properties);
  };
  
  // Auto-track page view on mount
  onMounted(() => {
    analytics?.page();
  });
  
  return { track, page, analytics };
}
```

## Privacy & Compliance

### GDPR Compliance

```typescript
class PrivacyCompliantAnalytics {
  private hasConsent = false;
  
  constructor(private analytics: AnalyticsService) {
    this.checkConsent();
  }
  
  private checkConsent() {
    // Check for consent cookie/localStorage
    this.hasConsent = localStorage.getItem('analytics-consent') === 'true';
  }
  
  track(event: string, properties?: any) {
    if (!this.hasConsent) {
      console.log('Analytics blocked: No consent');
      return;
    }
    this.analytics.track(event, properties);
  }
  
  grantConsent() {
    this.hasConsent = true;
    localStorage.setItem('analytics-consent', 'true');
    this.analytics.track('Consent Granted', {
      type: 'analytics',
      timestamp: Date.now()
    });
  }
  
  revokeConsent() {
    this.hasConsent = false;
    localStorage.removeItem('analytics-consent');
    this.analytics.reset();
  }
}
```

### PII Scrubbing

```typescript
function sanitizeProperties(properties: any): any {
  const piiFields = ['email', 'phone', 'ssn', 'credit_card'];
  const sanitized = { ...properties };
  
  for (const field of piiFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

// Use before tracking
analytics.track('User Action', sanitizeProperties({
  action: 'profile_update',
  email: 'user@example.com', // Will be redacted
  changes: ['name', 'avatar']
}));
```

## Performance Optimization

### Batching Events

```typescript
class BatchedAnalytics {
  private queue: AnalyticsEvent[] = [];
  private batchTimer?: NodeJS.Timeout;
  
  constructor(
    private analytics: AnalyticsService,
    private batchSize = 10,
    private batchDelay = 5000
  ) {}
  
  track(event: string, properties?: any) {
    this.queue.push({
      name: event,
      properties,
      timestamp: Date.now()
    });
    
    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else {
      this.scheduleBatch();
    }
  }
  
  private scheduleBatch() {
    if (this.batchTimer) return;
    
    this.batchTimer = setTimeout(() => {
      this.flush();
    }, this.batchDelay);
  }
  
  private flush() {
    if (this.queue.length === 0) return;
    
    // Send batch
    this.queue.forEach(event => {
      this.analytics.track(event.name, event.properties);
    });
    
    // Clear queue
    this.queue = [];
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }
  }
}
```

### Sampling

```typescript
class SampledAnalytics {
  constructor(
    private analytics: AnalyticsService,
    private sampleRate = 0.1 // 10% sampling
  ) {}
  
  track(event: string, properties?: any) {
    if (Math.random() > this.sampleRate) {
      return; // Skip this event
    }
    
    this.analytics.track(event, {
      ...properties,
      sampled: true,
      sample_rate: this.sampleRate
    });
  }
}
```

## Testing

```typescript
describe('AnalyticsService', () => {
  let analytics: AnalyticsService;
  let mockEndpoint: jest.Mock;
  
  beforeEach(() => {
    mockEndpoint = jest.fn();
    analytics = createAnalyticsService({
      endpoint: 'mock://analytics',
      debug: false
    });
  });
  
  it('should track events with properties', () => {
    analytics.track('Test Event', { value: 123 });
    
    expect(mockEndpoint).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Event',
        properties: { value: 123 }
      })
    );
  });
  
  it('should batch events', async () => {
    for (let i = 0; i < 25; i++) {
      analytics.track(`Event ${i}`);
    }
    
    // Should trigger batch at 20 events
    expect(mockEndpoint).toHaveBeenCalledTimes(1);
    expect(mockEndpoint).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Event 0' })
      ])
    );
  });
});
```

## Best Practices

1. **Track Meaningful Events**: Focus on business-critical user actions
2. **Consistent Naming**: Use snake_case or camelCase consistently
3. **Structured Properties**: Use nested objects for related properties
4. **Avoid PII**: Never track sensitive personal information
5. **Context is Key**: Include relevant context with events
6. **Test Tracking**: Verify events are tracked correctly
7. **Document Events**: Maintain a data dictionary of tracked events

## License

MIT