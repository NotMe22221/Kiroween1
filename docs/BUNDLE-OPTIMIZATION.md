# Bundle Optimization Guide

This document describes the bundle optimization strategies implemented in ShadowCache and how to use them effectively.

## Bundle Size Targets

- **Core SDK**: < 50 KB (gzipped)
- **Individual modules**: Optimized for tree-shaking
- **Total bundle**: Minimized through code splitting

## Optimization Strategies

### 1. Tree-Shaking Support

ShadowCache is built with tree-shaking in mind. Import only what you need:

```typescript
// ❌ Imports everything (larger bundle)
import { ShadowCache, validateConfig, matchPattern, encryptData } from '@shadowcache/sdk';

// ✅ Import only core functionality (smaller bundle)
import { ShadowCache } from '@shadowcache/sdk/core';

// ✅ Import specific utilities as needed
import { validateConfig } from '@shadowcache/sdk/validation';
import { matchPattern } from '@shadowcache/sdk/matcher';
```

### 2. Separate Entry Points

Each package provides multiple entry points for granular imports:

#### SDK Package

- `@shadowcache/sdk` - Full SDK with all features
- `@shadowcache/sdk/core` - Core SDK only (ShadowCache class + types)
- `@shadowcache/sdk/validation` - Configuration validation utilities
- `@shadowcache/sdk/matcher` - URL pattern matching
- `@shadowcache/sdk/serialization` - Response serialization
- `@shadowcache/sdk/security` - Security features (encryption, token storage)
- `@shadowcache/sdk/html-parser` - HTML resource extraction

#### UI Package

- `@shadowcache/ui` - All UI components
- `@shadowcache/ui/react` - React components only
- `@shadowcache/ui/web-component` - Web Components only
- `@shadowcache/ui/styles.css` - Styles only

### 3. Code Splitting

The build system automatically splits shared code into separate chunks:

```typescript
// Dynamic imports for optional features
const predictor = await import('@shadowcache/predictor');
const sync = await import('@shadowcache/sync');
```

### 4. Minification

Production builds are automatically minified with:
- Dead code elimination
- Variable name mangling
- Whitespace removal
- Comment removal

### 5. External Dependencies

Workspace dependencies are marked as external to prevent bundling:
- `@shadowcache/*` packages are not bundled together
- Peer dependencies (like React) are external
- This allows better caching and smaller individual bundles

## Build Commands

### Development Build
```bash
npm run build
```
- Includes source maps
- No minification
- Faster build times

### Production Build
```bash
npm run build:prod
```
- Minified output
- Optimized for size
- Removes debug code

### Bundle Analysis
```bash
npm run build:analyze
```
- Builds in production mode
- Analyzes bundle sizes
- Reports gzipped sizes
- Fails if SDK exceeds 50 KB limit

## Bundle Analysis Output

The analysis script provides detailed information:

```
📊 ShadowCache Bundle Analysis
======================================================================

📦 @shadowcache/sdk
----------------------------------------------------------------------
  index.js                    45.23 KB    12.34 KB (gz)  ██████
  core.js                     32.10 KB     8.45 KB (gz)  ████
  validation.js                8.50 KB     2.10 KB (gz)  █
  TOTAL                           -        22.89 KB (gz)

📦 @shadowcache/predictor
----------------------------------------------------------------------
  index.js                    15.20 KB     4.50 KB (gz)  ██
  TOTAL                           -         4.50 KB (gz)

======================================================================

📊 Summary:
  Total bundle size (all packages): 62.90 KB (gzipped)
  Core SDK bundle size: 22.89 KB (gzipped)
  Size limit for core SDK: 50 KB (gzipped)

✅ PASSED: Core SDK is 27.11 KB under the limit
```

## Optimization Tips

### 1. Use Core Imports

For minimal bundle size, use core imports:

```typescript
// Minimal setup (smallest bundle)
import { ShadowCache } from '@shadowcache/sdk/core';

const cache = await ShadowCache.init({
  cacheRules: [
    { id: 'api', pattern: '/api/*', strategy: 'network-first', priority: 8 }
  ]
});
```

### 2. Lazy Load Optional Features

Load features only when needed:

```typescript
import { ShadowCache } from '@shadowcache/sdk/core';

// Initialize with minimal config
const cache = await ShadowCache.init({ cacheRules: [] });

// Load security features only when needed
if (needsEncryption) {
  const { encryptData } = await import('@shadowcache/sdk/security');
  // Use encryption
}
```

### 3. Avoid Importing Entire Packages

```typescript
// ❌ Imports everything
import * as SDK from '@shadowcache/sdk';

// ✅ Import specific exports
import { ShadowCache, type CacheRule } from '@shadowcache/sdk/core';
```

### 4. Use Dynamic Imports for Large Features

```typescript
// Load UI components only when showing offline indicator
async function showOfflineIndicator() {
  const { ShadowIndicator } = await import('@shadowcache/ui/react');
  // Render component
}
```

## Monitoring Bundle Size

### CI/CD Integration

Add bundle size checks to your CI pipeline:

```yaml
# .github/workflows/ci.yml
- name: Check bundle size
  run: npm run build:analyze
```

This will fail the build if the core SDK exceeds 50 KB.

### Local Development

Run analysis during development:

```bash
# Build and analyze
npm run build:analyze

# Watch for size changes
npm run build:analyze -- --watch
```

## Advanced Optimization

### Custom Build Configuration

For advanced use cases, you can customize the build:

```javascript
// custom-build.js
import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  treeShaking: true,
  splitting: true,
  format: 'esm',
  target: 'es2017',
  // Custom optimizations
  pure: ['console.log'],
  drop: ['debugger'],
  mangleProps: /^_/,
});
```

### Analyzing Dependencies

Use esbuild's metafile to analyze what's in your bundle:

```javascript
const result = await build({
  // ... config
  metafile: true,
});

console.log(result.metafile);
```

## Best Practices

1. **Import only what you need** - Use specific imports instead of barrel exports
2. **Use core packages** - Start with minimal imports and add features as needed
3. **Lazy load optional features** - Use dynamic imports for non-critical code
4. **Monitor bundle size** - Run analysis regularly to catch size regressions
5. **Test tree-shaking** - Verify unused code is eliminated in production builds

## Troubleshooting

### Bundle Size Exceeds Limit

If the bundle size check fails:

1. Run `npm run build:analyze` to see detailed breakdown
2. Identify large modules in the output
3. Check for:
   - Unused imports
   - Large dependencies
   - Duplicate code
   - Missing tree-shaking

### Tree-Shaking Not Working

If unused code isn't being eliminated:

1. Ensure you're using ES modules (`type: "module"`)
2. Check that imports are static (not dynamic)
3. Verify `sideEffects: false` in package.json
4. Use named exports instead of default exports

### Large Dependencies

If a dependency is too large:

1. Look for lighter alternatives
2. Use dynamic imports to load it on-demand
3. Mark it as external if it's a peer dependency
4. Consider implementing the feature yourself if it's simple

## Resources

- [esbuild Documentation](https://esbuild.github.io/)
- [Tree-shaking Guide](https://webpack.js.org/guides/tree-shaking/)
- [Bundle Size Best Practices](https://web.dev/reduce-javascript-payloads-with-tree-shaking/)
