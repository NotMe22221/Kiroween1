import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { ShadowIndicatorElement } from './web-component';

// Feature: shadow-cache, Property 15: Uncached content shows unavailable message
// Validates: Requirements 5.3

describe('Property 15: Unavailable content message', () => {
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

  it('should show unavailable message when offline and content not cached', () => {
    fc.assert(
      fc.property(
        fc.record({
          theme: fc.constantFrom('dark', 'light', 'auto'),
          position: fc.constantFrom('top', 'bottom', 'corner'),
          showDetails: fc.boolean(),
        }),
        fc.record({
          storageUsage: fc.nat(),
          cachedResourceCount: fc.nat(),
          syncStatus: fc.string(),
        }),
        (config, cacheStatus) => {
          // Set up component in offline mode with uncached content
          element.config = config;
          element.cacheStatus = cacheStatus;
          element.isOnline = false;
          element.isContentCached = false;

          element.connectedCallback();

          // Get the shadow root content
          const shadowRoot = element.shadowRoot;
          expect(shadowRoot).not.toBeNull();

          const content = shadowRoot!.innerHTML;

          // Property: When offline and content is not cached, should show unavailable message
          expect(content).toContain('not available offline');
          expect(content).toContain('shadow-indicator__message--error');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not show unavailable message when online', () => {
    fc.assert(
      fc.property(
        fc.record({
          theme: fc.constantFrom('dark', 'light', 'auto'),
          position: fc.constantFrom('top', 'bottom', 'corner'),
          showDetails: fc.boolean(),
        }),
        fc.record({
          storageUsage: fc.nat(),
          cachedResourceCount: fc.nat(),
          syncStatus: fc.string(),
        }),
        fc.boolean(),
        (config, cacheStatus, isContentCached) => {
          // Set up component in online mode
          element.config = config;
          element.cacheStatus = cacheStatus;
          element.isOnline = true;
          element.isContentCached = isContentCached;

          element.connectedCallback();

          const shadowRoot = element.shadowRoot;
          expect(shadowRoot).not.toBeNull();

          const content = shadowRoot!.innerHTML;

          // Property: When online, should not show unavailable message regardless of cache status
          expect(content).not.toContain('not available offline');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not show unavailable message when offline but content is cached', () => {
    fc.assert(
      fc.property(
        fc.record({
          theme: fc.constantFrom('dark', 'light', 'auto'),
          position: fc.constantFrom('top', 'bottom', 'corner'),
          showDetails: fc.boolean(),
        }),
        fc.record({
          storageUsage: fc.nat(),
          cachedResourceCount: fc.nat(),
          syncStatus: fc.string(),
        }),
        (config, cacheStatus) => {
          // Set up component in offline mode with cached content
          element.config = config;
          element.cacheStatus = cacheStatus;
          element.isOnline = false;
          element.isContentCached = true;

          element.connectedCallback();

          const shadowRoot = element.shadowRoot;
          expect(shadowRoot).not.toBeNull();

          const content = shadowRoot!.innerHTML;

          // Property: When offline but content is cached, should not show unavailable message
          expect(content).not.toContain('not available offline');
        }
      ),
      { numRuns: 100 }
    );
  });
});
