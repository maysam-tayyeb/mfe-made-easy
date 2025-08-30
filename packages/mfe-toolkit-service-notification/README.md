# @mfe-toolkit/service-notification

Notification/toast service for MFE Toolkit - provides centralized notification management across microfrontends.

## Installation

```bash
npm install @mfe-toolkit/service-notification
# or
pnpm add @mfe-toolkit/service-notification
```

## Overview

The Notification Service provides a unified way to display toast notifications, alerts, and system messages across your microfrontend architecture. It handles notification stacking, auto-dismissal, and provides a consistent API for all MFEs.

## Key Features

- 🎨 **Multiple Types**: Success, error, warning, and info notifications
- ⏱️ **Auto-dismiss**: Configurable duration with manual dismiss option
- 📚 **Smart Stacking**: Intelligent notification positioning and stacking
- 🎯 **Action Support**: Add custom actions to notifications
- 🔄 **Queue Management**: Handle multiple notifications gracefully
- 🎭 **Framework Agnostic**: Works with any frontend framework

## Usage

### Basic Setup

```typescript
import { createNotificationService } from '@mfe-toolkit/service-notification';

// Create service
const notificationService = createNotificationService();
```

### Service Registration (MFE Container)

```typescript
import { createServiceRegistry } from '@mfe-toolkit/core';
import { notificationServiceProvider } from '@mfe-toolkit/service-notification';

const registry = createServiceRegistry();
registry.registerProvider(notificationServiceProvider);
await registry.initialize();
```

### Using in MFEs

```typescript
// In your MFE module
export default {
  mount(element: HTMLElement, container: ServiceContainer) {
    const notification = container.get('notification');
    
    // Show different types of notifications
    notification.success('Operation completed successfully!');
    notification.error('An error occurred', 'Please try again later');
    notification.warning('Warning', 'Your session will expire soon');
    notification.info('New update available');
  }
};
```

## API Reference

### `NotificationService` Interface

#### Quick Methods

##### `success(title: string, message?: string): string`
Shows a success notification.

```typescript
notification.success('Saved!', 'Your changes have been saved');
```

##### `error(title: string, message?: string): string`
Shows an error notification (doesn't auto-dismiss by default).

```typescript
notification.error('Upload Failed', 'File size exceeds limit');
```

##### `warning(title: string, message?: string): string`
Shows a warning notification.

```typescript
notification.warning('Low Storage', 'You have less than 10% storage remaining');
```

##### `info(title: string, message?: string): string`
Shows an info notification.

```typescript
notification.info('Tip', 'You can use keyboard shortcuts for faster navigation');
```

#### Advanced Methods

##### `show(config: NotificationConfig): string`
Shows a notification with full configuration options.

```typescript
const notificationId = notification.show({
  type: 'success',
  title: 'File Uploaded',
  message: 'document.pdf has been uploaded successfully',
  duration: 5000,
  actions: [
    {
      label: 'View',
      action: () => openFile('document.pdf')
    },
    {
      label: 'Share',
      action: () => shareFile('document.pdf')
    }
  ],
  onClose: () => console.log('Notification closed')
});
```

##### `dismiss(id: string): void`
Dismisses a specific notification.

```typescript
const id = notification.info('Processing...');
// Later...
notification.dismiss(id);
```

##### `dismissAll(): void`
Dismisses all notifications.

```typescript
notification.dismissAll();
```

### Types

#### `NotificationConfig`
```typescript
interface NotificationConfig {
  // Required
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  
  // Optional
  id?: string;              // Custom ID (auto-generated if not provided)
  message?: string;         // Additional message/description
  duration?: number;        // Auto-dismiss after ms (0 = no auto-dismiss)
  onClose?: () => void;     // Callback when notification closes
  actions?: Array<{         // Action buttons
    label: string;
    action: () => void;
  }>;
}
```

## Common Use Cases

### Form Submission

```typescript
async function submitForm(formData: FormData) {
  const notification = getNotificationService();
  
  try {
    await api.submitForm(formData);
    notification.success('Form Submitted', 'We\'ll get back to you soon!');
  } catch (error) {
    notification.error('Submission Failed', error.message);
  }
}
```

### File Operations

```typescript
async function uploadFiles(files: File[]) {
  const notification = getNotificationService();
  
  const uploadId = notification.show({
    type: 'info',
    title: 'Uploading Files',
    message: `Uploading ${files.length} files...`,
    duration: 0 // Don't auto-dismiss
  });
  
  try {
    const results = await api.uploadFiles(files);
    notification.dismiss(uploadId);
    
    notification.show({
      type: 'success',
      title: 'Upload Complete',
      message: `${results.length} files uploaded successfully`,
      actions: [
        {
          label: 'View Files',
          action: () => navigateToFiles(results)
        }
      ]
    });
  } catch (error) {
    notification.dismiss(uploadId);
    notification.error('Upload Failed', error.message);
  }
}
```

### Background Tasks

```typescript
function startBackgroundSync() {
  const notification = getNotificationService();
  
  notification.show({
    type: 'info',
    title: 'Syncing',
    message: 'Syncing your data in the background',
    duration: 3000,
    actions: [
      {
        label: 'View Details',
        action: () => showSyncDetails()
      }
    ]
  });
}
```

### Validation Errors

```typescript
function showValidationErrors(errors: ValidationError[]) {
  const notification = getNotificationService();
  
  if (errors.length === 1) {
    notification.error('Validation Error', errors[0].message);
  } else {
    notification.show({
      type: 'error',
      title: `${errors.length} Validation Errors`,
      message: 'Please fix the errors and try again',
      duration: 0,
      actions: [
        {
          label: 'View Errors',
          action: () => showErrorDetails(errors)
        }
      ]
    });
  }
}
```

### Connection Status

```typescript
function monitorConnection() {
  const notification = getNotificationService();
  let offlineNotificationId: string | null = null;
  
  window.addEventListener('online', () => {
    if (offlineNotificationId) {
      notification.dismiss(offlineNotificationId);
      offlineNotificationId = null;
    }
    notification.success('Connected', 'You are back online');
  });
  
  window.addEventListener('offline', () => {
    offlineNotificationId = notification.show({
      type: 'warning',
      title: 'Connection Lost',
      message: 'You are working offline. Changes will sync when reconnected.',
      duration: 0
    });
  });
}
```

### Progressive Operations

```typescript
async function batchProcess(items: any[]) {
  const notification = getNotificationService();
  let processed = 0;
  
  const progressId = notification.show({
    type: 'info',
    title: 'Processing',
    message: `0 of ${items.length} items processed`,
    duration: 0
  });
  
  for (const item of items) {
    await processItem(item);
    processed++;
    
    // Update progress
    if (processed < items.length) {
      // Note: This would require a custom update method in your implementation
      updateNotification(progressId, {
        message: `${processed} of ${items.length} items processed`
      });
    }
  }
  
  notification.dismiss(progressId);
  notification.success('Complete', `All ${items.length} items processed`);
}
```

## Framework Integration Examples

### React Hook

```typescript
import { useCallback } from 'react';
import { useService } from '@mfe-toolkit/react';

function useNotification() {
  const notification = useService('notification');
  
  const notify = useCallback((type: string, title: string, message?: string) => {
    return notification?.[type]?.(title, message);
  }, [notification]);
  
  return {
    success: (title: string, message?: string) => notify('success', title, message),
    error: (title: string, message?: string) => notify('error', title, message),
    warning: (title: string, message?: string) => notify('warning', title, message),
    info: (title: string, message?: string) => notify('info', title, message),
    show: notification?.show,
    dismiss: notification?.dismiss,
    dismissAll: notification?.dismissAll
  };
}

// Usage
function MyComponent() {
  const notification = useNotification();
  
  const handleSave = async () => {
    try {
      await saveData();
      notification.success('Saved!');
    } catch (error) {
      notification.error('Save failed', error.message);
    }
  };
}
```

### Vue Composable

```typescript
import { inject } from 'vue';

export function useNotification() {
  const notification = inject('notification');
  
  return {
    success: (title, message) => notification?.success(title, message),
    error: (title, message) => notification?.error(title, message),
    warning: (title, message) => notification?.warning(title, message),
    info: (title, message) => notification?.info(title, message),
    show: (config) => notification?.show(config),
    dismiss: (id) => notification?.dismiss(id),
    dismissAll: () => notification?.dismissAll()
  };
}
```

### Angular Service

```typescript
@Injectable({
  providedIn: 'root'
})
export class NotificationWrapper {
  constructor(
    @Inject('notification') private notification: NotificationService
  ) {}
  
  success(title: string, message?: string) {
    return this.notification.success(title, message);
  }
  
  error(title: string, message?: string) {
    return this.notification.error(title, message);
  }
  
  warning(title: string, message?: string) {
    return this.notification.warning(title, message);
  }
  
  info(title: string, message?: string) {
    return this.notification.info(title, message);
  }
}
```

## Styling

The Notification Service provides semantic CSS classes for styling:

```css
/* Container */
.ds-notification-container    /* Notification container */

/* Individual notifications */
.ds-notification              /* Base notification */
.ds-notification-success      /* Success variant */
.ds-notification-error        /* Error variant */
.ds-notification-warning      /* Warning variant */
.ds-notification-info         /* Info variant */

/* Structure */
.ds-notification-icon         /* Icon area */
.ds-notification-content      /* Content wrapper */
.ds-notification-title        /* Title text */
.ds-notification-message      /* Message text */
.ds-notification-actions      /* Action buttons container */
.ds-notification-close        /* Close button */

/* States */
.ds-notification-entering     /* Animation: entering */
.ds-notification-exiting      /* Animation: exiting */
```

## Configuration

### Global Configuration

```typescript
const notificationService = createNotificationService({
  position: 'top-right',      // Position on screen
  maxNotifications: 5,         // Max visible at once
  defaultDuration: 5000,       // Default auto-dismiss time
  animationDuration: 300,      // Animation duration
  stackSpacing: 10,           // Space between notifications
});
```

### Duration Guidelines

```typescript
// Recommended durations by type
const DURATIONS = {
  success: 3000,    // 3 seconds
  info: 5000,       // 5 seconds
  warning: 7000,    // 7 seconds
  error: 0,         // Don't auto-dismiss errors
};
```

## Accessibility

The Notification Service includes accessibility features:

- **ARIA Live Regions**: Notifications are announced to screen readers
- **Keyboard Support**: Dismiss with ESC, navigate with Tab
- **Focus Management**: Actions are keyboard accessible
- **Role Attributes**: Proper ARIA roles for different notification types

```typescript
// Accessibility is handled automatically
notification.show({
  type: 'error',
  title: 'Error',
  message: 'An error occurred',
  // Automatically adds:
  // role="alert"
  // aria-live="assertive"
  // aria-atomic="true"
});
```

## Best Practices

1. **Use appropriate types**: Match notification type to the message importance
2. **Keep messages concise**: Titles should be 2-4 words, messages under 50 characters
3. **Don't overuse**: Too many notifications can overwhelm users
4. **Provide actions**: Give users next steps when appropriate
5. **Consider duration**: Errors shouldn't auto-dismiss, successes should be brief
6. **Group related notifications**: Batch multiple related messages
7. **Test with screen readers**: Ensure notifications are properly announced

## Error Handling

```typescript
// Wrap notification calls in try-catch for safety
function safeNotify(notification: NotificationService, config: NotificationConfig) {
  try {
    return notification.show(config);
  } catch (error) {
    console.error('Failed to show notification:', error);
    // Fallback to console or alternative notification method
    console.log(`[${config.type.toUpperCase()}] ${config.title}: ${config.message}`);
  }
}
```

## Performance Considerations

1. **Limit concurrent notifications**: Use `maxNotifications` config
2. **Clean up dismissed notifications**: They're automatically removed from DOM
3. **Debounce rapid notifications**: Batch or throttle high-frequency notifications
4. **Use unique IDs**: For notifications that might be updated

```typescript
// Debounced notification helper
const debounce = (fn: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

const debouncedNotify = debounce(
  (notification: NotificationService, type: string, title: string) => {
    notification[type](title);
  },
  500
);
```

## License

MIT