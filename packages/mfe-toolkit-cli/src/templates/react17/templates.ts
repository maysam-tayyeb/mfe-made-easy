// Template files as constants for better readability and maintainability
// These are imported at build time and bundled into the CLI

export const mainTsxTemplate = `import React from 'react';
import ReactDOM from 'react-dom';
import type { MFEModule, ServiceContainer } from '@mfe-toolkit/core';
import { App } from './App';

const module: MFEModule = {
  metadata: {
    name: '{{name}}',
    version: '1.0.0',
    requiredServices: {{requiredServices}},
    capabilities: {{capabilities}}
  },

  mount: async (element: HTMLElement, container: ServiceContainer) => {
    ReactDOM.render(
      <React.StrictMode>
        <App serviceContainer={container} />
      </React.StrictMode>,
      element
    );
    
    const logger = container.get('logger');
    if (logger) {
      logger.info('[{{name}}] Mounted successfully with React 17');
    }
  },
  
  unmount: async (container: ServiceContainer) => {
    const element = document.querySelector('[data-mfe="{{name}}"]');
    if (element) {
      ReactDOM.unmountComponentAtNode(element as Element);
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
  serviceContainer: ServiceContainer;
}

export const App: React.FC<AppProps> = ({ serviceContainer }) => {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(prev => prev + 1);
    const logger = serviceContainer.get('logger');
    if (logger) {
      logger.info(\`Button clicked! Count: \${count + 1}\`);
    }
  };

  return (
    <div className="ds-card ds-p-6 ds-m-4">
      <div className="ds-text-center">
        <h1 className="ds-text-3xl ds-font-bold ds-mb-2 ds-text-accent-primary">
          ⚛️ Hello from {{name}}!
        </h1>
        <p className="ds-text-gray-600 ds-mb-6">
          React 17 MFE • Classic Hooks
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
React 17 {{serviceType}} microfrontend with classic hooks and stable features.

## Features
- React 17 with Hooks
- Stable and battle-tested
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

## React 17 Specifics
This MFE uses React 17's stable features:
- Classic hooks (useState, useEffect, etc.)
- Context API
- Error boundaries
- Portals

## Integration
Designed to be loaded by the MFE container application with shared dependencies via import maps.`;