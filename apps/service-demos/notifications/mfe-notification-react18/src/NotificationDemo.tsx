import React, { useState } from 'react';
import type { Logger } from '@mfe-toolkit/core';
import type { NotificationService, NotificationType } from '@mfe-toolkit/service-notification/types';

interface NotificationDemoProps {
  notification: NotificationService;
  logger: Logger;
}

export const NotificationDemo: React.FC<NotificationDemoProps> = ({ notification, logger }) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [customTitle, setCustomTitle] = useState('Custom Notification');
  const [customMessage, setCustomMessage] = useState('This is a custom notification message');
  const [customType, setCustomType] = useState<NotificationType>('info');

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
    setNotificationCount(prev => prev + 1);
    logger.info(`Notification shown: ${title} - ${message}`);
  };

  const showSuccess = () => {
    showNotification(
      'Success!',
      'Operation completed successfully from React 18 MFE',
      'success'
    );
  };

  const showError = () => {
    showNotification(
      'Error Occurred',
      'Something went wrong in the React 18 MFE',
      'error'
    );
  };

  const showWarning = () => {
    showNotification(
      'Warning',
      'Please review this warning from React 18',
      'warning'
    );
  };

  const showInfo = () => {
    showNotification(
      'Information',
      'This is an informational message from React 18',
      'info'
    );
  };

  const showCustom = () => {
    showNotification(
      customTitle,
      customMessage,
      customType
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
      { title: 'First', message: 'React 18 notification 1', type: 'info' as const },
      { title: 'Second', message: 'React 18 notification 2', type: 'success' as const },
      { title: 'Third', message: 'React 18 notification 3', type: 'warning' as const },
      { title: 'Fourth', message: 'React 18 notification 4', type: 'error' as const },
      { title: 'Fifth', message: 'React 18 notification 5', type: 'info' as const }
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
    <div className="ds-p-4">
      <div className="ds-mb-6">
        <h2 className="ds-text-2xl ds-font-bold ds-mb-2">React 18 Notification Demo</h2>
        <p className="ds-text-gray-600">
          Framework: <span className="ds-font-medium">React 18.2.0</span> | 
          Pattern: <span className="ds-font-medium">MFEModule</span>
        </p>
      </div>

      <div className="ds-space-y-4">
        {/* Notification Types */}
        <div>
          <h3 className="ds-text-lg ds-font-semibold ds-mb-3">Notification Types</h3>
          <div className="ds-flex ds-flex-wrap ds-gap-2">
            <button onClick={showSuccess} className="ds-btn-success">
              Success
            </button>
            <button onClick={showError} className="ds-btn-danger">
              Error
            </button>
            <button onClick={showWarning} className="ds-btn-warning">
              Warning
            </button>
            <button onClick={showInfo} className="ds-btn-primary">
              Info
            </button>
          </div>
        </div>

        {/* Custom Message */}
        <div>
          <h3 className="ds-text-lg ds-font-semibold ds-mb-3">Custom Notification</h3>
          <div className="ds-space-y-3">
            <div>
              <label className="ds-block ds-text-sm ds-font-medium ds-mb-1">Title</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="ds-input"
                placeholder="Enter notification title"
              />
            </div>
            <div>
              <label className="ds-block ds-text-sm ds-font-medium ds-mb-1">Message</label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="ds-textarea"
                rows={3}
                placeholder="Enter notification message"
              />
            </div>
            <div>
              <label className="ds-block ds-text-sm ds-font-medium ds-mb-1">Type</label>
              <select 
                value={customType}
                onChange={(e) => setCustomType(e.target.value as NotificationType)}
                className="ds-select"
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
            <button onClick={showCustom} className="ds-btn-primary">
              Show Custom Notification
            </button>
          </div>
        </div>

        {/* Duration Control */}
        <div>
          <h3 className="ds-text-lg ds-font-semibold ds-mb-3">Duration Control</h3>
          <div className="ds-flex ds-gap-2">
            <button onClick={showShortDuration} className="ds-btn-outline">
              Short (1s)
            </button>
            <button onClick={showNormalDuration} className="ds-btn-outline">
              Normal (3s)
            </button>
            <button onClick={showLongDuration} className="ds-btn-outline">
              Long (10s)
            </button>
            <button onClick={showPersistent} className="ds-btn-outline">
              Persistent
            </button>
          </div>
        </div>

        {/* Batch Notifications */}
        <div>
          <h3 className="ds-text-lg ds-font-semibold ds-mb-3">Batch Operations</h3>
          <div className="ds-flex ds-gap-2">
            <button onClick={showMultiple} className="ds-btn-secondary">
              Show 5 Notifications
            </button>
            <button onClick={clearAll} className="ds-btn-outline">
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Notification Counter */}
      <div className="ds-mt-6 ds-p-3 ds-bg-gray-50 ds-rounded">
        <p className="ds-text-sm ds-text-gray-600">
          Notifications shown: <span className="ds-font-semibold">{notificationCount}</span>
        </p>
      </div>
    </div>
  );
};