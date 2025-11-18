# API Reference

Complete API documentation for ShadowCache SDK.

## Table of Contents

- [ShadowCache Class](#shadowcache-class)
- [Configuration Types](#configuration-types)
- [Error Classes](#error-classes)
- [Utility Functions](#utility-functions)

## ShadowCache Class

The main entry point for the ShadowCache SDK.

### `ShadowCache.init(config: ShadowCacheConfig): Promise<ShadowCache>`

Initializes the ShadowCache system with the provided configuration.

**Parameters:**
- `config` (ShadowCacheConfig): Configuration object defining cache rules and optional modules

**Returns:** Promise<ShadowCache> - Initialized ShadowCache instance

**Throws:**
- `ConfigurationError` - If configuration is invalid
- `ShadowCacheError` - If initialization fails

**Example:**

```typescript
import { ShadowCache } from '@shadowcache/sdk';

const cache = await ShadowCache.init({
  cacheRules: [
    {
      id: 'api-cache',
      pattern: '/api/**',
      strategy: 'network-first',
      priority: 8,
      maxAge: 3600000,
    },
  ],
});
```

### `getStatus(): Promise<CacheStatus>`

Returns the current status of the cache system.

**Returns:** Promise<CacheStatus> - Object containing:
- `storageUsage` (number): Bytes of storage currently used
- `cachedResourceCount` (number): Number of cached resources
- `syncStatus` (string): Current sync status ('idle', 'pending', 'synced', 'conflict')

**Example:**

```typescript
const status = await cache.getStatus();
console.log(`Using ${status.storageUsage} bytes`);
console.log(`${status.cachedResourceCount} resources cached`);
console.log(`Sync status: ${status.syncStatus}`);
```

### `clearCache(pattern?: string): Promise<void>`

Clears cached resources, optionally filtered by URL pattern.

**Parameters:**
- `pattern` (string, optional): URL pattern to match for selective clearing. If omitted, clears all cache.

**Returns:** Promise<void>

**Example:**

```typescript
// Clear all cache
await cache.clearCache();

// Clear cache for specific pattern
await cache.clearCache('/api/**');
```

### `prefetch(urls: string[]): Promise<void>`

Manually prefetches and caches the specified URLs.

**Parameters:**
- `urls` (string[]): Array of URLs to prefetch

**Returns:** Promise<void>

**Example:**

```typescript
await cache.prefetch([
  '/api/user/profile',
  '/api/user/settings',
  '/assets/images/logo.png',
]);
```

### `sync(): Promise<SyncResult>`

Manually triggers synchronization of pending changes.

**Returns:** Promise<SyncResult> - Object containing:
- `success` (boolean): Whether sync completed successfully
- `synced` (number): Number of changes synchronized
- `conflicts` (number): Number of conflicts encountered
- `bytesTransferred` (number): Total bytes transferred
- `duration` (number): Sync duration in milliseconds

**Throws:**
- `Error` - If sync is not configured
- `SyncError` - If synchronization fails

**Example:**

```typescript
try {
  const result = await cache.sync();
  console.log(`Synced ${result.synced} changes in ${result.duration}ms`);
} catch (error) {
  console.error('Sync failed:', error);
}
```

### `on(event: string, handler: Function): void`

Registers an event handler for the specified event.

**Parameters:**
- `event` (string): Event name ('ready', 'state-change', 'sync-complete', etc.)
- `handler` (Function): Event handler function

**Example:**

```typescript
cache.on('ready', ({ status, timestamp }) => {
  console.log('Cache ready at', new Date(timestamp));
});

cache.on('state-change', ({ online }) => {
  console.log(online ? 'Online' : 'Offline');
});
```

### `off(event: string, handler: Function): void`

Removes an event handler for the specified event.

**Parameters:**
- `event` (string): Event name
- `handler` (Function): Event handler function to remove

**Example:**

```typescript
const handler = ({ online }) => console.log(online);
cache.on('state-change', handler);
// Later...
cache.off('state-change', handler);
```

## Configuration Types

### ShadowCacheConfig

Main configuration object for ShadowCache initialization.

```typescript
interface ShadowCacheConfig {
  cacheRules: CacheRule[];
  predictive?: PredictiveConfig;
  sync?: SyncConfig;
  storage?: StorageConfig;
  analytics?: AnalyticsConfig;
  ui?: UIConfig;
}
```

### CacheRule

Defines caching behavior for URL patterns.

```typescript
interface CacheRule {
  id: string;                    // Unique identifier for the rule
  pattern: string | RegExp;      // URL pattern (glob or regex)
  strategy: CacheStrategy;       // Caching strategy
  priority: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;  // Priority (1=lowest, 10=highest)
  maxAge?: number;               // Max age in milliseconds
  maxEntries?: number;           // Max number of cached entries
  networkTimeout?: number;       // Network timeout in milliseconds
  sensitive?: boolean;           // Whether to encrypt cached data
}
```

**Cache Strategies:**
- `'network-first'` - Try network first, fall back to cache
- `'cache-first'` - Try cache first, fall back to network
- `'stale-while-revalidate'` - Serve from cache while updating in background
- `'cache-only'` - Only serve from cache, never hit network

### PredictiveConfig

Configuration for predictive caching engine.

```typescript
interface PredictiveConfig {
  enabled: boolean;           // Enable predictive caching
  learningRate: number;       // Learning rate (0-1)
  minConfidence: number;      // Minimum confidence threshold (0-1)
  maxPrefetchSize: number;    // Max size in bytes to prefetch
  idleThreshold: number;      // Idle time threshold in milliseconds
}
```

### SyncConfig

Configuration for delta synchronization.

```typescript
interface SyncConfig {
  endpoint: string;                                    // Sync endpoint URL
  batchSize: number;                                   // Number of changes per batch
  retryAttempts: number;                               // Number of retry attempts
  conflictResolution: 'server-wins' | 'client-wins' | 'manual';  // Conflict resolution strategy
}
```

### StorageConfig

Configuration for storage management.

```typescript
interface StorageConfig {
  maxSize: number;                          // Max storage size in bytes
  evictionPolicy: 'lru' | 'lfu' | 'priority';  // Eviction policy
  encryption?: boolean;                     // Enable encryption
}
```

### AnalyticsConfig

Configuration for analytics integration.

```typescript
interface AnalyticsConfig {
  providers: AnalyticsProvider[];  // Analytics providers
  sampleRate: number;              // Event sampling rate (0-1)
}

interface AnalyticsProvider {
  name: string;
  track(event: AnalyticsEvent): void | Promise<void>;
}
```

### UIConfig

Configuration for Shadow Mode UI.

```typescript
interface UIConfig {
  theme: 'dark' | 'light' | 'auto';           // UI theme
  position: 'top' | 'bottom' | 'corner';      // Indicator position
  showDetails: boolean;                        // Show detailed information
}
```

## Error Classes

### ShadowCacheError

Base error class for all ShadowCache errors.

```typescript
class ShadowCacheError extends Error {
  code: string;                    // Error code
  details?: Record<string, any>;   // Additional error details
}
```

### ConfigurationError

Thrown when configuration validation fails.

```typescript
class ConfigurationError extends ShadowCacheError {
  constructor(message: string, details?: Record<string, any>)
}
```

**Example:**

```typescript
try {
  await ShadowCache.init({ cacheRules: [] });
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error('Invalid config:', error.details);
  }
}
```

### StorageError

Thrown when storage operations fail.

```typescript
class StorageError extends ShadowCacheError {
  constructor(message: string, code: ErrorCode, details?: Record<string, any>)
}
```

### NetworkError

Thrown when network operations fail.

```typescript
class NetworkError extends ShadowCacheError {
  constructor(message: string, code: ErrorCode, details?: Record<string, any>)
}
```

### SyncError

Thrown when synchronization fails.

```typescript
class SyncError extends ShadowCacheError {
  constructor(message: string, details?: Record<string, any>)
}
```

### SecurityError

Thrown when security policies are violated.

```typescript
class SecurityError extends ShadowCacheError {
  constructor(message: string, details?: Record<string, any>)
}
```

## Utility Functions

### Validation

#### `validateConfig(config: ShadowCacheConfig): void`

Validates a configuration object. Throws ConfigurationError if invalid.

#### `validateCacheRule(rule: CacheRule): void`

Validates a cache rule. Throws ConfigurationError if invalid.

### Pattern Matching

#### `matchPattern(url: string, pattern: string | RegExp): boolean`

Tests if a URL matches a pattern (glob or regex).

```typescript
import { matchPattern } from '@shadowcache/sdk';

matchPattern('/api/users/123', '/api/**');  // true
matchPattern('/api/users/123', /^\/api\//);  // true
```

#### `findMatchingRules(url: string, rules: CacheRule[]): CacheRule[]`

Finds all cache rules matching a URL.

#### `resolveRule(url: string, rules: CacheRule[]): CacheRule | null`

Finds the highest priority rule matching a URL.

### Serialization

#### `serializeResponse(response: Response): Promise<SerializedResponse>`

Serializes a Response object for storage.

#### `deserializeResponse(serialized: SerializedResponse): Response`

Deserializes a stored response.

#### `parseCacheControl(header: string): CacheControlDirectives`

Parses a Cache-Control header into directives.

### Security

#### `isSensitiveData(rule: CacheRule): boolean`

Checks if a cache rule is marked as sensitive.

#### `hasCredentials(request: Request): boolean`

Checks if a request contains credentials.

#### `encryptData(data: ArrayBuffer, key: CryptoKey): Promise<ArrayBuffer>`

Encrypts data using Web Crypto API.

#### `decryptData(encrypted: ArrayBuffer, key: CryptoKey): Promise<ArrayBuffer>`

Decrypts data using Web Crypto API.

### HTML Parsing

#### `extractLinkedResources(html: string): string[]`

Extracts all linked resource URLs from HTML content.

```typescript
import { extractLinkedResources } from '@shadowcache/sdk';

const html = '<html><link href="/style.css"><script src="/app.js"></script></html>';
const resources = extractLinkedResources(html);
// ['/style.css', '/app.js']
```

## Events

### 'ready'

Emitted when ShadowCache initialization completes.

**Payload:**
```typescript
{
  status: CacheStatus;
  timestamp: number;
}
```

### 'state-change'

Emitted when online/offline state changes.

**Payload:**
```typescript
{
  online: boolean;
}
```

### 'sync-complete'

Emitted when synchronization completes (if sync is configured).

**Payload:**
```typescript
{
  success: boolean;
  synced: number;
  conflicts: number;
  bytesTransferred: number;
  duration: number;
}
```

## Type Exports

All types are exported from the main package:

```typescript
import type {
  ShadowCacheConfig,
  CacheRule,
  CacheStatus,
  CacheEntry,
  CacheMetadata,
  SerializedResponse,
  CacheControlDirectives,
  ResponseType,
  ErrorCode,
} from '@shadowcache/sdk';
```
