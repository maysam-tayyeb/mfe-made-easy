import type { TemplateConfig, TemplateGenerator, ServiceConfig } from '../types';
import { getServiceConfig } from '../types';
import { processTemplate } from '../utils/template-processor';
import { formatJson } from '../utils/template-engine';
import { mainTsxTemplate, appTsxTemplate, buildJsTemplate, readmeTemplate } from './templates';

export class SolidJSTemplate implements TemplateGenerator {
  private config: TemplateConfig;
  private serviceConfig: ServiceConfig;

  constructor(config: TemplateConfig) {
    this.config = config;
    this.serviceConfig = getServiceConfig(config.serviceType || 'general', config.name);
  }

  generateMain(): string {
    const { serviceType } = this.config;
    
    // For modal services, use the modal-specific template (if needed)
    // For now, using the same template for all service types
    return processTemplate(mainTsxTemplate, {
      name: this.config.name,
      requiredServices: formatJson(this.serviceConfig.requiredServices),
      capabilities: formatJson(this.serviceConfig.capabilities)
    });
  }

  generateApp(): string {
    return processTemplate(appTsxTemplate, {
      name: this.config.name
    });
  }

  generatePackageJson(): object {
    const { name } = this.config;
    
    return {
      name: `@mfe/${name}`,
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
        '@mfe-toolkit/core': 'workspace:*',
        'solid-js': '^1.8.0'
      },
      devDependencies: {
        '@mfe-toolkit/build': 'workspace:*',
        '@mfe-toolkit/dev': 'workspace:*',
        'esbuild': '^0.24.2',
        'esbuild-plugin-solid': '^0.6.0',
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
      dependencies: {
        runtime: {
          'solid-js': '^1.8.0'
        },
        peer: {
          '@mfe-toolkit/core': '^0.1.0'
        }
      },
      compatibility: {
        container: '^1.0.0',
        browsers: {
          chrome: '>=90',
          firefox: '>=88',
          safari: '>=14',
          edge: '>=90'
        },
        frameworks: {
          'solid-js': '^1.8.0'
        }
      },
      capabilities: {
        emits,
        listens,
        features: [...features, 'solid-signals', 'fine-grained-reactivity', 'no-virtual-dom']
      },
      requirements: {
        services: requiredServices.map(name => ({ name, optional: name === 'logger' }))
      },
      metadata: {
        displayName: `Solid.js ${this.config.serviceType === 'modal' ? 'Modal' : this.config.serviceType === 'notification' ? 'Notification' : ''} Demo`.trim(),
        description: `${this.config.serviceType || 'General'} service demonstration MFE built with Solid.js`,
        icon: '🔷',
        author: { name: 'MFE Toolkit Team' },
        category: projectPath.includes('service-demos') ? 'service-demos' : 'custom',
        tags: [this.config.serviceType || 'demo', 'solidjs', 'service', 'reactive']
      },
      config: {
        loading: {
          timeout: 30000,
          retries: 3,
          retryDelay: 1000,
          priority: 5,
          preload: false,
          lazy: true
        },
        runtime: {
          isolation: 'none',
          keepAlive: false,
          singleton: true
        },
        communication: {
          eventNamespace
        }
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
        jsx: 'preserve',
        jsxImportSource: 'solid-js',
        moduleResolution: 'bundler',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        declaration: false,
        noEmit: true,
        resolveJsonModule: true,
        types: ['solid-js']
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    };
  }

  generateReadme(): string {
    const { name, serviceType } = this.config;
    
    return processTemplate(readmeTemplate, {
      name,
      serviceType: serviceType || 'general',
      serviceFeature: serviceType === 'modal' ? 'Modal service integration' : 
                      serviceType === 'notification' ? 'Notification service integration' : 
                      'General MFE functionality'
    });
  }
}