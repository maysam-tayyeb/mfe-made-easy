import { AnalyticsEngine } from './AnalyticsEngine';
import type { MFEModule, ServiceContainer } from '@mfe-toolkit/core';

let instance: AnalyticsEngine | null = null;

const module: MFEModule = {
  metadata: {
    name: 'mfe-analytics-engine',
    version: '1.0.0',
    requiredServices: ['eventBus', 'logger']
  },

  mount: async (element: HTMLElement, container: ServiceContainer) => {
    instance = new AnalyticsEngine(element, container);
    
    const logger = container.get('logger');
    if (logger) {
      logger.info('[mfe-analytics-engine] Mounted successfully with Vanilla TypeScript');
    }
  },
  
  unmount: async (container: ServiceContainer) => {
    if (instance) {
      instance.destroy();
      instance = null;
    }
    
    const logger = container.get('logger');
    if (logger) {
      logger.info('[mfe-analytics-engine] Unmounted successfully');
    }
  }
};

export default module;