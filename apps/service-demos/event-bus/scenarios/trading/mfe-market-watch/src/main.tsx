import React from 'react';
import ReactDOM from 'react-dom/client';
import { MarketWatch } from './MarketWatch';
import type { MFEModule, ServiceContainer } from '@mfe-toolkit/core';

let root: ReactDOM.Root | null = null;

const module: MFEModule = {
  metadata: {
    name: 'mfe-market-watch',
    version: '1.0.0',
    requiredServices: ['eventBus', 'logger']
  },

  mount: async (element: HTMLElement, container: ServiceContainer) => {
    root = ReactDOM.createRoot(element);
    root.render(
      <React.StrictMode>
        <MarketWatch serviceContainer={container} />
      </React.StrictMode>
    );
    
    const logger = container.get('logger');
    if (logger) {
      logger.info('[mfe-market-watch] Mounted successfully with React 18');
    }
  },
  
  unmount: async (container: ServiceContainer) => {
    if (root) {
      root.unmount();
      root = null;
    }
    
    const logger = container.get('logger');
    if (logger) {
      logger.info('[mfe-market-watch] Unmounted successfully');
    }
  }
};

export default module;