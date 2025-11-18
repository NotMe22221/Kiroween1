// Property-based tests for cache rule matching engine
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { matchPattern, findMatchingRules, resolveRule, RuleMatcher } from './matcher';
import type { CacheRule } from './types';

describe('Cache Rule Matching Engine', () => {
  // Feature: shadow-cache, Property 4: URL pattern matching works correctly
  // Validates: Requirements 2.2
  describe('Property 4: URL pattern matching works correctly', () => {
    it('should correctly match URLs against glob patterns', () => {
      fc.assert(
        fc.property(
          fc.record({
            // Generate URL-like strings
            protocol: fc.constantFrom('http://', 'https://'),
            domain: fc.stringMatching(/^[a-z0-9-]+\.[a-z]{2,}$/),
            path: fc.array(fc.stringMatching(/^[a-z0-9-]+$/), { minLength: 0, maxLength: 3 })
          }),
          ({ protocol, domain, path }) => {
            const url = protocol + domain + (path.length > 0 ? '/' + path.join('/') : '');
            
            // Test exact match
            expect(matchPattern(url, url)).toBe(true);
            
            // Test wildcard match - single segment
            if (path.length > 0) {
              const wildcardPattern = protocol + domain + '/*';
              expect(matchPattern(url, wildcardPattern)).toBe(path.length === 1);
            }
            
            // Test double wildcard match - any depth
            // Note: /** requires at least a / to match, so only test if path exists
            if (path.length > 0) {
              const doubleWildcardPattern = protocol + domain + '/**';
              expect(matchPattern(url, doubleWildcardPattern)).toBe(true);
            }
            
            // Test non-matching pattern
            const nonMatchingPattern = protocol + 'different.com/**';
            expect(matchPattern(url, nonMatchingPattern)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly match URLs against RegExp patterns', () => {
      fc.assert(
        fc.property(
          fc.record({
            protocol: fc.constantFrom('http://', 'https://'),
            domain: fc.stringMatching(/^[a-z0-9-]+\.[a-z]{2,}$/),
            path: fc.stringMatching(/^[a-z0-9/-]*$/)
          }),
          ({ protocol, domain, path }) => {
            const url = protocol + domain + (path ? '/' + path : '');
            
            // Test RegExp that should match
            const matchingRegex = new RegExp(`^${protocol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${domain.replace(/\./g, '\\.')}`);
            expect(matchPattern(url, matchingRegex)).toBe(true);
            
            // Test RegExp that should not match
            const nonMatchingRegex = /^ftp:\/\//;
            expect(matchPattern(url, nonMatchingRegex)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle glob special characters correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            base: fc.constant('https://example.com/'),
            segment1: fc.stringMatching(/^[a-z]{3,8}$/),
            segment2: fc.stringMatching(/^[a-z]{3,8}$/),
            extension: fc.constantFrom('js', 'css', 'html', 'json')
          }),
          ({ base, segment1, segment2, extension }) => {
            const url = `${base}${segment1}/${segment2}.${extension}`;
            
            // Test ? wildcard (single character)
            const questionPattern = `${base}${segment1}/${segment2}.???`;
            expect(matchPattern(url, questionPattern)).toBe(extension.length === 3);
            
            // Test * wildcard (any characters in segment)
            const starPattern = `${base}${segment1}/*.${extension}`;
            expect(matchPattern(url, starPattern)).toBe(true);
            
            // Test ** wildcard (any path depth)
            const doubleStarPattern = `${base}**/*.${extension}`;
            expect(matchPattern(url, doubleStarPattern)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: shadow-cache, Property 6: Highest priority rule wins on conflicts
  // Validates: Requirements 2.5
  describe('Property 6: Highest priority rule wins on conflicts', () => {
    // Generator for valid priority values (1-10)
    const priorityArb = fc.integer({ min: 1, max: 10 }) as fc.Arbitrary<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10>;
    
    // Generator for cache rules
    const cacheRuleArb = fc.record({
      id: fc.uuid(),
      pattern: fc.oneof(
        fc.constant('https://example.com/**'),
        fc.constant('https://example.com/api/**'),
        fc.constant(/^https:\/\/example\.com\/.*/),
      ),
      strategy: fc.constantFrom('network-first', 'cache-first', 'stale-while-revalidate', 'cache-only') as fc.Arbitrary<'network-first' | 'cache-first' | 'stale-while-revalidate' | 'cache-only'>,
      priority: priorityArb
    }) as fc.Arbitrary<CacheRule>;

    it('should resolve to the highest priority rule when multiple rules match', () => {
      fc.assert(
        fc.property(
          fc.array(cacheRuleArb, { minLength: 2, maxLength: 10 }),
          fc.constant('https://example.com/api/users'),
          (rules, url) => {
            // Find all matching rules
            const matchingRules = findMatchingRules(url, rules);
            
            if (matchingRules.length === 0) {
              // If no rules match, resolveRule should return null
              expect(resolveRule(url, rules)).toBeNull();
            } else {
              // Find the expected highest priority
              const expectedHighest = matchingRules.reduce((highest, current) =>
                current.priority > highest.priority ? current : highest
              );
              
              // Verify resolveRule returns the highest priority rule
              const resolved = resolveRule(url, rules);
              expect(resolved).not.toBeNull();
              expect(resolved!.priority).toBe(expectedHighest.priority);
              
              // Verify no other matching rule has higher priority
              matchingRules.forEach(rule => {
                expect(rule.priority).toBeLessThanOrEqual(resolved!.priority);
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle rules with same priority consistently', () => {
      fc.assert(
        fc.property(
          priorityArb,
          fc.array(fc.uuid(), { minLength: 2, maxLength: 5 }),
          (priority, ids) => {
            // Create multiple rules with the same priority
            const rules: CacheRule[] = ids.map(id => ({
              id,
              pattern: 'https://example.com/**',
              strategy: 'cache-first',
              priority
            }));
            
            const url = 'https://example.com/test';
            const resolved = resolveRule(url, rules);
            
            // Should return one of the matching rules
            expect(resolved).not.toBeNull();
            expect(resolved!.priority).toBe(priority);
            expect(ids).toContain(resolved!.id);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use cache correctly in RuleMatcher', () => {
      fc.assert(
        fc.property(
          fc.array(cacheRuleArb, { minLength: 1, maxLength: 10 }),
          fc.array(fc.webUrl(), { minLength: 1, maxLength: 20 }),
          (rules, urls) => {
            const matcher = new RuleMatcher(rules);
            
            // First pass: populate cache
            const firstResults = urls.map(url => matcher.match(url));
            
            // Second pass: should use cache
            const secondResults = urls.map(url => matcher.match(url));
            
            // Results should be identical
            firstResults.forEach((result, index) => {
              expect(secondResults[index]).toEqual(result);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear cache when rules are updated', () => {
      fc.assert(
        fc.property(
          fc.array(cacheRuleArb, { minLength: 1, maxLength: 5 }),
          fc.array(cacheRuleArb, { minLength: 1, maxLength: 5 }),
          fc.webUrl(),
          (initialRules, newRules, url) => {
            const matcher = new RuleMatcher(initialRules);
            
            // Get initial result
            const initialResult = matcher.match(url);
            
            // Update rules
            matcher.updateRules(newRules);
            
            // Get new result
            const newResult = matcher.match(url);
            
            // New result should be based on new rules, not cached
            const expectedResult = resolveRule(url, newRules);
            expect(newResult).toEqual(expectedResult);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
