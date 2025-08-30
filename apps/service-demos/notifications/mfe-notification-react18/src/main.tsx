import React from 'react';
import ReactDOM from 'react-dom/client';
import { NotificationDemo } from './NotificationDemo';
import type { MFEModule, ServiceContainer } from '@mfe-toolkit/core';
import '@mfe-toolkit/service-notification/types';

let root: ReactDOM.Root | null = null;

const module: MFEModule = {
  metadata: {
    name: 'mfe-notification-react18',
    version: '1.0.0',
    requiredServices: ['logger', 'notification'],
  },

  mount: async (element: HTMLElement, serviceContainer: ServiceContainer) => {
    const logger = serviceContainer.require('logger');
    const notification = serviceContainer.require('notification');

    // React 18 uses createRoot API
    root = ReactDOM.createRoot(element);
    root.render(
      <React.StrictMode>
        <NotificationDemo notification={notification} logger={logger} />
      </React.StrictMode>
    );

    logger.info('React 18 Notification MFE mounted');
  },

  unmount: async (serviceContainer: ServiceContainer) => {
    if (root) {
      root.unmount();
      root = null;
    }

    const logger = serviceContainer.get('logger');
    if (logger) {
      logger.info('React 18 Notification MFE unmounted');
    }
  },
};

export default module;
