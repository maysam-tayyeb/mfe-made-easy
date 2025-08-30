/**
 * Modal Service Types
 */

export interface BaseModalConfig<TContent = any> {
  /**
   * Modal title
   */
  title: string;
  
  /**
   * Modal content - can be string, HTML, or component data
   */
  content: TContent;
  
  /**
   * Modal size
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  /**
   * Callback when modal is closed
   */
  onClose?: () => void;
  
  /**
   * Callback when modal is confirmed
   */
  onConfirm?: () => void | Promise<void>;
  
  /**
   * Show close button
   */
  showCloseButton?: boolean;
  
  /**
   * Close modal when clicking overlay
   */
  closeOnOverlayClick?: boolean;
  
  /**
   * Close modal when pressing escape
   */
  closeOnEscape?: boolean;
  
  /**
   * Custom CSS class for modal
   */
  className?: string;
  
  /**
   * Modal z-index
   */
  zIndex?: number;
  
  /**
   * Show confirm button
   */
  showConfirmButton?: boolean;
  
  /**
   * Show cancel button
   */
  showCancelButton?: boolean;
  
  /**
   * Confirm button text
   */
  confirmText?: string;
  
  /**
   * Cancel button text
   */
  cancelText?: string;
  
  /**
   * Confirm button variant
   */
  confirmVariant?: 'primary' | 'danger' | 'success';
}

export interface ModalService<TModalConfig = BaseModalConfig> {
  /**
   * Open a modal
   */
  open(config: TModalConfig): string; // Returns modal ID
  
  /**
   * Close a specific modal by ID
   */
  close(id?: string): void;
  
  /**
   * Close all modals
   */
  closeAll?(): void;
  
  /**
   * Update modal configuration
   */
  update?(id: string, config: Partial<TModalConfig>): void;
  
  /**
   * Check if a modal is open
   */
  isOpen?(id?: string): boolean;
  
  /**
   * Get all open modals
   */
  getOpenModals?(): Array<{ id: string; config: TModalConfig }>;
}

export interface ModalStackEntry<TModalConfig = BaseModalConfig> {
  id: string;
  config: TModalConfig;
  element?: HTMLElement;
  onClose?: () => void;
}

/**
 * Service key for registration
 */
export const MODAL_SERVICE_KEY = 'modal';

// Module augmentation for TypeScript support
declare module '@mfe-toolkit/core' {
  interface ServiceMap {
    modal: ModalService;
  }
}