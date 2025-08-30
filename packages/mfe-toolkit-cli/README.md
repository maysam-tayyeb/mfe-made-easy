# @mfe-toolkit/cli

> ⚠️ **Alpha Release**: This package is in alpha. APIs may change in future versions. Use in production at your own risk.

Command-line interface for creating and managing microfrontends with a focus on simplicity and developer experience.

## Installation

```bash
npm install -g @mfe-toolkit/cli
# or
npx @mfe-toolkit/cli
```

## Commands

### Create a New MFE

```bash
# Interactive mode
mfe-toolkit create

# With name
mfe-toolkit create my-mfe

# With options
mfe-toolkit create my-mfe --template react19
```

**Options:**
- `-t, --template <template>` - Template to use (react17, react18, react19, vue, solidjs, vanilla-ts)
- `-y, --yes` - Skip prompts and use defaults

### Validate Manifests

```bash
# Validate all manifest files in project
mfe-toolkit validate

# Validate specific files
mfe-toolkit validate manifest.json

# Validate with pattern
mfe-toolkit validate --pattern "**/apps/**/manifest.json"

# Validate entire MFE registry
mfe-toolkit validate --registry

# Validate specific registry file
mfe-toolkit validate --registry ./path/to/mfe-registry.json
```

**Options:**
- `-p, --pattern <pattern>` - Glob pattern to find manifests (default: `**/manifest.json`)
- `-r, --registry [path]` - Validate the MFE registry instead of individual manifests

### Manage MFE Registry

The registry commands help you maintain your MFE registry file without manual editing.

#### Add MFE to Registry

```bash
# Add MFE from current directory
mfe-toolkit registry add .

# Add MFE from specific path
mfe-toolkit registry add ./apps/my-mfe

# Specify registry location
mfe-toolkit registry add ./apps/my-mfe --registry ./custom-registry.json
```

#### Remove MFE from Registry

```bash
# Remove by name
mfe-toolkit registry remove my-mfe

# Force removal without confirmation
mfe-toolkit registry remove my-mfe --force
```

#### Update MFE in Registry

```bash
# Update from current directory
mfe-toolkit registry update my-mfe

# Update from specific manifest
mfe-toolkit registry update my-mfe --manifest ./apps/my-mfe/manifest.json
```

#### List MFEs in Registry

```bash
# List all MFEs
mfe-toolkit registry list

# Filter by framework
mfe-toolkit registry list --filter react

# Output as JSON
mfe-toolkit registry list --json

# Use specific registry
mfe-toolkit registry list --registry ./custom-registry.json
```

## Registry Auto-Detection

The CLI automatically searches for `mfe-registry.json` in these locations:
1. Current directory
2. `public/` directory
3. `src/` directory
4. `config/` directory
5. Any `apps/*/` subdirectories
6. Parent directories (recursively)

This makes the CLI work seamlessly with various project structures without configuration.

## Supported Frameworks

- **React** - Versions 17, 18, and 19
- **Vue 3** - With Composition API
- **Solid.js** - Fine-grained reactive framework
- **Vanilla TypeScript** - Framework-agnostic

## MFE Templates

Each template includes:
- Pre-configured build setup using `@mfe-toolkit/core`
- Manifest v2 with full metadata
- Service injection pattern
- TypeScript support
- Hot module replacement in development

### Template Structure

```
my-mfe/
├── src/
│   └── main.tsx          # MFE entry point
├── manifest.json         # MFE manifest v2
├── build.js             # Build configuration
├── package.json
└── tsconfig.json
```

### Service Integration

All templates follow the service injection pattern:

```typescript
export default function ({ eventBus, logger, modal, notification }) {
  return {
    mount: (element) => {
      // Mount logic
    },
    unmount: () => {
      // Cleanup logic
    }
  };
}
```

## Manifest Validation

The CLI uses `@mfe-toolkit/core` for manifest validation, supporting:
- Manifest v1 (legacy)
- Manifest v2 (recommended)
- Automatic migration suggestions
- Schema validation
- Dependency checking

## Examples

### Create a React 19 MFE

```bash
mfe-toolkit create todo-app --template react19
cd todo-app
npm install
npm run build
```

### Add MFE to Container Registry

```bash
# From the MFE directory
mfe-toolkit registry add .

# Or from anywhere, specifying the path
mfe-toolkit registry add ./apps/todo-app
```

### Validate Project MFEs

```bash
# Validate all manifests
mfe-toolkit validate

# Validate registry integrity
mfe-toolkit validate --registry
```

## Development

For local development of the CLI:

```bash
# Clone the repository
git clone https://github.com/your-org/mfe-toolkit.git
cd mfe-toolkit/packages/mfe-toolkit-cli

# Install dependencies
pnpm install

# Build the CLI
pnpm build

# Run locally
node dist/index.js
```

## Troubleshooting

### Registry Not Found

If the CLI can't find your registry file, you can:
1. Specify it explicitly: `--registry ./path/to/mfe-registry.json`
2. Run the command from a directory closer to the registry
3. Ensure the file is named `mfe-registry.json`

### Template Not Found

Ensure you're using a supported template name:
- `react17`, `react18`, `react19` for React
- `vue` for Vue 3
- `solidjs` for Solid.js
- `vanilla-ts` for Vanilla TypeScript

## License

MIT