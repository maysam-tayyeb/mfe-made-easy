#!/usr/bin/env node

/**
 * Script to update service packages with types-only entry points
 * This allows MFEs to import just the types without the implementation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const servicePackages = [
  'mfe-toolkit-service-modal',
  'mfe-toolkit-service-authentication',
  'mfe-toolkit-service-authorization',
  'mfe-toolkit-service-theme',
  'mfe-toolkit-service-analytics',
];

function extractTypesFromIndex(indexPath) {
  const content = fs.readFileSync(indexPath, 'utf-8');
  
  // Extract type definitions and interfaces
  const typeMatches = content.match(/export (type|interface) \w+[\s\S]*?(?=\n(?:export|\/\/|class|function|const|$))/gm) || [];
  
  // Extract module augmentation
  const augmentationMatch = content.match(/declare module ['"]@mfe-toolkit\/core['"][\s\S]*?\n\}/m);
  
  return {
    types: typeMatches.join('\n\n'),
    augmentation: augmentationMatch ? augmentationMatch[0] : ''
  };
}

function createTypesFile(packageDir, serviceName) {
  const indexPath = path.join(packageDir, 'src', 'index.ts');
  
  if (!fs.existsSync(indexPath)) {
    console.log(`Skipping ${serviceName}: index.ts not found`);
    return false;
  }
  
  const { types, augmentation } = extractTypesFromIndex(indexPath);
  
  if (!types && !augmentation) {
    console.log(`Skipping ${serviceName}: no types or augmentation found`);
    return false;
  }
  
  const typesContent = `/**
 * Type definitions for the ${serviceName} service
 * This file contains only types and module augmentation, no implementation
 */

${types}

// Module augmentation for TypeScript support
${augmentation}`;

  const typesPath = path.join(packageDir, 'src', 'types.ts');
  fs.writeFileSync(typesPath, typesContent);
  console.log(`Created types.ts for ${serviceName}`);
  
  return true;
}

function updatePackageJson(packageDir) {
  const packageJsonPath = path.join(packageDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
  // Add exports field if it doesn't exist
  if (!packageJson.exports) {
    packageJson.exports = {
      '.': {
        types: './dist/index.d.ts',
        import: './dist/index.mjs',
        require: './dist/index.js'
      },
      './types': {
        types: './dist/types.d.ts'
      }
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`Updated package.json exports`);
  }
}

function updateTsupConfig(packageDir) {
  const tsupConfigPath = path.join(packageDir, 'tsup.config.ts');
  
  if (!fs.existsSync(tsupConfigPath)) {
    console.log(`Skipping tsup.config.ts: not found`);
    return;
  }
  
  let content = fs.readFileSync(tsupConfigPath, 'utf-8');
  
  // Update entry to include types.ts
  if (!content.includes('src/types.ts')) {
    content = content.replace(
      /entry:\s*\[['"]src\/index\.ts['"]\]/,
      "entry: ['src/index.ts', 'src/types.ts']"
    );
    
    fs.writeFileSync(tsupConfigPath, content);
    console.log(`Updated tsup.config.ts`);
  }
}

// Process each service package
for (const packageName of servicePackages) {
  console.log(`\nProcessing ${packageName}...`);
  const packageDir = path.join(rootDir, 'packages', packageName);
  
  if (!fs.existsSync(packageDir)) {
    console.log(`Package directory not found: ${packageDir}`);
    continue;
  }
  
  const serviceName = packageName.replace('mfe-toolkit-service-', '');
  
  if (createTypesFile(packageDir, serviceName)) {
    updatePackageJson(packageDir);
    updateTsupConfig(packageDir);
  }
}

console.log('\nDone! Remember to:');
console.log('1. Review the generated types.ts files');
console.log('2. Update the main index.ts files to import types from ./types');
console.log('3. Build the packages: pnpm build:packages');
console.log('4. Update MFEs to use the new import pattern: import "@mfe-toolkit/service-xxx/types"');