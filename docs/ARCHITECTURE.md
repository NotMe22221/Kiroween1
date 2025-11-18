# 🏗️ ShadowCache Architecture

This document provides a comprehensive overview of the ShadowCache architecture, design decisions, and implementation details.

## Table of Contents

- [Overview](#overview)
- [High-Level Architecture](#high-level-architecture)
- [Module Structure](#module-structure)
- [Data Flow](#data-flow)
- [Storage Architecture](#storage-architecture)
- [Caching Strategies](#caching-strategies)
- [Predictive Engine](#predictive-engine)
- [Delta Synchronization](#delta-synchronization)
- [Security Model](#security-model)
- [Performance Considerations](#performance-considerations)
- [Design Decisions](#design-decisions)

## Overview

ShadowCache is built on a **modular, layered architecture** that separates concerns and enables independent development and testing of each subsystem. The architecture follows these key principles:

- **Modularity**: Clear separation between components
- **Progressive Enhancement**: Graceful degradation based on browser capabilities
- **Zero Configuration**: Sensible defaults with deep customization
- **Type Safety**: Full TypeScript implementation
- **Performance First**: Minimal runtime overhead

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│                  (Your Web Application)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    ShadowCache SDK                           │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Configuration & Orchestration              │    │
│  │  • Initialization • Event Management • API         │    │
│  └────────────────────────────────────────────────────┘    │
└──┬────┬────┬────┬────┬────┬────────────────────────────────┘
   │    │    │    │    │    │
   ▼    ▼    ▼    ▼    ▼    ▼
┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐
│Rtr ││Pred││Sync││Stor││Anly││UI  │
│    ││    ││    ││    ││    ││    │
└────┘└────┘└────┘└────┘└────┘└────┘
  │     │     │     │     │     │
  ▼     ▼     ▼     ▼     ▼     ▼
┌────────────────────────────────────┐
│      Browser APIs & Storage        │
│  SW • IDB • LS • Crypto • Network  │
└────────────────────────────────────┘
```

### Layer Responsibilities

1. **Application Layer**: Your web application code
2. **SDK Layer**: Public API and orchestration
3. **Module Layer**: Specialized subsystems
4. **Browser Layer**: Native browser APIs

## Module Structure

### Core SDK (`@shadowcache/sdk`)

**Purpose**: Main entry point and orchestration

**Responsibilities**:
- Configuration validation
- Module initialization and coordination
- Event management and emission
- Public API surface
- Error handling

**Key Components**:
```typescript
ShadowCache          // Main class
├── init()           // Initialization
├── getStatus()      // Status queries
├── clearCache()     // Cache management
├── prefetch()       // Manual prefetching
├── sync()           // Manual synchronization
└── on/off()         // Event handling
```

### Offline Router (`@shadowcache/router`)

**Purpose**: Request interception and caching strategies

**Responsibilities**:
- Service Worker registration and lifecycle
- Fetch event interception
- Strategy implementation (network-first, cache-first, etc.)
- Online/offline detection
- Request/response handling

**Architecture**:
```
Main Thread                Service Worker
     │                           │
     ├──register()──────────────>│
     │                           │
     │<──────ready────────────────┤
     │                           │
     │                           │
  [fetch]                        │
     │                           │
     │                      [intercept]
     │                           │
     │                      [apply strategy]
     │                           │
     │<──────response─────────────┤
```

### Predictive Engine (`@shadowcache/predictor`)

**Purpose**: Behavior analysis and intelligent prefetching

**Responsibilities**:
- Navigation pattern recording
- Pattern analysis (Markov chains)
- Confidence scoring
- Resource graph building
- Idle time detection
- Prefetch queue management

**Algorithm**:
```
1. Record navigation: A → B → C
2. Build transition matrix:
   P(B|A) = count(A→B) / count(A)
3. Calculate confidence:
   confidence = P(next|current) × frequency
4. Queue prefetch if confidence > threshold
5. Execute during idle time
```

### Delta Sync (`@shadowcache/sync`)

**Purpose**: Efficient data synchronization

**Responsibilities**:
- Change tracking (JSON Patch format)
- Delta generation
- Patch application
- Conflict detection
- Resolution strategies
- Batch synchronization

**Sync Flow**:
```
1. Track changes locally
2. Generate delta patches
3. Queue patches for sync
4. Batch patches (configurable size)
5. Send to server
6. Receive server response
7. Detect conflicts
8. Apply resolution strategy
9. Update local state
10. Emit sync-complete event
```

### Storage Manager (`@shadowcache/storage`)

**Purpose**: Storage abstraction with fallback chain

**Responsibilities**:
- Storage provider abstraction
- Fallback chain management
- Usage tracking
- Eviction policies
- Quota management

**Fallback Chain**:
```
┌─────────────┐
│  IndexedDB  │ ← Primary (best performance)
└──────┬──────┘
       │ fails
       ▼
┌─────────────┐
│LocalStorage │ ← Secondary (limited size)
└──────┬──────┘
       │ fails
       ▼
┌─────────────┐
│   Memory    │ ← Tertiary (session only)
└─────────────┘
```

### Analytics (`@shadowcache/analytics`)

**Purpose**: Event tracking and MCP integration

**Responsibilities**:
- Provider registration
- Event emission
- Event sampling
- MCP compatibility

**Event Flow**:
```
[Event Occurs]
      │
      ▼
[Analytics Hooks]
      │
      ├──> Provider 1
      ├──> Provider 2
      └──> Provider N
```

### Shadow UI (`@shadowcache/ui`)

**Purpose**: Visual components for offline indicators

**Responsibilities**:
- React components
- Web Components
- Theme management
- Status visualization

**Component Tree**:
```
ShadowIndicator
├── ConnectivityBadge
├── CacheStatus
├── SyncProgress
└── OfflineMessage
```

## Data Flow

### Request Flow (Online)

```
1. Application makes request
2. Router intercepts (Service Worker)
3. Check cache rule match
4. Apply strategy (e.g., network-first):
   a. Try network
   b. If success: cache response, return
   c. If fail: check cache
   d. If cached: return cached
   e. If not cached: return error
5. Update analytics
6. Record navigation pattern
```

### Request Flow (Offline)

```
1. Application makes request
2. Router intercepts
3. Detect offline state
4. Check cache
5. If cached: return cached response
6. If not cached: return offline error
7. Update analytics
```

### Sync Flow

```
1. Changes occur while offline
2. Delta Sync records changes
3. Online transition detected
4. Automatic sync triggered
5. Batch changes
6. Send to server
7. Handle conflicts
8. Update local state
9. Emit events
```

## Storage Architecture

### Storage Providers

Each storage provider implements the `StorageProvider` interface:

```typescript
interface StorageProvider {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  getUsage(): Promise<StorageUsage>;
}
```

### IndexedDB Provider

**Advantages**:
- Large storage capacity (50MB+)
- Structured data support
- Indexed queries
- Async API

**Schema**:
```
Database: shadowcache
  Store: cache_entries
    Key: url (string)
    Value: {
      response: SerializedResponse
      metadata: CacheMetadata
    }
    Indexes:
      - priority
      - cachedAt
      - lastAccessed
```

### LocalStorage Provider

**Advantages**:
- Synchronous API (wrapped in Promise)
- Wide browser support
- Simple key-value storage

**Limitations**:
- 5-10MB limit
- String-only storage (requires serialization)
- Blocking operations

### Memory Provider

**Advantages**:
- Fastest access
- No quota limits
- No serialization needed

**Limitations**:
- Session-only persistence
- Lost on page reload
- Memory constraints

## Caching Strategies

### Network-First

```
┌─────────┐
│ Request │
└────┬────┘
     │
     ▼
┌─────────┐
│ Network │
└────┬────┘
     │
  Success?
   ┌─┴─┐
  Yes  No
   │    │
   │    ▼
   │  ┌─────┐
   │  │Cache│
   │  └──┬──┘
   │     │
   └─────┴──> Response
```

**Use Cases**:
- Frequently changing data
- User-specific content
- Real-time information

### Cache-First

```
┌─────────┐
│ Request │
└────┬────┘
     │
     ▼
┌─────────┐
│  Cache  │
└────┬────┘
     │
  Cached?
   ┌─┴─┐
  Yes  No
   │    │
   │    ▼
   │  ┌────────┐
   │  │Network │
   │  └───┬────┘
   │      │
   └──────┴──> Response
```

**Use Cases**:
- Static assets
- Rarely changing content
- Performance-critical resources

### Stale-While-Revalidate

```
┌─────────┐
│ Request │
└────┬────┘
     │
     ▼
┌─────────┐
│  Cache  │────> Return cached
└────┬────┘      (if available)
     │
     ▼
┌─────────┐
│ Network │────> Update cache
└─────────┘      (in background)
```

**Use Cases**:
- Semi-dynamic content
- News feeds
- Social media posts

### Cache-Only

```
┌─────────┐
│ Request │
└────┬────┘
     │
     ▼
┌─────────┐
│  Cache  │
└────┬────┘
     │
  Cached?
   ┌─┴─┐
  Yes  No
   │    │
   │    ▼
   │  Error
   │
   └────> Response
```

**Use Cases**:
- Offline-only resources
- Pre-cached content
- App shell

## Predictive Engine

### Pattern Learning

The predictive engine uses a **Markov chain** approach:

```typescript
// Transition matrix
transitions = {
  '/page-a': {
    '/page-b': 0.7,  // 70% probability
    '/page-c': 0.3   // 30% probability
  }
}

// Prediction
function predict(currentPage) {
  const transitions = this.transitions[currentPage];
  return Object.entries(transitions)
    .filter(([_, prob]) => prob > minConfidence)
    .sort(([_, a], [__, b]) => b - a)
    .map(([page, prob]) => ({ page, confidence: prob }));
}
```

### Resource Graph

Tracks linked resources:

```
/page-a
  ├── /styles/a.css
  ├── /scripts/a.js
  └── /images/logo.png

/page-b
  ├── /styles/b.css
  └── /scripts/b.js
```

When predicting `/page-b`, also prefetch its linked resources.

### Prefetch Queue

Priority-based queue:

```typescript
queue = [
  { url: '/page-b', priority: 8, confidence: 0.9 },
  { url: '/page-c', priority: 6, confidence: 0.7 },
  { url: '/page-d', priority: 5, confidence: 0.6 }
]

// Process during idle time
requestIdleCallback(() => {
  const item = queue.shift();
  if (item) prefetch(item.url);
});
```

## Delta Synchronization

### JSON Patch Format (RFC 6902)

```json
[
  { "op": "replace", "path": "/name", "value": "New Name" },
  { "op": "add", "path": "/email", "value": "new@example.com" },
  { "op": "remove", "path": "/oldField" }
]
```

### Conflict Resolution

**Server-Wins**:
```
Client: { name: "Alice" }
Server: { name: "Bob" }
Result: { name: "Bob" }
```

**Client-Wins**:
```
Client: { name: "Alice" }
Server: { name: "Bob" }
Result: { name: "Alice" }
```

**Manual**:
```
Client: { name: "Alice" }
Server: { name: "Bob" }
Result: Emit conflict event, wait for resolution
```

## Security Model

### Encryption

Uses **Web Crypto API** with **AES-GCM**:

```typescript
async function encrypt(data: ArrayBuffer): Promise<ArrayBuffer> {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  return await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
}
```

### Credential Detection

Rejects cache rules that attempt to cache:
- `Authorization` headers
- `Cookie` headers with auth tokens
- URLs containing credentials

### HTTPS Context

Preserves security context for HTTPS resources:
- No mixed content warnings
- Maintains secure flag
- Validates origin

## Performance Considerations

### Bundle Size

**Optimization Techniques**:
- Tree-shaking enabled
- Code splitting for optional features
- Minimal dependencies
- Efficient algorithms

**Results**:
- Core SDK: 1.78 KB gzipped
- Total: ~8.96 KB gzipped

### Runtime Performance

**Initialization**: < 100ms
- Parallel module initialization
- Lazy loading of optional features
- Efficient configuration validation

**Cache Serving**: < 10ms
- Direct IndexedDB access
- Minimal serialization overhead
- Efficient pattern matching

**CPU Usage**: < 5%
- Idle time prefetching
- Debounced pattern analysis
- Efficient data structures

### Memory Management

**Strategies**:
- WeakMap for caching
- Automatic cleanup of old entries
- Streaming for large resources
- Efficient serialization

## Design Decisions

### Why Monorepo?

**Advantages**:
- Shared tooling and configuration
- Easier cross-package changes
- Consistent versioning
- Simplified testing

### Why TypeScript?

**Advantages**:
- Type safety
- Better IDE support
- Self-documenting code
- Catch errors at compile time

### Why Vitest?

**Advantages**:
- Fast execution
- Native TypeScript support
- Modern API
- Great DX

### Why fast-check?

**Advantages**:
- Property-based testing
- Automatic test case generation
- Shrinking for minimal failing cases
- TypeScript integration

### Why Service Workers?

**Advantages**:
- Request interception
- Background processing
- Offline capability
- Push notifications (future)

**Alternatives Considered**:
- Fetch API wrapper (limited offline support)
- HTTP interceptors (no offline capability)

### Why IndexedDB?

**Advantages**:
- Large storage capacity
- Structured data support
- Async API
- Wide browser support

**Alternatives Considered**:
- LocalStorage (too limited)
- Cache API (less flexible)
- WebSQL (deprecated)

## Future Architecture

### Planned Enhancements

1. **Worker Pool**: Multiple workers for parallel processing
2. **Streaming**: Support for streaming large responses
3. **Compression**: Automatic compression for cached data
4. **Encryption**: Enhanced encryption with key rotation
5. **P2P Sync**: Peer-to-peer synchronization
6. **GraphQL**: Native GraphQL support
7. **WebSocket**: WebSocket caching and replay

### Scalability

The architecture is designed to scale:
- **Horizontal**: Multiple workers
- **Vertical**: Efficient algorithms
- **Data**: Streaming and compression
- **Network**: Batch operations

---

**Built with ❤️ for the offline-first web**

🌑 **ShadowCache** - Modern offline-first caching with predictive intelligence
