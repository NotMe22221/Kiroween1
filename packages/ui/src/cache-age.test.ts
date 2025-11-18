import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { ShadowIndicatorElement } from './web-component';
import type { CacheMetadata } from './types';

// Feature: shadow-cache, Property 16: Cached content displays age metadata
// Validates: Requirements 5.4

describe('Property 16: Cache age display', () => {
  let element: ShadowIndicatorElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    element = new ShadowIndicatorElement();
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
    document.body.classList.remove('shadow-theme');
  });

  it('should display age metadata when content metadata is provided', () => {
    fc.assert(
      fc.property(
        fc.record({
          theme: fc.constantFrom('dark', 'light', 'auto'),
          position: fc.constantFrom('top', 'bottom', 'corner'),
          showDetails: fc.constant(true), // Must show details to see metadata
        }),
        fc.record({
          storageUsage: fc.nat(),
          cachedResourceCount: fc.nat(),
          syncStatus: fc.string(),
        }),
        fc.record({
          cachedAt: fc.integer({ min: Date.now() - 86400000, max: Date.now() }), // Last 24 hours
          priority: fc.integer({ min: 1, max: 10 }) as fc.Arbitrary<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10>,
          size: fc.nat(),
          accessCount: fc.nat(),
          lastAccessed: fc.integer({ min: Date.now() - 86400000, max: Date.now() }),
          ruleId: fc.string(),
        }),
        (config, cacheStatus, metadata) => {
          // Set up component with metadata
          element.config = config;
          element.cacheStatus = cacheStatus;
          element.contentMetadata = metadata as CacheMetadata;
          element.isOnline = false;

          element.connectedCallback();

          const shadowRoot = element.shadowRoot;
          expect(shadowRoot).not.toBeNull();

          const content = shadowRoot!.innerHTML;

          // Property: When content metadata is provided, should display age
          expect(content).toContain('Age:');
          
          // Should display priority
          expect(content).toContain('Priority:');
          expect(content).toContain(`${metadata.priority}/10`);

          // Should have metadata section
          expect(content).toContain('shadow-indicator__metadata');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should mark stale content when expired', () => {
    fc.assert(
      fc.property(
        fc.record({
          theme: fc.constantFrom('dark', 'light', 'auto'),
          position: fc.constantFrom('top', 'bottom', 'corner'),
          showDetails: fc.constant(true),
        }),
        fc.record({
          storageUsage: fc.nat(),
          cachedResourceCount: fc.nat(),
          syncStatus: fc.string(),
        }),
        fc.record({
          cachedAt: fc.integer({ min: Date.now() - 86400000, max: Date.now() - 3600000 }),
          expiresAt: fc.integer({ min: Date.now() - 3600000, max: Date.now() - 1000 }), // Expired
          priority: fc.integer({ min: 1, max: 10 }) as fc.Arbitrary<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10>,
          size: fc.nat(),
          accessCount: fc.nat(),
          lastAccessed: fc.integer({ min: Date.now() - 86400000, max: Date.now() }),
          ruleId: fc.string(),
        }),
        (config, cacheStatus, metadata) => {
          // Set up component with expired metadata
          element.config = config;
          element.cacheStatus = cacheStatus;
          element.contentMetadata = metadata as CacheMetadata;
          element.isOnline = false;

          element.connectedCallback();

          const shadowRoot = element.shadowRoot;
          expect(shadowRoot).not.toBeNull();

          const content = shadowRoot!.innerHTML;

          // Property: When content is expired, should mark as stale
          expect(content).toContain('(stale)');
          expect(content).toContain('shadow-indicator__metadata-value--stale');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not mark fresh content as stale', () => {
    fc.assert(
      fc.property(
        fc.record({
          theme: fc.constantFrom('dark', 'light', 'auto'),
          position: fc.constantFrom('top', 'bottom', 'corner'),
          showDetails: fc.constant(true),
        }),
        fc.record({
          storageUsage: fc.nat(),
          cachedResourceCount: fc.nat(),
          syncStatus: fc.string(),
        }),
        fc.integer({ min: 1000, max: 3600000 }), // Age in ms (1 second to 1 hour)
        fc.integer({ min: 10000, max: 86400000 }), // Time until expiry (10 seconds to 1 day) - avoid race conditions
        fc.integer({ min: 1, max: 10 }) as fc.Arbitrary<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10>,
        (config, cacheStatus, age, timeUntilExpiry, priority) => {
          const now = Date.now(); // Capture now inside the property to minimize race conditions
          const cachedAt = now - age;
          const expiresAt = now + timeUntilExpiry;
          
          const metadata = {
            cachedAt,
            expiresAt,
            priority,
            size: 0,
            accessCount: 0,
            lastAccessed: cachedAt,
            ruleId: 'test',
          };

          // Set up component with fresh metadata
          element.config = config;
          element.cacheStatus = cacheStatus;
          element.contentMetadata = metadata as CacheMetadata;
          element.isOnline = false;

          element.connectedCallback();

          const shadowRoot = element.shadowRoot;
          expect(shadowRoot).not.toBeNull();

          const content = shadowRoot!.innerHTML;

          // Property: When content is not expired, should not mark as stale
          expect(content).not.toContain('(stale)');
          expect(content).not.toContain('shadow-indicator__metadata-value--stale');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not display metadata when showDetails is false', () => {
    fc.assert(
      fc.property(
        fc.record({
          theme: fc.constantFrom('dark', 'light', 'auto'),
          position: fc.constantFrom('top', 'bottom', 'corner'),
          showDetails: fc.constant(false), // Details hidden
        }),
        fc.record({
          storageUsage: fc.nat(),
          cachedResourceCount: fc.nat(),
          syncStatus: fc.string(),
        }),
        fc.record({
          cachedAt: fc.integer({ min: Date.now() - 86400000, max: Date.now() }),
          priority: fc.integer({ min: 1, max: 10 }) as fc.Arbitrary<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10>,
          size: fc.nat(),
          accessCount: fc.nat(),
          lastAccessed: fc.integer({ min: Date.now() - 86400000, max: Date.now() }),
          ruleId: fc.string(),
        }),
        (config, cacheStatus, metadata) => {
          // Set up component with details hidden
          element.config = config;
          element.cacheStatus = cacheStatus;
          element.contentMetadata = metadata as CacheMetadata;
          element.isOnline = false;

          element.connectedCallback();

          const shadowRoot = element.shadowRoot;
          expect(shadowRoot).not.toBeNull();

          const content = shadowRoot!.innerHTML;

          // Property: When showDetails is false, should not display metadata
          expect(content).not.toContain('shadow-indicator__details');
          expect(content).not.toContain('Age:');
          expect(content).not.toContain('Priority:');
        }
      ),
      { numRuns: 100 }
    );
  });
});
