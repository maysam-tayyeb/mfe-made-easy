#!/bin/bash

# Script to apply the types-only pattern to remaining service packages

PACKAGES=(
  "mfe-toolkit-service-authentication"
  "mfe-toolkit-service-authorization"
  "mfe-toolkit-service-theme"
  "mfe-toolkit-service-analytics"
)

for PACKAGE in "${PACKAGES[@]}"; do
  echo "Processing $PACKAGE..."
  
  PACKAGE_DIR="packages/$PACKAGE"
  
  # Check if package exists
  if [ ! -d "$PACKAGE_DIR" ]; then
    echo "  Package directory not found: $PACKAGE_DIR"
    continue
  fi
  
  # Update package.json to add exports field
  if [ -f "$PACKAGE_DIR/package.json" ]; then
    echo "  Updating package.json..."
    node -e "
      const fs = require('fs');
      const packagePath = '$PACKAGE_DIR/package.json';
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      
      if (!pkg.exports) {
        pkg.exports = {
          '.': {
            'types': './dist/index.d.ts',
            'import': './dist/index.mjs',
            'require': './dist/index.js'
          },
          './types': {
            'types': './dist/types.d.ts'
          }
        };
        
        fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\\n');
        console.log('    Added exports field');
      } else {
        console.log('    Exports field already exists');
      }
    "
  fi
  
  # Update tsup.config.ts to include types.ts
  if [ -f "$PACKAGE_DIR/tsup.config.ts" ]; then
    echo "  Updating tsup.config.ts..."
    
    # Check if types.ts is already in entry
    if ! grep -q "src/types.ts" "$PACKAGE_DIR/tsup.config.ts"; then
      sed -i.bak "s/entry: \['src\/index.ts'\]/entry: ['src\/index.ts', 'src\/types.ts']/" "$PACKAGE_DIR/tsup.config.ts"
      rm "$PACKAGE_DIR/tsup.config.ts.bak"
      echo "    Updated entry to include types.ts"
    else
      echo "    types.ts already in entry"
    fi
  fi
done

echo ""
echo "Done! Next steps:"
echo "1. Manually create or update types.ts files in each package"
echo "2. Move module augmentation from index.ts to types.ts"
echo "3. Build all packages: pnpm build:packages"