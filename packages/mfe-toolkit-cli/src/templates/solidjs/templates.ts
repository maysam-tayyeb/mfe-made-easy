// Template files as constants for better readability and maintainability
// These are imported at build time and bundled into the CLI

export const mainTsxTemplate = `import { render } from 'solid-js/web';
import type { MFEModule, ServiceContainer } from '@mfe-toolkit/core';
import { App } from './App';

let dispose: (() => void) | null = null;

const module: MFEModule = {
  metadata: {
    name: '{{name}}',
    version: '1.0.0',
    requiredServices: {{requiredServices}},
    capabilities: {{capabilities}}
  },

  mount: async (element: HTMLElement, container: ServiceContainer) => {
    dispose = render(() => App({ services: container }), element);
    
    const logger = container.get('logger');
    if (logger) {
      logger.info('[{{name}}] Mounted successfully with Solid.js');
    }
  },
  
  unmount: async (container: ServiceContainer) => {
    if (dispose) {
      dispose();
      dispose = null;
    }
    
    const logger = container.get('logger');
    if (logger) {
      logger.info('[{{name}}] Unmounted successfully');
    }
  }
};

export default module;`;

export const appTsxTemplate = `import { createSignal } from 'solid-js';
import type { ServiceContainer } from '@mfe-toolkit/core';

interface AppProps {
  services: ServiceContainer;
}

export const App = (props: AppProps) => {
  const [count, setCount] = createSignal(0);

  const handleClick = () => {
    setCount(count() + 1);
    props.services.get('logger')?.info(\`Button clicked! Count: \${count()}\`);
  };

  return (
    <div class="ds-card ds-p-6 ds-m-4">
      <div class="ds-text-center">
        <h1 class="ds-text-3xl ds-font-bold ds-mb-2 ds-text-accent-primary">
          🔷 Hello from {{name}}!
        </h1>
        <p class="ds-text-gray-600 ds-mb-6">
          Solid.js MFE • Fine-Grained Reactivity
        </p>
        
        <div class="ds-card-compact ds-inline-block ds-p-4">
          <div class="ds-text-4xl ds-font-bold ds-text-accent-primary ds-mb-2">
            {count()}
          </div>
          <button 
            onClick={handleClick}
            class="ds-btn-primary"
          >
            Click me!
          </button>
        </div>
        
        <p class="ds-text-sm ds-text-gray-500 ds-mt-6">
          Built with ❤️ using MFE Toolkit
        </p>
      </div>
    </div>
  );
};`;

export const buildJsTemplate = `import { buildMFE } from '@mfe-toolkit/build';
import { solidPlugin } from 'esbuild-plugin-solid';

await buildMFE({
  entry: 'src/main.tsx',
  outfile: 'dist/{{name}}.js',
  manifestPath: './manifest.json',
  esbuildOptions: {
    plugins: [solidPlugin()]
  }
});`;

export const readmeTemplate = `# {{name}}

## Description
Solid.js {{serviceType}} microfrontend with fine-grained reactivity and exceptional performance.

## Features
- Solid.js with signals and reactive primitives
- No Virtual DOM - direct DOM updates
- Fine-grained reactivity system
- Compiled reactive primitives
- Small bundle size (~7kb)
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

## Solid.js Specifics
This MFE leverages Solid.js's unique features:
- \`createSignal()\` for reactive state
- \`createMemo()\` for computed values
- \`createEffect()\` for side effects
- JSX compiled to efficient DOM operations
- No re-renders, only precise updates

## Integration
Designed to be loaded by the MFE container application with shared dependencies via import maps.`;