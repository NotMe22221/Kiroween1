# Migration Guide

Guide for migrating from AppCache, legacy LocalStorage patterns, and other caching solutions to ShadowCache.

## Table of Contents

- [Migrating from AppCache](#migrating-from-appcache)
- [Migrating from LocalStorage](#migrating-from-localstorage)
- [Migrating from Service Worker Cache API](#migrating-from-service-worker-cache-api)
- [Migrating from Workbox](#migrating-from-workbox)
- [Migration Checklist](#migration-checklist)

## Migrating from AppCache

AppCache (Application Cache) was deprecated and removed from modern browsers. ShadowCache provides a modern replacement with better control and reliability.

### AppCache Manifest

**Before (AppCache):**

```appcache
CACHE MANIFEST
# v1.0.0

CACHE:
/index.html
/styles.css
/app.js
/logo.png

NETWORK:
/api/
*

FALLBACK:
/ /offline.html
```

**After (ShadowCache):**

```typescript
import { ShadowCache } from '@shadowcache/sdk';

const cache = await ShadowCache.init({
  cacheRules: [
    // Cache static assets (equivalent to CACHE section)
    {
      id: 'static-assets',
      pattern: /\/(index\.html|styles\.css|app\.js|logo\.png)$/,
      strategy: 'cache-first',
      priority: 9,
      maxAge: 86400000, // 24 hours
    },
    // Network-first for API (equivalent to NETWORK section)
    {
      id: 'api',
      pattern: '/api/**',
      strategy: 'network-first',
      priority: 8,
      networkTimeout: 5000,
    },
    // Fallback for other pages (equivalent to FALLBACK section)
    {
      id: 'pages',
      pattern: '/**',
      strategy: 'network-first',
      priority: 5,
    },
  ],
});
```

### Key Differences

| AppCache | ShadowCache |
|----------|-------------|
| Declarative manifest | Programmatic configuration |
| All-or-nothing updates | Granular cache control |
| Limited strategies | Multiple caching strategies |
| No versioning | Built-in version detection |
| Poor error handling | Comprehensive error handling |
| No offline detection | Automatic offline detection |

### Migration Steps

1. **Remove AppCache manifest:**
```html
<!-- Remove this -->
<html manifest="cache.appcache">
```

2. **Install ShadowCache:**
```bash
npm install @shadowcache/sdk
```

3. **Convert manifest to configuration:**
```typescript
// Map CACHE section to cache-first rules
// Map NETWORK section to network-first rules
// Map FALLBACK section to network-first with fallback
```

4. **Initialize in your app:**
```typescript
import { ShadowCache } from '@shadowcache/sdk';

const cache = await ShadowCache.init({
  cacheRules: [/* converted rules */],
});
```

5. **Test offline functionality**

6. **Remove AppCache references from HTML**

## Migrating from LocalStorage

Legacy patterns using LocalStorage for caching can be replaced with ShadowCache's intelligent storage management.

### Manual LocalStorage Caching

**Before (LocalStorage):**

```javascript
// Fetch and cache
async function fetchData(url) {
  const cached = localStorage.getItem(url);
  
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    // Use cache if less than 1 hour old
    if (age < 3600000) {
      return data;
    }
  }
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    localStorage.setItem(url, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
    
    return data;
  } catch (error) {
    // Return stale cache on error
    if (cached) {
      return JSON.parse(cached).data;
    }
    throw error;
  }
}
```

**After (ShadowCache):**

```typescript
import { ShadowCache } from '@shadowcache/sdk';

const cache = await ShadowCache.init({
  cacheRules: [
    {
      id: 'api-data',
      pattern: '/api/**',
      strategy: 'network-first',
      priority: 8,
      maxAge: 3600000, // 1 hour
      networkTimeout: 5000,
    },
  ],
});

// Just fetch - caching is automatic
async function fetchData(url) {
  const response = await fetch(url);
  return await response.json();
}
```

### LocalStorage Data Migration

If you have existing data in LocalStorage:

```typescript
// Migrate existing LocalStorage data
async function migrateLocalStorageData() {
  const cache = await ShadowCache.init({
    cacheRules: [/* ... */],
  });
  
  // Get all LocalStorage keys
  const keys = Object.keys(localStorage);
  
  for (const key of keys) {
    if (key.startsWith('/api/')) {
      try {
        const cached = JSON.parse(localStorage.getItem(key));
        
        // Prefetch to populate ShadowCache
        await cache.prefetch([key]);
        
        // Remove from LocalStorage
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Failed to migrate ${key}:`, error);
      }
    }
  }
  
  console.log('Migration complete');
}
```

### Benefits of Migration

| LocalStorage | ShadowCache |
|--------------|-------------|
| 5-10MB limit | 50MB+ (IndexedDB) |
| Synchronous API | Async API (non-blocking) |
| String-only storage | Binary data support |
| Manual expiration | Automatic expiration |
| No offline detection | Built-in offline handling |
| Manual fallback | Automatic fallback chain |

## Migrating from Service Worker Cache API

If you're using the raw Cache API in Service Workers:

### Raw Cache API

**Before (Cache API):**

```javascript
// service-worker.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/styles.css',
        '/app.js',
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

**After (ShadowCache):**

```typescript
// main.js
import { ShadowCache } from '@shadowcache/sdk';

const cache = await ShadowCache.init({
  cacheRules: [
    {
      id: 'static',
      pattern: /\/(styles\.css|app\.js)$/,
      strategy: 'cache-first',
      priority: 9,
    },
    {
      id: 'pages',
      pattern: '/**',
      strategy: 'network-first',
      priority: 5,
    },
  ],
});

// Prefetch critical resources
await cache.prefetch(['/', '/styles.css', '/app.js']);
```

### Migration Steps

1. **Remove custom Service Worker:**
```javascript
// Remove service-worker.js
// Remove registration code
```

2. **Install ShadowCache:**
```bash
npm install @shadowcache/sdk
```

3. **Convert caching logic to rules:**
```typescript
// Map cache.match() → cache-first strategy
// Map fetch() fallback → network-first strategy
// Map cache.addAll() → prefetch()
```

4. **Initialize ShadowCache:**
```typescript
const cache = await ShadowCache.init({
  cacheRules: [/* converted rules */],
});
```

5. **Test thoroughly**

## Migrating from Workbox

Workbox is a popular Service Worker library. ShadowCache provides similar functionality with additional features.

### Workbox Configuration

**Before (Workbox):**

```javascript
// service-worker.js
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache API calls
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// Cache CSS/JS
registerRoute(
  ({ request }) => 
    request.destination === 'style' || 
    request.destination === 'script',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);
```

**After (ShadowCache):**

```typescript
import { ShadowCache } from '@shadowcache/sdk';

const cache = await ShadowCache.init({
  cacheRules: [
    // Images - cache first
    {
      id: 'images',
      pattern: /\.(png|jpg|jpeg|gif|svg|webp)$/,
      strategy: 'cache-first',
      priority: 7,
      maxAge: 2592000000, // 30 days
      maxEntries: 60,
    },
    // API - network first
    {
      id: 'api',
      pattern: '/api/**',
      strategy: 'network-first',
      priority: 8,
      maxAge: 300000, // 5 minutes
      maxEntries: 50,
    },
    // CSS/JS - stale while revalidate
    {
      id: 'static',
      pattern: /\.(css|js)$/,
      strategy: 'stale-while-revalidate',
      priority: 9,
    },
  ],
});
```

### Strategy Mapping

| Workbox | ShadowCache |
|---------|-------------|
| CacheFirst | cache-first |
| NetworkFirst | network-first |
| StaleWhileRevalidate | stale-while-revalidate |
| CacheOnly | cache-only |
| NetworkOnly | network-first (no cache) |

### Additional Features in ShadowCache

1. **Predictive Caching:**
```typescript
{
  predictive: {
    enabled: true,
    learningRate: 0.8,
    minConfidence: 0.6,
  },
}
```

2. **Delta Sync:**
```typescript
{
  sync: {
    endpoint: 'https://api.example.com/sync',
    batchSize: 50,
    retryAttempts: 3,
  },
}
```

3. **Analytics Integration:**
```typescript
{
  analytics: {
    providers: [/* ... */],
  },
}
```

4. **Built-in UI Components:**
```typescript
import { ShadowIndicator } from '@shadowcache/ui/react';
```

## Migration Checklist

### Pre-Migration

- [ ] Audit current caching implementation
- [ ] Document all cached resources
- [ ] Identify caching strategies used
- [ ] Note any custom logic or edge cases
- [ ] Back up current implementation

### During Migration

- [ ] Install ShadowCache: `npm install @shadowcache/sdk`
- [ ] Create configuration mapping old rules to new
- [ ] Initialize ShadowCache in application
- [ ] Test in development environment
- [ ] Verify all resources are cached correctly
- [ ] Test offline functionality
- [ ] Check error handling
- [ ] Verify performance is acceptable

### Post-Migration

- [ ] Remove old caching code
- [ ] Remove old Service Worker files
- [ ] Update documentation
- [ ] Monitor for errors in production
- [ ] Gather user feedback
- [ ] Optimize configuration based on analytics

### Testing Checklist

- [ ] Test online → offline transition
- [ ] Test offline → online transition
- [ ] Verify cached resources load offline
- [ ] Test uncached resources show appropriate errors
- [ ] Verify cache expiration works
- [ ] Test cache clearing
- [ ] Verify storage fallback chain
- [ ] Test on multiple browsers
- [ ] Test on mobile devices
- [ ] Verify performance metrics

## Common Migration Issues

### Issue: Service Worker Conflicts

**Problem:** Old Service Worker conflicts with ShadowCache

**Solution:**
```typescript
// Unregister old Service Workers
navigator.serviceWorker.getRegistrations().then((registrations) => {
  for (const registration of registrations) {
    registration.unregister();
  }
});

// Then initialize ShadowCache
const cache = await ShadowCache.init(config);
```

### Issue: Cache Version Mismatch

**Problem:** Old cached data incompatible with new system

**Solution:**
```typescript
// Clear old cache before migration
await caches.keys().then((names) => {
  return Promise.all(
    names.map((name) => caches.delete(name))
  );
});

// Then initialize ShadowCache
const cache = await ShadowCache.init(config);
```

### Issue: LocalStorage Quota Exceeded

**Problem:** Too much data in LocalStorage

**Solution:**
```typescript
// Clear old LocalStorage data
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key.startsWith('cache:')) {
    keysToRemove.push(key);
  }
}
keysToRemove.forEach(key => localStorage.removeItem(key));

// ShadowCache uses IndexedDB with larger quota
```

### Issue: Different Caching Behavior

**Problem:** Resources cached differently than before

**Solution:**
```typescript
// Adjust strategies to match old behavior
{
  cacheRules: [
    {
      id: 'match-old-behavior',
      pattern: '/api/**',
      strategy: 'network-first', // Match old behavior
      networkTimeout: 5000,      // Add timeout for fallback
      maxAge: 3600000,           // Match old expiration
    },
  ],
}
```

## Getting Help

If you encounter issues during migration:

1. Check the [Error Handling Guide](ERRORS.md)
2. Review [Configuration Guide](CONFIGURATION.md)
3. See [Examples](EXAMPLES.md) for common patterns
4. Search [GitHub Issues](https://github.com/shadowcache/shadowcache/issues)
5. Create a new issue with migration details

## Migration Support

For complex migrations or enterprise support:

- Review the [API Reference](API.md)
- Check the [demo application](../demo/) for reference implementation
- Consider gradual migration (run both systems in parallel)
- Test thoroughly before full rollout
