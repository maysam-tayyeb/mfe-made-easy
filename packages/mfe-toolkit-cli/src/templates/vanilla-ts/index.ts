import type { TemplateConfig, TemplateGenerator, ServiceConfig } from '../types';
import { getServiceConfig } from '../types';
import { processTemplate } from '../utils/template-processor';
import { formatJson } from '../utils/template-engine';
import { mainTsTemplate, buildJsTemplate, readmeTemplate } from './templates';

export class VanillaTypeScriptTemplate implements TemplateGenerator {
  private config: TemplateConfig;
  private serviceConfig: ServiceConfig;

  constructor(config: TemplateConfig) {
    this.config = config;
    this.serviceConfig = getServiceConfig(config.serviceType || 'general', config.name);
  }

  generateMain(): string {
    return processTemplate(mainTsTemplate, {
      name: this.config.name,
      requiredServices: formatJson(this.serviceConfig.requiredServices),
      capabilities: formatJson(this.serviceConfig.capabilities)
    });
  }

  generateApp(): string {
    return ''; // Vanilla TS doesn't need a separate App file
  }

  generatePackageJson(): object {
    return {
      name: `@mfe/${this.config.name}`,
      version: '1.0.0',
      private: true,
      type: 'module',
      scripts: {
        dev: 'mfe-dev',
        build: 'node build.js',
        'build:watch': 'node build.js --watch',
        clean: 'rm -rf dist'
      },
      dependencies: {
        '@mfe-toolkit/core': 'workspace:*'
      },
      devDependencies: {
        '@mfe-toolkit/build': 'workspace:*',
        '@mfe-toolkit/dev': 'workspace:*',
        'esbuild': '^0.24.2',
        'typescript': '^5.3.0'
      }
    };
  }

  generateManifest(): object {
    const { name, projectPath } = this.config;
    const { requiredServices, emits, listens, features, eventNamespace } = this.serviceConfig;
    
    const urlPath = projectPath.includes('service-demos') 
      ? `service-demos/${this.config.serviceType}/${name}` 
      : name;

    return {
      $schema: 'https://mfe-made-easy.com/schemas/mfe-manifest-v2.schema.json',
      name,
      version: '1.0.0',
      url: `http://localhost:8080/${urlPath}/${name}.js`,
      alternativeUrls: [],
      dependencies: { runtime: {}, peer: { '@mfe-toolkit/core': '^0.1.0' } },
      compatibility: {
        container: '^1.0.0',
        browsers: { chrome: '>=90', firefox: '>=88', safari: '>=14', edge: '>=90' }
      },
      capabilities: { emits, listens, features: [...features, 'vanilla-ts'] },
      requirements: { services: requiredServices.map(name => ({ name, optional: name === 'logger' })) },
      metadata: {
        displayName: `Vanilla TS ${this.config.serviceType || ''} Demo`.trim(),
        description: `${this.config.serviceType || 'General'} service demo with Vanilla TypeScript`,
        icon: '📦',
        author: { name: 'MFE Toolkit Team' },
        category: projectPath.includes('service-demos') ? 'service-demos' : 'custom',
        tags: [this.config.serviceType || 'demo', 'vanilla-ts', 'service']
      },
      config: {
        loading: { timeout: 30000, retries: 3, retryDelay: 1000, priority: 5, preload: false, lazy: true },
        runtime: { isolation: 'none', keepAlive: false, singleton: true },
        communication: { eventNamespace }
      }
    };
  }

  generateBuildScript(): string {
    return processTemplate(buildJsTemplate, {
      name: this.config.name
    });
  }

  generateTsConfig(): object {
    return {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        moduleResolution: 'bundler',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        declaration: false,
        noEmit: true,
        resolveJsonModule: true
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    };
  }

  generateReadme(): string {
    return processTemplate(readmeTemplate, {
      name: this.config.name
    });
  }
}