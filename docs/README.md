# ShadowCache Documentation

Welcome to the ShadowCache documentation! This guide will help you find the information you need.

## 📖 Documentation Overview

### For New Users

Start here if you're new to ShadowCache:

1. **[Main README](../README.md)** - Project overview, features, and quick start
2. **[Configuration Guide](CONFIGURATION.md)** - Learn how to configure ShadowCache
3. **[Usage Examples](EXAMPLES.md)** - See common implementation patterns

### For Developers

Deep dive into the API and advanced features:

1. **[API Reference](API.md)** - Complete API documentation
2. **[Error Handling](ERRORS.md)** - Error codes and troubleshooting
3. **[Performance Optimization](PERFORMANCE.md)** - Best practices and tips

### For Migration

Moving from another caching solution:

1. **[Migration Guide](MIGRATION.md)** - Migrate from AppCache, LocalStorage, Workbox, or Cache API

## 📚 Documentation Structure

### [API Reference](API.md)

Complete reference for all ShadowCache APIs:
- ShadowCache class methods
- Configuration types and interfaces
- Error classes and codes
- Utility functions
- Event system

**When to use:** Looking up specific methods, types, or parameters

### [Configuration Guide](CONFIGURATION.md)

Comprehensive guide to configuring ShadowCache:
- Cache rules and strategies
- Predictive caching options
- Delta synchronization setup
- Storage management
- Analytics integration
- UI customization

**When to use:** Setting up or customizing your ShadowCache configuration

### [Usage Examples](EXAMPLES.md)

Real-world examples and patterns:
- Basic initialization
- Cache rule patterns
- Offline handling
- Predictive caching
- Data synchronization
- Analytics integration
- UI integration
- Advanced patterns

**When to use:** Looking for implementation examples or best practices

### [Error Handling](ERRORS.md)

Error codes, troubleshooting, and solutions:
- Error classes and types
- Complete error code reference
- Common errors and solutions
- Troubleshooting guides
- Error handling patterns

**When to use:** Debugging issues or implementing error handling

### [Migration Guide](MIGRATION.md)

Step-by-step migration from other solutions:
- Migrating from AppCache
- Migrating from LocalStorage
- Migrating from Service Worker Cache API
- Migrating from Workbox
- Migration checklist and common issues

**When to use:** Replacing an existing caching solution

### [Performance Optimization](PERFORMANCE.md)

Optimization strategies and best practices:
- Bundle size optimization
- Runtime performance
- Storage optimization
- Network optimization
- Memory management
- Monitoring and profiling

**When to use:** Optimizing performance or troubleshooting performance issues

## 🚀 Quick Links

### Common Tasks

- **Initialize ShadowCache:** [Quick Start](../README.md#-quick-start)
- **Configure cache rules:** [Cache Rules](CONFIGURATION.md#cache-rules)
- **Handle offline mode:** [Offline Handling](EXAMPLES.md#offline-handling)
- **Set up sync:** [Data Synchronization](EXAMPLES.md#data-synchronization)
- **Integrate analytics:** [Analytics Integration](EXAMPLES.md#analytics-integration)
- **Optimize performance:** [Performance Guide](PERFORMANCE.md)
- **Debug errors:** [Error Handling](ERRORS.md)
- **Migrate from AppCache:** [Migration Guide](MIGRATION.md#migrating-from-appcache)

### API Quick Reference

```typescript
// Initialize
const cache = await ShadowCache.init(config);

// Get status
const status = await cache.getStatus();

// Clear cache
await cache.clearCache(pattern?);

// Prefetch resources
await cache.prefetch(urls);

// Sync changes
const result = await cache.sync();

// Event listeners
cache.on(event, handler);
cache.off(event, handler);
```

### Configuration Quick Reference

```typescript
{
  cacheRules: [
    {
      id: string,
      pattern: string | RegExp,
      strategy: 'network-first' | 'cache-first' | 'stale-while-revalidate' | 'cache-only',
      priority: 1-10,
      maxAge?: number,
      maxEntries?: number,
      networkTimeout?: number,
      sensitive?: boolean,
    },
  ],
  predictive?: { /* ... */ },
  sync?: { /* ... */ },
  storage?: { /* ... */ },
  analytics?: { /* ... */ },
  ui?: { /* ... */ },
}
```

## 🔍 Finding Information

### By Topic

- **Installation:** [Main README](../README.md#-installation)
- **Configuration:** [Configuration Guide](CONFIGURATION.md)
- **API Methods:** [API Reference](API.md)
- **Examples:** [Usage Examples](EXAMPLES.md)
- **Errors:** [Error Handling](ERRORS.md)
- **Migration:** [Migration Guide](MIGRATION.md)
- **Performance:** [Performance Guide](PERFORMANCE.md)

### By Use Case

- **E-commerce site:** [Examples - E-commerce](EXAMPLES.md#e-commerce-site)
- **Content platform:** [Examples - Content Platform](EXAMPLES.md#content-platform)
- **Progressive Web App:** [Examples - PWA](EXAMPLES.md#progressive-web-app)
- **Offline-first app:** [Configuration - Cache Strategies](CONFIGURATION.md#caching-strategies)

### By Problem

- **App not working offline:** [Troubleshooting - Cache Not Working](ERRORS.md#cache-not-working)
- **Storage quota exceeded:** [Error - STORAGE_FULL](ERRORS.md#storage_full)
- **Sync conflicts:** [Error - SYNC_CONFLICT](ERRORS.md#sync_conflict)
- **Slow performance:** [Performance - Troubleshooting](PERFORMANCE.md#troubleshooting-performance-issues)
- **Large bundle size:** [Performance - Bundle Size](PERFORMANCE.md#bundle-size-optimization)

## 💡 Tips

### For Beginners

1. Start with the [Quick Start](../README.md#-quick-start) guide
2. Try the [demo application](../demo/)
3. Review [basic examples](EXAMPLES.md#basic-initialization)
4. Experiment with different [cache strategies](CONFIGURATION.md#caching-strategies)

### For Advanced Users

1. Explore [advanced patterns](EXAMPLES.md#advanced-patterns)
2. Optimize with the [performance guide](PERFORMANCE.md)
3. Implement custom [analytics providers](EXAMPLES.md#analytics-integration)
4. Fine-tune [predictive caching](CONFIGURATION.md#predictive-caching)

### For Troubleshooting

1. Check [common errors](ERRORS.md#common-errors)
2. Review [troubleshooting guides](ERRORS.md#troubleshooting)
3. Enable debug mode: `localStorage.setItem('shadowcache:debug', 'true')`
4. Check browser console for errors
5. Verify [browser compatibility](../README.md#-browser-compatibility)

## 🤝 Getting Help

If you can't find what you're looking for:

1. Search the documentation using your browser's find function (Ctrl/Cmd + F)
2. Check the [GitHub Issues](https://github.com/shadowcache/shadowcache/issues)
3. Review the [demo application](../demo/) source code
4. Create a new issue with your question

## 📝 Contributing to Documentation

Found an error or want to improve the docs?

1. Fork the repository
2. Make your changes
3. Submit a pull request

All documentation is written in Markdown and located in the `docs/` directory.

---

**Need help?** Start with the [Quick Start](../README.md#-quick-start) or browse the guides above.
