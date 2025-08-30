# @mfe-toolkit/service-theme

Theme management service for MFE Toolkit - provides centralized theme switching and customization across microfrontends.

## Installation

```bash
npm install @mfe-toolkit/service-theme
# or
pnpm add @mfe-toolkit/service-theme
```

## Overview

The Theme Service provides a unified way to manage application themes across your microfrontend architecture. It handles theme persistence, live switching, and ensures consistent theming across all MFEs.

## Key Features

- 🎨 **Multiple Themes**: Support for unlimited theme variations
- 💾 **Persistence**: Remember user's theme preference
- 🔄 **Live Switching**: Instant theme updates without reload
- 📢 **Change Events**: Subscribe to theme changes
- 🌗 **System Integration**: Respect system dark/light mode preference
- 🎭 **Framework Agnostic**: Works with any frontend framework

## Usage

### Basic Setup

```typescript
import { createThemeService } from '@mfe-toolkit/service-theme';

// Create service with default themes
const themeService = createThemeService();

// Or with custom themes
const themeService = createThemeService(
  'light', // default theme
  ['light', 'dark', 'high-contrast', 'blue'] // available themes
);
```

### Service Registration (MFE Container)

```typescript
import { createServiceRegistry } from '@mfe-toolkit/core';
import { themeServiceProvider } from '@mfe-toolkit/service-theme';

const registry = createServiceRegistry();
registry.registerProvider(themeServiceProvider);
await registry.initialize();
```

### Using in MFEs

```typescript
// In your MFE module
export default {
  mount(element: HTMLElement, container: ServiceContainer) {
    const theme = container.get('theme');
    
    // Get current theme
    const currentTheme = theme.getTheme();
    console.log(`Current theme: ${currentTheme}`);
    
    // Subscribe to theme changes
    theme.subscribe((newTheme) => {
      console.log(`Theme changed to: ${newTheme}`);
      updateUIForTheme(newTheme);
    });
  }
};
```

## API Reference

### `ThemeService` Interface

#### Core Methods

##### `getTheme(): Theme`
Returns the current theme.

```typescript
const currentTheme = theme.getTheme();
console.log(currentTheme); // 'light', 'dark', etc.
```

##### `setTheme(theme: Theme): void`
Sets the active theme.

```typescript
theme.setTheme('dark');
```

##### `subscribe(callback: (theme: Theme) => void): () => void`
Subscribe to theme changes. Returns an unsubscribe function.

```typescript
const unsubscribe = theme.subscribe((newTheme) => {
  document.body.className = `theme-${newTheme}`;
});

// Later, to unsubscribe
unsubscribe();
```

##### `getAvailableThemes(): Theme[]`
Returns all available themes.

```typescript
const themes = theme.getAvailableThemes();
console.log(themes); // ['light', 'dark', 'high-contrast']
```

##### `cycleTheme(): void`
Cycles to the next available theme.

```typescript
// If current is 'light' and available are ['light', 'dark', 'blue']
theme.cycleTheme(); // Changes to 'dark'
theme.cycleTheme(); // Changes to 'blue'
theme.cycleTheme(); // Changes back to 'light'
```

### Types

#### `Theme`
```typescript
type Theme = string; // 'light', 'dark', 'blue', etc.
```

## Common Use Cases

### Theme Toggle Button

```typescript
function ThemeToggle() {
  const theme = useService('theme');
  const [currentTheme, setCurrentTheme] = useState(theme?.getTheme());
  
  useEffect(() => {
    if (!theme) return;
    return theme.subscribe(setCurrentTheme);
  }, [theme]);
  
  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    theme?.setTheme(newTheme);
  };
  
  return (
    <button onClick={toggleTheme}>
      {currentTheme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

### Theme Selector Dropdown

```typescript
function ThemeSelector() {
  const theme = useService('theme');
  const [currentTheme, setCurrentTheme] = useState(theme?.getTheme());
  const availableThemes = theme?.getAvailableThemes() || [];
  
  useEffect(() => {
    if (!theme) return;
    return theme.subscribe(setCurrentTheme);
  }, [theme]);
  
  return (
    <select 
      value={currentTheme} 
      onChange={(e) => theme?.setTheme(e.target.value)}
    >
      {availableThemes.map(t => (
        <option key={t} value={t}>
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </option>
      ))}
    </select>
  );
}
```

### System Theme Detection

```typescript
function useSystemTheme() {
  const theme = useService('theme');
  
  useEffect(() => {
    if (!theme) return;
    
    // Check if user prefers dark mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Set initial theme based on system preference
    theme.setTheme(mediaQuery.matches ? 'dark' : 'light');
    
    // Listen for system theme changes
    const handleChange = (e: MediaQueryListEvent) => {
      theme.setTheme(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);
}
```

### Theme-aware Components

```typescript
function ThemedCard({ children }) {
  const theme = useService('theme');
  const [currentTheme, setCurrentTheme] = useState(theme?.getTheme());
  
  useEffect(() => {
    if (!theme) return;
    return theme.subscribe(setCurrentTheme);
  }, [theme]);
  
  return (
    <div className={`card card-${currentTheme}`}>
      {children}
    </div>
  );
}
```

### Advanced Theme Configuration

```typescript
// Create a theme service with detailed configuration
const themeService = createThemeService('light', [
  'light',
  'dark',
  'high-contrast',
  'blue',
  'green'
]);

// Apply theme with CSS variables
themeService.subscribe((theme) => {
  const root = document.documentElement;
  
  switch(theme) {
    case 'light':
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--text-primary', '#000000');
      break;
    case 'dark':
      root.style.setProperty('--bg-primary', '#1a1a1a');
      root.style.setProperty('--text-primary', '#ffffff');
      break;
    case 'blue':
      root.style.setProperty('--bg-primary', '#001f3f');
      root.style.setProperty('--text-primary', '#7fdbff');
      break;
    // ... more themes
  }
});
```

## Integration Patterns

### CSS Class Application

The theme service automatically applies theme classes to the document:

```typescript
// When theme changes, these are applied automatically:
// 1. data-theme attribute on <html>
// 2. theme-{name} class on <html>

// CSS can then target these:
```

```css
/* Attribute selector */
[data-theme="dark"] {
  --bg-color: #1a1a1a;
  --text-color: #ffffff;
}

[data-theme="light"] {
  --bg-color: #ffffff;
  --text-color: #000000;
}

/* Class selector */
.theme-dark {
  background-color: var(--bg-color);
  color: var(--text-color);
}
```

### CSS Variables Strategy

```css
:root {
  /* Light theme (default) */
  --color-primary: #007bff;
  --color-background: #ffffff;
  --color-text: #333333;
  --color-border: #dee2e6;
}

[data-theme="dark"] {
  --color-primary: #0d6efd;
  --color-background: #212529;
  --color-text: #f8f9fa;
  --color-border: #495057;
}

[data-theme="high-contrast"] {
  --color-primary: #0000ff;
  --color-background: #ffffff;
  --color-text: #000000;
  --color-border: #000000;
}

/* Use variables in components */
.card {
  background: var(--color-background);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}
```

### Framework-Specific Examples

#### React Context Integration

```typescript
const ThemeContext = React.createContext();

function ThemeProvider({ children }) {
  const themeService = useService('theme');
  const [theme, setTheme] = useState(themeService?.getTheme());
  
  useEffect(() => {
    if (!themeService) return;
    return themeService.subscribe(setTheme);
  }, [themeService]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme: themeService?.setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

#### Vue Composition API

```typescript
import { ref, onMounted, onUnmounted, provide } from 'vue';

export function provideTheme() {
  const themeService = inject('theme');
  const currentTheme = ref(themeService?.getTheme());
  let unsubscribe: () => void;
  
  onMounted(() => {
    if (themeService) {
      unsubscribe = themeService.subscribe((theme) => {
        currentTheme.value = theme;
      });
    }
  });
  
  onUnmounted(() => {
    unsubscribe?.();
  });
  
  provide('currentTheme', currentTheme);
  provide('setTheme', themeService?.setTheme);
  
  return { currentTheme };
}
```

## Theme Persistence

The service automatically persists the selected theme to localStorage:

```typescript
// Theme is saved to localStorage with key 'mfe-theme'
// On next visit, the saved theme is automatically applied

// You can customize the storage key:
const themeService = createThemeService('light', ['light', 'dark']);
// Uses 'mfe-theme' key by default
```

## Accessibility Considerations

1. **High Contrast Support**: Include high-contrast theme option
2. **Reduced Motion**: Respect `prefers-reduced-motion` for theme transitions
3. **Color Blind Modes**: Consider color-blind friendly themes
4. **Focus Indicators**: Ensure focus states are visible in all themes

```css
/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  * {
    transition-duration: 0.01ms !important;
  }
}

/* Ensure focus visibility in all themes */
[data-theme="dark"] *:focus {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}

[data-theme="light"] *:focus {
  outline: 2px solid #000000;
  outline-offset: 2px;
}
```

## Best Practices

1. **Consistent Naming**: Use consistent theme names across your application
2. **Default Theme**: Always provide a sensible default theme
3. **Smooth Transitions**: Add CSS transitions for theme changes
4. **Contrast Ratios**: Ensure WCAG compliance for text contrast in all themes
5. **Test All Themes**: Regularly test all UI components in every theme
6. **Document Themes**: Provide a theme showcase/documentation page
7. **Performance**: Use CSS variables for instant theme switching

## Performance Optimization

```typescript
// Debounce rapid theme changes
import { debounce } from 'lodash';

const debouncedSetTheme = debounce((theme: Theme) => {
  themeService.setTheme(theme);
}, 100);

// Preload theme stylesheets
function preloadThemes(themes: Theme[]) {
  themes.forEach(theme => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `/themes/${theme}.css`;
    document.head.appendChild(link);
  });
}
```

## Custom Theme Implementation

```typescript
// Extend the base theme service
class CustomThemeService extends ThemeServiceImpl {
  private colorSchemes = {
    light: {
      primary: '#007bff',
      secondary: '#6c757d',
      background: '#ffffff'
    },
    dark: {
      primary: '#0d6efd',
      secondary: '#6c757d',
      background: '#212529'
    }
  };
  
  setTheme(theme: Theme): void {
    super.setTheme(theme);
    this.applyColorScheme(theme);
  }
  
  private applyColorScheme(theme: Theme): void {
    const scheme = this.colorSchemes[theme];
    if (!scheme) return;
    
    Object.entries(scheme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--color-${key}`, value);
    });
  }
}
```

## Testing Themes

```typescript
describe('ThemeService', () => {
  it('should persist theme selection', () => {
    const theme = createThemeService();
    theme.setTheme('dark');
    
    // Create new instance (simulates page reload)
    const newTheme = createThemeService();
    expect(newTheme.getTheme()).toBe('dark');
  });
  
  it('should notify subscribers on theme change', () => {
    const theme = createThemeService();
    const callback = jest.fn();
    
    theme.subscribe(callback);
    theme.setTheme('dark');
    
    expect(callback).toHaveBeenCalledWith('dark');
  });
});
```

## License

MIT