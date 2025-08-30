/**
 * Modal Service Implementation
 */

import type { ModalService, BaseModalConfig, ModalStackEntry } from './types';

export class ModalServiceImpl<TModalConfig extends BaseModalConfig = BaseModalConfig> 
  implements ModalService<TModalConfig> {
  
  private modals = new Map<string, ModalStackEntry<TModalConfig>>();
  private modalStack: string[] = [];
  private listeners = new Set<(modals: ModalStackEntry<TModalConfig>[]) => void>();
  private idCounter = 0;

  open(config: TModalConfig): string {
    const id = this.generateId();
    
    const entry: ModalStackEntry<TModalConfig> = {
      id,
      config,
      onClose: config.onClose,
    };
    
    this.modals.set(id, entry);
    this.modalStack.push(id);
    this.notifyListeners();
    
    // Setup escape handler if needed
    if (config.closeOnEscape !== false) {
      this.setupEscapeHandler(id);
    }
    
    return id;
  }

  close(id?: string): void {
    // If no ID provided, close the topmost modal
    const modalId = id || this.modalStack[this.modalStack.length - 1];
    
    if (!modalId) return;
    
    const modal = this.modals.get(modalId);
    if (!modal) return;
    
    // Call onClose callback
    if (modal.onClose) {
      modal.onClose();
    }
    
    // Remove from map and stack
    this.modals.delete(modalId);
    this.modalStack = this.modalStack.filter(stackId => stackId !== modalId);
    
    this.notifyListeners();
  }

  closeAll(): void {
    // Close all modals in reverse order
    const modalIds = [...this.modalStack].reverse();
    
    for (const id of modalIds) {
      this.close(id);
    }
  }

  update(id: string, config: Partial<TModalConfig>): void {
    const modal = this.modals.get(id);
    if (!modal) return;
    
    modal.config = {
      ...modal.config,
      ...config,
    };
    
    this.notifyListeners();
  }

  isOpen(id?: string): boolean {
    if (id) {
      return this.modals.has(id);
    }
    return this.modals.size > 0;
  }

  getOpenModals(): Array<{ id: string; config: TModalConfig }> {
    return this.modalStack.map(id => {
      const modal = this.modals.get(id)!;
      return {
        id,
        config: modal.config,
      };
    });
  }

  /**
   * Subscribe to modal state changes
   */
  subscribe(callback: (modals: ModalStackEntry<TModalConfig>[]) => void): () => void {
    this.listeners.add(callback);
    
    // Call immediately with current state
    callback(this.getModalStack());
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  private generateId(): string {
    return `modal-${++this.idCounter}-${Date.now()}`;
  }

  private getModalStack(): ModalStackEntry<TModalConfig>[] {
    return this.modalStack.map(id => this.modals.get(id)!).filter(Boolean);
  }

  private notifyListeners(): void {
    const stack = this.getModalStack();
    this.listeners.forEach(callback => callback(stack));
  }

  private setupEscapeHandler(id: string): void {
    if (typeof window === 'undefined') return;
    
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Only close if this is the topmost modal
        const topModal = this.modalStack[this.modalStack.length - 1];
        if (topModal === id) {
          this.close(id);
          window.removeEventListener('keydown', handler);
        }
      }
    };
    
    window.addEventListener('keydown', handler);
    
    // Store handler for cleanup
    const modal = this.modals.get(id);
    if (modal) {
      const originalOnClose = modal.onClose;
      modal.onClose = () => {
        window.removeEventListener('keydown', handler);
        originalOnClose?.();
      };
    }
  }

  dispose(): void {
    this.closeAll();
    this.listeners.clear();
  }
}

/**
 * Create a modal service instance
 */
export function createModalService<TModalConfig extends BaseModalConfig = BaseModalConfig>(): ModalService<TModalConfig> {
  return new ModalServiceImpl<TModalConfig>();
}