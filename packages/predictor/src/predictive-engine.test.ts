// Feature: shadow-cache, Property 7: Navigation patterns are recorded correctly
// Feature: shadow-cache, Property 8: Predictions are based on recorded patterns
// Feature: shadow-cache, Property 9: Prefetching respects priority ordering

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { PredictiveEngine } from './predictive-engine';

describe('PredictiveEngine', () => {
  describe('Property 7: Navigation patterns are recorded correctly', () => {
    it('should record navigation patterns with accurate timestamps and sequence order', () => {
      // **Validates: Requirements 3.1**
      fc.assert(
        fc.property(
          fc.array(fc.webUrl(), { minLength: 1, maxLength: 20 }),
          (urls) => {
            const engine = new PredictiveEngine();
            const startTime = Date.now();

            // Record all navigations
            urls.forEach(url => {
              engine.recordNavigation(url);
            });

            const endTime = Date.now();
            const history = engine.getNavigationHistory();
            const model = engine.getModel();

            // Check that history matches the recorded sequence
            expect(history).toEqual(urls);

            // Check that each URL has a pattern entry
            for (const url of urls) {
              const pattern = model.patterns.get(url);
              expect(pattern).toBeDefined();
              
              if (pattern) {
                // Timestamp should be within the test time range
                expect(pattern.lastAccessed).toBeGreaterThanOrEqual(startTime);
                expect(pattern.lastAccessed).toBeLessThanOrEqual(endTime);
                
                // Frequency should match occurrences in the URL list
                const expectedFrequency = urls.filter(u => u === url).length;
                expect(pattern.frequency).toBe(expectedFrequency);
                
                // Sequence should be non-empty
                expect(pattern.sequence.length).toBeGreaterThan(0);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain sequence order for navigation patterns', () => {
      fc.assert(
        fc.property(
          fc.array(fc.webUrl(), { minLength: 2, maxLength: 10 }),
          (urls) => {
            const engine = new PredictiveEngine();

            urls.forEach(url => engine.recordNavigation(url));

            const history = engine.getNavigationHistory();
            
            // History should preserve the exact order
            expect(history).toEqual(urls);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 8: Predictions are based on recorded patterns', () => {
    it('should return predictions based on recorded navigation patterns', async () => {
      // **Validates: Requirements 3.2**
      await fc.assert(
        fc.asyncProperty(
          fc.webUrl(),
          fc.array(fc.webUrl(), { minLength: 1, maxLength: 5 }),
          fc.integer({ min: 2, max: 10 }),
          async (startUrl, nextUrls, repetitions) => {
            const engine = new PredictiveEngine({ minConfidence: 0.1 });

            // Create a pattern: startUrl -> nextUrls[0] (repeated)
            for (let i = 0; i < repetitions; i++) {
              engine.recordNavigation(startUrl);
              for (const nextUrl of nextUrls) {
                engine.recordNavigation(nextUrl);
              }
            }

            // Get predictions from startUrl
            const predictions = await engine.getPredictions(startUrl);

            // Should have predictions
            expect(predictions.length).toBeGreaterThan(0);

            // All predicted URLs should be from the nextUrls we recorded
            for (const prediction of predictions) {
              expect(nextUrls).toContain(prediction.url);
              
              // Confidence should be between 0 and 1
              expect(prediction.confidence).toBeGreaterThan(0);
              expect(prediction.confidence).toBeLessThanOrEqual(1);
              
              // Priority should be between 1 and 10
              expect(prediction.priority).toBeGreaterThanOrEqual(1);
              expect(prediction.priority).toBeLessThanOrEqual(10);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty predictions for URLs with no recorded transitions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webUrl(),
          async (url) => {
            const engine = new PredictiveEngine();
            
            // Don't record any navigation
            const predictions = await engine.getPredictions(url);
            
            // Should have no predictions
            expect(predictions).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter predictions by minimum confidence threshold', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webUrl(),
          fc.array(fc.webUrl(), { minLength: 3, maxLength: 5 }),
          fc.double({ min: 0.5, max: 0.9 }),
          async (startUrl, nextUrls, minConfidence) => {
            const engine = new PredictiveEngine({ minConfidence });

            // Create varied patterns with different frequencies
            engine.recordNavigation(startUrl);
            engine.recordNavigation(nextUrls[0]);
            
            engine.recordNavigation(startUrl);
            engine.recordNavigation(nextUrls[0]);
            
            if (nextUrls.length > 1) {
              engine.recordNavigation(startUrl);
              engine.recordNavigation(nextUrls[1]);
            }

            const predictions = await engine.getPredictions(startUrl);

            // All predictions should meet minimum confidence
            for (const prediction of predictions) {
              expect(prediction.confidence).toBeGreaterThanOrEqual(minConfidence);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 9: Prefetching respects priority ordering', () => {
    it('should order prefetch queue by priority (highest first)', () => {
      // **Validates: Requirements 3.4**
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              url: fc.webUrl(),
              priority: fc.integer({ min: 1, max: 10 }),
              confidence: fc.double({ min: 0, max: 1 }),
            }),
            { minLength: 2, maxLength: 10 }
          ),
          (items) => {
            const engine = new PredictiveEngine();

            // Add items to prefetch queue
            items.forEach(item => {
              engine.addToPrefetchQueue(item.url, item.priority, item.confidence);
            });

            const queue = engine.getPrefetchQueue();

            // Queue should be sorted by priority (highest first)
            for (let i = 0; i < queue.length - 1; i++) {
              expect(queue[i].priority).toBeGreaterThanOrEqual(queue[i + 1].priority);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain priority ordering when adding items incrementally', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              url: fc.webUrl(),
              priority: fc.integer({ min: 1, max: 10 }),
              confidence: fc.double({ min: 0, max: 1 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (items) => {
            const engine = new PredictiveEngine();

            // Add items one by one
            for (const item of items) {
              engine.addToPrefetchQueue(item.url, item.priority, item.confidence);
              
              // Check ordering after each addition
              const queue = engine.getPrefetchQueue();
              for (let i = 0; i < queue.length - 1; i++) {
                expect(queue[i].priority).toBeGreaterThanOrEqual(queue[i + 1].priority);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update priority when same URL is added with higher priority', () => {
      fc.assert(
        fc.property(
          fc.webUrl(),
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 6, max: 10 }),
          fc.double({ min: 0, max: 1 }),
          (url, lowPriority, highPriority, confidence) => {
            const engine = new PredictiveEngine();

            // Add with low priority first
            engine.addToPrefetchQueue(url, lowPriority, confidence);
            
            // Add same URL with higher priority
            engine.addToPrefetchQueue(url, highPriority, confidence);

            const queue = engine.getPrefetchQueue();
            
            // Should only have one entry for this URL
            const urlEntries = queue.filter(item => item.url === url);
            expect(urlEntries.length).toBe(1);
            
            // Should have the higher priority
            expect(urlEntries[0].priority).toBe(highPriority);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
