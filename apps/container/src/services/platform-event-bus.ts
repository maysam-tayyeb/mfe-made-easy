import { createEventBus, EventBus } from '@mfe/dev-kit';
import { incrementEventBusMessages } from '@/store/platform-metrics';

/**
 * Creates an event bus that tracks messages in platform metrics
 */
export function createPlatformEventBus(): EventBus {
  const eventBus = createEventBus({ source: 'container' });

  // Wrap the emit method to track messages
  const originalEmit = eventBus.emit.bind(eventBus);

  eventBus.emit = (type: string, data?: any) => {
    // Call original emit
    originalEmit(type, data);

    // Increment platform metrics counter
    incrementEventBusMessages();
  };

  return eventBus;
}
