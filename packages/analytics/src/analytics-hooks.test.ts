import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { AnalyticsHooks } from './analytics-hooks';
import type { AnalyticsProvider, AnalyticsEvent } from './types';

// Arbitraries for generating valid test data
const validEventTypeArbitrary = fc.constantFrom(
  'cache-hit',
  'cache-miss',
  'sync-complete',
  'offline',
  'online'
);

const validAnalyticsEventArbitrary: fc.Arbitrary<AnalyticsEvent> = fc.record({
  type: validEventTypeArbitrary,
  timestamp: fc.integer({ min: 0 }),
  data: fc.dictionary(fc.string(), fc.anything())
});

const validProviderNameArbitrary = fc.string({ minLength: 1 }).filter(s => s.trim() !== '');

describe('Analytics Hooks - Property Tests', () => {
  describe('Property 22: Analytics providers receive correct events', () => {
    // Feature: shadow-cache, Property 22: Analytics providers receive correct events
    // Validates: Requirements 8.1, 8.3, 8.4, 8.5

    it('should dispatch events to all registered providers', () => {
      fc.assert(
        fc.property(
          fc.array(validProviderNameArbitrary, { minLength: 1, maxLength: 5 }),
          validAnalyticsEventArbitrary,
          (providerNames, event) => {
            const hooks = new AnalyticsHooks(1.0); // 100% sample rate
            const trackMocks = new Map<string, ReturnType<typeof vi.fn>>();

            // Register providers with unique names
            const uniqueNames = Array.from(new Set(providerNames));
            uniqueNames.forEach(name => {
              const trackMock = vi.fn();
              trackMocks.set(name, trackMock);
              const provider: AnalyticsProvider = {
                name,
                track: trackMock
              };
              hooks.registerProvider(provider);
            });

            // Track event
            hooks.track(event);

            // Verify all providers received the event
            uniqueNames.forEach(name => {
              const trackMock = trackMocks.get(name);
              expect(trackMock).toHaveBeenCalledTimes(1);
              expect(trackMock).toHaveBeenCalledWith(event);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should dispatch cache-hit events with correct structure', () => {
      fc.assert(
        fc.property(
          validProviderNameArbitrary,
          fc.integer({ min: 0 }),
          fc.dictionary(fc.string(), fc.anything()),
          (providerName, timestamp, data) => {
            const hooks = new AnalyticsHooks(1.0);
            const trackMock = vi.fn();
            const provider: AnalyticsProvider = {
              name: providerName,
              track: trackMock
            };
            hooks.registerProvider(provider);

            const event: AnalyticsEvent = {
              type: 'cache-hit',
              timestamp,
              data
            };

            hooks.track(event);

            expect(trackMock).toHaveBeenCalledWith(event);
            expect(trackMock).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should dispatch cache-miss events with correct structure', () => {
      fc.assert(
        fc.property(
          validProviderNameArbitrary,
          fc.integer({ min: 0 }),
          fc.dictionary(fc.string(), fc.anything()),
          (providerName, timestamp, data) => {
            const hooks = new AnalyticsHooks(1.0);
            const trackMock = vi.fn();
            const provider: AnalyticsProvider = {
              name: providerName,
              track: trackMock
            };
            hooks.registerProvider(provider);

            const event: AnalyticsEvent = {
              type: 'cache-miss',
              timestamp,
              data
            };

            hooks.track(event);

            expect(trackMock).toHaveBeenCalledWith(event);
            expect(trackMock).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should dispatch sync-complete events with correct structure', () => {
      fc.assert(
        fc.property(
          validProviderNameArbitrary,
          fc.integer({ min: 0 }),
          fc.dictionary(fc.string(), fc.anything()),
          (providerName, timestamp, data) => {
            const hooks = new AnalyticsHooks(1.0);
            const trackMock = vi.fn();
            const provider: AnalyticsProvider = {
              name: providerName,
              track: trackMock
            };
            hooks.registerProvider(provider);

            const event: AnalyticsEvent = {
              type: 'sync-complete',
              timestamp,
              data
            };

            hooks.track(event);

            expect(trackMock).toHaveBeenCalledWith(event);
            expect(trackMock).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should dispatch offline events with correct structure', () => {
      fc.assert(
        fc.property(
          validProviderNameArbitrary,
          fc.integer({ min: 0 }),
          fc.dictionary(fc.string(), fc.anything()),
          (providerName, timestamp, data) => {
            const hooks = new AnalyticsHooks(1.0);
            const trackMock = vi.fn();
            const provider: AnalyticsProvider = {
              name: providerName,
              track: trackMock
            };
            hooks.registerProvider(provider);

            const event: AnalyticsEvent = {
              type: 'offline',
              timestamp,
              data
            };

            hooks.track(event);

            expect(trackMock).toHaveBeenCalledWith(event);
            expect(trackMock).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should dispatch online events with correct structure', () => {
      fc.assert(
        fc.property(
          validProviderNameArbitrary,
          fc.integer({ min: 0 }),
          fc.dictionary(fc.string(), fc.anything()),
          (providerName, timestamp, data) => {
            const hooks = new AnalyticsHooks(1.0);
            const trackMock = vi.fn();
            const provider: AnalyticsProvider = {
              name: providerName,
              track: trackMock
            };
            hooks.registerProvider(provider);

            const event: AnalyticsEvent = {
              type: 'online',
              timestamp,
              data
            };

            hooks.track(event);

            expect(trackMock).toHaveBeenCalledWith(event);
            expect(trackMock).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle async providers correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          validProviderNameArbitrary,
          validAnalyticsEventArbitrary,
          async (providerName, event) => {
            const hooks = new AnalyticsHooks(1.0);
            const trackMock = vi.fn().mockResolvedValue(undefined);
            const provider: AnalyticsProvider = {
              name: providerName,
              track: trackMock
            };
            hooks.registerProvider(provider);

            hooks.track(event);

            // Give async operations time to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(trackMock).toHaveBeenCalledWith(event);
            expect(trackMock).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not dispatch to unregistered providers', () => {
      fc.assert(
        fc.property(
          validProviderNameArbitrary,
          validAnalyticsEventArbitrary,
          (providerName, event) => {
            const hooks = new AnalyticsHooks(1.0);
            const trackMock = vi.fn();
            const provider: AnalyticsProvider = {
              name: providerName,
              track: trackMock
            };
            
            hooks.registerProvider(provider);
            hooks.unregisterProvider(providerName);
            hooks.track(event);

            expect(trackMock).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should respect sample rate for event dispatch', () => {
      fc.assert(
        fc.property(
          validProviderNameArbitrary,
          fc.array(validAnalyticsEventArbitrary, { minLength: 100, maxLength: 100 }),
          (providerName, events) => {
            // Use 0% sample rate - no events should be dispatched
            const hooks = new AnalyticsHooks(0.0);
            const trackMock = vi.fn();
            const provider: AnalyticsProvider = {
              name: providerName,
              track: trackMock
            };
            hooks.registerProvider(provider);

            events.forEach(event => hooks.track(event));

            expect(trackMock).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle provider errors gracefully', () => {
      fc.assert(
        fc.property(
          validProviderNameArbitrary,
          validAnalyticsEventArbitrary,
          (providerName, event) => {
            const hooks = new AnalyticsHooks(1.0);
            const trackMock = vi.fn().mockImplementation(() => {
              throw new Error('Provider error');
            });
            const provider: AnalyticsProvider = {
              name: providerName,
              track: trackMock
            };
            hooks.registerProvider(provider);

            // Should not throw
            expect(() => hooks.track(event)).not.toThrow();
            expect(trackMock).toHaveBeenCalledWith(event);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle async provider errors gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          validProviderNameArbitrary,
          validAnalyticsEventArbitrary,
          async (providerName, event) => {
            const hooks = new AnalyticsHooks(1.0);
            const trackMock = vi.fn().mockRejectedValue(new Error('Async provider error'));
            const provider: AnalyticsProvider = {
              name: providerName,
              track: trackMock
            };
            hooks.registerProvider(provider);

            // Should not throw
            expect(() => hooks.track(event)).not.toThrow();
            
            // Give async operations time to complete
            await new Promise(resolve => setTimeout(resolve, 10));
            
            expect(trackMock).toHaveBeenCalledWith(event);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Provider registration validation', () => {
    it('should reject providers without names', () => {
      fc.assert(
        fc.property(
          fc.constant(undefined).map(() => ({
            name: '',
            track: vi.fn()
          })),
          (provider) => {
            const hooks = new AnalyticsHooks();
            expect(() => hooks.registerProvider(provider)).toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject providers without track method', () => {
      fc.assert(
        fc.property(
          validProviderNameArbitrary,
          (name) => {
            const hooks = new AnalyticsHooks();
            const invalidProvider = { name } as any;
            expect(() => hooks.registerProvider(invalidProvider)).toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
