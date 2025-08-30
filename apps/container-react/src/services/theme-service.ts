import type { Theme, ThemeService } from '@mfe-toolkit/service-theme';

type ThemeChangeListener = (theme: Theme) => void;

export class ThemeServiceImpl implements ThemeService {
  private listeners: Set<ThemeChangeListener> = new Set();
  private currentTheme: Theme;
  private availableThemes: Theme[];

  constructor(themes: Theme[] = ['light', 'dark']) {
    this.availableThemes = themes;

    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Validate saved theme is still available
    if (savedTheme && this.availableThemes.includes(savedTheme)) {
      this.currentTheme = savedTheme;
    } else {
      // Fallback to system preference or first available theme
      this.currentTheme =
        systemPrefersDark && this.availableThemes.includes('dark')
          ? 'dark'
          : this.availableThemes[0];
    }

    this.applyTheme(this.currentTheme);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        // Only update if user hasn't set a preference
        const preferredTheme = e.matches ? 'dark' : 'light';
        if (this.availableThemes.includes(preferredTheme)) {
          this.setTheme(preferredTheme);
        }
      }
    });
  }

  getTheme(): Theme {
    return this.currentTheme;
  }

  setTheme(theme: Theme): void {
    if (this.currentTheme !== theme) {
      this.currentTheme = theme;
      this.applyTheme(theme);
      localStorage.setItem('theme', theme);
      this.notifyListeners(theme);
    }
  }

  cycleTheme(): void {
    const currentIndex = this.availableThemes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % this.availableThemes.length;
    this.setTheme(this.availableThemes[nextIndex]);
  }

  getAvailableThemes(): Theme[] {
    return [...this.availableThemes];
  }

  subscribe(callback: ThemeChangeListener): () => void {
    this.listeners.add(callback);
    // Call immediately with current theme
    callback(this.currentTheme);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;

    // Remove all theme classes
    this.availableThemes.forEach((t) => {
      root.classList.remove(t);
    });

    // Add current theme class
    root.classList.add(theme);

    // Also set as data attribute for more flexible CSS targeting
    root.setAttribute('data-theme', theme);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      // Use theme-specific colors or fallback to light/dark defaults
      const themeColors: Record<string, string> = {
        light: '#ffffff',
        dark: '#000000',
        blue: '#1e40af',
        sepia: '#f5e6d3',
        // Add more theme colors as needed
      };
      metaThemeColor.setAttribute('content', themeColors[theme] || '#ffffff');
    }
  }

  private notifyListeners(theme: Theme): void {
    this.listeners.forEach((listener) => {
      try {
        listener(theme);
      } catch (error) {
        console.error('Error in theme change listener:', error);
      }
    });
  }
}

// Singleton instance
let themeService: ThemeServiceImpl | null = null;

export const getThemeService = (themes?: Theme[]): ThemeServiceImpl => {
  if (!themeService) {
    themeService = new ThemeServiceImpl(themes);
  }
  return themeService;
};

// Export for configuration
export const configureThemeService = (themes: Theme[]): void => {
  if (themeService) {
    console.warn('Theme service already initialized. Ignoring new configuration.');
    return;
  }
  themeService = new ThemeServiceImpl(themes);
};
