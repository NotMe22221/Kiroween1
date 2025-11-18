# Configuration Guide

Complete guide to configuring ShadowCache for your application.

## Table of Contents

- [Basic Configuration](#basic-configuration)
- [Cache Rules](#cache-rules)
- [Predictive Caching](#predictive-caching)
- [Delta Synchronization](#delta-synchronization)
- [Storage Management](#storage-management)
- [Analytics Integration](#analytics-integration)
- [UI Customization](#ui-customization)
- [Configuration Examples](#configuration-examples)

## Basic Configuration

The minimum configuration requires at least one cache rule:

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
```

## Cache Rules

Cache rules define what resources to cache and how to cache them.

### Required Fields

```typescript
{
  id: string;              // Unique identifier
  pattern: string | RegExp; // URL pattern to match
  strategy: CacheStrategy;  // Caching strategy
  priority: 1-10;          // Priority level
}
```

### Optional Fields

```typescript
{
  maxAge?: number;         // Max age in milliseconds
  maxEntries?: number;     // Max cached entries for this rule
  networkTimeout?: number; // Network timeout in milliseconds
  sensitive?: boolean;     // Encrypt cached data
}
```

### URL Patterns

#### Glob Patterns

Use glob syntax for simple pattern matching:

```typescript
{
  id: 'api-users',
  pattern: '/api/users/**',  // Matches all user API endpoints
  strategy: 'network-first',
  priority: 8,
}
```

**Glob Syntax:**
- `*` - Matches any characters except `/`
- `**` - Matches any characters including `/`
- `?` - Matches a single character
- `[abc]` - Matches any character in the set

**Examples:**
- `/api/**` - All API endpoints
- `/assets/*.{js,css}` - All JS and CSS in assets
- `/images/**/*.png` - All PNG images in any subdirectory

#### Regular Expressions

Use RegExp for complex matching:

```typescript
{
  id: 'versioned-assets',
  pattern: /\/assets\/.*\.[a-f0-9]{8}\.(js|css)$/,
  strategy: 'cache-first',
  priority: 9,
}
```

### Caching Strategies

#### network-first

Try network first, fall back to cache on failure.

**Best for:** API endpoints, dynamic content

```typescript
{
  id: 'api-cache',
  pattern: '/api/**',
  strategy: 'network-first',
  priority: 8,
  networkTimeout: 5000,  // Fall back to cache after 5s
}
```

#### cache-first

Try cache first, fall back to network on miss.

**Best for:** Static assets, images, fonts

```typescript
{
  id: 'static-assets',
  pattern: '/assets/**',
  strategy: 'cache-first',
  priority: 7,
  maxAge: 86400000,  // 24 hours
}
```

#### stale-while-revalidate

Serve from cache immediately while updating in background.

**Best for:** Content that can be slightly stale

```typescript
{
  id: 'content',
  pattern: '/content/**',
  strategy: 'stale-while-revalidate',
  priority: 6,
  maxAge: 3600000,  // 1 hour
}
```

#### cache-only

Only serve from cache, never hit network.

**Best for:** Offline-only resources, app shell

```typescript
{
  id: 'app-shell',
  pattern: '/shell/**',
  strategy: 'cache-only',
  priority: 10,
}
```

### Priority Levels

When multiple rules match a URL, the highest priority wins.

**Priority Guidelines:**
- `10` - Critical app shell resources
- `8-9` - Important API endpoints, versioned assets
- `5-7` - Regular content and assets
- `3-4` - Low-priority background resources
- `1-2` - Optional enhancements

```typescript
cacheRules: [
  {
    id: 'critical-api',
    pattern: '/api/auth/**',
    strategy: 'network-first',
    priority: 10,  // Highest priority
  },
  {
    id: 'general-api',
    pattern: '/api/**',
    strategy: 'network-first',
    priority: 7,   // Lower priority
  },
]
```

### Sensitive Data

Mark rules as sensitive to enable encryption:

```typescript
{
  id: 'user-data',
  pattern: '/api/user/**',
  strategy: 'network-first',
  priority: 9,
  sensitive: true,  // Encrypts cached data
}
```

**Note:** Credentials (Authorization headers, auth cookies) are automatically rejected regardless of this setting.

## Predictive Caching

Enable intelligent pre-fetching based on user behavior:

```typescript
{
  cacheRules: [/* ... */],
  predictive: {
    enabled: true,
    learningRate: 0.8,        // How quickly to adapt (0-1)
    minConfidence: 0.6,       // Minimum confidence to prefetch (0-1)
    maxPrefetchSize: 5242880, // Max 5MB to prefetch
    idleThreshold: 2000,      // Wait 2s of idle time
  },
}
```

### Configuration Options

#### enabled (boolean)

Enable or disable predictive caching.

**Default:** `false`

#### learningRate (number, 0-1)

How quickly the system adapts to new patterns.

- `0.9-1.0` - Very responsive, adapts quickly
- `0.7-0.8` - Balanced
- `0.5-0.6` - Conservative, requires more data

**Default:** `0.8`

#### minConfidence (number, 0-1)

Minimum confidence threshold to trigger prefetch.

- `0.8-1.0` - Only prefetch highly likely resources
- `0.6-0.7` - Balanced
- `0.4-0.5` - Aggressive prefetching

**Default:** `0.6`

#### maxPrefetchSize (number)

Maximum total size in bytes to prefetch at once.

**Default:** `5242880` (5MB)

#### idleThreshold (number)

Milliseconds of idle time before starting prefetch.

**Default:** `2000` (2 seconds)

## Delta Synchronization

Configure efficient data synchronization:

```typescript
{
  cacheRules: [/* ... */],
  sync: {
    endpoint: 'https://api.example.com/sync',
    batchSize: 50,
    retryAttempts: 3,
    conflictResolution: 'server-wins',
  },
}
```

### Configuration Options

#### endpoint (string, required)

URL of the sync endpoint.

#### batchSize (number)

Number of changes to send per batch.

**Default:** `50`

#### retryAttempts (number)

Number of times to retry failed sync operations.

**Default:** `3`

#### conflictResolution (string)

Strategy for resolving sync conflicts:

- `'server-wins'` - Server version always wins
- `'client-wins'` - Client version always wins
- `'manual'` - Emit conflict event for manual resolution

**Default:** `'server-wins'`

## Storage Management

Configure storage behavior and limits:

```typescript
{
  cacheRules: [/* ... */],
  storage: {
    maxSize: 104857600,      // 100MB
    evictionPolicy: 'priority',
    encryption: false,
  },
}
```

### Configuration Options

#### maxSize (number)

Maximum storage size in bytes.

**Default:** `104857600` (100MB)

#### evictionPolicy (string)

Policy for evicting cached items when storage is full:

- `'lru'` - Least Recently Used
- `'lfu'` - Least Frequently Used
- `'priority'` - Lowest priority first

**Default:** `'priority'`

#### encryption (boolean)

Enable encryption for all cached data.

**Default:** `false`

**Note:** Individual rules can override this with the `sensitive` flag.

## Analytics Integration

Integrate analytics providers to track cache performance:

```typescript
{
  cacheRules: [/* ... */],
  analytics: {
    sampleRate: 1.0,  // Track 100% of events
    providers: [
      {
        name: 'custom-analytics',
        track: (event) => {
          console.log('Analytics event:', event);
          // Send to your analytics service
        },
      },
    ],
  },
}
```

### Configuration Options

#### sampleRate (number, 0-1)

Percentage of events to track (for performance).

- `1.0` - Track all events
- `0.5` - Track 50% of events
- `0.1` - Track 10% of events

**Default:** `1.0`

#### providers (AnalyticsProvider[])

Array of analytics providers.

```typescript
interface AnalyticsProvider {
  name: string;
  track(event: AnalyticsEvent): void | Promise<void>;
}
```

### Analytics Events

Events emitted by ShadowCache:

- `cache-hit` - Resource served from cache
- `cache-miss` - Resource not in cache
- `sync-complete` - Synchronization completed
- `offline` - Went offline
- `online` - Came back online

**Event Structure:**

```typescript
interface AnalyticsEvent {
  type: 'cache-hit' | 'cache-miss' | 'sync-complete' | 'offline' | 'online';
  timestamp: number;
  data: Record<string, any>;
}
```

## UI Customization

Customize the Shadow Mode UI appearance:

```typescript
{
  cacheRules: [/* ... */],
  ui: {
    theme: 'auto',
    position: 'top',
    showDetails: true,
  },
}
```

### Configuration Options

#### theme (string)

UI theme:

- `'dark'` - Dark theme
- `'light'` - Light theme
- `'auto'` - Match system preference

**Default:** `'auto'`

#### position (string)

Indicator position:

- `'top'` - Top of viewport
- `'bottom'` - Bottom of viewport
- `'corner'` - Bottom-right corner

**Default:** `'top'`

#### showDetails (boolean)

Show detailed cache information.

**Default:** `true`

## Configuration Examples

### Minimal Configuration

```typescript
const cache = await ShadowCache.init({
  cacheRules: [
    {
      id: 'all',
      pattern: '/**',
      strategy: 'network-first',
      priority: 5,
    },
  ],
});
```

### E-commerce Site

```typescript
const cache = await ShadowCache.init({
  cacheRules: [
    // Product images - cache aggressively
    {
      id: 'product-images',
      pattern: '/images/products/**',
      strategy: 'cache-first',
      priority: 8,
      maxAge: 604800000, // 7 days
    },
    // Product API - network first with fallback
    {
      id: 'product-api',
      pattern: '/api/products/**',
      strategy: 'network-first',
      priority: 9,
      networkTimeout: 3000,
    },
    // User cart - sensitive data
    {
      id: 'cart-api',
      pattern: '/api/cart/**',
      strategy: 'network-first',
      priority: 10,
      sensitive: true,
    },
  ],
  predictive: {
    enabled: true,
    learningRate: 0.8,
    minConfidence: 0.7,
    maxPrefetchSize: 10485760, // 10MB
    idleThreshold: 1000,
  },
  sync: {
    endpoint: 'https://api.example.com/sync',
    batchSize: 25,
    retryAttempts: 5,
    conflictResolution: 'server-wins',
  },
});
```

### Content Platform

```typescript
const cache = await ShadowCache.init({
  cacheRules: [
    // Articles - stale while revalidate
    {
      id: 'articles',
      pattern: '/articles/**',
      strategy: 'stale-while-revalidate',
      priority: 7,
      maxAge: 3600000, // 1 hour
    },
    // Media files - cache first
    {
      id: 'media',
      pattern: '/media/**',
      strategy: 'cache-first',
      priority: 6,
      maxAge: 86400000, // 24 hours
    },
    // API - network first
    {
      id: 'api',
      pattern: '/api/**',
      strategy: 'network-first',
      priority: 8,
      networkTimeout: 5000,
    },
  ],
  storage: {
    maxSize: 209715200, // 200MB
    evictionPolicy: 'lru',
  },
  analytics: {
    sampleRate: 0.1, // 10% sampling
    providers: [
      {
        name: 'google-analytics',
        track: (event) => {
          // Send to GA
          gtag('event', event.type, event.data);
        },
      },
    ],
  },
});
```

### Progressive Web App

```typescript
const cache = await ShadowCache.init({
  cacheRules: [
    // App shell - cache only
    {
      id: 'app-shell',
      pattern: '/shell/**',
      strategy: 'cache-only',
      priority: 10,
    },
    // Static assets - cache first
    {
      id: 'static',
      pattern: '/static/**',
      strategy: 'cache-first',
      priority: 9,
      maxAge: 2592000000, // 30 days
    },
    // API - network first
    {
      id: 'api',
      pattern: '/api/**',
      strategy: 'network-first',
      priority: 8,
      networkTimeout: 3000,
    },
  ],
  predictive: {
    enabled: true,
    learningRate: 0.9,
    minConfidence: 0.6,
    maxPrefetchSize: 5242880,
    idleThreshold: 2000,
  },
  ui: {
    theme: 'auto',
    position: 'bottom',
    showDetails: true,
  },
});
```

## Default Values

If not specified, these defaults are used:

```typescript
{
  predictive: {
    enabled: false,
    learningRate: 0.8,
    minConfidence: 0.6,
    maxPrefetchSize: 5242880,
    idleThreshold: 2000,
  },
  sync: {
    batchSize: 50,
    retryAttempts: 3,
    conflictResolution: 'server-wins',
  },
  storage: {
    maxSize: 104857600,
    evictionPolicy: 'priority',
    encryption: false,
  },
  analytics: {
    sampleRate: 1.0,
    providers: [],
  },
  ui: {
    theme: 'auto',
    position: 'top',
    showDetails: true,
  },
}
```

## Validation

Configuration is validated on initialization. Common validation errors:

- **Missing cacheRules**: At least one cache rule is required
- **Invalid priority**: Must be 1-10
- **Invalid strategy**: Must be one of the four supported strategies
- **Invalid pattern**: Glob or RegExp pattern must be valid
- **Duplicate IDs**: Each cache rule must have a unique ID
- **Invalid ranges**: Numeric values must be within valid ranges (e.g., sampleRate 0-1)

See [Error Handling](ERRORS.md) for details on handling configuration errors.
