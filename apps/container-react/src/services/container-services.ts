/**
 * Container Services using new Service Registry
 * Provides services to React contexts and MFEs
 */

import type { ServiceContainer } from '@mfe-toolkit/core';
import type { AuthService } from '@mfe-toolkit/service-authentication';
import type { AuthorizationService } from '@mfe-toolkit/service-authorization';
import type { ModalService } from '@mfe-toolkit/service-modal';
import type { NotificationService } from '@mfe-toolkit/service-notification';
import type { ThemeService } from '@mfe-toolkit/service-theme';
import { getSharedServices } from './shared-services';

// Service container instance
let containerInstance: ServiceContainer | null = null;

/**
 * Initialize the container services
 */
export async function initializeServices(): Promise<ServiceContainer> {
  if (!containerInstance) {
    containerInstance = getSharedServices();
  }
  return containerInstance;
}

/**
 * Get the service container
 */
export function getServices(): ServiceContainer | null {
  return containerInstance;
}

/**
 * Service accessor functions for React contexts
 */
export function getAuthenticationService(): AuthService | undefined {
  return containerInstance?.get('auth');
}

export function getAuthorizationService(): AuthorizationService | undefined {
  return containerInstance?.get('authz');
}

export function getModalService(): ModalService | undefined {
  return containerInstance?.get('modal');
}

export function getNotificationService(): NotificationService | undefined {
  return containerInstance?.get('notification');
}

export function getThemeService(): ThemeService | undefined {
  return containerInstance?.get('theme');
}

export function getLogger() {
  return containerInstance?.get('logger');
}

export function getEventBus() {
  return containerInstance?.get('eventBus');
}