# Usage Examples

Common use cases and patterns for ShadowCache.

## Table of Contents

- [Basic Initialization](#basic-initialization)
- [Cache Rules](#cache-rules)
- [Offline Handling](#offline-handling)
- [Predictive Caching](#predictive-caching)
- [Data Synchronization](#data-synchronization)
- [Analytics Integration](#analytics-integration)
- [UI Integration](#ui-integration)
- [Advanced Patterns](#advanced-patterns)

## Basic Initialization

### Minimal Setup

```typescript
import { ShadowCache } from '@shadowcache/sdk';

const cache = await ShadowCache.init({
  cacheRules: [
    {
      id: 'default',
      pattern: '/**',
      strategy: 'network-first',
      priority: 5,
    },
  ],
});

console.log('ShadowCache initialized!');
```

### With Event Listeners

```typescript
const cache = await ShadowCache.init({
  cacheRules: [/* ... */],
});

cache.on('ready', ({ status }) => {
  console.log('Cache ready!');
  console.log(`Storage: ${status.storageUsage} bytes`);
  console.log(`Resources: ${status.cachedResourceCount}`);
});

cache.on('state-change', ({ online }) => {
  if (online) {
    console.log('✅ Back online');
  } else {
    console.log('📴 Gone offline');
  }
});
```

## Cache Rules

### API Endpoints

```typescript
const cache = await ShadowCache.init({
  cacheRules: [
    // User data - high priority, network first
    {
      id: 'user-api',
      pattern: '/api/user/**',
      strategy: 'network-first',
      priority: 10,
      networkTimeout: 3000,
      maxAge: 300000, // 5 minutes
    },
    // General API - medium priority
    {
      id: 'api',
      pattern: '/api/**',
      strategy: 'network-first',
      priority: 7,
      networkTimeout: 5000,
      maxAge: 600000, // 10 minutes
    },
  ],
});
```

### Static Assets

```typescript
const cache = await ShadowCache.init({
  cacheRules: [
    // Versioned assets - cache aggressively
    {
      id: 'versioned-assets',
      pattern: /\/assets\/.*\.[a-f0-9]{8}\.(js|css|png|jpg)$/,
      strategy: 'cache-first',
      priority: 9,
      maxAge: 31536000000, // 1 year
    },
    // Images - cache first
    {
      id: 'images',
      pattern: '/images/**',
      strategy: 'cache-first',
      priority: 7,
      maxAge: 86400000, // 24 hours
    },
    // Fonts - cache first
    {
      id: 'fonts',
      pattern: '/fonts/**',
      strategy: 'cache-first',
      priority: 8,
      maxAge: 2592000000, // 30 days
    },
  ],
});
```

### Mixed Strategies

```typescript
const cache = await ShadowCache.init({
  cacheRules: [
    // App shell - cache only (offline-first)
    {
      id: 'app-shell',
      pattern: '/shell.html',
      strategy: 'cache-only',
      priority: 10,
    },
    // News feed - stale while revalidate
    {
      id: 'news',
      pattern: '/api/news/**',
      strategy: 'stale-while-revalidate',
      priority: 6,
      maxAge: 1800000, // 30 minutes
    },
    // Analytics - network first, no fallback
    {
      id: 'analytics',
      pattern: '/api/analytics/**',
      strategy: 'network-first',
      priority: 3,
      networkTimeout: 2000,
    },
  ],
});
```

## Offline Handling

### Detecting Offline State

```typescript
const cache = await ShadowCache.init({
  cacheRules: [/* ... */],
});

// Listen for state changes
cache.on('state-change', ({ online }) => {
  const statusEl = document.getElementById('status');
  
  if (online) {
    statusEl.textContent = 'Online';
    statusEl.className = 'status-online';
  } else {
    statusEl.textContent = 'Offline';
    statusEl.className = 'status-offline';
  }
});
```

### Handling Offline Errors

```typescript
async function fetchData(url) {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    // Check if we're offline
    if (!navigator.onLine) {
      console.log('Offline - serving from cache');
      // ShadowCache will automatically serve from cache
      // if the resource is cached
    }
    throw error;
  }
}
```

### Manual Cache Status Check

```typescript
const cache = await ShadowCache.init({
  cacheRules: [/* ... */],
});

// Check cache status
const status = await cache.getStatus();

if (status.syncStatus === 'pending') {
  console.log('You have unsaved changes');
}

if (status.storageUsage > 50000000) { // 50MB
  console.log('Cache is getting large');
}
```

## Predictive Caching

### Enable Predictive Caching

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
    idleThreshold: 2000,
  },
});

// The system will automatically learn navigation patterns
// and prefetch likely resources
```

### Manual Prefetching

```typescript
const cache = await ShadowCache.init({
  cacheRules: [/* ... */],
});

// Prefetch specific resources
await cache.prefetch([
  '/api/user/profile',
  '/api/user/settings',
  '/images/avatar.png',
]);

console.log('Resources prefetched!');
```

### Prefetch on User Action

```typescript
// Prefetch when user hovers over a link
document.querySelectorAll('a').forEach(link => {
  link.addEventListener('mouseenter', async () => {
    const href = link.getAttribute('href');
    if (href) {
      await cache.prefetch([href]);
    }
  });
});
```

## Data Synchronization

### Basic Sync Setup

```typescript
const cache = await ShadowCache.init({
  cacheRules: [/* ... */],
  sync: {
    endpoint: 'https://api.example.com/sync',
    batchSize: 50,
    retryAttempts: 3,
    conflictResolution: 'server-wins',
  },
});

// Sync happens automatically when coming back online
// Or trigger manually:
const result = await cache.sync();
console.log(`Synced ${result.synced} changes`);
```

### Manual Sync Trigger

```typescript
const syncButton = document.getElementById('sync-btn');

syncButton.addEventListener('click', async () => {
  syncButton.disabled = true;
  syncButton.textContent = 'Syncing...';
  
  try {
    const result = await cache.sync();
    
    if (result.success) {
      console.log(`✅ Synced ${result.synced} changes`);
      console.log(`📊 ${result.bytesTransferred} bytes transferred`);
      console.log(`⏱️ Took ${result.duration}ms`);
    }
  } catch (error) {
    console.error('Sync failed:', error);
  } finally {
    syncButton.disabled = false;
    syncButton.textContent = 'Sync';
  }
});
```

### Handling Sync Conflicts

```typescript
const cache = await ShadowCache.init({
  cacheRules: [/* ... */],
  sync: {
    endpoint: 'https://api.example.com/sync',
    batchSize: 50,
    retryAttempts: 3,
    conflictResolution: 'manual', // Handle conflicts manually
  },
});

// Listen for sync completion
cache.on('sync-complete', (result) => {
  if (result.conflicts > 0) {
    console.log(`⚠️ ${result.conflicts} conflicts need resolution`);
    // Show UI for conflict resolution
    showConflictResolutionUI();
  }
});
```

### Auto-Sync on Online

```typescript
const cache = await ShadowCache.init({
  cacheRules: [/* ... */],
  sync: {
    endpoint: 'https://api.example.com/sync',
    batchSize: 50,
    retryAttempts: 3,
    conflictResolution: 'server-wins',
  },
});

// Auto-sync is enabled by default when coming back online
cache.on('state-change', async ({ online }) => {
  if (online) {
    console.log('Back online - syncing...');
    // Sync will happen automatically
  }
});
```

## Analytics Integration

### Google Analytics

```typescript
const cache = await ShadowCache.init({
  cacheRules: [/* ... */],
  analytics: {
    sampleRate: 1.0,
    providers: [
      {
        name: 'google-analytics',
        track: (event) => {
          if (typeof gtag !== 'undefined') {
            gtag('event', event.type, {
              event_category: 'cache',
              event_label: event.data.url || 'unknown',
              value: event.data.duration || 0,
            });
          }
        },
      },
    ],
  },
});
```

### Custom Analytics

```typescript
const cache = await ShadowCache.init({
  cacheRules: [/* ... */],
  analytics: {
    sampleRate: 0.1, // Sample 10% of events
    providers: [
      {
        name: 'custom-analytics',
        track: async (event) => {
          // Send to your analytics service
          await fetch('https://analytics.example.com/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: event.type,
              timestamp: event.timestamp,
              data: event.data,
            }),
          });
        },
      },
    ],
  },
});
```

### Multiple Providers

```typescript
const cache = await ShadowCache.init({
  cacheRules: [/* ... */],
  analytics: {
    sampleRate: 1.0,
    providers: [
      {
        name: 'google-analytics',
        track: (event) => {
          gtag('event', event.type, event.data);
        },
      },
      {
        name: 'mixpanel',
        track: (event) => {
          mixpanel.track(event.type, event.data);
        },
      },
      {
        name: 'console',
        track: (event) => {
          console.log('[Analytics]', event.type, event.data);
        },
      },
    ],
  },
});
```

## UI Integration

### React Integration

```typescript
import { ShadowCache } from '@shadowcache/sdk';
import { ShadowIndicator } from '@shadowcache/ui/react';
import { useState, useEffect } from 'react';

function App() {
  const [cache, setCache] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [cacheStatus, setCacheStatus] = useState(null);

  useEffect(() => {
    async function initCache() {
      const instance = await ShadowCache.init({
        cacheRules: [/* ... */],
        ui: {
          theme: 'auto',
          position: 'top',
          showDetails: true,
        },
      });

      instance.on('state-change', ({ online }) => {
        setIsOnline(online);
      });

      setCache(instance);
      
      // Update status periodically
      const updateStatus = async () => {
        const status = await instance.getStatus();
        setCacheStatus(status);
      };
      
      updateStatus();
      const interval = setInterval(updateStatus, 5000);
      
      return () => clearInterval(interval);
    }

    initCache();
  }, []);

  const handleSync = async () => {
    if (cache) {
      await cache.sync();
    }
  };

  return (
    <div>
      <ShadowIndicator
        isOnline={isOnline}
        cacheStatus={cacheStatus}
        onSync={handleSync}
      />
      {/* Your app content */}
    </div>
  );
}
```

### Vanilla JavaScript

```typescript
import { ShadowCache } from '@shadowcache/sdk';

const cache = await ShadowCache.init({
  cacheRules: [/* ... */],
});

// Update UI on state change
cache.on('state-change', ({ online }) => {
  const indicator = document.getElementById('status-indicator');
  indicator.textContent = online ? '🟢 Online' : '🔴 Offline';
  indicator.className = online ? 'online' : 'offline';
});

// Show cache status
cache.on('ready', async () => {
  const status = await cache.getStatus();
  document.getElementById('storage-usage').textContent = 
    `${(status.storageUsage / 1024 / 1024).toFixed(2)} MB`;
  document.getElementById('resource-count').textContent = 
    status.cachedResourceCount;
});
```

## Advanced Patterns

### Conditional Caching

```typescript
const cache = await ShadowCache.init({
  cacheRules: [
    // Cache authenticated API calls
    {
      id: 'auth-api',
      pattern: /^\/api\/.*\?.*token=/,
      strategy: 'network-first',
      priority: 9,
      sensitive: true, // Encrypt
    },
    // Don't cache login/logout
    {
      id: 'auth-endpoints',
      pattern: '/api/auth/**',
      strategy: 'network-first',
      priority: 10,
      maxAge: 0, // Never cache
    },
  ],
});
```

### Cache Warming

```typescript
const cache = await ShadowCache.init({
  cacheRules: [/* ... */],
});

// Warm cache on app load
cache.on('ready', async () => {
  const criticalResources = [
    '/api/config',
    '/api/user/profile',
    '/assets/app.css',
    '/assets/app.js',
  ];
  
  await cache.prefetch(criticalResources);
  console.log('Cache warmed!');
});
```

### Periodic Cache Cleanup

```typescript
const cache = await ShadowCache.init({
  cacheRules: [/* ... */],
});

// Clear old cache entries daily
setInterval(async () => {
  const status = await cache.getStatus();
  
  // If using more than 80% of max storage
  if (status.storageUsage > 80000000) { // 80MB
    console.log('Clearing old cache entries...');
    await cache.clearCache();
  }
}, 86400000); // 24 hours
```

### Progressive Enhancement

```typescript
// Check if Service Workers are supported
if ('serviceWorker' in navigator) {
  const cache = await ShadowCache.init({
    cacheRules: [/* ... */],
  });
  console.log('Offline support enabled');
} else {
  console.log('Service Workers not supported - running online-only');
  // Fallback to online-only mode
}
```

### Custom Error Handling

```typescript
import { 
  ShadowCache, 
  ConfigurationError, 
  StorageError, 
  NetworkError 
} from '@shadowcache/sdk';

try {
  const cache = await ShadowCache.init({
    cacheRules: [/* ... */],
  });
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error('Invalid configuration:', error.details);
    // Show configuration error to user
  } else if (error instanceof StorageError) {
    console.error('Storage error:', error.message);
    // Handle storage issues
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
    // Handle network issues
  } else {
    console.error('Unknown error:', error);
  }
}
```

### TypeScript Integration

```typescript
import { 
  ShadowCache, 
  ShadowCacheConfig,
  CacheRule,
  CacheStatus 
} from '@shadowcache/sdk';

// Type-safe configuration
const config: ShadowCacheConfig = {
  cacheRules: [
    {
      id: 'api',
      pattern: '/api/**',
      strategy: 'network-first',
      priority: 8,
    },
  ],
  predictive: {
    enabled: true,
    learningRate: 0.8,
    minConfidence: 0.6,
    maxPrefetchSize: 5242880,
    idleThreshold: 2000,
  },
};

const cache = await ShadowCache.init(config);

// Type-safe status
const status: CacheStatus = await cache.getStatus();
console.log(status.storageUsage);
```

## Testing

### Mock for Testing

```typescript
// In your tests
const mockCache = {
  init: jest.fn().mockResolvedValue({
    getStatus: jest.fn().mockResolvedValue({
      storageUsage: 1000,
      cachedResourceCount: 5,
      syncStatus: 'synced',
    }),
    clearCache: jest.fn().mockResolvedValue(undefined),
    prefetch: jest.fn().mockResolvedValue(undefined),
    sync: jest.fn().mockResolvedValue({
      success: true,
      synced: 10,
      conflicts: 0,
      bytesTransferred: 5000,
      duration: 100,
    }),
    on: jest.fn(),
    off: jest.fn(),
  }),
};
```

### Integration Testing

```typescript
import { ShadowCache } from '@shadowcache/sdk';

describe('ShadowCache Integration', () => {
  let cache;

  beforeAll(async () => {
    cache = await ShadowCache.init({
      cacheRules: [
        {
          id: 'test',
          pattern: '/test/**',
          strategy: 'cache-first',
          priority: 5,
        },
      ],
    });
  });

  test('should cache resources', async () => {
    await cache.prefetch(['/test/resource.json']);
    const status = await cache.getStatus();
    expect(status.cachedResourceCount).toBeGreaterThan(0);
  });

  test('should clear cache', async () => {
    await cache.clearCache();
    const status = await cache.getStatus();
    expect(status.cachedResourceCount).toBe(0);
  });
});
```
