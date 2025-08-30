import type { ReactNode } from 'react';

// Re-export core types for convenience
export type {
  MFEModule,
  ServiceContainer,
  MFEManifest,
  Logger,
  EventBus,
} from '@mfe-toolkit/core';

// React-specific types
export interface ModalConfig {
  title: string;
  content: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClose?: () => void;
  onConfirm?: () => void;
}