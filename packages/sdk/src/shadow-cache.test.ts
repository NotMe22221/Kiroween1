import { describe, it, expect } from 'vitest';
import { ShadowCache } from './shadow-cache';
import type { ShadowCacheConfig } from './types';

describe('ShadowCache', () => {
  it('should be defined', () => {
    expect(ShadowCache).toBeDefined();
  });

  it('should have static init method', () => {
    expect(typeof ShadowCache.init).toBe('function');
  });

  // Feature: shadow-cache, Example test for SDK API surface
  // Validates: Requirements 1.1, 9.1
  describe('SDK API Surface', () => {
    it('should export single default class with expected methods', async () => {
      // Verify ShadowCache is a class
      expect(typeof ShadowCache).toBe('function');
      expect(ShadowCache.name).toBe('ShadowCache');
      
      // Verify static init method exists
      expect(typeof ShadowCache.init).toBe('function');
      
      // Create a minimal valid config
      const config: ShadowCacheConfig = {
        cacheRules: [
          {
            id: 'test-rule',
            pattern: '/api/*',
            strategy: 'network-first',
            priority: 5,
          },
        ],
      };
      
      // Initialize SDK
      const sdk = await ShadowCache.init(config);
      
      // Verify instance methods exist
      expect(typeof sdk.getStatus).toBe('function');
      expect(typeof sdk.clearCache).toBe('function');
      expect(typeof sdk.prefetch).toBe('function');
      expect(typeof sdk.sync).toBe('function');
      expect(typeof sdk.on).toBe('function');
      expect(typeof sdk.off).toBe('function');
      
      // Verify all methods are present (no missing methods)
      const expectedMethods = ['getStatus', 'clearCache', 'prefetch', 'sync', 'on', 'off'];
      for (const method of expectedMethods) {
        expect(sdk).toHaveProperty(method);
        expect(typeof (sdk as any)[method]).toBe('function');
      }
    });
  });
});

// Import fast-check for property-based testing
import * as fc from 'fast-check';

// Feature: shadow-cache, Property 23: Async SDK methods return Promises
// Validates: Requirements 9.2
describe('Property 23: Async SDK methods return Promises', () => {
  it('should return Promises for all async SDK methods', async () => {
    // Generator for valid IDs (alphanumeric with hyphens)
    const validIdArb = fc.stringMatching(/^[a-zA-Z0-9][a-zA-Z0-9-]*$/);
    
    // Generator for valid URL patterns (simple paths without brackets)
    const validPatternArb = fc.oneof(
      fc.stringMatching(/^\/[a-zA-Z0-9/*-]*$/),
      fc.constant('/api/*'),
      fc.constant('/static/**'),
      fc.constant('*.js'),
      fc.constant('*.css')
    );
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          cacheRules: fc.array(
            fc.record({
              id: validIdArb,
              pattern: validPatternArb,
              strategy: fc.constantFrom('network-first', 'cache-first', 'stale-while-revalidate', 'cache-only'),
              priority: fc.integer({ min: 1, max: 10 }) as fc.Arbitrary<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10>,
            }),
            { minLength: 1 }
          ),
        }),
        async (config) => {
          // Initialize SDK with generated config
          const sdk = await ShadowCache.init(config as ShadowCacheConfig);
          
          // Test that init returns a Promise (already awaited above)
          const initResult = ShadowCache.init(config as ShadowCacheConfig);
          expect(initResult).toBeInstanceOf(Promise);
          await initResult; // Clean up
          
          // Test getStatus returns a Promise
          const statusResult = sdk.getStatus();
          expect(statusResult).toBeInstanceOf(Promise);
          await statusResult;
          
          // Test clearCache returns a Promise
          const clearResult = sdk.clearCache();
          expect(clearResult).toBeInstanceOf(Promise);
          await clearResult;
          
          // Test prefetch returns a Promise
          const prefetchResult = sdk.prefetch([]);
          expect(prefetchResult).toBeInstanceOf(Promise);
          await prefetchResult;
          
          // Note: sync() will throw if sync is not configured, but it should still return a Promise
          const syncResult = sdk.sync();
          expect(syncResult).toBeInstanceOf(Promise);
          // Catch the error since sync is not configured
          await syncResult.catch(() => {});
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: shadow-cache, Property 25: Cache status includes required fields
// Validates: Requirements 9.5
describe('Property 25: Cache status includes required fields', () => {
  it('should return status with storageUsage, cachedResourceCount, and syncStatus', async () => {
    // Generator for valid IDs (alphanumeric with hyphens)
    const validIdArb = fc.stringMatching(/^[a-zA-Z0-9][a-zA-Z0-9-]*$/);
    
    // Generator for valid URL patterns (simple paths without brackets)
    const validPatternArb = fc.oneof(
      fc.stringMatching(/^\/[a-zA-Z0-9/*-]*$/),
      fc.constant('/api/*'),
      fc.constant('/static/**'),
      fc.constant('*.js'),
      fc.constant('*.css')
    );
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          cacheRules: fc.array(
            fc.record({
              id: validIdArb,
              pattern: validPatternArb,
              strategy: fc.constantFrom('network-first', 'cache-first', 'stale-while-revalidate', 'cache-only'),
              priority: fc.integer({ min: 1, max: 10 }) as fc.Arbitrary<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10>,
            }),
            { minLength: 1 }
          ),
        }),
        async (config) => {
          // Initialize SDK with generated config
          const sdk = await ShadowCache.init(config as ShadowCacheConfig);
          
          // Get status
          const status = await sdk.getStatus();
          
          // Verify required fields exist
          expect(status).toHaveProperty('storageUsage');
          expect(status).toHaveProperty('cachedResourceCount');
          expect(status).toHaveProperty('syncStatus');
          
          // Verify field types
          expect(typeof status.storageUsage).toBe('number');
          expect(typeof status.cachedResourceCount).toBe('number');
          expect(typeof status.syncStatus).toBe('string');
          
          // Verify values are reasonable
          expect(status.storageUsage).toBeGreaterThanOrEqual(0);
          expect(status.cachedResourceCount).toBeGreaterThanOrEqual(0);
          expect(['idle', 'pending', 'synced', 'conflict']).toContain(status.syncStatus);
        }
      ),
      { numRuns: 100 }
    );
  });
});
