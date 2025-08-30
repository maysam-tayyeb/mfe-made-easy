import { Component, createSignal } from 'solid-js';
import type { Logger } from '@mfe-toolkit/core';
import type { NotificationService, NotificationType } from '@mfe-toolkit/service-notification/types';

interface AppProps {
  notification: NotificationService;
  logger: Logger;
}

export const App: Component<AppProps> = ({ notification, logger }) => {
  const [notificationCount, setNotificationCount] = createSignal(0);
  const [customTitle, setCustomTitle] = createSignal('Custom Notification');
  const [customMessage, setCustomMessage] = createSignal('This is a custom notification message');
  const [customType, setCustomType] = createSignal<NotificationType>('info');

  const showNotification = (
    title: string,
    message: string,
    type: NotificationType = 'info',
    duration?: number
  ) => {
    notification.show({
        title,
        message,
        type,
        duration
    });
    setNotificationCount(c => c + 1);
    logger.info(`Notification shown: ${title} - ${message}`);
  };

  const showSuccess = () => {
    showNotification(
      'Success!',
      'Operation completed successfully from Solid.js MFE',
      'success'
    );
  };

  const showError = () => {
    showNotification(
      'Error Occurred',
      'Something went wrong in the Solid.js MFE',
      'error'
    );
  };

  const showWarning = () => {
    showNotification(
      'Warning',
      'Please review this warning from Solid.js',
      'warning'
    );
  };

  const showInfo = () => {
    showNotification(
      'Information',
      'This is an informational message from Solid.js',
      'info'
    );
  };

  const showCustom = () => {
    showNotification(
      customTitle(),
      customMessage(),
      customType()
    );
  };

  const showShortDuration = () => {
    showNotification(
      'Quick Message',
      'This will disappear in 1 second',
      'info',
      1000
    );
  };

  const showNormalDuration = () => {
    showNotification(
      'Normal Duration',
      'This will disappear in 3 seconds',
      'info',
      3000
    );
  };

  const showLongDuration = () => {
    showNotification(
      'Long Duration',
      'This will stay for 10 seconds',
      'info',
      10000
    );
  };

  const showPersistent = () => {
    showNotification(
      'Persistent Notification',
      'This won\'t auto-dismiss (close manually)',
      'warning',
      0
    );
  };

  const showMultiple = () => {
    const messages = [
      { title: 'First', message: 'Solid.js notification 1', type: 'info' as const },
      { title: 'Second', message: 'Solid.js notification 2', type: 'success' as const },
      { title: 'Third', message: 'Solid.js notification 3', type: 'warning' as const },
      { title: 'Fourth', message: 'Solid.js notification 4', type: 'error' as const },
      { title: 'Fifth', message: 'Solid.js notification 5', type: 'info' as const }
    ];

    messages.forEach((msg, index) => {
      setTimeout(() => {
        showNotification(msg.title, msg.message, msg.type);
      }, index * 200);
    });
  };

  const clearAll = () => {
    notification.dismissAll();
    logger.info('All notifications cleared');
  };

  return (
    <div class="ds-p-4">
      <div class="ds-mb-6">
        <h2 class="ds-text-2xl ds-font-bold ds-mb-2">Solid.js Notification Demo</h2>
        <p class="ds-text-gray-600">
          Framework: <span class="ds-font-medium">Solid.js 1.8.0</span> | 
          Pattern: <span class="ds-font-medium">MFEModule</span>
        </p>
      </div>

      <div class="ds-space-y-4">
        {/* Notification Types */}
        <div>
          <h3 class="ds-text-lg ds-font-semibold ds-mb-3">Notification Types</h3>
          <div class="ds-flex ds-flex-wrap ds-gap-2">
            <button 
              onClick={showSuccess}
              class="ds-btn-success"
            >
              Success
            </button>
            <button 
              onClick={showError}
              class="ds-btn-danger"
            >
              Error
            </button>
            <button 
              onClick={showWarning}
              class="ds-btn-warning"
            >
              Warning
            </button>
            <button 
              onClick={showInfo}
              class="ds-btn-primary"
            >
              Info
            </button>
          </div>
        </div>

        {/* Custom Message */}
        <div>
          <h3 class="ds-text-lg ds-font-semibold ds-mb-3">Custom Notification</h3>
          <div class="ds-space-y-3">
            <div>
              <label class="ds-block ds-text-sm ds-font-medium ds-mb-1">Title</label>
              <input 
                value={customTitle()}
                onInput={(e) => setCustomTitle(e.currentTarget.value)}
                type="text"
                class="ds-input"
                placeholder="Enter notification title"
              />
            </div>
            <div>
              <label class="ds-block ds-text-sm ds-font-medium ds-mb-1">Message</label>
              <textarea 
                value={customMessage()}
                onInput={(e) => setCustomMessage(e.currentTarget.value)}
                class="ds-textarea"
                rows="3"
                placeholder="Enter notification message"
              ></textarea>
            </div>
            <div>
              <label class="ds-block ds-text-sm ds-font-medium ds-mb-1">Type</label>
              <select 
                value={customType()} 
                onChange={(e) => setCustomType(e.currentTarget.value as any)}
                class="ds-select"
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
            <button 
              onClick={showCustom}
              class="ds-btn-primary"
            >
              Show Custom Notification
            </button>
          </div>
        </div>

        {/* Duration Control */}
        <div>
          <h3 class="ds-text-lg ds-font-semibold ds-mb-3">Duration Control</h3>
          <div class="ds-flex ds-gap-2">
            <button 
              onClick={showShortDuration}
              class="ds-btn-outline"
            >
              Short (1s)
            </button>
            <button 
              onClick={showNormalDuration}
              class="ds-btn-outline"
            >
              Normal (3s)
            </button>
            <button 
              onClick={showLongDuration}
              class="ds-btn-outline"
            >
              Long (10s)
            </button>
            <button 
              onClick={showPersistent}
              class="ds-btn-outline"
            >
              Persistent
            </button>
          </div>
        </div>

        {/* Batch Notifications */}
        <div>
          <h3 class="ds-text-lg ds-font-semibold ds-mb-3">Batch Operations</h3>
          <div class="ds-flex ds-gap-2">
            <button 
              onClick={showMultiple}
              class="ds-btn-secondary"
            >
              Show 5 Notifications
            </button>
            <button 
              onClick={clearAll}
              class="ds-btn-outline"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Notification Counter */}
      <div class="ds-mt-6 ds-p-3 ds-bg-gray-50 ds-rounded">
        <p class="ds-text-sm ds-text-gray-600">
          Notifications shown: <span class="ds-font-semibold">{notificationCount()}</span>
        </p>
      </div>
    </div>
  );
};