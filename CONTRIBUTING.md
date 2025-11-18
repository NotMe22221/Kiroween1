# Contributing to ShadowCache

First off, thank you for considering contributing to ShadowCache! 🎉

It's people like you that make ShadowCache such a great tool for building offline-first web applications.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Standards

- **Be respectful** and inclusive
- **Be collaborative** and constructive
- **Be patient** with newcomers
- **Focus on what is best** for the community
- **Show empathy** towards other community members

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- A code editor (VS Code recommended)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
```bash
git clone https://github.com/YOUR_USERNAME/shadowcache.git
cd shadowcache
```

3. Add the upstream repository:
```bash
git remote add upstream https://github.com/shadowcache/shadowcache.git
```

## Development Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Build all packages:**
```bash
npm run build
```

3. **Run tests:**
```bash
npm test
```

4. **Run tests in watch mode:**
```bash
npm run test:watch
```

5. **Type check:**
```bash
npm run lint
```

6. **Run the demo:**
```bash
cd demo
npx serve .
```

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates.

When creating a bug report, include:

- **Clear title** describing the issue
- **Detailed description** of the problem
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **Environment details**:
  - OS and version
  - Browser and version
  - Node.js version
  - ShadowCache version

**Example:**

```markdown
**Bug**: Cache not working in Safari 14

**Description**: When using ShadowCache in Safari 14, cached resources are not being served offline.

**Steps to Reproduce**:
1. Initialize ShadowCache with default config
2. Fetch a resource while online
3. Go offline
4. Try to access the cached resource

**Expected**: Resource should be served from cache
**Actual**: Network error is thrown

**Environment**:
- OS: macOS 12.0
- Browser: Safari 14.1
- Node.js: 18.12.0
- ShadowCache: 0.1.0
```

### 💡 Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues.

When creating an enhancement suggestion, include:

- **Clear title** describing the enhancement
- **Detailed description** of the proposed feature
- **Use cases** explaining why this would be useful
- **Possible implementation** if you have ideas
- **Alternatives considered**

### 📝 Improving Documentation

Documentation improvements are always welcome!

- Fix typos or clarify existing docs
- Add examples for common use cases
- Improve API documentation
- Create tutorials or guides
- Translate documentation

### 🔧 Contributing Code

1. **Find an issue** to work on or create a new one
2. **Comment** on the issue to let others know you're working on it
3. **Create a branch** for your work
4. **Make your changes** following our coding standards
5. **Write tests** for your changes
6. **Update documentation** if needed
7. **Submit a pull request**

## Development Workflow

### Branch Naming

Use descriptive branch names:

- `feature/add-graphql-support`
- `fix/safari-cache-bug`
- `docs/improve-api-reference`
- `refactor/storage-manager`
- `test/add-sync-tests`

### Making Changes

1. **Create a branch:**
```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes** following coding standards

3. **Run tests:**
```bash
npm test
```

4. **Type check:**
```bash
npm run lint
```

5. **Build:**
```bash
npm run build
```

6. **Test the demo:**
```bash
cd demo
npx serve .
```

### Keeping Your Fork Updated

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

## Coding Standards

We follow strict coding standards defined in [.kiro/steering/shadowcache-standards.md](.kiro/steering/shadowcache-standards.md).

### Key Standards

#### Naming Conventions
- **Variables/Functions**: camelCase (`getUserData`, `isOnline`)
- **Classes/Interfaces**: PascalCase (`ShadowCache`, `StorageManager`)
- **Files**: kebab-case (`shadow-cache.ts`, `storage-manager.ts`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_CACHE_SIZE`, `DEFAULT_PRIORITY`)

#### File Structure
```typescript
// 1. External dependencies
import { describe, it, expect } from 'vitest';

// 2. Internal package imports
import { StorageManager } from '@shadowcache/storage';

// 3. Relative imports
import { validateConfig } from './validation';

// 4. Type imports
import type { CacheRule } from './types';
```

#### Documentation
All public APIs must have JSDoc comments:

```typescript
/**
 * Initializes the ShadowCache system.
 * 
 * @param config - Configuration object
 * @returns Promise resolving to ShadowCache instance
 * @throws {ConfigurationError} If config is invalid
 * 
 * @example
 * ```typescript
 * const cache = await ShadowCache.init({
 *   cacheRules: [...]
 * });
 * ```
 */
static async init(config: ShadowCacheConfig): Promise<ShadowCache>
```

#### Error Handling
Use typed errors with codes:

```typescript
throw new ConfigurationError(
  'Invalid cache rule pattern',
  { ruleId: rule.id, pattern: rule.pattern }
);
```

### TypeScript

- Use **strict mode** (enabled in tsconfig.json)
- Avoid `any` - use `unknown` if type is truly unknown
- Use type guards for runtime type checking
- Prefer interfaces over type aliases for object shapes

### Bundle Size

- Keep core SDK **under 50KB gzipped**
- Use tree-shakeable exports
- Minimize dependencies
- Run bundle analysis: `npm run build:analyze`

## Testing Guidelines

### Unit Tests

Write unit tests for all new functionality:

```typescript
import { describe, it, expect } from 'vitest';
import { validateConfig } from './validation';

describe('validateConfig', () => {
  it('should accept valid configuration', () => {
    const config = {
      cacheRules: [
        { id: 'test', pattern: '/api/*', strategy: 'cache-first', priority: 5 }
      ]
    };
    expect(() => validateConfig(config)).not.toThrow();
  });

  it('should reject invalid priority', () => {
    const config = {
      cacheRules: [
        { id: 'test', pattern: '/api/*', strategy: 'cache-first', priority: 11 }
      ]
    };
    expect(() => validateConfig(config)).toThrow(ConfigurationError);
  });
});
```

### Property-Based Tests

Use fast-check for property-based testing:

```typescript
import { fc } from 'fast-check';

// Feature: shadow-cache, Property 4: URL pattern matching works correctly
it('should match URLs correctly against patterns', () => {
  fc.assert(
    fc.property(
      fc.webUrl(),
      fc.constantFrom('network-first', 'cache-first', 'stale-while-revalidate'),
      (url, strategy) => {
        const rule = { pattern: '**', strategy, priority: 5 };
        const matches = matchPattern(url, rule.pattern);
        expect(typeof matches).toBe('boolean');
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Coverage

- Aim for **> 80% coverage**
- Test edge cases and error conditions
- Test async operations properly
- Use descriptive test names

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests for specific package
cd packages/storage
npm test

# Run with coverage
npm test -- --coverage
```

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test additions or changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `chore`: Build process or tooling changes
- `style`: Code style changes (formatting, etc.)

### Examples

```
feat(storage): add encryption support for sensitive data

Implement AES-GCM encryption using Web Crypto API for cache
entries marked as sensitive in cache rules.

Validates: Requirements 14.1
```

```
fix(router): handle offline errors correctly

Previously, offline errors were not being caught properly,
causing unhandled promise rejections.

Fixes #123
```

```
docs(api): improve configuration examples

Add more examples for common configuration scenarios
and clarify cache rule priority behavior.
```

### Commit Message Rules

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- Limit first line to 72 characters
- Reference issues and pull requests in footer
- Include "BREAKING CHANGE:" in footer for breaking changes

## Pull Request Process

### Before Submitting

- [ ] Tests pass (`npm test`)
- [ ] Type check passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Bundle size is within limits
- [ ] Documentation is updated
- [ ] Commits follow commit guidelines
- [ ] Branch is up to date with main

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123

## Changes Made
- Added X feature
- Fixed Y bug
- Updated Z documentation

## Testing
- [ ] Unit tests added/updated
- [ ] Property-based tests added/updated
- [ ] Manual testing completed
- [ ] Demo tested

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added and passing
- [ ] Bundle size checked
```

### Review Process

1. **Automated checks** run on PR submission
2. **Maintainer review** within 48 hours
3. **Address feedback** and push updates
4. **Approval** from at least one maintainer
5. **Merge** by maintainer

### After Merge

- Delete your branch
- Update your fork
- Celebrate! 🎉

## Community

### Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Discord**: For real-time chat (coming soon)
- **Stack Overflow**: Tag questions with `shadowcache`

### Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- CHANGELOG.md

### Becoming a Maintainer

Active contributors may be invited to become maintainers. Maintainers have:
- Commit access to the repository
- Ability to review and merge PRs
- Responsibility to uphold project standards
- Voice in project direction

## Questions?

Don't hesitate to ask! We're here to help:

- Open an issue with the `question` label
- Start a discussion on GitHub Discussions
- Reach out to maintainers directly

---

**Thank you for contributing to ShadowCache!** 🌑

Every contribution, no matter how small, makes a difference. We appreciate your time and effort in making ShadowCache better for everyone.

**Built with ❤️ by contributors like you**
