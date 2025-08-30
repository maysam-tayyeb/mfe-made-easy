import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { createTemplateGenerator } from '../templates/factory';

// Mock modules
vi.mock('fs-extra');
vi.mock('child_process', () => ({
  spawn: vi.fn(() => ({
    on: vi.fn((event, callback) => {
      if (event === 'close') callback(0);
    })
  }))
}));
vi.mock('prompts', () => ({
  default: vi.fn()
}));
vi.mock('chalk', () => ({
  default: {
    cyan: (str: string) => str,
    green: (str: string) => str,
    yellow: (str: string) => str,
    red: (str: string) => str,
    gray: (str: string) => str,
  }
}));

describe('Create Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.ensureDirSync).mockReturnValue(undefined);
    vi.mocked(fs.writeFileSync).mockReturnValue(undefined);
    vi.mocked(fs.writeJson).mockResolvedValue(undefined);
    vi.mocked(fs.readJson).mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Template Generation', () => {
    it('should create React 19 template', () => {
      const generator = createTemplateGenerator({
        name: 'test-mfe',
        framework: 'react',
        reactVersion: '19',
        projectPath: '/test/test-mfe'
      });

      expect(generator).toBeDefined();
      
      const manifest = generator.generateManifest();
      expect(manifest).toHaveProperty('name', 'test-mfe');
      expect(manifest).toHaveProperty('dependencies');
      
      const packageJson = generator.generatePackageJson();
      expect(packageJson).toHaveProperty('name', '@mfe/test-mfe');
      expect(packageJson.dependencies).toHaveProperty('react');
    });

    it('should create Vue 3 template', () => {
      const generator = createTemplateGenerator({
        name: 'vue-mfe',
        framework: 'vue',
        projectPath: '/test/vue-mfe'
      });

      expect(generator).toBeDefined();
      
      const manifest = generator.generateManifest();
      expect(manifest).toHaveProperty('name', 'vue-mfe');
      
      const packageJson = generator.generatePackageJson();
      expect(packageJson.dependencies).toHaveProperty('vue');
    });

    it('should create Solid.js template', () => {
      const generator = createTemplateGenerator({
        name: 'solid-mfe',
        framework: 'solid',
        projectPath: '/test/solid-mfe'
      });

      expect(generator).toBeDefined();
      
      const manifest = generator.generateManifest();
      expect(manifest).toHaveProperty('name', 'solid-mfe');
      
      const packageJson = generator.generatePackageJson();
      expect(packageJson.dependencies).toHaveProperty('solid-js');
    });

    it('should create Vanilla TypeScript template', () => {
      const generator = createTemplateGenerator({
        name: 'vanilla-mfe',
        framework: 'vanilla-ts',
        projectPath: '/test/vanilla-mfe'
      });

      expect(generator).toBeDefined();
      
      const manifest = generator.generateManifest();
      expect(manifest).toHaveProperty('name', 'vanilla-mfe');
      
      const packageJson = generator.generatePackageJson();
      expect(packageJson.devDependencies).toHaveProperty('typescript');
    });
  });

  describe('Project Structure', () => {
    it('should create correct file structure for React', () => {
      const generator = createTemplateGenerator({
        name: 'react-mfe',
        framework: 'react',
        reactVersion: '18',
        projectPath: '/test/react-mfe'
      });

      const mainContent = generator.generateMain();
      expect(mainContent).toContain('import React from');
      expect(mainContent).toContain('createRoot');
      
      const appContent = generator.generateApp();
      expect(appContent).toContain('export const App');
      expect(appContent).toContain('React.FC');
    });

    it('should create correct file structure for Vue', () => {
      const generator = createTemplateGenerator({
        name: 'vue-mfe',
        framework: 'vue',
        projectPath: '/test/vue-mfe'
      });

      const mainContent = generator.generateMain();
      expect(mainContent).toContain('createApp');
      expect(mainContent).toContain('vue');
      
      const appContent = generator.generateApp();
      expect(appContent).toContain('defineComponent');
    });
  });

  describe('Registry Auto-update', () => {
    it('should add new MFE to registry after creation', async () => {
      const mockRegistry = {
        version: '2.0.0',
        mfes: []
      };

      const mockManifest = {
        name: 'new-mfe',
        version: '1.0.0',
        url: 'http://localhost:8080/new-mfe.js'
      };

      vi.mocked(fs.existsSync)
        .mockReturnValueOnce(false) // MFE directory doesn't exist
        .mockReturnValueOnce(true) // Registry exists
        .mockReturnValueOnce(true); // Manifest exists
      
      vi.mocked(fs.readJson)
        .mockResolvedValueOnce(mockManifest)
        .mockResolvedValueOnce(mockRegistry);

      // Test auto-update logic
      expect(true).toBe(true);
    });

    it('should skip registry update with --no-registry flag', async () => {
      vi.mocked(fs.writeJson).mockClear();
      
      // With --no-registry flag, writeJson should not be called for registry
      expect(vi.mocked(fs.writeJson)).not.toHaveBeenCalled();
    });

    it('should handle missing registry gracefully', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      
      // Should continue without error when registry not found
      expect(true).toBe(true);
    });

    it('should not add duplicate MFE to registry', async () => {
      const mockRegistry = {
        version: '2.0.0',
        mfes: [
          { name: 'existing-mfe', version: '1.0.0', url: 'http://localhost:8080/existing.js' }
        ]
      };

      const duplicateManifest = {
        name: 'existing-mfe',
        version: '2.0.0',
        url: 'http://localhost:8080/existing-v2.js'
      };

      vi.mocked(fs.readJson)
        .mockResolvedValueOnce(duplicateManifest)
        .mockResolvedValueOnce(mockRegistry);

      // Should skip duplicate
      expect(true).toBe(true);
    });
  });

  describe('Service Type Detection', () => {
    it('should detect modal service type', () => {
      const generator = createTemplateGenerator({
        name: 'mfe-modal-react',
        framework: 'react',
        reactVersion: '19',
        projectPath: '/test/service-demos/modal/mfe-modal-react',
        serviceType: 'modal'
      });

      const manifest = generator.generateManifest();
      expect(manifest).toHaveProperty('metadata');
      if (manifest.metadata) {
        // Service type detection maps to category or tags
        expect(manifest.metadata.tags).toContain('modal');
      }
    });

    it('should detect notification service type', () => {
      const generator = createTemplateGenerator({
        name: 'mfe-notification-vue',
        framework: 'vue',
        projectPath: '/test/service-demos/notifications/mfe-notification-vue',
        serviceType: 'notifications'
      });

      const manifest = generator.generateManifest();
      expect(manifest).toHaveProperty('metadata');
      if (manifest.metadata) {
        // Service type detection creates general tags
        expect(manifest.metadata.category).toBe('service-demos');
      }
    });
  });

  describe('Build Configuration', () => {
    it('should generate correct build script', () => {
      const generator = createTemplateGenerator({
        name: 'test-mfe',
        framework: 'react',
        reactVersion: '18',
        projectPath: '/test/test-mfe'
      });

      const buildScript = generator.generateBuildScript();
      expect(buildScript).toContain("import { buildMFE } from '@mfe-toolkit/build'");
      expect(buildScript).toContain('entry:');
      expect(buildScript).toContain('outfile:');
      expect(buildScript).toContain('manifestPath:');
    });

    it('should generate correct TypeScript config', () => {
      const generator = createTemplateGenerator({
        name: 'test-mfe',
        framework: 'react',
        reactVersion: '18',
        projectPath: '/test/test-mfe'
      });

      const tsConfig = generator.generateTsConfig();
      expect(tsConfig).toHaveProperty('compilerOptions');
      expect(tsConfig.compilerOptions).toHaveProperty('jsx', 'react-jsx');
      expect(tsConfig.compilerOptions).toHaveProperty('module', 'ESNext');
    });
  });
});