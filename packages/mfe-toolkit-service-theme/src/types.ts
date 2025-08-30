/**
 * Type definitions for the theme service
 * This file contains only types and module augmentation, no implementation
 */

export type Theme = string;

export interface ThemeService {
  getTheme(): Theme;
  setTheme(theme: Theme): void;
  subscribe(callback: (theme: Theme) => void): () => void;
  getAvailableThemes?(): Theme[];
  cycleTheme?(): void;
}

export const THEME_SERVICE_KEY = 'theme';

// Module augmentation for TypeScript support
declare module '@mfe-toolkit/core' {
  interface ServiceMap {
    theme: ThemeService;
  }
}