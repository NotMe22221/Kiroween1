# ShadowCache Development Standards

This document defines the coding standards, conventions, and best practices for the ShadowCache project. All contributors must follow these guidelines to maintain consistency and quality across the codebase.

## Naming Conventions

### Variables and Functions
- Use **camelCase** for variables, functions, and methods
- Use descriptive names that clearly indicate purpose
- Boolean variables should use `is`, `has`, `should` prefixes

```typescript
// Good
const cacheEntry = getCacheEntry(url);
const isOnline = checkNetworkStatus();
const hasExpired = checkExpiration(timestamp);

// Bad
const ce = get_cache_entry(url);
const online = check_network();
const expired = expiration_check(timestamp);
```

### Classes and Interfaces
- Use **PascalCase** for classes, interfaces, types, and enums
- Interface names should describe the contract, not implementation
- Avoid prefixing interfaces with `I`

```typescript
// Good
class StorageManager {}
interface CacheProvider {}
type CacheStrategy = 'network-first' | 'cache-first';

// Bad
class storage_manager {}
interface ICacheProvider {}
type cacheStrategy = string;
```

### Files and Directories
- Use **kebab-case** for file and directory names
- Test files should use `.test.ts` suffix
- Type definition files should use `.d.ts` suffix

```
// Good
shadow-cache.ts
predictive-engine.ts
storage-manager.test.ts

// Bad
ShadowCache.ts
predictive_engine.ts
StorageManager.test.ts
```

### Constants
- Use **UPPER_SNAKE_CASE** for constants
- Group related constants in enums or const objects

```typescript
// Good
const MAX_CACHE_SIZE = 50 * 1024 * 1024;
const DEFAULT_PRIORITY = 5;

// Bad
const maxCacheSize = 50 * 1024 * 1024;
const defaultPriority = 5;
```

## File Structure Standards

### Module Organization
Each package should follow this structure:

```
packages/
  package-name/
    src/
      index.ts           # Public API exports
      types.ts           # Type definitions
      errors.ts          # Error classes (if needed)
      core-module.ts     # Implementation files
      core-module.test.ts # Test files
      utils/             # Utility functions
    dist/                # Build output
    package.json
    tsconfig.json
```

### Index Files
- `index.ts` files should only contain exports
- Re-export public APIs from implementation files
- Do not include implementation logic in index files

```typescript
// Good - index.ts
export { ShadowCache } from './shadow-cache';
export { StorageManager } from './storage-manager';
export type { ShadowCacheConfig, CacheRule } from './types';

// Bad - index.ts
export class ShadowCache {
  // implementation here
}
```

### Import Organization
Organize imports in the following order:
1. External dependencies
2. Internal package imports
3. Relative imports
4. Type imports (grouped separately)

```typescript
// Good
import { describe, it, expect } from 'vitest';
import { fc } from 'fast-check';

import { StorageManager } from '@shadowcache/storage';

import { validateConfig } from './validation';
import { parseURL } from './utils';

import type { CacheRule, CacheEntry } from './types';

// Bad - mixed order
import { validateConfig } from './validation';
import { describe, it, expect } from 'vitest';
import type { CacheRule } from './types';
import { StorageManager } from '@shadowcache/storage';
```

## Documentation Requirements

### JSDoc for Public APIs
All public APIs must have JSDoc comments including:
- Description of functionality
- `@param` tags for all parameters
- `@returns` tag for return values
- `@throws` tag for possible errors
- `@example` tag with usage example

```typescript
/**
 * Initializes the ShadowCache system with the provided configuration.
 * 
 * @param config - The configuration object defining cache rules, storage, and sync options
 * @returns A Promise that resolves to an initialized ShadowCache instance
 * @throws {ConfigurationError} If the configuration is invalid
 * @throws {StorageError} If storage initialization fails
 * 
 * @example
 * ```typescript
 * const cache = await ShadowCache.init({
 *   cacheRules: [
 *     { pattern: '/api/*', strategy: 'network-first', priority: 8 }
 *   ]
 * });
 * ```
 */
static async init(config: ShadowCacheConfig): Promise<ShadowCache> {
  // implementation
}
```

### Internal Documentation
- Use single-line comments for complex logic explanations
- Avoid obvious comments that restate the code
- Document "why" not "what"

```typescript
// Good
// Use exponential backoff to avoid overwhelming the server during sync retries
const delay = Math.pow(2, attempt) * 1000;

// Bad
// Set delay to 2 to the power of attempt times 1000
const delay = Math.pow(2, attempt) * 1000;
```

### Type Documentation
- Document complex types and interfaces
- Explain constraints and valid ranges

```typescript
/**
 * Configuration for a cache rule.
 */
interface CacheRule {
  /** Unique identifier for the rule */
  id: string;
  
  /** URL pattern to match (glob or RegExp) */
  pattern: string | RegExp;
  
  /** Caching strategy to apply */
  strategy: 'network-first' | 'cache-first' | 'stale-while-revalidate' | 'cache-only';
  
  /** Priority level (1-10, where 10 is highest) */
  priority: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
}
```

## API Design Patterns

### Promise-Based Async Operations
- All asynchronous operations must return Promises
- Use `async/await` syntax for cleaner code
- Never use callbacks for async operations

```typescript
// Good
async function fetchAndCache(url: string): Promise<Response> {
  const response = await fetch(url);
  await cache.put(url, response);
  return response;
}

// Bad
function fetchAndCache(url: string, callback: (response: Response) => void): void {
  fetch(url).then(response => {
    cache.put(url, response).then(() => {
      callback(response);
    });
  });
}
```

### Method Chaining
- Return `this` from methods that modify state to enable chaining
- Document chainable methods clearly

```typescript
class CacheBuilder {
  private rules: CacheRule[] = [];
  
  /**
   * Adds a cache rule to the builder.
   * @returns This builder instance for chaining
   */
  addRule(rule: CacheRule): this {
    this.rules.push(rule);
    return this;
  }
}

// Usage
const builder = new CacheBuilder()
  .addRule(rule1)
  .addRule(rule2);
```

### Event Emitters
- Use typed event emitters with string literal types
- Document all possible events

```typescript
type ShadowCacheEvent = 
  | 'ready'
  | 'offline'
  | 'online'
  | 'sync-complete'
  | 'cache-hit'
  | 'cache-miss';

class ShadowCache {
  /**
   * Registers an event handler.
   * @param event - The event name to listen for
   * @param handler - The callback function to invoke
   */
  on(event: ShadowCacheEvent, handler: (...args: any[]) => void): void {
    // implementation
  }
}
```

## Error Handling Patterns

### Typed Errors
- All errors must extend the base `ShadowCacheError` class
- Include error codes for programmatic handling
- Provide detailed error messages for debugging

```typescript
/**
 * Base error class for all ShadowCache errors.
 */
class ShadowCacheError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Error thrown when configuration validation fails.
 */
class ConfigurationError extends ShadowCacheError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'INVALID_CONFIG', details);
  }
}
```

### Error Codes
Use consistent error code naming:
- `INIT_FAILED` - SDK initialization failure
- `INVALID_CONFIG` - Configuration validation failure
- `STORAGE_FULL` - Storage quota exceeded
- `STORAGE_UNAVAILABLE` - All storage mechanisms failed
- `NETWORK_OFFLINE` - Operation requires network but offline
- `SYNC_CONFLICT` - Synchronization conflict detected
- `SECURITY_VIOLATION` - Security policy violation
- `RESOURCE_NOT_FOUND` - Requested resource not in cache

### Error Propagation
- Let errors bubble up unless you can handle them meaningfully
- Add context when re-throwing errors
- Never swallow errors silently

```typescript
// Good
async function getCachedResource(url: string): Promise<Response> {
  try {
    const entry = await storage.get(url);
    if (!entry) {
      throw new ShadowCacheError(
        `Resource not found in cache: ${url}`,
        'RESOURCE_NOT_FOUND',
        { url }
      );
    }
    return entry.response;
  } catch (error) {
    if (error instanceof ShadowCacheError) {
      throw error;
    }
    throw new StorageError(
      `Failed to retrieve cached resource: ${error.message}`,
      { url, originalError: error }
    );
  }
}

// Bad
async function getCachedResource(url: string): Promise<Response | null> {
  try {
    const entry = await storage.get(url);
    return entry?.response || null;
  } catch (error) {
    console.error(error); // Silent failure
    return null;
  }
}
```

## Security Constraints

### No Credential Caching
- **NEVER** cache resources containing credentials
- Reject cache rules that attempt to cache:
  - `Authorization` headers
  - `Cookie` headers with authentication tokens
  - URLs containing credentials

```typescript
// Required validation
function validateCacheRule(rule: CacheRule): void {
  if (rule.pattern.toString().includes('Authorization')) {
    throw new SecurityError(
      'Cache rules cannot target resources with Authorization headers',
      { ruleId: rule.id }
    );
  }
}
```

### Encryption Requirements
- Sensitive data marked in cache rules must be encrypted
- Use Web Crypto API with AES-GCM algorithm
- Never implement custom encryption

```typescript
// Good
async function encryptSensitiveData(data: ArrayBuffer): Promise<ArrayBuffer> {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
}

// Bad - custom encryption
function encryptSensitiveData(data: string): string {
  return btoa(data); // Not secure!
}
```

### HTTPS Context
- Preserve security context for HTTPS resources
- Prevent mixed content warnings
- Validate origin for cross-origin requests

## Bundle Size Limits

### Core SDK Limit
- Core SDK bundle must be **under 50KB gzipped**
- Run bundle analysis on every build
- Fail CI if limit is exceeded

### Optimization Strategies
- Enable tree-shaking in build configuration
- Use dynamic imports for optional features
- Minimize dependencies
- Avoid large libraries for simple tasks

```typescript
// Good - tree-shakeable exports
export { ShadowCache } from './shadow-cache';
export { StorageManager } from './storage-manager';

// Bad - barrel exports that prevent tree-shaking
export * from './shadow-cache';
export * from './storage-manager';
```

### Bundle Analysis
Run bundle analysis regularly:

```bash
npm run build
npm run analyze-bundle
```

Expected output:
```
Core SDK: 42.3 KB (gzipped)
Predictor: 8.1 KB (gzipped)
Router: 12.5 KB (gzipped)
Total: 62.9 KB (gzipped)
```

## Code Review Checklist

### Before Submitting PR
- [ ] All tests pass (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Code follows naming conventions
- [ ] Public APIs have JSDoc comments
- [ ] Error handling uses typed errors with codes
- [ ] No credentials are cached
- [ ] Sensitive data is encrypted where required
- [ ] Bundle size is within limits
- [ ] No console.log statements in production code
- [ ] Imports are organized correctly
- [ ] No unused imports or variables

### Reviewer Checklist
- [ ] Code matches requirements from spec
- [ ] Property-based tests cover correctness properties
- [ ] Error messages are clear and actionable
- [ ] Security constraints are enforced
- [ ] Performance considerations are addressed
- [ ] Breaking changes are documented
- [ ] API changes are backward compatible (or versioned)
- [ ] Edge cases are handled
- [ ] Code is maintainable and readable

### Testing Requirements
- [ ] Unit tests for all new functions/classes
- [ ] Property-based tests for correctness properties
- [ ] Tests use descriptive names
- [ ] Tests are isolated and don't depend on order
- [ ] Mocks are used sparingly and appropriately
- [ ] Test coverage is adequate (aim for >80%)

## Performance Guidelines

### Async Operations
- Use `Promise.all()` for parallel operations
- Avoid sequential awaits when operations are independent
- Implement timeouts for network operations

```typescript
// Good - parallel
const [user, posts, comments] = await Promise.all([
  fetchUser(id),
  fetchPosts(id),
  fetchComments(id)
]);

// Bad - sequential
const user = await fetchUser(id);
const posts = await fetchPosts(id);
const comments = await fetchComments(id);
```

### Memory Management
- Clean up event listeners when no longer needed
- Use WeakMap/WeakSet for caching when appropriate
- Avoid memory leaks in Service Workers

### IndexedDB Best Practices
- Use indexes for frequently queried fields
- Batch operations when possible
- Close connections when done

## TypeScript Configuration

### Strict Mode
All packages must use TypeScript strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Type Safety
- Avoid `any` type - use `unknown` if type is truly unknown
- Use type guards for runtime type checking
- Prefer interfaces over type aliases for object shapes

```typescript
// Good
function isResponse(value: unknown): value is Response {
  return value instanceof Response;
}

// Bad
function isResponse(value: any): boolean {
  return value instanceof Response;
}
```

## Git Commit Guidelines

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test additions or changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `chore`: Build process or tooling changes

Example:
```
feat(storage): add encryption support for sensitive data

Implement AES-GCM encryption using Web Crypto API for cache
entries marked as sensitive in cache rules.

Validates: Requirements 14.1
```

## Continuous Integration

### Required Checks
All PRs must pass:
- TypeScript compilation
- Unit tests
- Property-based tests
- Linting
- Bundle size check
- Security audit

### Pre-commit Hooks
Install pre-commit hooks to catch issues early:
```bash
npm run setup-hooks
```

Hooks will run:
- Type checking
- Linting
- Format checking
- Test execution (fast tests only)

---

**Last Updated**: 2025-11-18
**Version**: 1.0.0
