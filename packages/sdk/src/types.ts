// SDK Type Definitions
export interface ShadowCacheConfig {
  cacheRules: CacheRule[];
  predictive?: any;
  sync?: any;
  storage?: any;
  analytics?: any;
  ui?: any;
}

export interface CacheRule {
  id: string;
  pattern: string | RegExp;
  strategy: 'network-first' | 'cache-first' | 'stale-while-revalidate' | 'cache-only';
  priority: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  maxAge?: number;
  maxEntries?: number;
  networkTimeout?: number;
  sensitive?: boolean;
}

export interface CacheStatus {
  storageUsage: number;
  cachedResourceCount: number;
  syncStatus: string;
}

// Cache Entry Models
export interface CacheEntry {
  key: string;
  url: string;
  response: SerializedResponse;
  metadata: CacheMetadata;
}

export interface CacheMetadata {
  cachedAt: number;
  expiresAt?: number;
  priority: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
  ruleId: string;
  etag?: string;
  version?: string;
}

export interface SerializedResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: ArrayBuffer | string;
  type: ResponseType;
}

export type ResponseType = 'basic' | 'cors' | 'default' | 'error' | 'opaque' | 'opaqueredirect';

// Cache Control Directives
export interface CacheControlDirectives {
  maxAge?: number;
  sMaxAge?: number;
  noCache?: boolean;
  noStore?: boolean;
  mustRevalidate?: boolean;
  proxyRevalidate?: boolean;
  public?: boolean;
  private?: boolean;
  immutable?: boolean;
  staleWhileRevalidate?: number;
  staleIfError?: number;
}
