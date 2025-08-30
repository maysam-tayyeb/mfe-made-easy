/**
 * @mfe-toolkit/service-modal
 * Modal/dialog service for MFE Toolkit
 */

// Export types
export type {
  ModalService,
  BaseModalConfig,
  ModalStackEntry,
} from './types';

export { MODAL_SERVICE_KEY } from './types';

// Export service implementation
export { ModalServiceImpl, createModalService } from './service';

// Export provider
export { createModalProvider, modalServiceProvider, type ModalProviderOptions } from './provider';

// Module augmentation is now in ./types.ts for lighter imports