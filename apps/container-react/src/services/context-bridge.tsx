import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import type { AuthService } from '@mfe-toolkit/service-authentication/types';
import type {
  AuthorizationService,
  ResourceAccess,
} from '@mfe-toolkit/service-authorization/types';
import type { ModalService } from '@mfe-toolkit/service-modal';
import type {
  NotificationService,
  NotificationConfig,
} from '@mfe-toolkit/service-notification/types';
import type { ThemeService } from '@mfe-toolkit/service-theme';
import { getThemeService } from './theme-service';

export interface ContextBridgeRef {
  getAuthenticationService: () => AuthService;
  getAuthorizationService: () => AuthorizationService;
  getModalService: () => ModalService;
  getNotificationService: () => NotificationService;
  getThemeService: () => ThemeService;
}

// This component bridges React contexts to imperative services for MFEs
export const ContextBridge = forwardRef<ContextBridgeRef, { children: React.ReactNode }>(
  ({ children }, ref) => {
    const auth = useAuth();
    const ui = useUI();

    // Create stable service instances - only update refs, don't recreate objects
    const authServiceRef = useRef<AuthService>({
      getSession: () => null,
      isAuthenticated: () => false,
    });

    const authorizationServiceRef = useRef<AuthorizationService>({
      hasPermission: () => false,
      hasAnyPermission: () => false,
      hasAllPermissions: () => false,
      hasRole: () => false,
      hasAnyRole: () => false,
      hasAllRoles: () => false,
      canAccess: () => false,
      canAccessAny: () => false,
      canAccessAll: () => false,
      getPermissions: () => [],
      getRoles: () => [],
    });

    const modalServiceRef = useRef<ModalService>({
      open: () => '', // Must return modal ID
      close: () => {},
    });

    const notificationServiceRef = useRef<NotificationService>({
      show: () => '', // Must return notification ID
      success: () => '',
      error: () => '',
      warning: () => '',
      info: () => '',
      dismiss: () => {},
      dismissAll: () => {},
    });

    // Update service methods without recreating the objects
    useEffect(() => {
      authServiceRef.current.getSession = () => auth.session;
      authServiceRef.current.isAuthenticated = () => auth.session?.isAuthenticated || false;
    }, [auth.session]);

    useEffect(() => {
      authorizationServiceRef.current.hasPermission = (permission: string) =>
        auth.session?.permissions?.includes(permission) || false;
      authorizationServiceRef.current.hasAnyPermission = (permissions: string[]) =>
        permissions.some((p) => auth.session?.permissions?.includes(p)) || false;
      authorizationServiceRef.current.hasAllPermissions = (permissions: string[]) =>
        permissions.every((p) => auth.session?.permissions?.includes(p)) || false;
      authorizationServiceRef.current.hasRole = (role: string) =>
        auth.session?.roles?.includes(role) || false;
      authorizationServiceRef.current.hasAnyRole = (roles: string[]) =>
        roles.some((r) => auth.session?.roles?.includes(r)) || false;
      authorizationServiceRef.current.hasAllRoles = (roles: string[]) =>
        roles.every((r) => auth.session?.roles?.includes(r)) || false;
      authorizationServiceRef.current.canAccess = (resource: string, action: string) => {
        // Simple permission check - could be more sophisticated
        const permission = `${resource}:${action}`;
        return auth.session?.permissions?.includes(permission) || false;
      };
      authorizationServiceRef.current.canAccessAny = (resources: ResourceAccess[]) => {
        return (
          resources.some((r) =>
            r.actions.some((action) => {
              const permission = `${r.resource}:${action}`;
              return auth.session?.permissions?.includes(permission);
            })
          ) || false
        );
      };
      authorizationServiceRef.current.canAccessAll = (resources: ResourceAccess[]) => {
        return (
          resources.every((r) =>
            r.actions.every((action) => {
              const permission = `${r.resource}:${action}`;
              return auth.session?.permissions?.includes(permission);
            })
          ) || false
        );
      };
      authorizationServiceRef.current.getPermissions = () => auth.session?.permissions || [];
      authorizationServiceRef.current.getRoles = () => auth.session?.roles || [];
    }, [auth.session]);

    useEffect(() => {
      modalServiceRef.current.open = (config) => {
        ui.openModal(config);
        return 'modal-1'; // Return a modal ID
      };
      modalServiceRef.current.close = () => ui.closeModal();
    }, [ui.openModal, ui.closeModal]);

    useEffect(() => {
      const show = (config: NotificationConfig) => {
        ui.addNotification(config);
        return `notification-${Date.now()}`; // Return a notification ID
      };

      notificationServiceRef.current.show = show;
      notificationServiceRef.current.success = (title, message) =>
        show({ type: 'success', title, message });
      notificationServiceRef.current.error = (title, message) =>
        show({ type: 'error', title, message });
      notificationServiceRef.current.warning = (title, message) =>
        show({ type: 'warning', title, message });
      notificationServiceRef.current.info = (title, message) =>
        show({ type: 'info', title, message });
      notificationServiceRef.current.dismiss = () => {}; // TODO: Implement
      notificationServiceRef.current.dismissAll = () => {}; // TODO: Implement
    }, [ui.addNotification]);

    // Get theme service singleton
    const themeService = getThemeService();

    // Expose methods to get services
    useImperativeHandle(
      ref,
      () => ({
        getAuthenticationService: () => authServiceRef.current,
        getAuthorizationService: () => authorizationServiceRef.current,
        getModalService: () => modalServiceRef.current,
        getNotificationService: () => notificationServiceRef.current,
        getThemeService: () => themeService,
      }),
      []
    );

    return <>{children}</>;
  }
);
