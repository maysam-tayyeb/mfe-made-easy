import { Command } from 'commander';
import { manifestValidator } from '@mfe-toolkit/core';
import chalk from 'chalk';
import fs from 'fs-extra';
import { glob } from 'glob';
import path from 'path';

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
      const appDirs = fs
        .readdirSync(appsDir)
        .filter((dir) => fs.statSync(path.join(appsDir, dir)).isDirectory());

      for (const appDir of appDirs) {
        possiblePaths.push(
          path.join(appsDir, appDir, 'public', 'mfe-registry.json'),
          path.join(appsDir, appDir, 'mfe-registry.json')
        );
      }
    }

    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        return possiblePath;
      }
    }

    currentPath = path.dirname(currentPath);
  }

  return null;
}

export const validateCommand = new Command('validate')
  .description('Validate MFE manifests or registry')
  .argument('[files...]', 'Manifest files to validate (optional)')
  .option('-p, --pattern <pattern>', 'Glob pattern to find manifests', '**/manifest.json')
  .option('-r, --registry [path]', 'Validate the MFE registry instead of individual manifests')
  .action(async (files, options) => {
    try {
      // Check if we're validating the registry
      if (options.registry !== undefined) {
        // Validate registry
        const registryPath =
          typeof options.registry === 'string' ? options.registry : findRegistryPath();

        if (!registryPath) {
          console.error(chalk.red('✖ Could not find MFE registry file'));
          console.log(
            chalk.gray('  Searched for: mfe-registry.json in current and parent directories')
          );
          process.exit(1);
        }

        if (!fs.existsSync(registryPath)) {
          console.error(chalk.red(`✖ Registry file not found: ${registryPath}`));
          process.exit(1);
        }

        console.log(chalk.blue('\n🔍 Validating MFE Registry...'));
        console.log(chalk.gray(`📁 Registry: ${registryPath}\n`));

        const registryData = await fs.readJson(registryPath);

        // Support both array format and object with mfes array
        const registry = Array.isArray(registryData) ? registryData : registryData.mfes;

        if (!Array.isArray(registry)) {
          console.error(
            chalk.red(
              '✖ Registry must be an array of MFE manifests or an object with "mfes" array'
            )
          );
          process.exit(1);
        }

        let hasErrors = false;
        const issues: {
          name: string;
          errors: Array<{ field: string; message: string }>;
          warnings: Array<{ field: string; message: string }>;
        }[] = [];

        for (const manifest of registry) {
          const result = manifestValidator.validate(manifest);

          if (!result.valid || (result.warnings && result.warnings.length > 0)) {
            issues.push({
              name: manifest.name || 'Unknown',
              errors: result.errors || [],
              warnings: result.warnings || [],
            });

            if (!result.valid) {
              hasErrors = true;
            }
          }
        }

        // Display results
        console.log(chalk.blue(`📊 Registry contains ${registry.length} MFE(s)\n`));

        if (issues.length === 0) {
          console.log(chalk.green('✅ All MFEs in registry are valid'));
        } else {
          issues.forEach((issue) => {
            if (issue.errors.length > 0) {
              console.log(chalk.red(`❌ ${issue.name}`));
              issue.errors.forEach((error) => {
                console.log(chalk.red(`   - ${error.field}: ${error.message}`));
              });
            } else if (issue.warnings.length > 0) {
              console.log(chalk.yellow(`⚠️  ${issue.name}`));
              issue.warnings.forEach((warning) => {
                console.log(chalk.yellow(`   - ${warning.field}: ${warning.message}`));
              });
            }
          });
        }

        if (hasErrors) {
          console.log(chalk.red('\n✖ Registry validation failed'));
          process.exit(1);
        } else if (issues.length > 0) {
          console.log(chalk.yellow('\n⚠️  Registry is valid but has warnings'));
        } else {
          console.log(chalk.green('\n✅ Registry validation passed'));
        }
        return;
      }

      // Original manifest validation logic
      let manifestFiles: string[] = files;

      if (!manifestFiles.length) {
        manifestFiles = await glob(options.pattern, {
          ignore: ['**/node_modules/**', '**/dist/**'],
        });
      }

      if (!manifestFiles.length) {
        console.log(chalk.yellow('⚠️  No manifest files found'));
        return;
      }

      console.log(chalk.blue(`\n🔍 Validating ${manifestFiles.length} manifest(s)...\n`));

      let hasErrors = false;

      for (const file of manifestFiles) {
        console.log(chalk.gray(`📄 ${file}`));

        try {
          const manifest = await fs.readJson(file);
          const result = manifestValidator.validate(manifest);

          if (result.valid) {
            console.log(chalk.green(`   ✅ Valid (v${result.version})`));

            if (result.warnings && result.warnings.length > 0) {
              console.log(chalk.yellow('   ⚠️  Warnings:'));
              result.warnings.forEach((warning) => {
                console.log(chalk.yellow(`      - ${warning.field}: ${warning.message}`));
              });
            }
          } else {
            hasErrors = true;
            console.log(chalk.red('   ❌ Invalid'));

            if (result.errors && result.errors.length > 0) {
              console.log(chalk.red('   Errors:'));
              result.errors.forEach((error) => {
                console.log(chalk.red(`      - ${error.field}: ${error.message}`));
              });
            }
          }
        } catch (error) {
          hasErrors = true;
          console.log(chalk.red(`   ❌ Error reading file: ${(error as Error).message}`));
        }

        console.log('');
      }

      if (hasErrors) {
        console.log(chalk.red('✖ Validation failed with errors'));
        process.exit(1);
      } else {
        console.log(chalk.green('✅ All manifests are valid'));
      }
    } catch (error) {
      console.error(chalk.red('✖ Error validating manifests:'), error);
      process.exit(1);
    }
  });
