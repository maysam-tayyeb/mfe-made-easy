import type { TemplateConfig, TemplateGenerator, ReactVersion } from './types';
import { React17Template } from './react17';
import { React18Template } from './react18';
import { React19Template } from './react19';
import { Vue3Template } from './vue3';
import { SolidJSTemplate } from './solidjs';
import { VanillaTypeScriptTemplate } from './vanilla-ts';

export function createTemplateGenerator(config: TemplateConfig): TemplateGenerator {
  const { framework } = config;
  
  switch (framework) {
    case 'react': {
      const reactVersion = config.reactVersion || '18';
      switch (reactVersion) {
        case '17':
          return new React17Template(config);
        case '18':
          return new React18Template(config);
        case '19':
          return new React19Template(config);
        default:
          return new React18Template(config);
      }
    }
    
    case 'vue':
      return new Vue3Template(config);
    
    case 'solid':
      return new SolidJSTemplate(config);
    
    case 'vanilla-ts':
    case 'vanilla-js':
      return new VanillaTypeScriptTemplate(config);
    
    default:
      throw new Error(`Unsupported framework: ${framework}`);
  }
}

export function detectReactVersion(template: string): ReactVersion {
  if (template === 'react17' || template === 'react-17') return '17';
  if (template === 'react19' || template === 'react-19') return '19';
  if (template === 'react18' || template === 'react-18') return '18';
  if (template === 'react' || template.startsWith('react')) return '18'; // Default to React 18
  return '18';
}

export function normalizeFramework(template: string): string {
  if (template.startsWith('react')) return 'react';
  if (template === 'vue' || template === 'vue3') return 'vue';
  if (template === 'solidjs' || template === 'solid') return 'solid';
  if (template === 'vanilla-ts') return 'vanilla-ts';
  if (template === 'vanilla-js') return 'vanilla-js';
  return template;
}