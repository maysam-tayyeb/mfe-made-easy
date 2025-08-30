import { Command } from 'commander';
import prompts from 'prompts';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'child_process';
import { createTemplateGenerator, normalizeFramework } from '../templates/factory';
import { detectServiceType } from '../templates/types';
import type { TemplateConfig, ReactVersion, Framework } from '../templates/types';

function runCommand(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
      } else {
        resolve();
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Helper function to find registry path
function findRegistryPath(startPath: string = process.cwd()): string | null {
  let currentPath = path.resolve(startPath);
  
  while (currentPath !== path.dirname(currentPath)) {
    // Check common generic locations for registry files
    const possiblePaths = [
      path.join(currentPath, 'mfe-registry.json'),
      path.join(currentPath, 'public', 'mfe-registry.json'),
      path.join(currentPath, 'src', 'mfe-registry.json'),
      path.join(currentPath, 'config', 'mfe-registry.json'),
    ];
    
    // Also check in any 'apps' subdirectories
    const appsDir = path.join(currentPath, 'apps');
    if (fs.existsSync(appsDir) && fs.statSync(appsDir).isDirectory()) {
      const appDirs = fs.readdirSync(appsDir).filter(dir => 
        fs.statSync(path.join(appsDir, dir)).isDirectory()
      );
      
      for (const appDir of appDirs) {
        possiblePaths.push(
          path.join(appsDir, appDir, 'public', 'mfe-registry.json'),
          path.join(appsDir, appDir, 'mfe-registry.json')
        );
      }
    }
    
    for (const registryPath of possiblePaths) {
      if (fs.existsSync(registryPath)) {
        return registryPath;
      }
    }
    
    currentPath = path.dirname(currentPath);
  }
  
  return null;
}

// Helper function to add MFE to registry
async function addToRegistry(mfePath: string, registryPath: string): Promise<boolean> {
  try {
    // Read the manifest
    const manifestPath = path.join(mfePath, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      console.log(chalk.yellow('⚠️  No manifest.json found, skipping registry update'));
      return false;
    }
    
    const manifest = await fs.readJson(manifestPath);
    
    // Read the registry
    const registryData = await fs.readJson(registryPath);
    const registry = Array.isArray(registryData) ? registryData : registryData.mfes;
    
    if (!Array.isArray(registry)) {
      console.log(chalk.yellow('⚠️  Invalid registry format, skipping update'));
      return false;
    }
    
    // Check if MFE already exists
    const existingIndex = registry.findIndex((mfe: any) => mfe.name === manifest.name);
    if (existingIndex !== -1) {
      console.log(chalk.yellow(`⚠️  MFE "${manifest.name}" already exists in registry, skipping`));
      return false;
    }
    
    // Add the new MFE
    registry.push(manifest);
    
    // Update the registry file
    if (Array.isArray(registryData)) {
      await fs.writeJson(registryPath, registry, { spaces: 2 });
    } else {
      registryData.mfes = registry;
      registryData.lastUpdated = new Date().toISOString();
      await fs.writeJson(registryPath, registryData, { spaces: 2 });
    }
    
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Failed to update registry:'), error);
    return false;
  }
}

export const createCommand = new Command('create')
  .description('Create a new microfrontend')
  .argument('[name]', 'Name of the microfrontend')
  .option('-t, --template <template>', 'Template to use (react, react17, react18, react19, vue, solidjs, vanilla-ts)')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .option('--no-registry', 'Skip automatic registry update')
  .action(async (name, options) => {
    try {
      // Prompt for missing information
      const answers = await prompts(
        [
          {
            type: name ? null : 'text',
            name: 'name',
            message: 'What is the name of your microfrontend?',
            initial: name || 'my-mfe',
            validate: (value) =>
              /^[a-z0-9-]+$/.test(value) || 'Name must be lowercase with hyphens only',
          },
          {
            type: options.template ? null : 'select',
            name: 'template',
            message: 'Which framework would you like to use?',
            choices: [
              { title: 'React', value: 'react' },
              { title: 'Vue 3', value: 'vue' },
              { title: 'Solid.js', value: 'solidjs' },
              { title: 'Vanilla TypeScript', value: 'vanilla-ts' },
              { title: 'Vanilla JavaScript', value: 'vanilla-js' },
            ],
            initial: 0,
          },
          {
            type: (prev) => (prev === 'react' ? 'select' : null),
            name: 'reactVersion',
            message: 'Which React version would you like to use?',
            choices: [
              { title: 'React 19 (Latest)', value: '19' },
              { title: 'React 18 (Stable)', value: '18' },
              { title: 'React 17', value: '17' },
            ],
            initial: 1,
          },
        ],
        {
          onCancel: () => {
            console.log(chalk.red('✖ Operation cancelled'));
            process.exit(1);
          },
        }
      );

      // Merge options with answers
      const config = {
        name: name || answers.name,
        template: options.template || answers.template,
        reactVersion: answers.reactVersion,
      };

      // Skip if user cancelled
      if (!config.name || !config.template) {
        return;
      }

      console.log(chalk.cyan('\n📦 Creating microfrontend...\n'));
      
      // Determine framework and React version
      let framework: Framework = normalizeFramework(config.template) as Framework;
      let reactVersion: ReactVersion = '18';
      
      if (framework === 'react') {
        if (config.template.includes('17')) {
          reactVersion = '17';
        } else if (config.template.includes('19')) {
          reactVersion = '19';
        } else if (config.reactVersion) {
          reactVersion = config.reactVersion as ReactVersion;
        }
      }
      
      // Create project directory
      const projectPath = process.cwd();
      const mfePath = path.join(projectPath, config.name);
      
      // Check if directory exists
      if (fs.existsSync(mfePath)) {
        console.log(chalk.red(`✖ Directory ${config.name} already exists`));
        process.exit(1);
      }
      
      // Detect service type from path and name
      const serviceType = detectServiceType(projectPath, config.name);
      
      // Create template config
      const templateConfig: TemplateConfig = {
        name: config.name,
        framework,
        projectPath: mfePath,
        reactVersion: framework === 'react' ? reactVersion : undefined,
        serviceType
      };
      
      // Generate templates
      const generator = createTemplateGenerator(templateConfig);
      
      // Create project structure
      fs.ensureDirSync(mfePath);
      fs.ensureDirSync(path.join(mfePath, 'src'));
      
      // Write main file
      const mainExt = framework === 'vue' ? 'ts' : 
                     (framework === 'vanilla-ts' || framework === 'vanilla-js') ? 'ts' : 
                     framework === 'solid' ? 'tsx' :  // Solid.js uses .tsx with JSX
                     'tsx';  // React always uses .tsx
      
      fs.writeFileSync(
        path.join(mfePath, 'src', `main.${mainExt}`),
        generator.generateMain()
      );
      
      // Write app file if needed
      if (framework !== 'vanilla-ts' && framework !== 'vanilla-js') {
        const appExt = framework === 'vue' ? 'ts' :  // Vue3 now uses pure TypeScript files
                      framework === 'solid' ? 'tsx' :  // Solid.js uses .tsx for JSX
                      'tsx';  // React always uses .tsx
        const appContent = generator.generateApp();
        if (appContent) {
          fs.writeFileSync(
            path.join(mfePath, 'src', `App.${appExt}`),
            appContent
          );
        }
      }
      
      // Write configuration files
      fs.writeFileSync(
        path.join(mfePath, 'package.json'),
        JSON.stringify(generator.generatePackageJson(), null, 2)
      );
      
      fs.writeFileSync(
        path.join(mfePath, 'manifest.json'),
        JSON.stringify(generator.generateManifest(), null, 2)
      );
      
      fs.writeFileSync(
        path.join(mfePath, 'build.js'),
        generator.generateBuildScript()
      );
      
      fs.writeFileSync(
        path.join(mfePath, 'tsconfig.json'),
        JSON.stringify(generator.generateTsConfig(), null, 2)
      );
      
      fs.writeFileSync(
        path.join(mfePath, 'README.md'),
        generator.generateReadme()
      );
      
      // Write mfe.config.mjs if the generator has the method
      if ('generateMfeConfig' in generator && typeof generator.generateMfeConfig === 'function') {
        fs.writeFileSync(
          path.join(mfePath, 'mfe.config.mjs'),
          generator.generateMfeConfig()
        );
      }
      
      fs.writeFileSync(
        path.join(mfePath, '.gitignore'),
        'node_modules\ndist\n*.log\n.DS_Store'
      );
      
      // Install dependencies
      console.log(chalk.cyan('📦 Installing dependencies...'));
      try {
        await runCommand('pnpm', ['install'], projectPath);
        console.log(chalk.green('✅ Dependencies installed successfully!'));
      } catch (error) {
        console.error(chalk.red('❌ Failed to install dependencies:'), error);
        console.log(chalk.yellow('Please run "pnpm install" manually'));
      }
      
      // Build the MFE
      console.log(chalk.cyan('\n🔨 Building MFE...'));
      try {
        await runCommand('pnpm', ['build'], mfePath);
        console.log(chalk.green('✅ MFE built successfully!'));
      } catch (error) {
        console.error(chalk.red('❌ Failed to build MFE:'), error);
        console.log(chalk.yellow('Please run "pnpm build" in the MFE directory'));
      }
      
      // Try to add to registry if not disabled
      if (options.registry !== false) {
        const registryPath = findRegistryPath(projectPath);
        if (registryPath) {
          console.log(chalk.cyan('\n📝 Updating MFE registry...'));
          const added = await addToRegistry(mfePath, registryPath);
          if (added) {
            console.log(chalk.green(`✅ Added "${config.name}" to registry at ${path.relative(projectPath, registryPath)}`));
          }
        } else {
          console.log(chalk.gray('\nℹ️  No MFE registry found. You can add this MFE manually with:'));
          console.log(chalk.cyan(`   mfe-toolkit registry add ${config.name}`));
        }
      }
      
      console.log(
        chalk.green(`
✅ Microfrontend created successfully!

📁 Location: ${chalk.cyan(mfePath)}

🚀 Next steps:
   ${chalk.cyan(`cd ${config.name}`)}
   ${chalk.cyan('pnpm dev')}  ${chalk.gray('# Start standalone dev server with dev tools')}
   
   ${chalk.gray('Press Ctrl+Shift+D to toggle dev tools')}
`)
      );
      
      // Log manifest warning if needed
      if (!fs.existsSync(path.join(projectPath, 'manifest.json'))) {
        console.log('Could not read manifest at ./manifest.json, proceeding without auto-detection');
      }
      
    } catch (error) {
      console.error(chalk.red('✖ Error creating microfrontend:'), error);
      process.exit(1);
    }
  });