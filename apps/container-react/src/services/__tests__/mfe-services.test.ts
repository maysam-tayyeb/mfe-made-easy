import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createSharedServices,
  setContextBridge,
  resetContextBridge,
  isContextBridgeReady,
  waitForContextBridge,
} from '../mfe-services';
import { ContextBridgeRef } from '../context-bridge';
import { ServiceContainer } from '@mfe-toolkit/core';

describe('MFE Services with Proxy Pattern', () => {
  let services: ServiceContainer;
  let mockContextBridge: ContextBridgeRef;

  beforeEach(() => {
    // Reset the context bridge state
    resetContextBridge();

    // Create mock services that persist
    const mockAuthService = {
      getSession: vi.fn(() => ({
        userId: 'test-user-id',
        username: 'test-user',
        email: 'test@example.com',
        roles: ['user'],
        permissions: ['read'],
        isAuthenticated: true,
      })),
      isAuthenticated: vi.fn(() => true),
      hasPermission: vi.fn(() => true),
      hasRole: vi.fn(() => true),
    };

    const mockModalService = {
      open: vi.fn(),
      close: vi.fn(),
    };

    const mockNotificationService = {
      show: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      dismiss: vi.fn(),
      dismissAll: vi.fn(),
    };

    // Create mock context bridge
    mockContextBridge = {
      getAuthService: vi.fn(() => mockAuthService),
      getModalService: vi.fn(() => mockModalService),
      getNotificationService: vi.fn(() => mockNotificationService),
      getThemeService: vi.fn(() => ({
        getTheme: vi.fn(() => 'light' as const),
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
        subscribe: vi.fn(() => vi.fn()),
      })),
    };

    services = createSharedServices();
  });

  afterEach(() => {
    // Clean up
    resetContextBridge();
  });

  describe('Context Bridge Status', () => {
    it('should report not ready before context bridge is set', () => {
      expect(isContextBridgeReady()).toBe(false);
    });

    it('should report ready after context bridge is set', () => {
      setContextBridge(mockContextBridge);
      expect(isContextBridgeReady()).toBe(true);
    });

    it('should resolve waitForContextBridge promise when bridge is set', async () => {
      const readyPromise = waitForContextBridge();
      setContextBridge(mockContextBridge);

      await expect(readyPromise).resolves.toBeUndefined();
    });
  });

  describe('Auth Service Proxy', () => {
    it('should return default values when bridge is not ready', () => {
      const auth = services.get('auth');
      expect(auth?.getSession()).toBeNull();
      expect(auth?.isAuthenticated()).toBe(false);
      expect(auth?.hasPermission('any')).toBe(false);
      expect(auth?.hasRole('any')).toBe(false);
    });

    it('should warn when called before bridge initialization', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const auth = services.get('auth');
      auth?.getSession();

      expect(consoleSpy).toHaveBeenCalledWith(
        'AuthService.getSession called before context bridge initialization'
      );

      consoleSpy.mockRestore();
    });

    it('should delegate to context bridge when ready', () => {
      setContextBridge(mockContextBridge);

      const auth = services.get('auth');
      const session = auth?.getSession();

      expect(session).toMatchObject({ username: 'test-user' });
      expect(mockContextBridge.getAuthenticationService).toHaveBeenCalled();
    });
  });

  describe('Modal Service Proxy', () => {
    it('should warn but not throw when called before initialization', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const modal = services.get('modal');
      expect(() => modal?.open({ title: 'Test', content: 'Test content' })).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        'ModalService.open called before context bridge initialization'
      );

      consoleSpy.mockRestore();
    });

    it('should delegate to context bridge when ready', () => {
      setContextBridge(mockContextBridge);

      const modal = services.get('modal');
      modal?.open({ title: 'Test', content: 'Test content' });

      // Get the mocked service and check it was called
      const modalService = mockContextBridge.getModalService();
      expect(modalService.open).toHaveBeenCalledWith({ title: 'Test', content: 'Test content' });
    });
  });

  describe('Notification Service Proxy', () => {
    it('should handle all notification methods', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const notification = services.get('notification');
      notification?.show({ title: 'Test', type: 'info' });
      notification?.success('Success', 'Message');
      notification?.error('Error', 'Message');
      notification?.warning('Warning', 'Message');
      notification?.info('Info', 'Message');

      expect(consoleSpy).toHaveBeenCalledTimes(5);

      consoleSpy.mockRestore();
    });

    it('should delegate all methods when bridge is ready', () => {
      setContextBridge(mockContextBridge);

      const notification = services.get('notification');
      notification?.success('Success', 'Message');

      // Get the mocked service and check it was called
      const notificationService = mockContextBridge.getNotificationService();
      expect(notificationService.success).toHaveBeenCalledWith('Success', 'Message');
    });
  });

  describe('Error Handling', () => {
    it('should throw error if accessing non-existent method', () => {
      setContextBridge(mockContextBridge);

      expect(() => {
        const auth = services.get('auth') as any;
        auth.nonExistentMethod();
      }).toThrow('AuthService.nonExistentMethod is not a function');
    });
  });

  describe('Service Consistency', () => {
    it('should maintain ServiceContainer interface', () => {
      // Verify services implement the ServiceContainer interface
      expect(services).toHaveProperty('get');
      expect(services).toHaveProperty('require');
      expect(services).toHaveProperty('has');
      expect(services).toHaveProperty('listAvailable');
      expect(services).toHaveProperty('getAllServices');
      expect(services).toHaveProperty('createScoped');
      expect(services).toHaveProperty('dispose');

      // Verify services are accessible via get()
      expect(services.get('logger')).toBeDefined();
      expect(services.get('auth')).toBeDefined();
      expect(services.get('eventBus')).toBeDefined();
      expect(services.get('modal')).toBeDefined();
      expect(services.get('notification')).toBeDefined();
      expect(services.get('errorReporter')).toBeDefined();
    });
  });
});
