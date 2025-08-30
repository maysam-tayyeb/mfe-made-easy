import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUI } from '@/contexts/UIContext';
import { TabGroup } from '@mfe/design-system-react';
import { RegistryMFELoader } from '@/components/RegistryMFELoader';

// MFE Card Component with Framework Badge (matching EventBusPageV3 style)
const MFECard: React.FC<{
  id: string;
  title: string;
  framework: 'react' | 'vue' | 'vanilla' | 'solid';
  frameworkVersion?: string;
  className?: string;
}> = ({ id, title, framework, frameworkVersion, className = '' }) => {
  const getFrameworkBadge = (framework: 'react' | 'vue' | 'vanilla' | 'solid') => {
    const badges = {
      react: { color: 'ds-bg-blue-500', icon: '⚛️', name: `React${frameworkVersion ? ` ${frameworkVersion}` : ''} MFE` },
      vue: { color: 'ds-bg-green-500', icon: '💚', name: 'Vue 3 MFE' },
      vanilla: { color: 'ds-bg-yellow-600', icon: '📦', name: 'Vanilla TS MFE' },
      solid: { color: 'ds-bg-purple-500', icon: '🔷', name: 'Solid.js MFE' }
    };
    return badges[framework];
  };

  const badge = getFrameworkBadge(framework);

  return (
    <div className={`ds-card ds-p-0 ${className}`}>
      <div className="ds-px-3 ds-py-2 ds-border-b ds-bg-slate-50 ds-flex ds-items-center ds-justify-between">
        <div className="ds-flex ds-items-center ds-gap-2">
          <span className="ds-text-sm ds-font-medium">{title}</span>
        </div>
        <div className={`ds-badge ds-badge-sm ${badge.color} ds-text-white`}>
          {badge.icon} {badge.name}
        </div>
      </div>
      <div>
        <RegistryMFELoader id={id} />
      </div>
    </div>
  );
};

export const NotificationsPage: React.FC = () => {
  const { addNotification, notifications, removeNotification } = useUI();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Helper function to clear all notifications
  const clearNotifications = () => {
    notifications.forEach(notification => {
      if (notification.id) {
        removeNotification(notification.id);
      }
    });
  };
  
  // Tab state - get initial tab from URL or default to 'container'
  const initialTab = searchParams.get('tab') || 'container';
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [notificationCount, setNotificationCount] = useState(0);
  const [customTitle, setCustomTitle] = useState('Custom Notification');
  const [customMessage, setCustomMessage] = useState('This is a custom notification message');
  const [customType, setCustomType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  
  // Sync tab state with URL
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const showNotification = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    duration?: number
  ) => {
    addNotification({ type, title, message, duration });
    setNotificationCount(prev => prev + 1);
  };

  // Container notification content component
  const ContainerNotificationDemo = () => {
    const showSuccess = () => {
      showNotification(
        'Success!',
        'Operation completed successfully from Container',
        'success'
      );
    };

    const showError = () => {
      showNotification(
        'Error Occurred',
        'Something went wrong in the Container',
        'error'
      );
    };

    const showWarning = () => {
      showNotification(
        'Warning',
        'Please review this warning from Container',
        'warning'
      );
    };

    const showInfo = () => {
      showNotification(
        'Information',
        'This is an informational message from Container',
        'info'
      );
    };

    const showCustom = () => {
      showNotification(customTitle, customMessage, customType);
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
        { title: 'First', message: 'Container notification 1', type: 'info' as const },
        { title: 'Second', message: 'Container notification 2', type: 'success' as const },
        { title: 'Third', message: 'Container notification 3', type: 'warning' as const },
        { title: 'Fourth', message: 'Container notification 4', type: 'error' as const },
        { title: 'Fifth', message: 'Container notification 5', type: 'info' as const }
      ];

      messages.forEach((msg, index) => {
        setTimeout(() => {
          showNotification(msg.title, msg.message, msg.type);
        }, index * 200);
      });
    };

    const clearAll = () => {
      if (clearNotifications) {
        clearNotifications();
      }
    };

    return (
      <div className="ds-p-4">
        <div className="ds-mb-6">
          <h2 className="ds-text-2xl ds-font-bold ds-mb-2">Container Notification Demo</h2>
          <p className="ds-text-gray-600">
            Framework: <span className="ds-font-medium">React 19.0.0</span> | 
            Pattern: <span className="ds-font-medium">Container Native</span>
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
                  onChange={(e) => setCustomType(e.target.value as any)}
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

  return (
    <div className="ds-page">
      <div className="ds-section">
        <h1 className="ds-page-title">Notification Service</h1>
        <p className="ds-text-muted">Test the platform notification system across different frameworks</p>
      </div>

      <TabGroup
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={[
          {
            id: 'container',
            label: '🏠 Container',
            content: (
              <div className="ds-card ds-p-0">
                <div className="ds-px-3 ds-py-2 ds-border-b ds-bg-slate-50 ds-flex ds-items-center ds-justify-between">
                  <div className="ds-flex ds-items-center ds-gap-2">
                    <span className="ds-text-sm ds-font-medium">Notification Service Demo</span>
                  </div>
                  <div className="ds-badge ds-badge-sm ds-bg-slate-600 ds-text-white">
                    🏠 Container Implementation
                  </div>
                </div>
                <div>
                  <ContainerNotificationDemo />
                </div>
              </div>
            )
          },
          {
            id: 'react19',
            label: '⚛️ React 19',
            content: (
              <MFECard 
                id="mfe-notification-react19" 
                title="Notification Service Demo" 
                framework="react"
                frameworkVersion="19"
              />
            )
          },
          {
            id: 'react18',
            label: '⚛️ React 18',
            content: (
              <MFECard 
                id="mfe-notification-react18" 
                title="Notification Service Demo" 
                framework="react"
                frameworkVersion="18"
              />
            )
          },
          {
            id: 'react17',
            label: '⚛️ React 17',
            content: (
              <MFECard 
                id="mfe-notification-react17" 
                title="Notification Service Demo" 
                framework="react"
                frameworkVersion="17"
              />
            )
          },
          {
            id: 'vue3',
            label: '💚 Vue 3',
            content: (
              <MFECard 
                id="mfe-notification-vue3" 
                title="Notification Service Demo" 
                framework="vue"
              />
            )
          },
          {
            id: 'solidjs',
            label: '🔷 Solid.js',
            content: (
              <MFECard 
                id="mfe-notification-solidjs" 
                title="Notification Service Demo" 
                framework="solid"
              />
            )
          },
          {
            id: 'vanilla',
            label: '📦 Vanilla TS',
            content: (
              <MFECard 
                id="mfe-notification-vanilla" 
                title="Notification Service Demo" 
                framework="vanilla"
              />
            )
          }
        ]}
        defaultTab="container"
        className="ds-mt-4"
      />
    </div>
  );
};