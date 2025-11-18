import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { ShadowIndicatorElement } from './web-component';

// Feature: shadow-cache, Property 14: Offline UI applies shadow theme
// Validates: Requirements 5.2

describe('Property 14: Shadow theme application', () => {
  let element: ShadowIndicatorElement;

  beforeEach(() => {
    // Clean up any existing elements
    document.body.innerHTML = '';
    element = new ShadowIndicatorElement();
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
    document.body.classList.remove('shadow-theme');
  });

  it('should apply shadow theme class when offline', () => {
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
          // Set up the component
          element.config = config;
          element.cacheStatus = cacheStatus;
          element.isOnline = false;

          // Wait for DOM updates
          element.connectedCallback();

          // Verify shadow theme is applied
          const hasShadowTheme = document.body.classList.contains('shadow-theme');
          const hasThemeAttribute = document.documentElement.hasAttribute('data-shadow-theme');
          const themeValue = document.documentElement.getAttribute('data-shadow-theme');

          // Property: When offline, the UI should apply shadow theme
          expect(hasShadowTheme).toBe(true);
          expect(hasThemeAttribute).toBe(true);
          expect(themeValue).toBe(config.theme);

          // Clean up for next iteration
          document.body.classList.remove('shadow-theme');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not apply shadow theme class when online', () => {
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
          // Set up the component
          element.config = config;
          element.cacheStatus = cacheStatus;
          element.isOnline = true;

          // Wait for DOM updates
          element.connectedCallback();

          // Verify shadow theme is NOT applied when online
          const hasShadowTheme = document.body.classList.contains('shadow-theme');

          // Property: When online, the UI should not apply shadow theme
          expect(hasShadowTheme).toBe(false);

          // Clean up for next iteration
          document.body.classList.remove('shadow-theme');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply correct theme variant to document', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('dark', 'light', 'auto'),
        (theme) => {
          element.config = { theme, position: 'corner', showDetails: true };
          element.connectedCallback();

          const themeAttribute = document.documentElement.getAttribute('data-shadow-theme');

          // Property: Theme attribute should match configured theme
          expect(themeAttribute).toBe(theme);
        }
      ),
      { numRuns: 100 }
    );
  });
});
