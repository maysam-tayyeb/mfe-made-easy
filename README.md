# 🚀 MFE Toolkit - Enterprise Microfrontend Development Platform

A production-ready toolkit and reference architecture for building enterprise-grade microfrontends. Features framework-agnostic core, cross-framework communication, comprehensive dev tools, and battle-tested patterns from real-world implementations.

## ✨ Key Features

- 🧪 **Standalone Development** - Develop MFEs independently with `@mfe-toolkit/dev` - no container needed!
- 🛠️ **Interactive Dev Tools** - Built-in console, event simulator, metrics, viewport controls, and theme switcher
- 🚀 **Dynamic MFE Loading** - Load microfrontends on-demand with ES modules
- 📡 **Inter-MFE Communication** - Real-time event bus for MFE-to-MFE messaging ([see guide](./docs/guides/mfe-communication-guide.md))
- 🎯 **Shared Services** - Modal, notification, auth, and logging services ([see demos](./docs/service-demos.md))
- 📦 **Optimized Bundles** - 96% smaller with import maps (576KB → 14KB)
- 🔄 **Cross-Framework Support** - React, Vue, Solid.js, and Vanilla JS MFEs work together ([see demos](./docs/service-demos.md))
- 🛠️ **Modern Tooling** - Vite, TypeScript, pnpm workspaces, and ESBuild
- 🔧 **Universal State Manager** - Cross-framework state management (React, Vue, Solid.js, Vanilla JS) with proxy-based reactivity and middleware support
- 📐 **Professional UI/UX** - Modern Blue & Slate palette, heroes, metrics, cards, complete component system
- 🚫 **No Global Pollution** - Clean architecture with service injection, no window/global variables
- 📱 **Mobile-Responsive** - Adaptive layouts with `ds-sm:*`, `ds-md:*`, `ds-lg:*` breakpoints
- 🔄 **Dual Loading Strategies** - Standard and Isolated loaders for React and non-React MFEs
- 📊 **Performance Monitoring** - Built-in middleware for state management performance tracking
- 📝 **Registry Management** - CLI commands for managing MFE registry (add/remove/update/list)
- 🎯 **Auto-Registry Updates** - MFE creation automatically updates registry
- ✅ **Comprehensive Testing** - All packages now have test suites

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Container Application                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Navigation | Dashboard | Registry | Services Demo    │  │
│  │  Error Boundaries | Performance Monitoring            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                Injected Services Layer                │  │
│  │  ┌──────────┐ ┌───────────┐ ┌─────────┐ ┌──────────┐  │  │
│  │  │  Logger  │ │ Event Bus │ │  Modal  │ │  Notify  │  │  │
│  │  └──────────┘ └───────────┘ └─────────┘ └──────────┘  │  │
│  │  ┌──────────────┐ ┌────────────────────────────────┐  │  │
│  │  │Error Reporter│ │ Service Container (Injection)  │  │  │
│  │  └──────────────┘ └────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │             Container State Management                │  │
│  │    AuthContext  |  UIContext  |  RegistryContext      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │          MFE Loading Infrastructure                   │  │
│  │     MFELoader Components | Error Boundaries           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
                  Dynamic Import (Runtime)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│         Static File Server (S3)                             │
│         Serves Built MFEs from dist/ directory              │
│  ┌────────────────┐ ┌────────────────┐ ┌─────────────────┐  │
│  │/service-demos  │ │/event-bus/*    │ │/trading/*       │  │
│  │/modal/*        │ │/playground.js  │ │market|terminal  │  │
│  │/notifications  │ │                │ │analytics        │  │
│  └────────────────┘ └────────────────┘ └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Microfrontends (MFEs)                    │
│  ┌────────────────┐ ┌───────────────┐ ┌──────────────────┐  │
│  │Service Demos   │ │Trading Demos  │ │Interactive Tools │  │
│  │- Modal         │ │- Market Watch │ │- Event Playground│  │
│  │  All frameworks│ │- Trading      │ │  (Solid.js)      │  │
│  │- Notifications │ │  Terminal     │ │- Dev Tools       │  │
│  │  All frameworks│ │- Analytics    │ │  Panel           │  │
│  │                │ │  Engine       │ │                  │  │
│  └────────────────┘ └───────────────┘ └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 📚 Architecture Documentation

- [Architecture Decisions](./docs/architecture/architecture-decisions.md) - Key design choices and rationale
- [State Management Architecture](./docs/architecture/state-management-architecture.md) - ContextBridge vs Universal State Manager
- [MFE Loading Guide](./docs/architecture/mfe-loading-guide.md) - How MFEs are loaded and best practices
- [Service Demonstrations](./docs/service-demos.md) - Interactive demos of all platform services
- [Comprehensive Roadmap](./docs/architecture/comprehensive-roadmap.md) - Complete development roadmap with completed work and future plans

## 📦 NPM Packages

The toolkit is available as modular npm packages under the `@mfe-toolkit` organization:

### Core Packages

| Package                                              | Description                           | Version |
| ---------------------------------------------------- | ------------------------------------- | ------- |
| [`@mfe-toolkit/core`](./packages/mfe-toolkit-core)   | Framework-agnostic core functionality | 0.1.0   |
| [`@mfe-toolkit/react`](./packages/mfe-toolkit-react) | React components and hooks            | 0.1.0   |
| [`@mfe-toolkit/cli`](./packages/mfe-toolkit-cli)     | CLI tools for MFE development         | 0.1.0   |
| [`@mfe-toolkit/dev`](./packages/mfe-toolkit-dev)     | Standalone dev server with dev tools  | 0.1.0   |
| [`@mfe-toolkit/state`](./packages/mfe-toolkit-state) | Cross-framework state management      | 0.1.0   |

### Middleware Packages

| Package                                                                                            | Description                                 | Version |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------- |
| [`@mfe-toolkit/state-middleware-performance`](./packages/mfe-toolkit-state-middleware-performance) | Performance monitoring for state management | 0.1.0   |

### Internal Packages

| Package                                                      | Description                                       | Status   |
| ------------------------------------------------------------ | ------------------------------------------------- | -------- |
| [`@mfe/design-system`](./packages/design-system)             | CSS-first design system with 500+ utility classes | Internal |
| [`@mfe/design-system-react`](./packages/design-system-react) | React components for design system                | Internal |
| [`@mfe/shared`](./packages/shared)                           | Shared utilities and constants                    | Internal |

### Installation

```bash
# Core functionality (required)
npm install @mfe-toolkit/core

# Standalone development (recommended)
npm install -D @mfe-toolkit/dev

# React components (for React apps)
npm install @mfe-toolkit/react

# CLI tools (global installation)
npm install -g @mfe-toolkit/cli

# State management (optional)
npm install @mfe-toolkit/state

# Performance monitoring middleware (optional)
npm install @mfe-toolkit/state-middleware-performance
```

## 🚀 Quick Start

### 🧪 Standalone Development (Fastest Way to Start)

```bash
# Create a new MFE
npx @mfe-toolkit/cli create my-awesome-mfe
cd my-awesome-mfe

# Add dev toolkit
pnpm add -D @mfe-toolkit/dev

# Start standalone dev server with dev tools
pnpm dev

# Open http://localhost:3100
# Press Ctrl+Shift+D to toggle dev tools
```

**Features:**
- ✅ Mock services automatically injected
- ✅ Interactive dev tools panel
- ✅ Hot reload
- ✅ Event simulator
- ✅ Viewport testing
- ✅ Theme switcher

### 📖 Complete Getting Started Guide

New to MFE Toolkit? Start with our comprehensive guide:

**[📚 Getting Started Guide](./docs/GETTING_STARTED.md)** - Complete 0-100 guide covering:
- Standalone development workflow
- Creating your first MFE
- Using dev tools effectively
- Setting up a container
- Inter-MFE communication
- State management
- Production deployment
- Troubleshooting

### State Management with Middleware

The toolkit includes a powerful state management solution with optional middleware:

```typescript
import { createStateManager } from '@mfe-toolkit/state';
import {
  createPerformanceMiddleware,
  initStatePerformanceMonitor,
} from '@mfe-toolkit/state-middleware-performance';

// Initialize performance monitoring
initStatePerformanceMonitor('my-app');

// Create state manager with middleware
const stateManager = createStateManager({
  devtools: true,
  persistent: true,
  crossTab: true,
  middleware: [createPerformanceMiddleware()],
});

// Use the state manager
stateManager.set('user', { name: 'John' });
const user = stateManager.get('user');

// Subscribe to changes
stateManager.subscribe('user', (value) => {
  console.log('User changed:', value);
});
```

### Prerequisites

- Node.js (LTS version specified in `.nvmrc`)
- pnpm >= 8 (Follow Quick Setup or see [pnpm.io](https://pnpm.io/installation))

#### Quick Setup

```bash
# Install nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Use the Node version specified in .nvmrc
nvm install
nvm use

# Install pnpm globally
npm install -g pnpm
```

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd mfe-made-easy

# Install dependencies
pnpm install

# Build packages and MFEs (required first time)
pnpm build
```

## 🏃‍♂️ Running the Applications

### Development Mode

```bash
# Install dependencies (run after cloning)
pnpm install

# Build packages and MFEs (required before first run)
pnpm build

# Start the container application
pnpm dev:container-react  # React container app on http://localhost:3000
```

### Service Demonstration MFEs

The platform includes comprehensive service demonstrations across multiple frameworks:

#### Trading Platform Scenario
- **Market Watch** (React): Real-time market data viewer
- **Trading Terminal** (Vue 3): Order placement interface
- **Analytics Engine** (Vanilla TS): Real-time analytics processor
- **Event Playground** (Solid.js): Interactive event testing tool

#### Service Demonstrations
- **Modal Service**: React 17/18/19, Vue 3, Solid.js, Vanilla TS implementations
- **Notification Service**: React 17/18/19, Vue 3, Solid.js, Vanilla TS implementations
- All demos showcase framework-agnostic service injection patterns

Access demos at:
- Trading Platform: http://localhost:3000/services/event-bus-v3
- Modal Service: http://localhost:3000/services/modal
- Notifications: http://localhost:3000/services/notifications

See [Service Demonstrations](./docs/service-demos.md) for detailed documentation.

### Production Mode

```bash
# Build everything
pnpm build

# Serve the built MFEs
pnpm serve

# In another terminal, preview the container
cd apps/container-react && pnpm preview
```

### How MFEs Are Loaded

The platform uses **dynamic ES module imports** (no Module Federation) for MFE loading:

1. **Development Mode**: MFEs run on their own dev servers (ports 3001, 3002, etc.)
2. **Production Mode**:
   - Build MFEs as ES modules to `dist/` directory
   - Serve via static file server (port 8080)
   - Container loads MFEs dynamically from registry

```bash
# Development URLs:
http://localhost:3001/mfe-example.js      # Example MFE
http://localhost:3002/mfe-react17.js      # React 17 MFE

# Production URLs (after build):
http://localhost:8080/mfe-example/mfe-example.js
http://localhost:8080/mfe-react17/mfe-react17.js
http://localhost:8080/mfe-event-demo/mfe-event-demo.js
```

### MFE Registry Configuration

The container uses a **dynamic registry system** that loads configurations from JSON files:

```json
{
  "mfes": [
    {
      "name": "example",
      "url": "http://localhost:3001/mfe-example.js", // Dev mode
      "metadata": {
        "displayName": "Example MFE",
        "description": "Demonstrates all MFE services",
        "icon": "🎯"
      }
    }
  ]
}
```

**Registry Features:**

- 📁 Single registry file: `mfe-registry.json` (consolidated from multiple files)
- 🔧 Environment variable: `VITE_MFE_REGISTRY_URL`
- 🔄 Hot reload support in development
- 📦 Automatic fallback to hardcoded values if registry fails

> **Note**: For production deployments:
>
> - Update URLs to point to your CDN: `https://cdn.example.com/mfes/`
> - Use environment-specific registry files
> - Configure caching (5 min dev, 30 min prod)

## 🧪 Testing

### Running Tests

```bash
# Run tests for all packages
pnpm test:packages

# Run tests for container app
pnpm test:container

# Run tests for a specific package
pnpm --filter @mfe-toolkit/core test
pnpm --filter @mfe/container-react test

# Watch mode for specific package tests
pnpm --filter @mfe/container-react test:watch

# Coverage report for specific package
pnpm --filter @mfe/container-react test:coverage

# Run a single test file (from within package directory)
cd apps/container-react && pnpm vitest src/App.test.tsx
```

### Testing the MFE Integration

1. **Open the Container Application**: http://localhost:3000
2. **Navigate through the app**:
   - Home page shows the platform overview
   - Dashboard page tests container services
   - MFE Communication page for inter-MFE messaging
   - Universal State Demo for cross-MFE state management with performance monitoring
3. **Load the Example MFE**:
   - Click "Example MFE" in navigation, or
   - Go directly to http://localhost:3000/mfe/example
4. **Test MFE Services**:
   - Click buttons to test modal service
   - Try notifications system
   - Test event bus communication
   - Check authentication integration
   - View logger output in console

### 📡 Testing Inter-MFE Communication

For a comprehensive guide on testing real-time communication between MFEs, see the [MFE Communication Guide](./docs/mfe-communication-guide.md).

## 📁 Project Structure

```
mfe-made-easy/
├── apps/
│   ├── container-react/        # React container app (port 3000)
│   │   ├── src/
│   │   │   ├── components/     # Navigation, Layout, UI components
│   │   │   ├── pages/          # Home, Dashboard, Services pages
│   │   │   ├── contexts/       # React Context (Auth, UI, Registry)
│   │   │   └── services/       # MFE services implementation
│   │   └── package.json
│   └── service-demos/          # MFE demonstrations
│       ├── modal/              # Modal service demos
│       │   ├── mfe-react19-modal-demo/
│       │   ├── mfe-react17-modal-demo/
│       │   ├── mfe-vue3-modal-demo/
│       │   └── mfe-vanilla-modal-demo/
│       └── event-bus/          # Event bus demos
│           └── mfe-react19-eventbus-demo/
├── packages/
│   ├── mfe-toolkit-core/       # Framework-agnostic core
│   │   └── src/
│   │       ├── types/          # TypeScript definitions
│   │       ├── services/       # Logger, EventBus, Registry
│   │       └── utils/          # Common utilities
│   ├── mfe-toolkit-react/      # React-specific components
│   │   └── src/
│   │       └── components/     # MFELoader, MFEPage
│   ├── shared/                 # Internal utilities (private)
│   │   └── src/
│   │       ├── utils.ts        # Helper functions
│   │       └── constants.ts    # Shared constants
│   ├── design-system/          # CSS-first design system
│   │   └── src/
│   │       ├── styles/         # CSS with ds-* classes
│   │       └── tokens/         # Design tokens
│   ├── design-system-react/    # React design components
│   │   └── src/
│   │       └── components/     # Hero, MetricCard, TabGroup
│   ├── mfe-toolkit-state/      # Cross-framework state management
│   │   └── src/
│   │       ├── StateManager.ts # Core state management
│   │       └── adapters/       # Framework-specific adapters
│   └── mfe-toolkit-state-middleware-performance/ # Performance monitoring
│       └── src/
│           └── index.ts        # Performance middleware
├── pnpm-workspace.yaml         # Workspace configuration
└── package.json                # Root package with scripts
```

## 🛠️ Available Scripts

### Development

- `pnpm dev` - Start all apps in development mode
- `pnpm dev:container-react` - Start React container app

### Building & Serving

- `pnpm build` - Build all packages
- `pnpm -r build` - Build in dependency order
- `pnpm preview` - Preview production build (run from apps/container-react)

### Code Quality

- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix linting issues
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check formatting
- `pnpm type-check` - TypeScript checking
- `pnpm test:packages` - Run tests for all packages
- `pnpm test:container` - Run tests for container app

## 🔧 Development Workflow

### Building New MFEs

1. Create new app in `apps/` directory
2. Configure build for ES modules
3. Implement MFE module interface
4. Register in container's MFE registry
5. Build ES modules for deployment

### Key Configuration Files

- `pnpm-workspace.yaml` - Workspace setup
- `tsconfig.base.json` - Shared TypeScript config
- `vite.config.base.ts` - Shared Vite configuration
- `tailwind.config.base.js` - Shared Tailwind setup

## 🎯 Features Implemented

✅ **Monorepo Setup**: pnpm workspaces with shared configurations  
✅ **Container Applications**: React 19 with comprehensive service injection  
✅ **MFE Dev Kit**: Standalone development with interactive dev tools  
✅ **Dynamic Loading**: Runtime ES module imports with dual loading strategies  
✅ **Shared Services**: Auth, Modal, Notification, Event Bus, Logger, Error Reporter  
✅ **Universal State Manager**: Cross-framework state with middleware and performance monitoring  
✅ **Registry System**: JSON-based MFE configuration with manifest v2 support  
✅ **Cross-Framework Support**: React 17/18/19, Vue 3, Solid.js, Vanilla TS  
✅ **Professional UI/UX**: Hero sections, metrics, cards, complete component system  
✅ **Error Handling**: Comprehensive error boundaries with retry mechanisms  
✅ **Performance Monitoring**: Built-in middleware for state management metrics  
✅ **TypeScript**: Full type safety with framework-agnostic types  
✅ **Modern Tooling**: Vite, ESBuild, Tailwind CSS, ESLint, Vitest, Playwright

## 🚀 Quick Command Reference

### Essential Commands

```bash
# Install dependencies
pnpm install

# Install and build (first time setup)
pnpm install
pnpm -r build

# Start all apps (recommended)
pnpm dev

# Start individual apps
pnpm dev:container-react  # React container on :3000
pnpm dev:mfe          # Example MFE on :3001
pnpm dev:react17      # React 17 MFE on :3002

# Code quality checks
pnpm lint             # Run linter
pnpm format           # Format code
pnpm type-check       # Type checking
pnpm test:packages    # Run tests for packages
pnpm test:container   # Run tests for container
```

### Working with MFEs

```bash
# Build a specific MFE
cd apps/mfe-example
pnpm build

# Serve MFE statically (production-like)
pnpm serve:static

# Check bundle size after build
# Look for: "📏 Bundle size: XX KB"
```

## 🐛 Troubleshooting

### MFE Not Loading?

```bash
# 1. Make sure packages are built first
pnpm -r build

# 2. Start all services
pnpm dev  # Should start container + all MFEs

# 3. For production mode, build and serve
pnpm build
pnpm serve  # Terminal 1: Serves MFEs on :8080
cd apps/container-react && pnpm preview  # Terminal 2: React Container

# 4. Check browser console for errors
# Open DevTools > Console
```

### Build or Module Errors?

```bash
# 1. Rebuild all packages
pnpm -r build

# 2. Clean install (if needed)
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 3. Check for TypeScript errors
pnpm type-check
```

### Services Not Available?

Services are injected into MFEs at mount time via service container (zero global pollution). Check:

1. MFE exports proper mount/unmount functions with service container parameter
2. Services are injected via `createServiceContainer` during mount
3. MFE is using correct TypeScript types from `@mfe-toolkit/core`
4. Error boundaries are catching and reporting errors
5. Check browser console for detailed error logs from Error Reporter service

### Port Already in Use?

```bash
# Kill process on specific port
lsof -ti:3000 | xargs kill -9  # Container
lsof -ti:3001 | xargs kill -9  # Service Explorer MFE
lsof -ti:3002 | xargs kill -9  # React 17 MFE
lsof -ti:8080 | xargs kill -9  # Static file server

# Or use different ports in vite.config.ts
```

### Development Tips

- **Hot Reload**: Changes auto-refresh (HMR enabled)
- **Browser DevTools**: Use React DevTools extension
- **Network Tab**: Monitor MFE loading in DevTools
- **Event Monitoring**: Use MFE Communication page at `/mfe-communication`

## 🔧 Configuration

### MFE Registry System

The MFE platform now uses a **dynamic registry system** that loads MFE configurations from JSON files, making it easy to manage MFE URLs across different environments.

#### Registry Files

The container application looks for registry files in the `public` directory:

- `mfe-registry.json` - Single source of truth for all MFE configurations (Manifest v2 format)
- Supports environment-specific configs: `mfe-registry.{environment}.json`

#### Registry JSON Structure

```json
{
  "$schema": "https://mfe-made-easy.com/schemas/mfe-registry.schema.json",
  "version": "2.0.0",
  "environment": "development",
  "mfes": [
    {
      "name": "mfe-market-watch",
      "version": "1.0.0",
      "url": "http://localhost:8080/service-demos/event-bus/scenarios/trading/mfe-market-watch.js",
      "dependencies": {
        "runtime": { "react": "^18.0.0 || ^19.0.0" }
      },
      "capabilities": {
        "emits": ["market:price-update"],
        "listens": ["trading:order-placed"]
      },
      "requirements": {
        "services": [
          { "name": "eventBus", "optional": false },
          { "name": "logger", "optional": true }
        ]
      },
      "metadata": {
        "displayName": "Market Watch",
        "description": "Real-time market data viewer",
        "icon": "📈"
      },
      "config": {
        "loading": {
          "timeout": 30000,
          "retries": 3,
          "retryDelay": 1000
        },
        "runtime": {
          "isolation": "none",
          "singleton": true
        }
      }
    }
  ]
}
```

#### Environment Variables

Configure the registry URL using environment variables:

```bash
# .env or .env.local
VITE_MFE_REGISTRY_URL=/mfe-registry.json

# For remote registry
VITE_MFE_REGISTRY_URL=https://api.example.com/mfe-registry

# For CDN-hosted registry
VITE_MFE_REGISTRY_URL=https://cdn.example.com/configs/mfe-registry.json
```

#### Loading Order

1. Tries to load from `VITE_MFE_REGISTRY_URL` if set
2. Falls back to `/mfe-registry.json` (default)
3. Uses hardcoded values in development if all fail

#### Registry Features

- ✅ **Remote Loading** - Load registry from any URL
- ✅ **Caching** - 5-minute cache in dev, 30-minute in production
- ✅ **Fallback Support** - Multiple fallback options
- ✅ **Environment-Specific** - Different configs per environment
- ✅ **Hot Reload** - Changes reflected on page refresh

## 📚 Documentation

### Documentation

- **[Architecture Documentation](./docs/architecture/)** - Technical architecture and analysis
- **[State Management Architecture](./docs/architecture/state-management-architecture.md)** - Dual state management approach (ContextBridge vs Universal State)
- **[MFE Loading Guide](./docs/architecture/mfe-loading-guide.md)** - How MFEs are loaded and best practices
- **[Architecture Decisions](./docs/architecture/architecture-decisions.md)** - Key design choices and rationale
- **[MFE Communication Guide](./docs/mfe-communication-guide.md)** - Inter-MFE messaging with event bus

### Quick Links

- **[All Documentation](./docs/)** - Browse all documentation
- **[Architecture Analysis](./docs/architecture/architecture-analysis-report.md)** - Comprehensive architecture review
- **[Comprehensive Roadmap](./docs/architecture/comprehensive-roadmap.md)** - Complete development roadmap
- **[MFE Toolkit Core](./packages/mfe-toolkit-core/README.md)** - Framework-agnostic core services and utilities
- **[MFE Toolkit React](./packages/mfe-toolkit-react/README.md)** - React-specific components and hooks
- **[Shared Utilities](./packages/shared/README.md)** - Common constants and helper functions

## 🚀 Next Steps

- ✅ Implement MFE Manifest for better metadata and dependency management (see [Platform Manifest Docs](./docs/platform/manifests/))
- Add more cross-framework MFE examples
- Enhance Universal State Manager with more features
- Configure CI/CD pipeline with GitHub Actions
- Improve error boundaries and recovery mechanisms
- Add performance monitoring and optimization

See our [Comprehensive Roadmap](./docs/architecture/comprehensive-roadmap.md) for exciting upcoming features including:

- 🔍 DevTools middleware for time-travel debugging
- ✅ Validation middleware for runtime type safety
- 🔄 Sync middleware for backend integration
- 📊 Analytics middleware for usage insights
- 🚀 Framework adapters for Svelte and Angular
- ✅ Solid.js support now included!
- And much more!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.
