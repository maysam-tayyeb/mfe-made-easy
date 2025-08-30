import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type { BaseModalConfig } from '@mfe-toolkit/service-modal';
import type { NotificationConfig } from '@mfe-toolkit/service-notification';

type ModalConfig = BaseModalConfig<React.ReactNode>;

interface UIContextType {
  // Modal state
  modal: {
    isOpen: boolean;
    config: ModalConfig | null;
  };
  openModal: (config: ModalConfig) => void;
  closeModal: () => void;

  // Notification state
  notifications: NotificationConfig[];
  addNotification: (notification: NotificationConfig) => void;
  removeNotification: (id: string) => void;
}

const UIContext = createContext<UIContextType | null>(null);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modal, setModal] = useState<{ isOpen: boolean; config: ModalConfig | null }>({
    isOpen: false,
    config: null,
  });
  const [notifications, setNotifications] = useState<NotificationConfig[]>([]);

  // Modal functions
  const openModal = useCallback((config: ModalConfig) => {
    setModal({ isOpen: true, config });
  }, []);

  const closeModal = useCallback(() => {
    setModal({ isOpen: false, config: null });
  }, []);

  // Notification functions
  const addNotification = useCallback((notification: NotificationConfig) => {
    const id = notification.id || `notification-${Date.now()}`;
    setNotifications(prev => [...prev, { ...notification, id }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const value: UIContextType = {
    modal,
    openModal,
    closeModal,
    notifications,
    addNotification,
    removeNotification,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within UIProvider');
  }
  return context;
};