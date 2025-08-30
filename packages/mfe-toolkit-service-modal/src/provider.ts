/**
 * Modal Service Provider
 */

import type { ServiceProvider, ServiceContainer } from '@mfe-toolkit/core';
import { createModalService } from './service';
import { MODAL_SERVICE_KEY, type ModalService, type BaseModalConfig } from './types';

export interface ModalProviderOptions {
  /**
   * Default modal configuration
   */
  defaultConfig?: Partial<BaseModalConfig>;
  
  /**
   * Maximum number of modals that can be open at once
   */
  maxModals?: number;
}

/**
 * Create a modal service provider
 */
export function createModalProvider<TModalConfig extends BaseModalConfig = BaseModalConfig>(
  options: ModalProviderOptions = {}
): ServiceProvider<ModalService<TModalConfig>> {
  return {
    name: MODAL_SERVICE_KEY,
    version: '1.0.0',
    dependencies: ['logger'], // Optional dependency for logging
    
    create(container: ServiceContainer): ModalService<TModalConfig> {
      const logger = container.get('logger');
      
      // Create modal service
      const modalService = createModalService<TModalConfig>();
      
      // Add logging if available
      if (logger) {
        const originalOpen = modalService.open.bind(modalService);
        modalService.open = (config) => {
          logger.debug('Opening modal', { title: config.title });
          
          // Check max modals
          const openModals = modalService.getOpenModals?.() || [];
          if (options.maxModals && openModals.length >= options.maxModals) {
            logger.warn(`Maximum number of modals (${options.maxModals}) reached`);
            throw new Error(`Cannot open more than ${options.maxModals} modals`);
          }
          
          // Apply default config
          const finalConfig = {
            ...options.defaultConfig,
            ...config,
          } as TModalConfig;
          
          return originalOpen(finalConfig);
        };
        
        const originalClose = modalService.close.bind(modalService);
        modalService.close = (id) => {
          logger.debug('Closing modal', { id });
          originalClose(id);
        };
      }
      
      return modalService;
    },
    
    dispose(): void {
      // Cleanup if needed
    },
  };
}

// Export default provider for common use case
export const modalServiceProvider = createModalProvider();