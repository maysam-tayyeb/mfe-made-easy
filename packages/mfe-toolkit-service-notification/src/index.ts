/**
 * @mfe-toolkit/service-notification
 * Notification/toast service for MFE Toolkit
 */

import type { ServiceProvider, ServiceContainer } from '@mfe-toolkit/core';
import type { NotificationService, NotificationConfig } from './types';

// Re-export types for backward compatibility
export type { NotificationService, NotificationConfig, NotificationType } from './types';

export const NOTIFICATION_SERVICE_KEY = 'notification';

// Implementation
class NotificationServiceImpl implements NotificationService {
  private notifications = new Map<string, NotificationConfig>();
  private listeners = new Set<(notifications: NotificationConfig[]) => void>();
  private idCounter = 0;

  show(config: NotificationConfig): string {
    const id = config.id || `notification-${++this.idCounter}`;
    const notification = { ...config, id };

    this.notifications.set(id, notification);
    this.notifyListeners();

    // Auto-dismiss after duration
    if (config.duration !== 0) {
      setTimeout(() => this.dismiss(id), config.duration || 5000);
    }

    return id;
  }

  success(title: string, message?: string): string {
    return this.show({ type: 'success', title, message });
  }

  error(title: string, message?: string): string {
    return this.show({ type: 'error', title, message, duration: 0 });
  }

  warning(title: string, message?: string): string {
    return this.show({ type: 'warning', title, message });
  }

  info(title: string, message?: string): string {
    return this.show({ type: 'info', title, message });
  }

  dismiss(id: string): void {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.onClose?.();
      this.notifications.delete(id);
      this.notifyListeners();
    }
  }

  dismissAll(): void {
    for (const id of this.notifications.keys()) {
      this.dismiss(id);
    }
  }

  subscribe(callback: (notifications: NotificationConfig[]) => void): () => void {
    this.listeners.add(callback);
    callback(Array.from(this.notifications.values()));
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const notifications = Array.from(this.notifications.values());
    this.listeners.forEach((callback) => callback(notifications));
  }
}

// Provider
export function createNotificationProvider(): ServiceProvider<NotificationService> {
  return {
    name: NOTIFICATION_SERVICE_KEY,
    version: '1.0.0',
    dependencies: ['logger'],

    create(container: ServiceContainer): NotificationService {
      const logger = container.get('logger');
      const service = new NotificationServiceImpl();

      if (logger) {
        const originalShow = service.show.bind(service);
        service.show = (config) => {
          logger.debug(`Showing ${config.type} notification: ${config.title}`);
          return originalShow(config);
        };
      }

      return service;
    },
  };
}

export const notificationServiceProvider = createNotificationProvider();

// Module augmentation is now in ./types.ts for lighter imports
