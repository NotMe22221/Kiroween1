# Error Handling Guide

Complete guide to error codes, troubleshooting, and error handling in ShadowCache.

## Table of Contents

- [Error Classes](#error-classes)
- [Error Codes](#error-codes)
- [Common Errors](#common-errors)
- [Troubleshooting](#troubleshooting)
- [Error Handling Patterns](#error-handling-patterns)

## Error Classes

ShadowCache uses typed error classes for different error categories.

### ShadowCacheError

Base error class for all ShadowCache errors.

```typescript
class ShadowCacheError extends Error {
  code: string;                    // Error code
  details?: Record<string, any>;   // Additional error details
}
```

**Properties:**
- `message` - Human-readable error message
- `code` - Machine-readable error code
- `details` - Additional context about the error
- `stack` - Stack trace

### ConfigurationError

Thrown when configuration validation fails.

```typescript
try {
  await ShadowCache.init({ cacheRules: [] });
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error('Config error:', error.message);
    console.error('Details:', error.details);
  }
}
```

### StorageError

Thrown when storage operations fail.

```typescript
try {
  await cache.prefetch(['/large-file.bin']);
} catch (error) {
  if (error instanceof StorageError) {
    if (error.code === 'STORAGE_FULL') {
      console.error('Storage quota exceeded');
      await cache.clearCache(); // Free up space
    }
  }
}
```

### NetworkError

Thrown when network operations fail.

```typescript
try {
  await cache.sync();
} catch (error) {
  if (error instanceof NetworkError) {
    if (error.code === 'NETWORK_OFFLINE') {
      console.log('Cannot sync while offline');
    }
  }
}
```

### SyncError

Thrown when synchronization fails.

```typescript
try {
  await cache.sync();
} catch (error) {
  if (error instanceof SyncError) {
    if (error.code === 'SYNC_CONFLICT') {
      console.error('Sync conflicts detected');
      console.error('Conflicts:', error.details);
    }
  }
}
```

### SecurityError

Thrown when security policies are violated.

```typescript
try {
  await ShadowCache.init({
    cacheRules: [
      {
        id: 'bad-rule',
        pattern: '/api/auth/**',
        strategy: 'cache-first',
        priority: 5,
        // This will fail - credentials cannot be cached
      },
    ],
  });
} catch (error) {
  if (error instanceof SecurityError) {
    console.error('Security violation:', error.message);
  }
}
```

## Error Codes

### Initialization Errors

#### INIT_FAILED

SDK initialization failed.

**Causes:**
- Service Worker registration failed
- Storage initialization failed
- Invalid browser environment

**Solution:**
```typescript
try {
  const cache = await ShadowCache.init(config);
} catch (error) {
  if (error.code === 'INIT_FAILED') {
    console.error('Initialization failed:', error.details);
    // Check browser compatibility
    // Verify Service Worker support
    // Check storage availability
  }
}
```

#### INVALID_CONFIG

Configuration validation failed.

**Causes:**
- Missing required fields
- Invalid field types
- Out-of-range values
- Duplicate rule IDs

**Solution:**
```typescript
try {
  const cache = await ShadowCache.init(config);
} catch (error) {
  if (error.code === 'INVALID_CONFIG') {
    console.error('Invalid configuration:', error.details);
    // Check error.details for specific validation failures
    // Fix configuration and retry
  }
}
```

**Common validation errors:**
- `cacheRules` is required and must be non-empty
- `priority` must be 1-10
- `strategy` must be valid strategy name
- `pattern` must be valid glob or RegExp
- Rule IDs must be unique

### Storage Errors

#### STORAGE_FULL

Storage quota exceeded.

**Causes:**
- Cache size exceeds configured `maxSize`
- Browser storage quota exceeded
- Too many cached resources

**Solution:**
```typescript
try {
  await cache.prefetch(urls);
} catch (error) {
  if (error.code === 'STORAGE_FULL') {
    // Clear old cache entries
    await cache.clearCache();
    
    // Or increase maxSize in config
    // Or implement custom eviction logic
  }
}
```

**Prevention:**
- Set appropriate `maxSize` in storage config
- Configure eviction policy
- Monitor storage usage with `getStatus()`
- Clear cache periodically

#### STORAGE_UNAVAILABLE

All storage mechanisms failed.

**Causes:**
- IndexedDB blocked or unavailable
- LocalStorage disabled
- Private browsing mode
- Storage quota at 0

**Solution:**
```typescript
try {
  const cache = await ShadowCache.init(config);
} catch (error) {
  if (error.code === 'STORAGE_UNAVAILABLE') {
    console.error('Storage unavailable:', error.details);
    // Fallback to online-only mode
    // Inform user about storage requirements
  }
}
```

**Troubleshooting:**
- Check if in private/incognito mode
- Verify storage is not disabled in browser settings
- Check for browser extensions blocking storage
- Try different browser

### Network Errors

#### NETWORK_OFFLINE

Operation requires network but device is offline.

**Causes:**
- Device has no network connectivity
- Network request timed out
- Server unreachable

**Solution:**
```typescript
try {
  await cache.sync();
} catch (error) {
  if (error.code === 'NETWORK_OFFLINE') {
    console.log('Cannot sync while offline');
    // Queue operation for when online
    // Show offline message to user
  }
}
```

**Handling:**
```typescript
cache.on('state-change', async ({ online }) => {
  if (online) {
    // Retry failed operations
    try {
      await cache.sync();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
});
```

#### RESOURCE_NOT_FOUND

Requested resource not in cache.

**Causes:**
- Resource never cached
- Resource evicted
- Cache cleared
- Wrong URL

**Solution:**
```typescript
// This is handled automatically by caching strategies
// For manual handling:
try {
  const response = await fetch(url);
  // Process response
} catch (error) {
  if (error.code === 'RESOURCE_NOT_FOUND') {
    // Show offline message
    // Provide fallback content
  }
}
```

### Sync Errors

#### SYNC_CONFLICT

Synchronization conflict detected.

**Causes:**
- Client and server versions differ
- Concurrent modifications
- Network interruption during sync

**Solution:**
```typescript
try {
  await cache.sync();
} catch (error) {
  if (error.code === 'SYNC_CONFLICT') {
    console.error('Conflicts:', error.details.conflicts);
    
    // With manual conflict resolution:
    for (const conflict of error.details.conflicts) {
      // Show conflict resolution UI
      // Let user choose version
      await resolveConflict(conflict);
    }
  }
}
```

**Conflict Resolution Strategies:**

1. **Server Wins** (default):
```typescript
{
  sync: {
    conflictResolution: 'server-wins',
  },
}
```

2. **Client Wins**:
```typescript
{
  sync: {
    conflictResolution: 'client-wins',
  },
}
```

3. **Manual**:
```typescript
{
  sync: {
    conflictResolution: 'manual',
  },
}

// Handle conflicts manually
cache.on('sync-complete', (result) => {
  if (result.conflicts > 0) {
    showConflictResolutionUI();
  }
});
```

### Security Errors

#### SECURITY_VIOLATION

Security policy violated.

**Causes:**
- Attempting to cache credentials
- Caching HTTPS resources in HTTP context
- Invalid encryption configuration

**Solution:**
```typescript
try {
  await ShadowCache.init(config);
} catch (error) {
  if (error.code === 'SECURITY_VIOLATION') {
    console.error('Security violation:', error.message);
    console.error('Details:', error.details);
    // Fix security issue in configuration
  }
}
```

**Common violations:**
- Caching Authorization headers
- Caching authentication cookies
- Mixed content (HTTPS → HTTP)
- Invalid encryption keys

## Common Errors

### "cacheRules is required"

**Error:**
```
ConfigurationError: cacheRules is required
```

**Cause:** Missing or empty `cacheRules` array

**Solution:**
```typescript
// ❌ Wrong
await ShadowCache.init({});

// ✅ Correct
await ShadowCache.init({
  cacheRules: [
    {
      id: 'default',
      pattern: '/**',
      strategy: 'network-first',
      priority: 5,
    },
  ],
});
```

### "Invalid priority value"

**Error:**
```
ConfigurationError: Invalid priority value: must be 1-10
```

**Cause:** Priority outside valid range

**Solution:**
```typescript
// ❌ Wrong
{
  priority: 15,
}

// ✅ Correct
{
  priority: 8,
}
```

### "Duplicate rule ID"

**Error:**
```
ConfigurationError: Duplicate rule ID: api-cache
```

**Cause:** Multiple rules with same ID

**Solution:**
```typescript
// ❌ Wrong
cacheRules: [
  { id: 'api-cache', /* ... */ },
  { id: 'api-cache', /* ... */ }, // Duplicate!
]

// ✅ Correct
cacheRules: [
  { id: 'api-cache-1', /* ... */ },
  { id: 'api-cache-2', /* ... */ },
]
```

### "Service Worker registration failed"

**Error:**
```
ShadowCacheError: Service Worker registration failed
```

**Causes:**
- Not running on HTTPS (except localhost)
- Service Worker file not found
- Browser doesn't support Service Workers

**Solution:**
```typescript
// Check Service Worker support
if ('serviceWorker' in navigator) {
  const cache = await ShadowCache.init(config);
} else {
  console.warn('Service Workers not supported');
  // Fallback to online-only mode
}
```

### "Sync is not configured"

**Error:**
```
Error: Sync is not configured
```

**Cause:** Calling `sync()` without sync configuration

**Solution:**
```typescript
// ❌ Wrong
const cache = await ShadowCache.init({
  cacheRules: [/* ... */],
  // No sync config
});
await cache.sync(); // Error!

// ✅ Correct
const cache = await ShadowCache.init({
  cacheRules: [/* ... */],
  sync: {
    endpoint: 'https://api.example.com/sync',
    batchSize: 50,
    retryAttempts: 3,
    conflictResolution: 'server-wins',
  },
});
await cache.sync(); // Works!
```

## Troubleshooting

### Cache Not Working

**Symptoms:**
- Resources not being cached
- Always hitting network
- Offline mode not working

**Checklist:**
1. Verify Service Worker is registered:
```typescript
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});
```

2. Check cache rules match URLs:
```typescript
import { matchPattern } from '@shadowcache/sdk';

const url = '/api/users/123';
const pattern = '/api/**';
console.log(matchPattern(url, pattern)); // Should be true
```

3. Verify caching strategy:
```typescript
// For offline testing, use cache-first or cache-only
{
  strategy: 'cache-first',
}
```

4. Check browser console for errors

5. Verify HTTPS (required for Service Workers except localhost)

### Storage Issues

**Symptoms:**
- Storage quota errors
- Cache cleared unexpectedly
- Storage unavailable

**Solutions:**

1. Check storage usage:
```typescript
const status = await cache.getStatus();
console.log('Storage usage:', status.storageUsage);
```

2. Increase max size:
```typescript
{
  storage: {
    maxSize: 209715200, // 200MB
  },
}
```

3. Configure eviction:
```typescript
{
  storage: {
    evictionPolicy: 'lru', // or 'lfu' or 'priority'
  },
}
```

4. Clear cache manually:
```typescript
await cache.clearCache();
```

### Sync Problems

**Symptoms:**
- Sync not triggering
- Conflicts not resolving
- Data not syncing

**Solutions:**

1. Verify sync endpoint:
```typescript
{
  sync: {
    endpoint: 'https://api.example.com/sync', // Must be valid URL
  },
}
```

2. Check network connectivity:
```typescript
cache.on('state-change', ({ online }) => {
  console.log('Online:', online);
});
```

3. Monitor sync events:
```typescript
cache.on('sync-complete', (result) => {
  console.log('Sync result:', result);
});
```

4. Increase retry attempts:
```typescript
{
  sync: {
    retryAttempts: 5,
  },
}
```

### Performance Issues

**Symptoms:**
- Slow initialization
- High memory usage
- Sluggish UI

**Solutions:**

1. Reduce prefetch size:
```typescript
{
  predictive: {
    maxPrefetchSize: 2097152, // 2MB instead of 5MB
  },
}
```

2. Adjust sample rate:
```typescript
{
  analytics: {
    sampleRate: 0.1, // Sample 10% instead of 100%
  },
}
```

3. Limit cache entries:
```typescript
{
  id: 'api',
  pattern: '/api/**',
  strategy: 'network-first',
  priority: 7,
  maxEntries: 100, // Limit to 100 entries
}
```

4. Use appropriate eviction policy:
```typescript
{
  storage: {
    evictionPolicy: 'lru', // Evict least recently used
  },
}
```

## Error Handling Patterns

### Graceful Degradation

```typescript
async function initializeApp() {
  try {
    const cache = await ShadowCache.init(config);
    console.log('Offline support enabled');
    return cache;
  } catch (error) {
    console.warn('Offline support unavailable:', error);
    // Continue without offline support
    return null;
  }
}
```

### Retry Logic

```typescript
async function syncWithRetry(cache, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await cache.sync();
      return result;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
}
```

### User-Friendly Error Messages

```typescript
function getUserFriendlyError(error) {
  if (error instanceof ConfigurationError) {
    return 'Configuration error. Please check your settings.';
  }
  
  if (error instanceof StorageError) {
    if (error.code === 'STORAGE_FULL') {
      return 'Storage is full. Please clear some space.';
    }
    return 'Storage error. Please try again.';
  }
  
  if (error instanceof NetworkError) {
    if (error.code === 'NETWORK_OFFLINE') {
      return 'You are offline. Some features may be unavailable.';
    }
    return 'Network error. Please check your connection.';
  }
  
  return 'An unexpected error occurred. Please try again.';
}

// Usage
try {
  await cache.sync();
} catch (error) {
  showErrorMessage(getUserFriendlyError(error));
}
```

### Logging and Monitoring

```typescript
function setupErrorMonitoring(cache) {
  // Log all errors
  const originalInit = ShadowCache.init;
  ShadowCache.init = async function(config) {
    try {
      return await originalInit.call(this, config);
    } catch (error) {
      console.error('[ShadowCache] Initialization error:', error);
      // Send to error tracking service
      trackError(error);
      throw error;
    }
  };
  
  // Monitor sync errors
  cache.on('sync-complete', (result) => {
    if (!result.success) {
      console.error('[ShadowCache] Sync failed:', result);
      trackError(new Error('Sync failed'));
    }
  });
}
```

## Getting Help

If you encounter an error not covered in this guide:

1. Check the [GitHub Issues](https://github.com/shadowcache/shadowcache/issues)
2. Search the [documentation](../README.md)
3. Enable debug logging:
```typescript
localStorage.setItem('shadowcache:debug', 'true');
```
4. Create a minimal reproduction
5. File an issue with error details and reproduction steps
