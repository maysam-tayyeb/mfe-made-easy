// Template files as constants for better readability and maintainability
// These are imported at build time and bundled into the CLI

export const mainTsTemplate = `import { createApp, h } from 'vue';
import type { MFEModule, ServiceContainer } from '@mfe-toolkit/core';
import { App } from './App';

let app: any = null;

const module: MFEModule = {
  metadata: {
    name: '{{name}}',
    version: '1.0.0',
    requiredServices: {{requiredServices}},
    capabilities: {{capabilities}}
  },

  mount: async (element: HTMLElement, container: ServiceContainer) => {
    app = createApp({
      render() {
        return h(App, { services: container });
      }
    });
    app.mount(element);
    
    const logger = container.get('logger');
    if (logger) {
      logger.info('[{{name}}] Mounted successfully with Vue 3');
    }
  },
  
  unmount: async (container: ServiceContainer) => {
    if (app) {
      app.unmount();
      app = null;
    }
    
    const logger = container.get('logger');
    if (logger) {
      logger.info('[{{name}}] Unmounted successfully');
    }
  }
};

export default module;`;

export const appTsTemplate = `import { defineComponent, ref, h } from 'vue';
import type { ServiceContainer } from '@mfe-toolkit/core';

export const App = defineComponent({
  props: {
    services: {
      type: Object as () => ServiceContainer,
      required: true
    }
  },
  setup(props) {
    const count = ref(0);

    const handleClick = () => {
      count.value++;
      props.services.get('logger')?.info(\`Button clicked! Count: \${count.value}\`);
    };

    return () => h('div', { class: 'ds-card ds-p-6 ds-m-4' }, [
      h('div', { class: 'ds-text-center' }, [
        h('h1', { class: 'ds-text-3xl ds-font-bold ds-mb-2 ds-text-accent-primary' }, 
          '🎉 Hello from {{name}}!'
        ),
        h('p', { class: 'ds-text-gray-600 ds-mb-6' }, 
          'Vue 3 MFE • Composition API'
        ),
        h('div', { class: 'ds-card-compact ds-inline-block ds-p-4' }, [
          h('div', { class: 'ds-text-4xl ds-font-bold ds-text-accent-primary ds-mb-2' }, 
            count.value
          ),
          h('button', {
            class: 'ds-btn-primary',
            onClick: handleClick
          }, 'Click me!')
        ]),
        h('p', { class: 'ds-text-sm ds-text-gray-500 ds-mt-6' }, 
          'Built with ❤️ using MFE Toolkit'
        )
      ])
    ]);
  }
});`;

export const buildJsTemplate = `import { buildMFE } from '@mfe-toolkit/build';
import vuePlugin from 'esbuild-plugin-vue3';

await buildMFE({
  entry: 'src/main.ts',
  outfile: 'dist/{{name}}.js',
  manifestPath: './manifest.json',
  esbuildOptions: {
    plugins: [vuePlugin()]
  }
});`;

export const readmeTemplate = `# {{name}}

A simple Vue 3 microfrontend with a beautiful hello world interface.

## Development

\`\`\`bash
# Install dependencies
pnpm install

# Build for production
pnpm build

# Build in watch mode
pnpm build:watch
\`\`\``;