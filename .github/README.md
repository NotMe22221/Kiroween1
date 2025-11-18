# 🌑 ShadowCache

<div align="center">

![ShadowCache Banner](https://img.shields.io/badge/ShadowCache-v0.1.0-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMxZTI5M2IiLz4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNiIgZmlsbD0iIzYzNjZmMSIvPgo8L3N2Zz4=)

**Modern offline-first caching engine with predictive intelligence**

[![npm version](https://img.shields.io/npm/v/@shadowcache/sdk.svg?style=flat-square)](https://www.npmjs.com/package/@shadowcache/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Bundle Size](https://img.shields.io/badge/bundle-1.78%20KB-success?style=flat-square)](README.md)
[![Test Coverage](https://img.shields.io/badge/coverage-80%25+-success?style=flat-square)](README.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

[Quick Start](../QUICK_START.md) • [Demo](../demo/) • [Documentation](../docs/) • [API Reference](../docs/API.md) • [Contributing](../CONTRIBUTING.md)

</div>

---

## ✨ Features at a Glance

<table>
<tr>
<td width="50%">

### 🚀 Zero Configuration
```typescript
const cache = await ShadowCache.init({
  cacheRules: [
    { pattern: '/api/**', 
      strategy: 'network-first', 
      priority: 8 }
  ]
});
```

</td>
<td width="50%">

### 🧠 Predictive Intelligence
- Learns navigation patterns
- Predicts next resources
- Prefetches during idle time
- Confidence-based decisions

</td>
</tr>
<tr>
<td width="50%">

### 📡 Offline-First
- Seamless online/offline transitions
- Multiple caching strategies
- Storage fallback chain
- Service Worker integration

</td>
<td width="50%">

### 🔄 Delta Sync
```typescript
const result = await cache.sync();
// Synced 42 items, 12.5 KB transferred
```

</td>
</tr>
</table>

## 🎯 Why ShadowCache?

| Feature | ShadowCache | Workbox | sw-toolbox | AppCache |
|---------|-------------|---------|------------|----------|
| Bundle Size | **1.78 KB** | ~20 KB | ~15 KB | N/A |
| Predictive Caching | ✅ | ❌ | ❌ | ❌ |
| Delta Sync | ✅ | ❌ | ❌ | ❌ |
| Storage Fallback | ✅ | ❌ | ❌ | ❌ |
| TypeScript Native | ✅ | ✅ | ❌ | N/A |
| Zero Config | ✅ | ❌ | ❌ | ❌ |
| Security First | ✅ | ⚠️ | ⚠️ | ❌ |
| Active Development | ✅ | ✅ | ❌ | ❌ (Deprecated) |

## 📦 Installation

```bash
npm install @shadowcache/sdk
```

## 🎮 Try the Demo

Experience ShadowCache in action with our stunning demo application:

```bash
npm run build
cd demo
npx serve . -p 3000
```

**Features**:
- 🌐 Real-time connectivity status
- 📊 Cache metrics dashboard
- 🧠 Predictive caching visualization
- ⚡ Performance metrics
- 🎨 Beautiful Shadow Mode UI

## 📚 Quick Links

### Getting Started
- 🚀 [Quick Start Guide](../QUICK_START.md) - Get up and running in 5 minutes
- 📖 [Full Documentation](../README.md) - Complete project documentation
- 🎮 [Demo Application](../demo/) - Interactive demo with all features

### Guides & References
- 📘 [API Reference](../docs/API.md) - Complete API documentation
- ⚙️ [Configuration Guide](../docs/CONFIGURATION.md) - All configuration options
- 💡 [Usage Examples](../docs/EXAMPLES.md) - Common use cases
- 🏗️ [Architecture](../docs/ARCHITECTURE.md) - System design and internals

### Contributing
- 🤝 [Contributing Guide](../CONTRIBUTING.md) - How to contribute
- 📋 [Changelog](../CHANGELOG.md) - Version history
- 📊 [Project Summary](../PROJECT_SUMMARY.md) - Project overview

## 🎨 Code Examples

### Basic Setup

```typescript
import { ShadowCache } from '@shadowcache/sdk';

const cache = await ShadowCache.init({
  cacheRules: [
    {
      id: 'api-cache',
      pattern: '/api/**',
      strategy: 'network-first',
      priority: 8,
      maxAge: 3600000 // 1 hour
    }
  ]
});

cache.on('ready', () => console.log('ShadowCache ready!'));
```

### With Predictive Caching

```typescript
const cache = await ShadowCache.init({
  cacheRules: [...],
  predictive: {
    enabled: true,
    learningRate: 0.8,
    minConfidence: 0.6,
    maxPrefetchSize: 5242880 // 5MB
  }
});
```

### With Delta Sync

```typescript
const cache = await ShadowCache.init({
  cacheRules: [...],
  sync: {
    endpoint: 'https://api.example.com/sync',
    batchSize: 50,
    conflictResolution: 'server-wins'
  }
});

const result = await cache.sync();
console.log(`Synced ${result.synced} changes`);
```

## 🏆 Achievements

<div align="center">

### Bundle Size Achievement 🎉
**Target**: < 50 KB gzipped  
**Achieved**: **1.78 KB gzipped**  
**96.4% under target!**

### Testing Coverage 🧪
**34 correctness properties**  
**100+ iterations per property**  
**80%+ test coverage**

### Performance ⚡
**< 100ms** initialization  
**< 10ms** cache serving  
**< 5%** CPU usage

</div>

## 🌐 Browser Support

| Browser | Minimum Version |
|---------|----------------|
| Chrome  | 40+            |
| Firefox | 44+            |
| Safari  | 11.1+          |
| Edge    | 17+            |

## 📊 Project Stats

- **7 packages** in monorepo
- **~8.96 KB** total bundle size (gzipped)
- **34 correctness properties** validated
- **13 documentation files**
- **4 caching strategies**
- **3 storage levels** with fallback
- **2 UI frameworks** supported

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](../CONTRIBUTING.md) for details.

### Ways to Contribute
- 🐛 Report bugs
- 💡 Suggest features
- 📝 Improve documentation
- 🔧 Submit pull requests
- ⭐ Star the repository

## 📄 License

MIT © ShadowCache Contributors

## 🙏 Built With

- TypeScript for type safety
- Vitest for testing
- fast-check for property-based testing
- esbuild for bundling
- Web Crypto API for encryption
- Service Workers for offline capability

---

<div align="center">

**Built with ❤️ for the offline-first web**

[⬆ Back to Top](#-shadowcache)

</div>
