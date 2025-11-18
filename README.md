# ShadowCache

> Modern offline-first caching engine with predictive intelligence, delta synchronization, and comprehensive SDK.

[![npm version](https://img.shields.io/npm/v/@shadowcache/sdk.svg)](https://www.npmjs.com/package/@shadowcache/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

ShadowCache resurrects and reimagines deprecated web storage technologies (AppCache, legacy LocalStorage patterns) with modern capabilities including automatic resource prediction, intelligent storage fallback chains, and seamless online/offline transitions with a distinctive Shadow Mode UI theme.

## ✨ Features

- 🚀 **Zero Configuration** - Sensible defaults with deep customization options
- 🧠 **Predictive Caching** - Intelligent pre-fetching based on user behavior patterns
- 📡 **Offline-First** - Seamless operation without network connectivity
- 🔄 **Delta Sync** - Efficient synchronization transmitting only changes
- 💾 **Smart Storage** - Automatic fallback chain (IndexedDB → LocalStorage → Memory)
- 🎨 **Shadow Mode UI** - Beautiful offline indicators and cache status displays
- 📊 **Analytics Integration** - MCP-compatible analytics hooks
- 🔒 **Security First** - Encryption for sensitive data, automatic credential rejection
- 🌳 **Tree-Shakeable** - Import only what you need (< 50KB gzipped core)
- 📘 **TypeScript Native** - Full type definitions included

## 📦 Installation

### npm

```bash
npm install @shadowcache/sdk
```

### yarn

```bash
yarn add @shadowcache/sdk
```

### pnpm

```bash
pnpm add @shadowcache/sdk
```

## 🚀 Quick Start

### Basic Setup

```typescript
import { ShadowCache } from '@shadowcache/sdk';

// Initialize with minimal configuration
const cache = await ShadowCache.init({
  cacheRules: [
    {
      id: 'api-cache',
      pattern: '/api/**',
      strategy: 'network-first',
      priority: 8,
      maxAge: 3600000, // 1 hour
    },
    {
      id: 'static-assets',
      pattern: '/assets/**',
      strategy: 'cache-first',
      priority: 5,
      maxAge: 86400000, // 24 hours
    },
  ],
});

// Listen for ready event
cache.on('ready', ({ status }) => {
  console.log('ShadowCache ready!', status);
});

// Listen for online/offline transitions
cache.on('state-change', ({ online }) => {
  console.log(online ? 'Back online!' : 'Gone offline');
});
```

### With Predictive Caching

```typescript
const cache = await ShadowCache.init({
  cacheRules: [
    {
      id: 'pages',
      pattern: '/**/*.html',
      strategy: 'stale-while-revalidate',
      priority: 7,
    },
  ],
  predictive: {
    enabled: true,
    learningRate: 0.8,
    minConfidence: 0.6,
    maxPrefetchSize: 5242880, // 5MB
    idleThreshold: 2000, // 2 seconds
  },
});
```

### With Delta Sync

```typescript
const cache = await ShadowCache.init({
  cacheRules: [
    {
      id: 'user-data',
      pattern: '/api/user/**',
      strategy: 'network-first',
      priority: 10,
    },
  ],
  sync: {
    endpoint: 'https://api.example.com/sync',
    batchSize: 50,
    retryAttempts: 3,
    conflictResolution: 'server-wins',
  },
});

// Manually trigger sync
const result = await cache.sync();
console.log(`Synced ${result.synced} changes in ${result.duration}ms`);
```

## 📚 Documentation

### Getting Started
- [Quick Start](#-quick-start) - Get up and running in minutes
- [Installation](#-installation) - npm, yarn, or pnpm

### Guides
- [API Reference](docs/API.md) - Complete API documentation with all methods and types
- [Configuration Guide](docs/CONFIGURATION.md) - Comprehensive configuration options and examples
- [Usage Examples](docs/EXAMPLES.md) - Common use cases and implementation patterns
- [Error Handling](docs/ERRORS.md) - Error codes, troubleshooting, and solutions
- [Migration Guide](docs/MIGRATION.md) - Migrate from AppCache, LocalStorage, Workbox, or raw Cache API
- [Performance Optimization](docs/PERFORMANCE.md) - Best practices and optimization strategies
- [Bundle Optimization](docs/BUNDLE-OPTIMIZATION.md) - Tree-shaking, code splitting, and size optimization

### Additional Resources
- [Browser Compatibility](#-browser-compatibility) - Supported browsers and requirements
- [Demo Application](#-demo-application) - Live examples and interactive demos
- [Architecture](#-architecture) - System design and module structure

## 📦 Bundle Size & Tree-Shaking

ShadowCache is optimized for minimal bundle size with full tree-shaking support:

- **Core SDK**: < 8 KB gzipped (well under 50 KB limit)
- **Total (all packages)**: ~17 KB gzipped
- **Tree-shakeable**: Import only what you need

### Optimized Imports

```typescript
// ✅ Minimal bundle - core functionality only
import { ShadowCache } from '@shadowcache/sdk/core';

// ✅ Import specific utilities as needed
import { validateConfig } from '@shadowcache/sdk/validation';
import { matchPattern } from '@shadowcache/sdk/matcher';
import { encryptData } from '@shadowcache/sdk/security';

// ❌ Avoid importing everything
import * as SDK from '@shadowcache/sdk';
```

See [Bundle Optimization Guide](docs/BUNDLE-OPTIMIZATION.md) for detailed strategies.

## 🏗️ Project Structure

This is a monorepo containing the following packages:

- **@shadowcache/sdk** - Main SDK entry point and orchestration layer
- **@shadowcache/storage** - Storage abstraction with fallback chain (IndexedDB → LocalStorage → Memory)
- **@shadowcache/router** - Offline router with Service Worker for request interception
- **@shadowcache/predictor** - Predictive engine for behavior analysis and pre-fetching
- **@shadowcache/sync** - Delta sync module for efficient data synchronization
- **@shadowcache/analytics** - Analytics hooks with MCP integration
- **@shadowcache/ui** - Shadow Mode UI components (React + Web Components)

## 🌐 Browser Compatibility

ShadowCache supports all modern browsers with Service Worker capabilities:

| Browser | Minimum Version |
|---------|----------------|
| Chrome  | 40+            |
| Firefox | 44+            |
| Safari  | 11.1+          |
| Edge    | 17+            |

**Requirements:**
- Service Worker API (gracefully degrades without it)
- IndexedDB (falls back to LocalStorage/Memory)
- ES2017+ features (async/await, Promises)

## 🎯 Use Cases

- **Progressive Web Apps (PWAs)** - Full offline functionality
- **E-commerce Sites** - Cache product catalogs and user carts
- **Content Platforms** - Offline reading and media playback
- **SaaS Applications** - Resilient data access and sync
- **Mobile Web Apps** - Reduced data usage and faster load times

## 🏗️ Architecture

ShadowCache follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│         Application Code                │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         ShadowCache SDK                 │
│  ┌─────────────────────────────────┐   │
│  │  Configuration & Orchestration  │   │
│  └─────────────────────────────────┘   │
└──┬────┬────┬────┬────┬────┬───────────┘
   │    │    │    │    │    │
   ▼    ▼    ▼    ▼    ▼    ▼
┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐
│Rtr ││Pred││Sync││Stor││Anly││UI  │
└────┘└────┘└────┘└────┘└────┘└────┘
```

**Modules:**
- **Router**: Request interception and caching strategies
- **Predictor**: Behavior analysis and intelligent pre-fetching
- **Sync**: Delta synchronization with conflict resolution
- **Storage**: Multi-level storage with automatic fallback
- **Analytics**: Event tracking and MCP integration
- **UI**: Shadow Mode components for offline indicators

## 🛠️ Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
npm install
```

### Building

Build all packages:

```bash
npm run build
```

Build a specific package:

```bash
cd packages/sdk
npm run build
```

### Testing

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests for a specific package:

```bash
cd packages/storage
npm test
```

### Type Checking

```bash
npm run lint
```

### Agent Hooks

The project includes automated agent hooks in `.kiro/hooks/` for development workflow automation:

- **Auto-test generation**: Reminds to add tests when SDK code changes
- **Auto-doc generation**: Prompts documentation updates when specs change
- **Version control verification**: Ensures .kiro directory is tracked in git

See [.kiro/hooks/README.md](.kiro/hooks/README.md) for configuration details.

## 🎮 Demo Application

A fully functional demo application is available in the `demo/` directory. The demo showcases:

- Real-time connectivity status with online/offline detection
- Cache status dashboard with storage usage visualization
- Manual sync controls with progress tracking
- Cached resources list with filtering and sorting
- Test API endpoints demonstrating different caching strategies
- Modern, responsive UI with Shadow Mode theme

### Running the Demo

```bash
# Build all packages first
npm run build

# Start the demo
cd demo
npm start
```

Then open your browser to `http://localhost:3000`

See [demo/README.md](demo/README.md) for detailed instructions and features.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

MIT © ShadowCache Contributors

## 🔗 Links

- [Documentation](docs/)
- [Demo Application](demo/)
- [Issue Tracker](https://github.com/shadowcache/shadowcache/issues)
- [Changelog](CHANGELOG.md)

## 💡 Technology Stack

- **TypeScript** with strict mode for type safety
- **Vitest** for unit testing
- **fast-check** for property-based testing
- **esbuild** for fast, tree-shakeable builds
- **ES2017+** target for modern browser support

---

**Built with ❤️ for the offline-first web**
