// Cache Entry Serialization
import type { 
  CacheEntry, 
  CacheMetadata, 
  SerializedResponse, 
  CacheControlDirectives,
  ResponseType 
} from './types';

/**
 * Serialize a Response object for storage
 */
export async function serializeResponse(response: Response): Promise<SerializedResponse> {
  // Extract headers
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  // Clone response to avoid consuming the body
  const clonedResponse = response.clone();
  
  // Read body as ArrayBuffer for binary data support
  const body = await clonedResponse.arrayBuffer();

  return {
    status: response.status,
    statusText: response.statusText,
    headers,
    body,
    type: response.type as ResponseType,
  };
}

/**
 * Deserialize a SerializedResponse back to a Response object
 */
export function deserializeResponse(serialized: SerializedResponse): Response {
  const { status, statusText, headers, body, type } = serialized;

  // Create Headers object
  const headersObj = new Headers();
  Object.entries(headers).forEach(([key, value]) => {
    headersObj.append(key, value);
  });

  // Create Response with body and metadata
  return new Response(body, {
    status,
    statusText,
    headers: headersObj,
  });
}

/**
 * Parse Cache-Control header into structured directives
 */
export function parseCacheControl(cacheControlHeader?: string): CacheControlDirectives {
  if (!cacheControlHeader) {
    return {};
  }

  const directives: CacheControlDirectives = {};
  
  // Split by comma and process each directive
  const parts = cacheControlHeader.split(',').map(part => part.trim());
  
  for (const part of parts) {
    const [directive, value] = part.split('=').map(s => s.trim());
    const directiveLower = directive.toLowerCase();

    switch (directiveLower) {
      case 'max-age':
        directives.maxAge = parseInt(value, 10);
        break;
      case 's-maxage':
        directives.sMaxAge = parseInt(value, 10);
        break;
      case 'no-cache':
        directives.noCache = true;
        break;
      case 'no-store':
        directives.noStore = true;
        break;
      case 'must-revalidate':
        directives.mustRevalidate = true;
        break;
      case 'proxy-revalidate':
        directives.proxyRevalidate = true;
        break;
      case 'public':
        directives.public = true;
        break;
      case 'private':
        directives.private = true;
        break;
      case 'immutable':
        directives.immutable = true;
        break;
      case 'stale-while-revalidate':
        directives.staleWhileRevalidate = parseInt(value, 10);
        break;
      case 'stale-if-error':
        directives.staleIfError = parseInt(value, 10);
        break;
    }
  }

  return directives;
}

/**
 * Calculate expiration time based on cache-control directives and cached time
 */
export function calculateExpiresAt(
  cacheControl: CacheControlDirectives,
  cachedAt: number
): number | undefined {
  // If no-store or no-cache, don't set expiration (should revalidate)
  if (cacheControl.noStore || cacheControl.noCache) {
    return undefined;
  }

  // Use s-maxage for shared caches, otherwise max-age
  const maxAge = cacheControl.sMaxAge ?? cacheControl.maxAge;
  
  if (maxAge !== undefined && maxAge >= 0) {
    return cachedAt + (maxAge * 1000); // Convert seconds to milliseconds
  }

  return undefined;
}

/**
 * Check if a cached entry should be revalidated based on cache-control
 */
export function shouldRevalidate(
  cacheControl: CacheControlDirectives,
  metadata: CacheMetadata,
  now: number = Date.now()
): boolean {
  // Always revalidate if no-cache is set
  if (cacheControl.noCache) {
    return true;
  }

  // Check if expired
  if (metadata.expiresAt !== undefined && now >= metadata.expiresAt) {
    return true;
  }

  // Check must-revalidate
  if (cacheControl.mustRevalidate && metadata.expiresAt !== undefined && now >= metadata.expiresAt) {
    return true;
  }

  return false;
}

/**
 * Compare two version strings
 * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  // Simple string comparison for now
  // Can be enhanced with semver parsing if needed
  if (v1 === v2) return 0;
  
  // Try to parse as semver-like versions
  const parts1 = v1.split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = v2.split('.').map(p => parseInt(p, 10) || 0);
  
  const maxLength = Math.max(parts1.length, parts2.length);
  
  for (let i = 0; i < maxLength; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }
  
  return 0;
}

/**
 * Check if a cache entry should be invalidated due to version change
 */
export function shouldInvalidateVersion(
  cachedVersion: string | undefined,
  currentVersion: string | undefined
): boolean {
  // If no version tracking, don't invalidate
  if (!cachedVersion || !currentVersion) {
    return false;
  }

  // Invalidate if versions differ
  return cachedVersion !== currentVersion;
}

/**
 * Create a cache entry from a Response and metadata
 */
export async function createCacheEntry(
  url: string,
  response: Response,
  metadata: Partial<CacheMetadata>
): Promise<CacheEntry> {
  const serializedResponse = await serializeResponse(response);
  
  // Calculate size (approximate)
  const bodySize = serializedResponse.body instanceof ArrayBuffer 
    ? serializedResponse.body.byteLength 
    : new Blob([serializedResponse.body]).size;
  
  const headersSize = Object.entries(serializedResponse.headers)
    .reduce((sum, [k, v]) => sum + k.length + v.length, 0);
  
  const size = bodySize + headersSize;

  // Parse cache-control if present
  const cacheControlHeader = serializedResponse.headers['cache-control'];
  const cacheControl = parseCacheControl(cacheControlHeader);
  
  const now = Date.now();
  const expiresAt = calculateExpiresAt(cacheControl, now);

  const fullMetadata: CacheMetadata = {
    cachedAt: now,
    expiresAt,
    priority: metadata.priority ?? 5,
    size,
    accessCount: 0,
    lastAccessed: now,
    ruleId: metadata.ruleId ?? 'default',
    etag: serializedResponse.headers['etag'],
    version: metadata.version,
  };

  return {
    key: url,
    url,
    response: serializedResponse,
    metadata: fullMetadata,
  };
}

/**
 * Extract version from response headers or URL
 */
export function extractVersion(response: Response, url: string): string | undefined {
  // Check ETag header
  const etag = response.headers.get('etag');
  if (etag) {
    return etag;
  }

  // Check custom version header
  const version = response.headers.get('x-version') || response.headers.get('x-api-version');
  if (version) {
    return version;
  }

  // Check URL query parameters for version
  try {
    const urlObj = new URL(url);
    const versionParam = urlObj.searchParams.get('v') || urlObj.searchParams.get('version');
    if (versionParam) {
      return versionParam;
    }
  } catch {
    // Invalid URL, skip
  }

  return undefined;
}
