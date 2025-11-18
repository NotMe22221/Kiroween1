// ShadowCache SDK - Main entry point
// For smaller bundles, import specific modules:
// - @shadowcache/sdk/core - Core SDK only
// - @shadowcache/sdk/validation - Validation utilities
// - @shadowcache/sdk/matcher - URL pattern matching
// - @shadowcache/sdk/serialization - Response serialization
// - @shadowcache/sdk/security - Security features
// - @shadowcache/sdk/html-parser - HTML parsing

export { ShadowCache } from './shadow-cache';
export type { 
  ShadowCacheConfig, 
  CacheRule, 
  CacheStatus,
  CacheEntry,
  CacheMetadata,
  SerializedResponse,
  CacheControlDirectives,
  ResponseType
} from './types';
export {
  ShadowCacheError,
  ConfigurationError,
  StorageError,
  NetworkError,
  SyncError,
  SecurityError,
  ErrorCodes,
  type ErrorCode
} from './errors';

// Validation utilities - import from @shadowcache/sdk/validation for tree-shaking
export { validateConfig, validateCacheRule } from './validation';

// URL pattern matching - import from @shadowcache/sdk/matcher for tree-shaking
export { 
  matchPattern, 
  findMatchingRules, 
  resolveRule, 
  RuleMatcher, 
  RuleMatcherCache 
} from './matcher';

// Serialization utilities - import from @shadowcache/sdk/serialization for tree-shaking
export {
  serializeResponse,
  deserializeResponse,
  parseCacheControl,
  calculateExpiresAt,
  shouldRevalidate,
  compareVersions,
  shouldInvalidateVersion,
  createCacheEntry,
  extractVersion
} from './serialization';

// Security features - import from @shadowcache/sdk/security for tree-shaking
export {
  isSensitiveData,
  hasCredentials,
  validateNoCredentials,
  isHttps,
  validateHttpsContext,
  initializeEncryption,
  encryptData,
  decryptData,
  storeToken,
  getToken,
  removeToken,
  clearExpiredTokens,
  clearAllTokens
} from './security';

// HTML parsing - import from @shadowcache/sdk/html-parser for tree-shaking
export {
  extractLinkedResources,
  extractResourcesByType
} from './html-parser';
