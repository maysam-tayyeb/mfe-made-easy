import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import prompts from 'prompts';

type MFEManifest = {
  name: string;
  version: string;
  url: string;
  alternativeUrls?: string[];
  dependencies?: Record<string, any>;
  compatibility?: Record<string, any>;
  capabilities?: Record<string, any>;
  requirements?: Record<string, any>;
  metadata?: Record<string, any>;
  config?: Record<string, any>;
};

type MFERegistry = {
  $schema?: string;
  version: string;
  environment?: string;
  lastUpdated?: string;
  mfes: MFEManifest[];
};

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

function readRegistry(registryPath: string): MFERegistry {
  try {
    const content = fs.readFileSync(registryPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(chalk.red(`Error reading registry: ${error}`));
    process.exit(1);
  }
}

function writeRegistry(registryPath: string, registry: MFERegistry): void {
  try {
    // Update lastUpdated timestamp
    registry.lastUpdated = new Date().toISOString();
    
    // Write with pretty formatting
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');
  } catch (error) {
    console.error(chalk.red(`Error writing registry: ${error}`));
    process.exit(1);
  }
}

function readManifest(mfePath: string): MFEManifest | null {
  const manifestPath = path.join(mfePath, 'manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    console.error(chalk.red(`No manifest.json found in ${mfePath}`));
    return null;
  }
  
  try {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(chalk.red(`Error reading manifest: ${error}`));
    return null;
  }
}

// Add subcommand
const addCommand = new Command('add')
  .description('Add an MFE to the registry')
  .argument('<mfe-path>', 'Path to the MFE directory')
  .option('-r, --registry <path>', 'Path to registry file')
  .option('-f, --force', 'Overwrite existing entry without confirmation')
  .action(async (mfePath: string, options) => {
    // Find registry
    const registryPath = options.registry || findRegistryPath();
    if (!registryPath) {
      console.error(chalk.red('Could not find mfe-registry.json. Use --registry to specify path.'));
      process.exit(1);
    }
    
    console.log(chalk.cyan(`Using registry: ${registryPath}`));
    
    // Read manifest
    const manifest = readManifest(path.resolve(mfePath));
    if (!manifest) {
      process.exit(1);
    }
    
    // Read registry
    const registry = readRegistry(registryPath);
    
    // Check if MFE already exists
    const existingIndex = registry.mfes.findIndex(mfe => mfe.name === manifest.name);
    
    if (existingIndex !== -1 && !options.force) {
      const { overwrite } = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: `MFE "${manifest.name}" already exists in registry. Overwrite?`,
        initial: false,
      });
      
      if (!overwrite) {
        console.log(chalk.yellow('Operation cancelled'));
        return;
      }
    }
    
    // Add or update MFE
    if (existingIndex !== -1) {
      registry.mfes[existingIndex] = manifest;
      console.log(chalk.green(`✅ Updated "${manifest.name}" in registry`));
    } else {
      registry.mfes.push(manifest);
      console.log(chalk.green(`✅ Added "${manifest.name}" to registry`));
    }
    
    // Write registry
    writeRegistry(registryPath, registry);
  });

// Remove subcommand
const removeCommand = new Command('remove')
  .description('Remove an MFE from the registry')
  .argument('<mfe-name>', 'Name of the MFE to remove')
  .option('-r, --registry <path>', 'Path to registry file')
  .option('-f, --force', 'Skip confirmation')
  .action(async (mfeName: string, options) => {
    // Find registry
    const registryPath = options.registry || findRegistryPath();
    if (!registryPath) {
      console.error(chalk.red('Could not find mfe-registry.json. Use --registry to specify path.'));
      process.exit(1);
    }
    
    // Read registry
    const registry = readRegistry(registryPath);
    
    // Find MFE
    const mfeIndex = registry.mfes.findIndex(mfe => mfe.name === mfeName);
    
    if (mfeIndex === -1) {
      console.error(chalk.red(`MFE "${mfeName}" not found in registry`));
      process.exit(1);
    }
    
    // Confirm deletion
    if (!options.force) {
      const { confirm } = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: `Remove "${mfeName}" from registry?`,
        initial: false,
      });
      
      if (!confirm) {
        console.log(chalk.yellow('Operation cancelled'));
        return;
      }
    }
    
    // Remove MFE
    registry.mfes.splice(mfeIndex, 1);
    console.log(chalk.green(`✅ Removed "${mfeName}" from registry`));
    
    // Write registry
    writeRegistry(registryPath, registry);
  });

// Update subcommand
const updateCommand = new Command('update')
  .description('Update an MFE entry in the registry')
  .argument('<mfe-name>', 'Name of the MFE to update')
  .option('-p, --path <path>', 'Path to MFE directory (defaults to ./<mfe-name>)')
  .option('-r, --registry <path>', 'Path to registry file')
  .action(async (mfeName: string, options) => {
    // Find registry
    const registryPath = options.registry || findRegistryPath();
    if (!registryPath) {
      console.error(chalk.red('Could not find mfe-registry.json. Use --registry to specify path.'));
      process.exit(1);
    }
    
    // Determine MFE path
    const mfePath = options.path || path.join(process.cwd(), mfeName);
    
    // Read manifest
    const manifest = readManifest(path.resolve(mfePath));
    if (!manifest) {
      process.exit(1);
    }
    
    // Validate name matches
    if (manifest.name !== mfeName) {
      console.error(chalk.red(`Manifest name "${manifest.name}" doesn't match requested "${mfeName}"`));
      process.exit(1);
    }
    
    // Read registry
    const registry = readRegistry(registryPath);
    
    // Find and update MFE
    const mfeIndex = registry.mfes.findIndex(mfe => mfe.name === mfeName);
    
    if (mfeIndex === -1) {
      console.error(chalk.red(`MFE "${mfeName}" not found in registry`));
      process.exit(1);
    }
    
    registry.mfes[mfeIndex] = manifest;
    console.log(chalk.green(`✅ Updated "${mfeName}" in registry`));
    
    // Write registry
    writeRegistry(registryPath, registry);
  });

// List subcommand
const listCommand = new Command('list')
  .description('List all MFEs in the registry')
  .option('-r, --registry <path>', 'Path to registry file')
  .option('-j, --json', 'Output as JSON')
  .option('-f, --filter <framework>', 'Filter by framework')
  .action((options) => {
    // Find registry
    const registryPath = options.registry || findRegistryPath();
    if (!registryPath) {
      console.error(chalk.red('Could not find mfe-registry.json. Use --registry to specify path.'));
      process.exit(1);
    }
    
    // Read registry
    const registry = readRegistry(registryPath);
    
    // Filter MFEs if requested
    let mfes = registry.mfes;
    if (options.filter) {
      mfes = mfes.filter(mfe => {
        const framework = mfe.compatibility?.frameworks?.react ? 'react' :
                         mfe.compatibility?.frameworks?.vue ? 'vue' :
                         mfe.compatibility?.frameworks?.solid ? 'solid' :
                         'unknown';
        return framework === options.filter;
      });
    }
    
    // Output
    if (options.json) {
      console.log(JSON.stringify(mfes, null, 2));
    } else {
      console.log(chalk.cyan(`\n📦 MFEs in Registry (${mfes.length} total)\n`));
      
      for (const mfe of mfes) {
        const framework = mfe.compatibility?.frameworks?.react ? 'React' :
                         mfe.compatibility?.frameworks?.vue ? 'Vue' :
                         mfe.compatibility?.frameworks?.solid ? 'Solid' :
                         'Unknown';
        
        console.log(chalk.bold(`  ${mfe.name}`) + chalk.gray(` v${mfe.version}`));
        console.log(chalk.gray(`    Framework: ${framework}`));
        console.log(chalk.gray(`    URL: ${mfe.url}`));
        
        if (mfe.metadata?.description) {
          console.log(chalk.gray(`    ${mfe.metadata.description}`));
        }
        console.log();
      }
    }
  });

// Removed validate and sync commands - consolidated into main validate command

/*
// Validate subcommand (removed - use 'mfe-toolkit validate --registry' instead)
const validateCommand = new Command('validate')
  .description('Validate registry integrity')
  .option('-r, --registry <path>', 'Path to registry file')
  .option('-c, --check-urls', 'Check if URLs are reachable')
  .action(async (options) => {
    // Find registry
    const registryPath = options.registry || findRegistryPath();
    if (!registryPath) {
      console.error(chalk.red('Could not find mfe-registry.json. Use --registry to specify path.'));
      process.exit(1);
    }
    
    console.log(chalk.cyan('🔍 Validating registry...\n'));
    
    // Read registry
    const registry = readRegistry(registryPath);
    
    let hasErrors = false;
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check for duplicates
    const names = new Set<string>();
    for (const mfe of registry.mfes) {
      if (names.has(mfe.name)) {
        errors.push(`Duplicate MFE name: ${mfe.name}`);
        hasErrors = true;
      }
      names.add(mfe.name);
    }
    
    // Validate each MFE
    for (const mfe of registry.mfes) {
      // Check required fields
      if (!mfe.name) {
        errors.push(`MFE missing name`);
        hasErrors = true;
      }
      if (!mfe.version) {
        warnings.push(`${mfe.name}: Missing version`);
      }
      if (!mfe.url) {
        errors.push(`${mfe.name}: Missing URL`);
        hasErrors = true;
      }
      
      // Check URL format
      if (mfe.url && !mfe.url.match(/^https?:\/\//)) {
        warnings.push(`${mfe.name}: URL should start with http:// or https://`);
      }
      
      // Check if URL is reachable (optional)
      if (options.checkUrls && mfe.url) {
        try {
          const { default: fetch } = await import('node-fetch');
          const response = await fetch(mfe.url, { method: 'HEAD' });
          if (!response.ok) {
            warnings.push(`${mfe.name}: URL not reachable (${response.status})`);
          }
        } catch (error) {
          warnings.push(`${mfe.name}: URL not reachable`);
        }
      }
    }
    
    // Report results
    if (errors.length > 0) {
      console.log(chalk.red('❌ Errors:'));
      errors.forEach(error => console.log(chalk.red(`  - ${error}`)));
      console.log();
    }
    
    if (warnings.length > 0) {
      console.log(chalk.yellow('⚠️  Warnings:'));
      warnings.forEach(warning => console.log(chalk.yellow(`  - ${warning}`)));
      console.log();
    }
    
    if (!hasErrors && warnings.length === 0) {
      console.log(chalk.green('✅ Registry is valid!'));
    } else if (!hasErrors) {
      console.log(chalk.yellow('⚠️  Registry is valid with warnings'));
    } else {
      console.log(chalk.red('❌ Registry has errors'));
      process.exit(1);
    }
  });

// Sync subcommand (removed - too complex and unpredictable)
const syncCommand = new Command('sync')
  .description('Sync registry with filesystem')
  .option('-r, --registry <path>', 'Path to registry file')
  .option('-d, --directory <path>', 'Root directory to scan for MFEs')
  .option('-f, --force', 'Auto-confirm all changes')
  .action(async (options) => {
    // Find registry
    const registryPath = options.registry || findRegistryPath();
    if (!registryPath) {
      console.error(chalk.red('Could not find mfe-registry.json. Use --registry to specify path.'));
      process.exit(1);
    }
    
    // Determine scan directory
    const scanDir = options.directory || path.dirname(path.dirname(registryPath));
    
    console.log(chalk.cyan(`Scanning for MFEs in: ${scanDir}\n`));
    
    // Find all manifest.json files
    const findManifests = (dir: string): string[] => {
      const manifests: string[] = [];
      
      const scan = (currentDir: string) => {
        // Skip node_modules and dist directories
        if (currentDir.includes('node_modules') || currentDir.includes('dist')) {
          return;
        }
        
        const manifestPath = path.join(currentDir, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
          manifests.push(currentDir);
        }
        
        // Scan subdirectories
        try {
          const entries = fs.readdirSync(currentDir, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory()) {
              scan(path.join(currentDir, entry.name));
            }
          }
        } catch (error) {
          // Ignore permission errors
        }
      };
      
      scan(dir);
      return manifests;
    };
    
    const mfePaths = findManifests(scanDir);
    console.log(chalk.cyan(`Found ${mfePaths.length} MFEs\n`));
    
    // Read current registry
    const registry = readRegistry(registryPath);
    const existingNames = new Set(registry.mfes.map(mfe => mfe.name));
    
    // Find MFEs to add/update
    const toAdd: MFEManifest[] = [];
    const toUpdate: MFEManifest[] = [];
    
    for (const mfePath of mfePaths) {
      const manifest = readManifest(mfePath);
      if (manifest) {
        if (existingNames.has(manifest.name)) {
          toUpdate.push(manifest);
        } else {
          toAdd.push(manifest);
        }
      }
    }
    
    // Find MFEs to remove (in registry but not on filesystem)
    const foundNames = new Set([...toAdd, ...toUpdate].map(m => m.name));
    const toRemove = registry.mfes.filter(mfe => !foundNames.has(mfe.name));
    
    // Report changes
    if (toAdd.length === 0 && toUpdate.length === 0 && toRemove.length === 0) {
      console.log(chalk.green('✅ Registry is already in sync'));
      return;
    }
    
    console.log(chalk.cyan('📋 Changes to apply:\n'));
    
    if (toAdd.length > 0) {
      console.log(chalk.green(`  Add (${toAdd.length}):`));
      toAdd.forEach(mfe => console.log(chalk.green(`    + ${mfe.name}`)));
    }
    
    if (toUpdate.length > 0) {
      console.log(chalk.yellow(`  Update (${toUpdate.length}):`));
      toUpdate.forEach(mfe => console.log(chalk.yellow(`    ~ ${mfe.name}`)));
    }
    
    if (toRemove.length > 0) {
      console.log(chalk.red(`  Remove (${toRemove.length}):`));
      toRemove.forEach(mfe => console.log(chalk.red(`    - ${mfe.name}`)));
    }
    
    console.log();
    
    // Confirm changes
    if (!options.force) {
      const { confirm } = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: 'Apply these changes?',
        initial: true,
      });
      
      if (!confirm) {
        console.log(chalk.yellow('Operation cancelled'));
        return;
      }
    }
    
    // Apply changes
    for (const manifest of toAdd) {
      registry.mfes.push(manifest);
    }
    
    for (const manifest of toUpdate) {
      const index = registry.mfes.findIndex(mfe => mfe.name === manifest.name);
      if (index !== -1) {
        registry.mfes[index] = manifest;
      }
    }
    
    for (const mfe of toRemove) {
      const index = registry.mfes.findIndex(m => m.name === mfe.name);
      if (index !== -1) {
        registry.mfes.splice(index, 1);
      }
    }
    
    // Write registry
    writeRegistry(registryPath, registry);
    console.log(chalk.green('\n✅ Registry synced successfully!'));
  });

*/

// Main registry command
export const registryCommand = new Command('registry')
  .description('Manage MFE registry')
  .addCommand(addCommand)
  .addCommand(removeCommand)
  .addCommand(updateCommand)
  .addCommand(listCommand);