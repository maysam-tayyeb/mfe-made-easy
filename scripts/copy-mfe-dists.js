#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

async function copyMfeDists() {
  console.log('📦 Copying MFE dist folders to root dist...');
  
  // Create root dist directory if it doesn't exist
  const rootDist = path.join(rootDir, 'dist');
  await fs.mkdir(rootDist, { recursive: true });
  
  // Get all MFE directories
  const appsDir = path.join(rootDir, 'apps');
  const appDirs = await fs.readdir(appsDir);
  
  // Filter for MFE directories
  const mfeDirs = appDirs.filter(dir => dir.startsWith('mfe-'));
  
  for (const mfeDir of mfeDirs) {
    const mfePath = path.join(appsDir, mfeDir);
    const mfeDistPath = path.join(mfePath, 'dist');
    
    // Check if MFE has a dist directory
    try {
      const stat = await fs.stat(mfeDistPath);
      if (stat.isDirectory()) {
        // Copy MFE dist to root dist with MFE name
        const targetPath = path.join(rootDist, mfeDir);
        
        // Remove existing target directory if it exists
        try {
          await fs.rm(targetPath, { recursive: true, force: true });
        } catch (err) {
          // Ignore error if directory doesn't exist
        }
        
        // Copy the dist contents
        await fs.cp(mfeDistPath, targetPath, { recursive: true });
        console.log(`✅ Copied ${mfeDir}/dist → dist/${mfeDir}`);
      }
    } catch (err) {
      // MFE doesn't have a dist directory, skip it
      console.log(`⏭️  Skipping ${mfeDir} (no dist directory)`);
    }
  }
  
  console.log('🎉 All MFE dist folders copied to root dist!');
}

// Run the script
copyMfeDists().catch(err => {
  console.error('❌ Error copying MFE dists:', err);
  process.exit(1);
});