import { createApp } from 'vue';
import type { MFEModule, ServiceContainer } from '@mfe-toolkit/core';
import '@mfe-toolkit/service-notification/types';
import NotificationDemo from './NotificationDemo.vue';

let app: any = null;

const module: MFEModule = {
  metadata: {
    name: 'mfe-notification-vue3',
    version: '1.0.0',
    requiredServices: ['logger', 'notification']
  },

  mount: async (element: HTMLElement, serviceContainer: ServiceContainer) => {
    const logger = serviceContainer.require('logger');
    const notification = serviceContainer.require('notification');
    
    app = createApp(NotificationDemo, { 
      notification,
      logger 
    });
    app.mount(element);
    
    logger.info('[mfe-notification-vue3] Mounted successfully');
  },
  
  unmount: async (serviceContainer: ServiceContainer) => {
    if (app) {
      app.unmount();
      app = null;
    }
    
    const logger = serviceContainer.get('logger');
    if (logger) {
      logger.info('[mfe-notification-vue3] Unmounted successfully');
    }
  }
};

export default module;