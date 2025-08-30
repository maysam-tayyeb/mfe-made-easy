import type { MFEModule, ServiceContainer, Logger } from '@mfe-toolkit/core';
import type { NotificationService } from '@mfe-toolkit/service-notification/types';
import '@mfe-toolkit/service-notification/types';

// State management for the Vanilla TS MFE
interface NotificationState {
  count: number;
  customTitle: string;
  customMessage: string;
  customType: 'info' | 'success' | 'warning' | 'error';
}

const state: NotificationState = {
  count: 0,
  customTitle: 'Custom Notification',
  customMessage: 'This is a custom notification message',
  customType: 'info'
};

let notification: NotificationService | null = null;
let logger: Logger | null = null;
let rootElement: HTMLElement | null = null;

// Helper function to show notifications
const showNotification = (
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  duration?: number
) => {
  if (notification) {
    notification.show({
      title,
      message,
      type,
      duration
    });
    state.count++;
    updateCounter();
    logger?.info(`Notification shown: ${title} - ${message}`);
  }
};

// Update notification counter display
const updateCounter = () => {
  const counterElement = rootElement?.querySelector('[data-notification-count]');
  if (counterElement) {
    counterElement.textContent = state.count.toString();
  }
};

// Event handlers
const handlers = {
  showSuccess: () => {
    showNotification(
      'Success!',
      'Operation completed successfully from Vanilla TS MFE',
      'success'
    );
  },
  
  showError: () => {
    showNotification(
      'Error Occurred',
      'Something went wrong in the Vanilla TS MFE',
      'error'
    );
  },
  
  showWarning: () => {
    showNotification(
      'Warning',
      'Please review this warning from Vanilla TypeScript',
      'warning'
    );
  },
  
  showInfo: () => {
    showNotification(
      'Information',
      'This is an informational message from Vanilla TypeScript',
      'info'
    );
  },
  
  showCustom: () => {
    showNotification(
      state.customTitle,
      state.customMessage,
      state.customType
    );
  },
  
  showShortDuration: () => {
    showNotification(
      'Quick Message',
      'This will disappear in 1 second',
      'info',
      1000
    );
  },
  
  showNormalDuration: () => {
    showNotification(
      'Normal Duration',
      'This will disappear in 3 seconds',
      'info',
      3000
    );
  },
  
  showLongDuration: () => {
    showNotification(
      'Long Duration',
      'This will stay for 10 seconds',
      'info',
      10000
    );
  },
  
  showPersistent: () => {
    showNotification(
      'Persistent Notification',
      'This won\'t auto-dismiss (close manually)',
      'warning',
      0
    );
  },
  
  showMultiple: () => {
    const messages = [
      { title: 'First', message: 'Vanilla TS notification 1', type: 'info' as const },
      { title: 'Second', message: 'Vanilla TS notification 2', type: 'success' as const },
      { title: 'Third', message: 'Vanilla TS notification 3', type: 'warning' as const },
      { title: 'Fourth', message: 'Vanilla TS notification 4', type: 'error' as const },
      { title: 'Fifth', message: 'Vanilla TS notification 5', type: 'info' as const }
    ];

    messages.forEach((msg, index) => {
      setTimeout(() => {
        showNotification(msg.title, msg.message, msg.type);
      }, index * 200);
    });
  },
  
  clearAll: () => {
    if (notification) {
      notification.dismissAll();
      logger?.info('All notifications cleared');
    }
  },
  
  updateCustomTitle: (e: Event) => {
    state.customTitle = (e.target as HTMLInputElement).value;
  },
  
  updateCustomMessage: (e: Event) => {
    state.customMessage = (e.target as HTMLTextAreaElement).value;
  },
  
  updateCustomType: (e: Event) => {
    state.customType = (e.target as HTMLSelectElement).value as any;
  }
};

// Create the UI
const createUI = (): string => {
  return `
    <div class="ds-p-4">
      <div class="ds-mb-6">
        <h2 class="ds-text-2xl ds-font-bold ds-mb-2">Vanilla TypeScript Notification Demo</h2>
        <p class="ds-text-gray-600">
          Framework: <span class="ds-font-medium">Vanilla TypeScript</span> | 
          Pattern: <span class="ds-font-medium">MFEModule</span>
        </p>
      </div>

      <div class="ds-space-y-4">
        <!-- Notification Types -->
        <div>
          <h3 class="ds-text-lg ds-font-semibold ds-mb-3">Notification Types</h3>
          <div class="ds-flex ds-flex-wrap ds-gap-2">
            <button data-action="showSuccess" class="ds-btn-success">
              Success
            </button>
            <button data-action="showError" class="ds-btn-danger">
              Error
            </button>
            <button data-action="showWarning" class="ds-btn-warning">
              Warning
            </button>
            <button data-action="showInfo" class="ds-btn-primary">
              Info
            </button>
          </div>
        </div>

        <!-- Custom Message -->
        <div>
          <h3 class="ds-text-lg ds-font-semibold ds-mb-3">Custom Notification</h3>
          <div class="ds-space-y-3">
            <div>
              <label class="ds-block ds-text-sm ds-font-medium ds-mb-1">Title</label>
              <input 
                data-input="customTitle"
                type="text"
                class="ds-input"
                placeholder="Enter notification title"
                value="${state.customTitle}"
              />
            </div>
            <div>
              <label class="ds-block ds-text-sm ds-font-medium ds-mb-1">Message</label>
              <textarea 
                data-input="customMessage"
                class="ds-textarea"
                rows="3"
                placeholder="Enter notification message"
              >${state.customMessage}</textarea>
            </div>
            <div>
              <label class="ds-block ds-text-sm ds-font-medium ds-mb-1">Type</label>
              <select data-input="customType" class="ds-select">
                <option value="info" ${state.customType === 'info' ? 'selected' : ''}>Info</option>
                <option value="success" ${state.customType === 'success' ? 'selected' : ''}>Success</option>
                <option value="warning" ${state.customType === 'warning' ? 'selected' : ''}>Warning</option>
                <option value="error" ${state.customType === 'error' ? 'selected' : ''}>Error</option>
              </select>
            </div>
            <button data-action="showCustom" class="ds-btn-primary">
              Show Custom Notification
            </button>
          </div>
        </div>

        <!-- Duration Control -->
        <div>
          <h3 class="ds-text-lg ds-font-semibold ds-mb-3">Duration Control</h3>
          <div class="ds-flex ds-gap-2">
            <button data-action="showShortDuration" class="ds-btn-outline">
              Short (1s)
            </button>
            <button data-action="showNormalDuration" class="ds-btn-outline">
              Normal (3s)
            </button>
            <button data-action="showLongDuration" class="ds-btn-outline">
              Long (10s)
            </button>
            <button data-action="showPersistent" class="ds-btn-outline">
              Persistent
            </button>
          </div>
        </div>

        <!-- Batch Notifications -->
        <div>
          <h3 class="ds-text-lg ds-font-semibold ds-mb-3">Batch Operations</h3>
          <div class="ds-flex ds-gap-2">
            <button data-action="showMultiple" class="ds-btn-secondary">
              Show 5 Notifications
            </button>
            <button data-action="clearAll" class="ds-btn-outline">
              Clear All
            </button>
          </div>
        </div>
      </div>

      <!-- Notification Counter -->
      <div class="ds-mt-6 ds-p-3 ds-bg-gray-50 ds-rounded">
        <p class="ds-text-sm ds-text-gray-600">
          Notifications shown: <span class="ds-font-semibold" data-notification-count>${state.count}</span>
        </p>
      </div>
    </div>
  `;
};

// Attach event listeners
const attachEventListeners = () => {
  if (!rootElement) return;

  // Button click handlers
  rootElement.querySelectorAll('[data-action]').forEach(button => {
    const action = button.getAttribute('data-action') as keyof typeof handlers;
    if (action && handlers[action]) {
      button.addEventListener('click', handlers[action]);
    }
  });

  // Input handlers
  const titleInput = rootElement.querySelector('[data-input="customTitle"]') as HTMLInputElement;
  if (titleInput) {
    titleInput.addEventListener('input', handlers.updateCustomTitle);
  }

  const messageInput = rootElement.querySelector('[data-input="customMessage"]') as HTMLTextAreaElement;
  if (messageInput) {
    messageInput.addEventListener('input', handlers.updateCustomMessage);
  }

  const typeSelect = rootElement.querySelector('[data-input="customType"]') as HTMLSelectElement;
  if (typeSelect) {
    typeSelect.addEventListener('change', handlers.updateCustomType);
  }
};

// Cleanup event listeners
const cleanupEventListeners = () => {
  if (!rootElement) return;

  rootElement.querySelectorAll('[data-action]').forEach(button => {
    const action = button.getAttribute('data-action') as keyof typeof handlers;
    if (action && handlers[action]) {
      button.removeEventListener('click', handlers[action]);
    }
  });

  const titleInput = rootElement.querySelector('[data-input="customTitle"]') as HTMLInputElement;
  if (titleInput) {
    titleInput.removeEventListener('input', handlers.updateCustomTitle);
  }

  const messageInput = rootElement.querySelector('[data-input="customMessage"]') as HTMLTextAreaElement;
  if (messageInput) {
    messageInput.removeEventListener('input', handlers.updateCustomMessage);
  }

  const typeSelect = rootElement.querySelector('[data-input="customType"]') as HTMLSelectElement;
  if (typeSelect) {
    typeSelect.removeEventListener('change', handlers.updateCustomType);
  }
};

const module: MFEModule = {
  metadata: {
    name: 'mfe-notification-vanilla',
    version: '1.0.0',
    requiredServices: ['logger', 'notification']
  },

  mount: async (element: HTMLElement, serviceContainer: ServiceContainer) => {
    logger = serviceContainer.require('logger');
    notification = serviceContainer.require('notification');
    rootElement = element;
    
    // Reset state
    state.count = 0;
    
    // Create and render UI
    element.innerHTML = createUI();
    
    // Attach event listeners
    attachEventListeners();
    
    logger.info('[mfe-notification-vanilla] Mounted successfully');
  },
  
  unmount: async (serviceContainer: ServiceContainer) => {
    // Cleanup event listeners
    cleanupEventListeners();
    
    // Clear references
    notification = null;
    rootElement = null;
    
    const unmountLogger = serviceContainer.get('logger');
    if (unmountLogger) {
      unmountLogger.info('[mfe-notification-vanilla] Unmounted successfully');
    }
    logger = null;
  }
};

export default module;