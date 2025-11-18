// Cache Rule Matching Engine
import type { CacheRule } from './types';

/**
 * Converts a glob pattern to a RegExp
 * Supports: * (any chars), ** (any path segments), ? (single char)
 */
function globToRegex(pattern: string): RegExp {
  // Escape special regex characters except glob wildcards
  let regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '___DOUBLE_STAR___')
    .replace(/\*/g, '[^/]*')
    .replace(/___DOUBLE_STAR___/g, '.*')
    .replace(/\?/g, '.');
  
  return new RegExp(`^${regexPattern}$`);
}

/**
 * Matches a URL against a pattern (string glob or RegExp)
 */
export function matchPattern(url: string, pattern: string | RegExp): boolean {
  if (pattern instanceof RegExp) {
    return pattern.test(url);
  }
  
  // String pattern - treat as glob
  const regex = globToRegex(pattern);
  return regex.test(url);
}

/**
 * Finds all cache rules that match a given URL
 */
export function findMatchingRules(url: string, rules: CacheRule[]): CacheRule[] {
  return rules.filter(rule => matchPattern(url, rule.pattern));
}

/**
 * Resolves the highest priority rule from a set of matching rules
 * Returns null if no rules match
 */
export function resolveRule(url: string, rules: CacheRule[]): CacheRule | null {
  const matchingRules = findMatchingRules(url, rules);
  
  if (matchingRules.length === 0) {
    return null;
  }
  
  // Sort by priority (descending) and return the highest
  return matchingRules.reduce((highest, current) => 
    current.priority > highest.priority ? current : highest
  );
}

/**
 * Cache for pattern matching results to improve performance
 */
export class RuleMatcherCache {
  private cache: Map<string, CacheRule | null>;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(url: string): CacheRule | null | undefined {
    return this.cache.get(url);
  }

  set(url: string, rule: CacheRule | null): void {
    // Simple LRU: if cache is full, delete oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(url, rule);
  }

  clear(): void {
    this.cache.clear();
  }

  has(url: string): boolean {
    return this.cache.has(url);
  }
}

/**
 * Main matcher class that combines matching logic with caching
 */
export class RuleMatcher {
  private rules: CacheRule[];
  private cache: RuleMatcherCache;

  constructor(rules: CacheRule[], cacheSize: number = 1000) {
    this.rules = rules;
    this.cache = new RuleMatcherCache(cacheSize);
  }

  /**
   * Finds the matching rule for a URL, using cache when possible
   */
  match(url: string): CacheRule | null {
    // Check cache first
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    // Resolve rule and cache result
    const rule = resolveRule(url, this.rules);
    this.cache.set(url, rule);
    return rule;
  }

  /**
   * Updates the rules and clears the cache
   */
  updateRules(rules: CacheRule[]): void {
    this.rules = rules;
    this.cache.clear();
  }

  /**
   * Clears the matching cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
