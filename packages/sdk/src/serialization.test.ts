// Property-Based Tests for Cache Entry Serialization
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  serializeResponse,
  deserializeResponse,
  parseCacheControl,
  calculateExpiresAt,
  shouldRevalidate,
  compareVersions,
  shouldInvalidateVersion,
  createCacheEntry,
  extractVersion,
} from './serialization';
import type { CacheMetadata, CacheControlDirectives } from './types';

// Generators for property-based testing

const headerNameArb = fc.stringMatching(/^[a-z][a-z0-9-]*$/);
const headerValueArb = fc.string({ minLength: 0, maxLength: 200 }).filter(s => !s.includes('\n') && !s.includes('\r'));

const headersArb = fc.dictionary(
  headerNameArb,
  headerValueArb,
  { minKeys: 0, maxKeys: 20 }
);

// Status codes that can have a body
// Exclude: 204 (No Content), 205 (Reset Content), 304 (Not Modified)
const statusCodeArb = fc.constantFrom(
  200, 201, 202, 203, 206, 207, 208, 226, // 2xx success
  300, 301, 302, 303, 305, 306, 307, 308, // 3xx redirect (excluding 304)
  400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451, // 4xx client errors
  500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511 // 5xx server errors
);

const bodyArb = fc.oneof(
  fc.string({ minLength: 0, maxLength: 1000 }),
  fc.uint8Array({ minLength: 0, maxLength: 1000 })
);

const responseArb = fc.record({
  status: statusCodeArb,
  statusText: fc.string({ minLength: 0, maxLength: 50 }),
  headers: headersArb,
  body: bodyArb,
});

// Feature: shadow-cache, Property 27: Response headers are preserved
// Validates: Requirements 13.2
describe('Property 27: Response headers are preserved', () => {
  it('should preserve all headers through serialization round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(responseArb, async (responseData) => {
        // Create a Response object
        const headers = new Headers();
        Object.entries(responseData.headers).forEach(([key, value]) => {
          headers.append(key, value);
        });

        const body = responseData.body;

        const originalResponse = new Response(body as BodyInit, {
          status: responseData.status,
          statusText: responseData.statusText,
          headers,
        });

        // Serialize the response
        const serialized = await serializeResponse(originalResponse);

        // Check that all headers are preserved in serialized form
        // Note: Headers API trims leading/trailing whitespace per HTTP spec
        Object.entries(responseData.headers).forEach(([key, value]) => {
          const trimmedValue = value.trim();
          expect(serialized.headers[key]).toBe(trimmedValue);
        });

        // Deserialize back to Response
        const deserializedResponse = deserializeResponse(serialized);

        // Verify all headers are preserved (with trimming)
        Object.entries(responseData.headers).forEach(([key, value]) => {
          const trimmedValue = value.trim();
          expect(deserializedResponse.headers.get(key)).toBe(trimmedValue);
        });

        // Verify status and statusText
        expect(deserializedResponse.status).toBe(responseData.status);
        expect(deserializedResponse.statusText).toBe(responseData.statusText);
      }),
      { numRuns: 100 }
    );
  });
});


// Generator for cache-control directives
const cacheControlDirectivesArb = fc.record({
  maxAge: fc.option(fc.integer({ min: 0, max: 31536000 }), { nil: undefined }),
  sMaxAge: fc.option(fc.integer({ min: 0, max: 31536000 }), { nil: undefined }),
  noCache: fc.option(fc.boolean(), { nil: undefined }),
  noStore: fc.option(fc.boolean(), { nil: undefined }),
  mustRevalidate: fc.option(fc.boolean(), { nil: undefined }),
  public: fc.option(fc.boolean(), { nil: undefined }),
  private: fc.option(fc.boolean(), { nil: undefined }),
});

// Feature: shadow-cache, Property 29: Cache-control headers are respected
// Validates: Requirements 13.4
describe('Property 29: Cache-control headers are respected', () => {
  it('should correctly parse and respect cache-control directives', () => {
    fc.assert(
      fc.property(cacheControlDirectivesArb, (directives) => {
        // Build cache-control header string
        const parts: string[] = [];
        
        if (directives.maxAge !== undefined) {
          parts.push(`max-age=${directives.maxAge}`);
        }
        if (directives.sMaxAge !== undefined) {
          parts.push(`s-maxage=${directives.sMaxAge}`);
        }
        if (directives.noCache) {
          parts.push('no-cache');
        }
        if (directives.noStore) {
          parts.push('no-store');
        }
        if (directives.mustRevalidate) {
          parts.push('must-revalidate');
        }
        if (directives.public) {
          parts.push('public');
        }
        if (directives.private) {
          parts.push('private');
        }

        const cacheControlHeader = parts.join(', ');

        // Parse the header
        const parsed = parseCacheControl(cacheControlHeader);

        // Verify all directives are correctly parsed
        if (directives.maxAge !== undefined) {
          expect(parsed.maxAge).toBe(directives.maxAge);
        }
        if (directives.sMaxAge !== undefined) {
          expect(parsed.sMaxAge).toBe(directives.sMaxAge);
        }
        if (directives.noCache) {
          expect(parsed.noCache).toBe(true);
        }
        if (directives.noStore) {
          expect(parsed.noStore).toBe(true);
        }
        if (directives.mustRevalidate) {
          expect(parsed.mustRevalidate).toBe(true);
        }
        if (directives.public) {
          expect(parsed.public).toBe(true);
        }
        if (directives.private) {
          expect(parsed.private).toBe(true);
        }

        // Test expiration calculation respects directives
        const cachedAt = Date.now();
        const expiresAt = calculateExpiresAt(parsed, cachedAt);

        // If no-store or no-cache, should not set expiration
        if (directives.noStore || directives.noCache) {
          expect(expiresAt).toBeUndefined();
        } else if (directives.sMaxAge !== undefined) {
          // Should use s-maxage if present
          expect(expiresAt).toBe(cachedAt + directives.sMaxAge * 1000);
        } else if (directives.maxAge !== undefined) {
          // Should use max-age
          expect(expiresAt).toBe(cachedAt + directives.maxAge * 1000);
        }

        // Test revalidation logic respects directives
        const metadata: CacheMetadata = {
          cachedAt,
          expiresAt,
          priority: 5,
          size: 1000,
          accessCount: 1,
          lastAccessed: cachedAt,
          ruleId: 'test',
        };

        const shouldRevalidateNow = shouldRevalidate(parsed, metadata, cachedAt);
        
        // If no-cache is set, should always revalidate
        if (directives.noCache) {
          expect(shouldRevalidateNow).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle revalidation after expiration', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3600 }), // maxAge in seconds
        fc.integer({ min: 0, max: 7200 }), // time elapsed in seconds
        (maxAge, timeElapsed) => {
          const cacheControl: CacheControlDirectives = { maxAge };
          const cachedAt = 1000000;
          const expiresAt = calculateExpiresAt(cacheControl, cachedAt);
          
          const metadata: CacheMetadata = {
            cachedAt,
            expiresAt,
            priority: 5,
            size: 1000,
            accessCount: 1,
            lastAccessed: cachedAt,
            ruleId: 'test',
          };

          const now = cachedAt + (timeElapsed * 1000);
          const shouldRevalidateResult = shouldRevalidate(cacheControl, metadata, now);

          // Should revalidate if time elapsed exceeds maxAge
          if (timeElapsed >= maxAge) {
            expect(shouldRevalidateResult).toBe(true);
          } else {
            expect(shouldRevalidateResult).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


// Generator for semantic version strings
const versionArb = fc.tuple(
  fc.integer({ min: 0, max: 99 }),
  fc.integer({ min: 0, max: 99 }),
  fc.integer({ min: 0, max: 99 })
).map(([major, minor, patch]) => `${major}.${minor}.${patch}`);

// Feature: shadow-cache, Property 30: Version changes invalidate cache
// Validates: Requirements 13.5
describe('Property 30: Version changes invalidate cache', () => {
  it('should invalidate cache when versions differ', () => {
    fc.assert(
      fc.property(versionArb, versionArb, (version1, version2) => {
        const shouldInvalidate = shouldInvalidateVersion(version1, version2);

        // Should invalidate if and only if versions are different
        if (version1 === version2) {
          expect(shouldInvalidate).toBe(false);
        } else {
          expect(shouldInvalidate).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should not invalidate when no version tracking', () => {
    fc.assert(
      fc.property(
        fc.option(versionArb, { nil: undefined }),
        fc.option(versionArb, { nil: undefined }),
        (cachedVersion, currentVersion) => {
          const shouldInvalidate = shouldInvalidateVersion(cachedVersion, currentVersion);

          // Should not invalidate if either version is undefined
          if (cachedVersion === undefined || currentVersion === undefined) {
            expect(shouldInvalidate).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly compare version strings', () => {
    fc.assert(
      fc.property(versionArb, versionArb, (v1, v2) => {
        const comparison = compareVersions(v1, v2);

        // Comparison should be consistent
        expect([-1, 0, 1]).toContain(comparison);

        // Same version should return 0
        if (v1 === v2) {
          expect(comparison).toBe(0);
        }

        // Comparison should be antisymmetric
        const reverseComparison = compareVersions(v2, v1);
        if (comparison === -1) {
          expect(reverseComparison).toBe(1);
        } else if (comparison === 1) {
          expect(reverseComparison).toBe(-1);
        } else {
          expect(reverseComparison).toBe(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should extract version from various sources', () => {
    fc.assert(
      fc.property(
        versionArb,
        fc.constantFrom('etag', 'x-version', 'x-api-version', 'url-param'),
        (version, source) => {
          let response: Response;
          let url = 'https://example.com/api/resource';

          if (source === 'etag') {
            response = new Response('body', {
              headers: { 'etag': version }
            });
          } else if (source === 'x-version') {
            response = new Response('body', {
              headers: { 'x-version': version }
            });
          } else if (source === 'x-api-version') {
            response = new Response('body', {
              headers: { 'x-api-version': version }
            });
          } else {
            // url-param
            url = `https://example.com/api/resource?v=${version}`;
            response = new Response('body');
          }

          const extractedVersion = extractVersion(response, url);

          // Should extract version from the specified source
          expect(extractedVersion).toBe(version);
        }
      ),
      { numRuns: 100 }
    );
  });
});
