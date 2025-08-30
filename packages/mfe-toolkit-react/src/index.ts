// Components
export { MFELoader } from './components/MFELoader';
export { MFEPage } from './components/MFEPage';
export { MFEErrorBoundary, withMFEErrorBoundary } from './components/MFEErrorBoundary';

// Services
export {
  MFEServicesProvider,
  MFEServicesProvider as MFEProvider, // alias for backward compatibility
  useMFEServices,
  useMFEService,
} from './services/dependency-injection';

// State Management
export * from './state/mfe-store-factory';
export * from './state/mfe-store-hooks';

// Types
export type { ModalConfig } from './types';
