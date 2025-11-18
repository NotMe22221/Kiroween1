# 🚀 ShadowCache Quick Start Guide

Get up and running with ShadowCache in under 5 minutes!

## 📦 Installation

```bash
npm install @shadowcache/sdk
```

## 🎯 Basic Usage

### 1. Initialize ShadowCache

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
```

### 2. Listen for Events

```typescript
// Ready event
cache.on('ready', ({ status }) => {
  console.log('ShadowCache ready!', status);
});

// Online/offline transitions
cache.on('state-change', ({ online }) => {
  console.log(online ? 'Online' : 'Offline');
});

// Cache hits/misses
cache.on('cache-hit', ({ url }) => {
  console.log('Cache hit:', url);
});
```

### 3. Manual Operations

```typescript
// Get cache status
const status = await cache.getStatus();
console.log('Cached resources:', status.cachedResourceCount);

// Clear cache
await cache.clearCache();

// Prefetch resources
await cache.prefetch(['/api/users', '/api/posts']);

// Manual sync
const result = await cache.sync();
console.log('Synced:', result.synced, 'items');
```

## 🎨 Caching Strategies

### Network-First
Best for: Frequently changing data
```typescript
{
  strategy: 'network-first',
  priority: 8,
  maxAge: 300000 // 5 minutes
}
```

### Cache-First
Best for: Static content
```typescript
{
  strategy: 'cache-first',
  priority: 7,
  maxAge: 86400000 // 24 hours
}
```

### Stale-While-Revalidate
Best for: Semi-dynamic content
```typescript
{
  strategy: 'stale-while-revalidate',
  priority: 6,
  maxAge: 600000 // 10 minutes
}
```

### Cache-Only
Best for: Offline-only resources
```typescript
{
  strategy: 'cache-only',
  priority: 5
}
```

## 🧠 Predictive Caching

Enable predictive caching to automatically prefetch resources:

```typescript
const cache = await ShadowCache.init({
  cacheRules: [...],
  predictive: {
    enabled: true,
    learningRate: 0.8,
    minConfidence: 0.6,
    maxPrefetchSize: 5242880, // 5MB
    idleThreshold: 2000 // 2 seconds
  }
});
```

## 🔄 Delta Sync

Configure delta synchronization for efficient data sync:

```typescript
const cache = await ShadowCache.init({
  cacheRules: [...],
  sync: {
    endpoint: 'https://api.example.com/sync',
    batchSize: 50,
    retryAttempts: 3,
    conflictResolution: 'server-wins' // or 'client-wins', 'manual'
  }
});

// Sync manually
const result = await cache.sync();
console.log(`Synced ${result.synced} changes`);
```

## 💾 Storage Configuration

Customize storage behavior:

```typescript
const cache = await ShadowCache.init({
  cacheRules: [...],
  storage: {
    maxSize: 50 * 1024 * 1024, // 50MB
    evictionPolicy: 'priority', // or 'lru', 'lfu'
    encryption: true // Enable encryption for sensitive data
  }
});
```

## 🎨 Shadow Mode UI

### React Component

```tsx
import { ShadowIndicator } from '@shadowcache/ui';

function App() {
  return (
    <ShadowIndicator
      isOnline={isOnline}
      cacheStatus={cacheStatus}
      syncStatus={syncStatus}
      onSync={() => cache.sync()}
    />
  );
}
```

### Web Component

```html
<shadow-indicator
  is-online="true"
  cache-status='{"used": 1024, "total": 5242880}'
  sync-status='{"status": "idle"}'
></shadow-indicator>

<script type="module">
  import '@shadowcache/ui/web-component';
</script>
```

## 📊 Analytics Integration

Track caching performance:

```typescript
const cache = await ShadowCache.init({
  cacheRules: [...],
  analytics: {
    providers: [
      {
        name: 'custom-analytics',
        track: (event) => {
          console.log('Analytics event:', event);
          // Send to your analytics service
        }
      }
    ],
    sampleRate: 1.0 // 100% sampling
  }
});
```

## 🔒 Security Best Practices

### 1. Never Cache Credentials

```typescript
// ❌ BAD - Will be rejected
{
  pattern: '/api/auth/**',
  strategy: 'cache-first'
}

// ✅ GOOD - Exclude auth endpoints
{
  pattern: '/api/!(auth)/**',
  strategy: 'cache-first'
}
```

### 2. Encrypt Sensitive Data

```typescript
{
  id: 'user-data',
  pattern: '/api/user/**',
  strategy: 'network-first',
  priority: 10,
  sensitive: true // Enables encryption
}
```

### 3. Use HTTPS

```typescript
// Always use HTTPS for sensitive resources
{
  pattern: 'https://api.example.com/secure/**',
  strategy: 'network-first'
}
```

## 🐛 Error Handling

```typescript
try {
  const cache = await ShadowCache.init(config);
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error('Invalid config:', error.details);
  } else if (error instanceof StorageError) {
    console.error('Storage failed:', error.message);
  } else {
    console.error('Initialization failed:', error);
  }
}
```

## 📱 Common Patterns

### PWA Setup

```typescript
// Initialize ShadowCache
const cache = await ShadowCache.init({
  cacheRules: [
    // Cache app shell
    {
      id: 'app-shell',
      pattern: '/(index.html|app.js|styles.css)',
      strategy: 'cache-first',
      priority: 10
    },
    // Cache API data
    {
      id: 'api-data',
      pattern: '/api/**',
      strategy: 'network-first',
      priority: 8
    },
    // Cache images
    {
      id: 'images',
      pattern: '/images/**',
      strategy: 'cache-first',
      priority: 5,
      maxAge: 604800000 // 7 days
    }
  ]
});

// Show offline indicator
cache.on('state-change', ({ online }) => {
  document.body.classList.toggle('offline', !online);
});
```

### E-commerce Site

```typescript
const cache = await ShadowCache.init({
  cacheRules: [
    // Product catalog
    {
      id: 'products',
      pattern: '/api/products/**',
      strategy: 'stale-while-revalidate',
      priority: 8,
      maxAge: 3600000 // 1 hour
    },
    // Shopping cart
    {
      id: 'cart',
      pattern: '/api/cart',
      strategy: 'network-first',
      priority: 10,
      maxAge: 300000 // 5 minutes
    },
    // Product images
    {
      id: 'product-images',
      pattern: '/images/products/**',
      strategy: 'cache-first',
      priority: 6,
      maxAge: 86400000 // 24 hours
    }
  ],
  predictive: {
    enabled: true,
    learningRate: 0.9,
    minConfidence: 0.7
  }
});
```

### Content Platform

```typescript
const cache = await ShadowCache.init({
  cacheRules: [
    // Articles
    {
      id: 'articles',
      pattern: '/api/articles/**',
      strategy: 'cache-first',
      priority: 7,
      maxAge: 3600000 // 1 hour
    },
    // Comments
    {
      id: 'comments',
      pattern: '/api/comments/**',
      strategy: 'stale-while-revalidate',
      priority: 6,
      maxAge: 600000 // 10 minutes
    },
    // Media files
    {
      id: 'media',
      pattern: '/media/**',
      strategy: 'cache-first',
      priority: 5,
      maxAge: 604800000 // 7 days
    }
  ],
  sync: {
    endpoint: '/api/sync',
    batchSize: 100,
    conflictResolution: 'server-wins'
  }
});
```

## 🎯 Performance Tips

### 1. Set Appropriate Priorities

```typescript
// Critical resources: 8-10
{ pattern: '/api/user', priority: 10 }

// Important resources: 5-7
{ pattern: '/api/posts', priority: 7 }

// Nice-to-have: 1-4
{ pattern: '/images/**', priority: 3 }
```

### 2. Configure Max Age

```typescript
// Frequently changing: 5-10 minutes
{ maxAge: 300000 }

// Occasionally changing: 1-6 hours
{ maxAge: 3600000 }

// Rarely changing: 1-7 days
{ maxAge: 86400000 }
```

### 3. Limit Cache Size

```typescript
{
  storage: {
    maxSize: 50 * 1024 * 1024, // 50MB
    evictionPolicy: 'priority'
  }
}
```

### 4. Use Predictive Caching Wisely

```typescript
{
  predictive: {
    enabled: true,
    maxPrefetchSize: 5 * 1024 * 1024, // 5MB max
    idleThreshold: 2000 // Wait 2s before prefetching
  }
}
```

## 📚 Next Steps

- 📖 Read the [Full Documentation](docs/API.md)
- 🎮 Try the [Demo Application](demo/)
- 💡 Check out [Usage Examples](docs/EXAMPLES.md)
- 🔧 Explore [Configuration Options](docs/CONFIGURATION.md)
- 🚀 Review [Performance Guide](docs/PERFORMANCE.md)

## 🆘 Need Help?

- 📝 [GitHub Issues](https://github.com/shadowcache/shadowcache/issues)
- 💬 [Discussions](https://github.com/shadowcache/shadowcache/discussions)
- 📚 [Full Documentation](README.md)

---

**Built with ❤️ for the offline-first web**

🌑 **ShadowCache** - Modern offline-first caching with predictive intelligence
