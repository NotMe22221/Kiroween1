# Performance Optimization Guide

Best practices and tips for optimizing ShadowCache performance.

## Table of Contents

- [Bundle Size Optimization](#bundle-size-optimization)
- [Runtime Performance](#runtime-performance)
- [Storage Optimization](#storage-optimization)
- [Network Optimization](#network-optimization)
- [Memory Management](#memory-management)
- [Monitoring and Profiling](#monitoring-and-profiling)

## Bundle Size Optimization

### Tree-Shaking

ShadowCache is designed to be tree-shakeable. Import only what you need:

```typescript
// ❌ Imports everything
import * as ShadowCache from '@shadowcache/sdk';

// ✅ Import only what you need
import { ShadowCache } from '@shadowcache/sdk';
import type { CacheRule, CacheStatus } from '@shadowcache/sdk';
```

### Module Imports

Import individual modules for smaller bundles:

```typescript
// If you only need storage
import { StorageManager } from '@shadowcache/storage';

// If you only need analytics
import { AnalyticsHooks } from '@shadowcache/analytics';

// If you only need UI components
import { ShadowIndicator } from '@shadowcache/ui/react';
```

### Code Splitting

Split ShadowCache initialization for faster initial load:

```typescript
// Load ShadowCache lazily
async function initializeOfflineSupport() {
  const { ShadowCache } = await import('@shadowcache/sdk');
  
  const cache = await ShadowCache.init({
    cacheRules: [/* ... */],
  });
  
  return cache;
}

// Initialize after critical content loads
window.addEventListener('load', () => {
  initializeOfflineSupport();
});
```

### Conditional Loading

Load ShadowCache only when needed:

```typescript
// Only load if Service Workers are supported
if ('serviceWorker' in navigator) {
  const { ShadowCache } = await import('@shadowcache/sdk');
  const cache = await ShadowCache.init(config);
}

// Only load on slow connections
if (navigator.connection?.effectiveType === '2g' || 
    navigator.connection?.effectiveType === 'slow-2g') {
  const { ShadowCache } = await import('@shadowcache/sdk');
  const cache = await ShadowCache.init(config);
}
```

### Bundle Analysis

Analyze your bundle to identify optimization opportunities:

```bash
# Using webpack-bundle-analyzer
npm install --save-dev webpack-bundle-analyzer

# Using rollup-plugin-visualizer
npm install --save-dev rollup-plugin-visualizer
```

**Target:** Core SDK should be < 50KB gzipped

## Runtime Performance

### Initialization Optimization

Optimize initialization for faster startup:

```typescript
// ✅ Minimal configuration for fast init
const cache = await ShadowCache.init({
  cacheRules: [
    {
      id: 'default',
      pattern: '/**',
      strategy: 'network-first',
      priority: 5,
    },
  ],
  // Disable optional features initially
  predictive: {
    enabled: false, // Enable later if needed
  },
});

// Enable predictive caching after app is ready
setTimeout(() => {
  // Enable predictive features
}, 5000);
```

### Lazy Feature Activation

Enable features progressively:

```typescript
const cache = await ShadowCache.init({
  cacheRules: [/* ... */],
  // Start with minimal features
});

// Enable predictive caching when idle
requestIdleCallback(() => {
  // Activate predictive engine
  cache.predictor?.startPrefetching();
});

// Enable analytics after critical operations
setTimeout(() => {
  // Start tracking analytics
}, 10000);
```

### Efficient Cache Rules

Optimize cache rule matching:

```typescript
// ❌ Slow - many overlapping rules
cacheRules: [
  { pattern: '/api/users/**', /* ... */ },
  { pattern: '/api/users/*/profile', /* ... */ },
  { pattern: '/api/users/*/settings', /* ... */ },
  { pattern: '/api/users/*/posts', /* ... */ },
]

// ✅ Fast - fewer, more general rules
cacheRules: [
  { 
    pattern: '/api/users/**', 
    priority: 8,
    /* ... */ 
  },
]
```

### Pattern Matching Performance

Use efficient patterns:

```typescript
// ❌ Slow - complex regex
{
  pattern: /^\/api\/(?:users|posts|comments)\/\d+\/(?:profile|settings)$/,
}

// ✅ Fast - simple glob
{
  pattern: '/api/**',
}

// ✅ Fast - simple regex
{
  pattern: /^\/api\//,
}
```

### Priority Optimization

Use priorities to avoid unnecessary matching:

```typescript
cacheRules: [
  // High priority rules checked first
  {
    id: 'critical',
    pattern: '/api/auth/**',
    strategy: 'network-first',
    priority: 10, // Checked first
  },
  // Lower priority for less common patterns
  {
    id: 'general',
    pattern: '/**',
    strategy: 'network-first',
    priority: 5, // Checked last
  },
]
```

## Storage Optimization

### Storage Limits

Set appropriate storage limits:

```typescript
{
  storage: {
    maxSize: 52428800, // 50MB - reasonable default
    evictionPolicy: 'priority',
  },
}

// For media-heavy apps
{
  storage: {
    maxSize: 209715200, // 200MB
    evictionPolicy: 'lru',
  },
}

// For data-light apps
{
  storage: {
    maxSize: 10485760, // 10MB
    evictionPolicy: 'lfu',
  },
}
```

### Eviction Policies

Choose the right eviction policy:

```typescript
// Priority-based - best for mixed content
{
  evictionPolicy: 'priority', // Evict low-priority items first
}

// LRU - best for time-sensitive content
{
  evictionPolicy: 'lru', // Evict least recently used
}

// LFU - best for frequently accessed content
{
  evictionPolicy: 'lfu', // Evict least frequently used
}
```

### Selective Caching

Cache only what's necessary:

```typescript
cacheRules: [
  // Don't cache large files
  {
    id: 'videos',
    pattern: /\.mp4$/,
    strategy: 'network-first',
    priority: 3,
    maxAge: 0, // Don't cache
  },
  // Cache small, frequently used files
  {
    id: 'icons',
    pattern: /\.svg$/,
    strategy: 'cache-first',
    priority: 8,
    maxAge: 2592000000, // 30 days
  },
]
```

### Entry Limits

Limit cache entries per rule:

```typescript
{
  id: 'api',
  pattern: '/api/**',
  strategy: 'network-first',
  priority: 7,
  maxEntries: 100, // Limit to 100 entries
  maxAge: 3600000, // 1 hour
}
```

### Compression

Enable compression for text-based resources:

```typescript
// Server-side: Enable gzip/brotli compression
// ShadowCache automatically handles compressed responses

// Client-side: Store compressed data
{
  id: 'json-api',
  pattern: '/api/**/*.json',
  strategy: 'network-first',
  priority: 7,
  // Responses are stored compressed if server sends them compressed
}
```

## Network Optimization

### Prefetch Strategy

Optimize prefetching:

```typescript
{
  predictive: {
    enabled: true,
    maxPrefetchSize: 2097152, // 2MB - conservative
    idleThreshold: 2000, // Wait 2s before prefetching
    minConfidence: 0.7, // Only prefetch high-confidence predictions
  },
}
```

### Network Timeouts

Set appropriate timeouts:

```typescript
cacheRules: [
  // Fast timeout for API calls
  {
    id: 'api',
    pattern: '/api/**',
    strategy: 'network-first',
    priority: 8,
    networkTimeout: 3000, // 3s timeout
  },
  // Longer timeout for large files
  {
    id: 'images',
    pattern: '/images/**',
    strategy: 'network-first',
    priority: 6,
    networkTimeout: 10000, // 10s timeout
  },
]
```

### Batch Synchronization

Optimize sync operations:

```typescript
{
  sync: {
    endpoint: 'https://api.example.com/sync',
    batchSize: 50, // Send 50 changes at once
    retryAttempts: 3,
  },
}

// For slow connections
{
  sync: {
    batchSize: 10, // Smaller batches
    retryAttempts: 5, // More retries
  },
}
```

### Connection-Aware Prefetching

Adjust behavior based on connection:

```typescript
const cache = await ShadowCache.init({
  cacheRules: [/* ... */],
  predictive: {
    enabled: true,
    // Adjust based on connection
    maxPrefetchSize: navigator.connection?.effectiveType === '4g' 
      ? 10485760  // 10MB on fast connection
      : 1048576,  // 1MB on slow connection
  },
});
```

## Memory Management

### Event Listener Cleanup

Clean up event listeners:

```typescript
const cache = await ShadowCache.init(config);

const handler = ({ online }) => {
  console.log('State changed:', online);
};

cache.on('state-change', handler);

// Clean up when component unmounts
function cleanup() {
  cache.off('state-change', handler);
}
```

### Periodic Cache Cleanup

Clear old entries periodically:

```typescript
// Clear cache daily
setInterval(async () => {
  const status = await cache.getStatus();
  
  if (status.storageUsage > 80000000) { // > 80MB
    console.log('Clearing old cache...');
    // Clear specific patterns
    await cache.clearCache('/api/old/**');
  }
}, 86400000); // 24 hours
```

### Analytics Sampling

Reduce memory usage with sampling:

```typescript
{
  analytics: {
    sampleRate: 0.1, // Track only 10% of events
    providers: [/* ... */],
  },
}
```

### Limit Predictive Data

Constrain predictive engine memory:

```typescript
{
  predictive: {
    enabled: true,
    learningRate: 0.8,
    // Limit stored patterns
    maxPatterns: 100, // Store max 100 patterns
  },
}
```

## Monitoring and Profiling

### Performance Monitoring

Track cache performance:

```typescript
const cache = await ShadowCache.init({
  cacheRules: [/* ... */],
  analytics: {
    sampleRate: 1.0,
    providers: [
      {
        name: 'performance',
        track: (event) => {
          if (event.type === 'cache-hit') {
            console.log('Cache hit:', event.data.url);
            // Track cache hit rate
          } else if (event.type === 'cache-miss') {
            console.log('Cache miss:', event.data.url);
            // Track cache miss rate
          }
        },
      },
    ],
  },
});
```

### Storage Usage Monitoring

Monitor storage usage:

```typescript
// Check storage periodically
setInterval(async () => {
  const status = await cache.getStatus();
  
  console.log('Storage usage:', {
    used: status.storageUsage,
    percentage: (status.storageUsage / 104857600 * 100).toFixed(2) + '%',
    resources: status.cachedResourceCount,
  });
  
  // Alert if usage is high
  if (status.storageUsage > 90000000) { // > 90MB
    console.warn('Storage usage high!');
  }
}, 60000); // Every minute
```

### Performance Metrics

Collect performance metrics:

```typescript
const metrics = {
  cacheHits: 0,
  cacheMisses: 0,
  syncOperations: 0,
  syncDuration: [],
};

cache.on('cache-hit', () => {
  metrics.cacheHits++;
});

cache.on('cache-miss', () => {
  metrics.cacheMisses++;
});

cache.on('sync-complete', (result) => {
  metrics.syncOperations++;
  metrics.syncDuration.push(result.duration);
});

// Report metrics
setInterval(() => {
  const hitRate = metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses);
  const avgSyncDuration = metrics.syncDuration.reduce((a, b) => a + b, 0) / metrics.syncDuration.length;
  
  console.log('Performance metrics:', {
    hitRate: (hitRate * 100).toFixed(2) + '%',
    avgSyncDuration: avgSyncDuration.toFixed(2) + 'ms',
  });
}, 300000); // Every 5 minutes
```

### Browser DevTools

Use browser DevTools for profiling:

```typescript
// Enable debug mode
localStorage.setItem('shadowcache:debug', 'true');

// Check Service Worker status
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});

// Check cache storage
caches.keys().then(names => {
  console.log('Cache names:', names);
  names.forEach(name => {
    caches.open(name).then(cache => {
      cache.keys().then(keys => {
        console.log(`${name}:`, keys.length, 'entries');
      });
    });
  });
});

// Check IndexedDB
indexedDB.databases().then(dbs => {
  console.log('IndexedDB databases:', dbs);
});
```

## Performance Checklist

### Initial Load

- [ ] Bundle size < 50KB gzipped
- [ ] Initialization < 100ms
- [ ] Tree-shaking enabled
- [ ] Code splitting configured
- [ ] Lazy loading for optional features

### Runtime

- [ ] Cache rule matching < 10ms
- [ ] Storage operations < 50ms
- [ ] Network timeouts configured
- [ ] Event listeners cleaned up
- [ ] Memory usage stable

### Storage

- [ ] Appropriate maxSize set
- [ ] Eviction policy configured
- [ ] Entry limits per rule
- [ ] Periodic cleanup scheduled
- [ ] Storage usage monitored

### Network

- [ ] Prefetch size limited
- [ ] Connection-aware behavior
- [ ] Batch sync configured
- [ ] Retry logic implemented
- [ ] Timeout values optimized

### Monitoring

- [ ] Analytics sampling configured
- [ ] Performance metrics collected
- [ ] Storage usage tracked
- [ ] Error rates monitored
- [ ] User experience measured

## Performance Targets

| Metric | Target | Excellent |
|--------|--------|-----------|
| Bundle Size (gzipped) | < 50KB | < 30KB |
| Initialization Time | < 100ms | < 50ms |
| Cache Hit Rate | > 70% | > 90% |
| Storage Usage | < 100MB | < 50MB |
| Network Timeout | 3-5s | 2-3s |
| Sync Duration | < 1s | < 500ms |
| Memory Usage | Stable | < 10MB |

## Troubleshooting Performance Issues

### Slow Initialization

**Symptoms:** App takes long to start

**Solutions:**
- Reduce number of cache rules
- Disable predictive caching initially
- Use lazy loading
- Minimize initial prefetch

### High Memory Usage

**Symptoms:** Browser becomes sluggish

**Solutions:**
- Reduce analytics sample rate
- Limit predictive patterns
- Clear cache more frequently
- Reduce maxEntries per rule

### Slow Cache Operations

**Symptoms:** Delayed responses

**Solutions:**
- Simplify cache rule patterns
- Use priority-based matching
- Reduce number of rules
- Optimize storage queries

### Large Bundle Size

**Symptoms:** Slow initial load

**Solutions:**
- Enable tree-shaking
- Import only needed modules
- Use code splitting
- Lazy load optional features

## Best Practices Summary

1. **Start minimal** - Add features as needed
2. **Monitor performance** - Track metrics continuously
3. **Optimize patterns** - Use simple, efficient patterns
4. **Limit storage** - Set appropriate size limits
5. **Clean up** - Remove old data regularly
6. **Test thoroughly** - Profile on real devices
7. **Measure impact** - Track before/after metrics
8. **Iterate** - Continuously optimize based on data
