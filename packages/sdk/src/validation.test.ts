import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateConfig, validateCacheRule } from './validation';
import { ConfigurationError } from './errors';
import type { ShadowCacheConfig, CacheRule } from './types';

// Arbitraries for generating valid test data
const validStrategyArbitrary = fc.constantFrom(
  'network-first',
  'cache-first',
  'stale-while-revalidate',
  'cache-only'
);

const validPriorityArbitrary = fc.integer({ min: 1, max: 10 });

const validPatternArbitrary = fc.oneof(
  fc.webUrl(),
  // Generate valid glob patterns (no unbalanced brackets, not just whitespace)
  fc.string({ minLength: 1 })
    .filter(s => s.trim() !== '')
    .filter(s => {
      const openBrackets = (s.match(/\[/g) || []).length;
      const closeBrackets = (s.match(/\]/g) || []).length;
      return openBrackets === closeBrackets;
    }),
  fc.constant(/test/),
  fc.constant(/.*\.js$/)
);

const validCacheRuleArbitrary: fc.Arbitrary<CacheRule> = fc.record({
  id: fc.string({ minLength: 1 }).filter(s => s.trim() !== ''),
  pattern: validPatternArbitrary,
  strategy: validStrategyArbitrary,
  priority: validPriorityArbitrary,
  maxAge: fc.option(fc.nat(), { nil: undefined }),
  maxEntries: fc.option(fc.integer({ min: 1 }), { nil: undefined }),
  networkTimeout: fc.option(fc.nat(), { nil: undefined })
});

const validConfigArbitrary: fc.Arbitrary<ShadowCacheConfig> = fc.record({
  cacheRules: fc.array(validCacheRuleArbitrary, { minLength: 1 }),
  predictive: fc.option(fc.record({}), { nil: undefined }),
  sync: fc.option(fc.record({}), { nil: undefined }),
  storage: fc.option(fc.record({}), { nil: undefined }),
  analytics: fc.option(fc.record({}), { nil: undefined }),
  ui: fc.option(fc.record({}), { nil: undefined })
});

describe('Configuration Validation - Property Tests', () => {
  describe('Property 1: Successful initialization establishes complete system state', () => {
    // Feature: shadow-cache, Property 1: Successful initialization establishes complete system state
    // Validates: Requirements 1.2, 1.5
    
    it('should accept all valid configurations without throwing', () => {
      fc.assert(
        fc.property(validConfigArbitrary, (config) => {
          expect(() => validateConfig(config)).not.toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it('should accept valid configurations with minimal fields', () => {
      fc.assert(
        fc.property(
          fc.array(validCacheRuleArbitrary, { minLength: 1 }),
          (cacheRules) => {
            const config: ShadowCacheConfig = { cacheRules };
            expect(() => validateConfig(config)).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Invalid configurations are rejected with detailed errors', () => {
    // Feature: shadow-cache, Property 2: Invalid configurations are rejected with detailed errors
    // Validates: Requirements 1.3

    it('should reject non-object configurations', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.constant(null),
            fc.constant(undefined)
          ),
          (invalidConfig) => {
            expect(() => validateConfig(invalidConfig)).toThrow(ConfigurationError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject configurations missing cacheRules', () => {
      fc.assert(
        fc.property(
          fc.record({
            predictive: fc.option(fc.record({}), { nil: undefined }),
            sync: fc.option(fc.record({}), { nil: undefined })
          }),
          (invalidConfig) => {
            expect(() => validateConfig(invalidConfig)).toThrow(ConfigurationError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject configurations with non-array cacheRules', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.record({}),
            fc.constant(null)
          ),
          (invalidCacheRules) => {
            const config = { cacheRules: invalidCacheRules };
            expect(() => validateConfig(config)).toThrow(ConfigurationError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject configurations with invalid optional fields', () => {
      fc.assert(
        fc.property(
          validCacheRuleArbitrary,
          fc.oneof(fc.string(), fc.integer(), fc.boolean()),
          (validRule, invalidValue) => {
            const configs = [
              { cacheRules: [validRule], predictive: invalidValue },
              { cacheRules: [validRule], sync: invalidValue },
              { cacheRules: [validRule], storage: invalidValue },
              { cacheRules: [validRule], analytics: invalidValue },
              { cacheRules: [validRule], ui: invalidValue }
            ];
            
            configs.forEach(config => {
              expect(() => validateConfig(config)).toThrow(ConfigurationError);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Cache rules are validated before activation', () => {
    // Feature: shadow-cache, Property 3: Cache rules are validated before activation
    // Validates: Requirements 1.4, 2.1

    it('should validate all cache rules in configuration', () => {
      fc.assert(
        fc.property(validCacheRuleArbitrary, (validRule) => {
          expect(() => validateCacheRule(validRule)).not.toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it('should reject cache rules missing required fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.option(fc.string(), { nil: undefined }),
            pattern: fc.option(validPatternArbitrary, { nil: undefined }),
            strategy: fc.option(validStrategyArbitrary, { nil: undefined }),
            priority: fc.option(validPriorityArbitrary, { nil: undefined })
          }),
          (partialRule) => {
            // Only test if at least one required field is missing
            if (!partialRule.id || !partialRule.pattern || !partialRule.strategy || partialRule.priority === undefined) {
              expect(() => validateCacheRule(partialRule)).toThrow(ConfigurationError);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject cache rules with invalid pattern format', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim() !== ''),
          validStrategyArbitrary,
          validPriorityArbitrary,
          (id, strategy, priority) => {
            const invalidPatterns = [
              '', // empty string
              '   ', // whitespace only
              123, // number
              true, // boolean
              null, // null
              {}, // object
              [] // array
            ];

            invalidPatterns.forEach(pattern => {
              const rule = { id, pattern, strategy, priority };
              expect(() => validateCacheRule(rule)).toThrow(ConfigurationError);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject cache rules with invalid strategy', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim() !== ''),
          validPatternArbitrary,
          validPriorityArbitrary,
          fc.string().filter(s => !['network-first', 'cache-first', 'stale-while-revalidate', 'cache-only'].includes(s)),
          (id, pattern, priority, invalidStrategy) => {
            const rule = { id, pattern, strategy: invalidStrategy, priority };
            expect(() => validateCacheRule(rule)).toThrow(ConfigurationError);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: Priority assignment is within valid range', () => {
    // Feature: shadow-cache, Property 5: Priority assignment is within valid range
    // Validates: Requirements 2.4

    it('should accept priorities between 1 and 10 inclusive', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim() !== ''),
          validPatternArbitrary,
          validStrategyArbitrary,
          validPriorityArbitrary,
          (id, pattern, strategy, priority) => {
            const rule = { id, pattern, strategy, priority };
            expect(() => validateCacheRule(rule)).not.toThrow();
            expect(priority).toBeGreaterThanOrEqual(1);
            expect(priority).toBeLessThanOrEqual(10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject priorities outside valid range', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim() !== ''),
          validPatternArbitrary,
          validStrategyArbitrary,
          fc.integer().filter(p => p < 1 || p > 10),
          (id, pattern, strategy, invalidPriority) => {
            const rule = { id, pattern, strategy, priority: invalidPriority };
            expect(() => validateCacheRule(rule)).toThrow(ConfigurationError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject non-integer priorities', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim() !== ''),
          validPatternArbitrary,
          validStrategyArbitrary,
          fc.double({ min: 1.1, max: 9.9, noNaN: true }),
          (id, pattern, strategy, floatPriority) => {
            const rule = { id, pattern, strategy, priority: floatPriority };
            expect(() => validateCacheRule(rule)).toThrow(ConfigurationError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject non-numeric priorities', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim() !== ''),
          validPatternArbitrary,
          validStrategyArbitrary,
          (id, pattern, strategy) => {
            const invalidPriorities = ['5', true, null, undefined, {}, []];
            
            invalidPriorities.forEach(priority => {
              const rule = { id, pattern, strategy, priority };
              expect(() => validateCacheRule(rule)).toThrow(ConfigurationError);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Additional validation tests', () => {
    it('should reject empty id strings', () => {
      fc.assert(
        fc.property(
          validPatternArbitrary,
          validStrategyArbitrary,
          validPriorityArbitrary,
          (pattern, strategy, priority) => {
            const rule = { id: '', pattern, strategy, priority };
            expect(() => validateCacheRule(rule)).toThrow(ConfigurationError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate optional maxAge field', () => {
      fc.assert(
        fc.property(
          validCacheRuleArbitrary,
          fc.integer().filter(n => n < 0),
          (baseRule, negativeMaxAge) => {
            const rule = { ...baseRule, maxAge: negativeMaxAge };
            expect(() => validateCacheRule(rule)).toThrow(ConfigurationError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate optional maxEntries field', () => {
      fc.assert(
        fc.property(
          validCacheRuleArbitrary,
          fc.integer().filter(n => n < 1),
          (baseRule, invalidMaxEntries) => {
            const rule = { ...baseRule, maxEntries: invalidMaxEntries };
            expect(() => validateCacheRule(rule)).toThrow(ConfigurationError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate optional networkTimeout field', () => {
      fc.assert(
        fc.property(
          validCacheRuleArbitrary,
          fc.integer().filter(n => n < 0),
          (baseRule, negativeTimeout) => {
            const rule = { ...baseRule, networkTimeout: negativeTimeout };
            expect(() => validateCacheRule(rule)).toThrow(ConfigurationError);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
