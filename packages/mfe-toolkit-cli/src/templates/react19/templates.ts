// Template files as constants for better readability and maintainability
// These are imported at build time and bundled into the CLI

export const mainTsxTemplate = `import React from 'react';
import ReactDOM from 'react-dom/client';
import type { MFEModule, ServiceContainer } from '@mfe-toolkit/core';
import { App } from './App';

let root: ReactDOM.Root | null = null;

const module: MFEModule = {
  metadata: {
    name: '{{name}}',
    version: '1.0.0',
    requiredServices: {{requiredServices}},
    capabilities: {{capabilities}}
  },

  mount: async (element: HTMLElement, container: ServiceContainer) => {
    root = ReactDOM.createRoot(element);
    root.render(
      <React.StrictMode>
        <App services={container} />
      </React.StrictMode>
    );
    
    const logger = container.get('logger');
    if (logger) {
      logger.info('[{{name}}] Mounted successfully with React 19');
    }
  },
  
  unmount: async (container: ServiceContainer) => {
    if (root) {
      root.unmount();
      root = null;
    }
    
    const logger = container.get('logger');
    if (logger) {
      logger.info('[{{name}}] Unmounted successfully');
    }
  }
};

export default module;`;

export const appTsxTemplate = `import React, { useState } from 'react';
import type { ServiceContainer } from '@mfe-toolkit/core';

interface AppProps {
  services: ServiceContainer;
}

export const App: React.FC<AppProps> = ({ services }) => {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(prev => prev + 1);
    services.get('logger')?.info(\`Button clicked! Count: \${count + 1}\`);
  };

  return (
    <div className="ds-card ds-p-6 ds-m-4">
      <div className="ds-text-center">
        <h1 className="ds-text-3xl ds-font-bold ds-mb-2 ds-text-accent-primary">
          🔥 Hello from {{name}}!
        </h1>
        <p className="ds-text-gray-600 ds-mb-6">
          React 19 MFE • Latest Features
        </p>
        
        <div className="ds-card-compact ds-inline-block ds-p-4">
          <div className="ds-text-4xl ds-font-bold ds-text-accent-primary ds-mb-2">
            {count}
          </div>
          <button 
            onClick={handleClick}
            className="ds-btn-primary"
          >
            Click me!
          </button>
        </div>
        
        <p className="ds-text-sm ds-text-gray-500 ds-mt-6">
          Built with ❤️ using MFE Toolkit
        </p>
      </div>
    </div>
  );
};`;

export const buildJsTemplate = `import { buildMFE } from '@mfe-toolkit/build';

await buildMFE({
  entry: 'src/main.tsx',
  outfile: 'dist/{{name}}.js',
  manifestPath: './manifest.json'
});`;

export const readmeTemplate = `# {{name}}

## Description
React 19 {{serviceType}} microfrontend with latest features and optimistic UI support.

## Features
- React 19 with latest APIs
- Server Components ready
- useOptimistic for optimistic UI updates
- use() hook for promise handling
- Enhanced Suspense and Actions
- {{serviceFeature}}
- Design system integration
- TypeScript support

## Development

\`\`\`bash
# Install dependencies
pnpm install

# Build for production
pnpm build

# Build in watch mode
pnpm build:watch

# Clean build artifacts
pnpm clean
\`\`\`

## React 19 Specifics
This MFE leverages React 19's cutting-edge features:
- \`useOptimistic()\` for instant UI feedback
- \`use()\` hook for promise and context handling
- Server Components compatibility
- Enhanced form actions
- Improved hydration performance

## Integration
Designed to be loaded by the MFE container application with shared dependencies via import maps.`;