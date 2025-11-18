// Core SDK exports - minimal bundle for basic functionality
export { ShadowCache } from './shadow-cache';
export type { 
  ShadowCacheConfig, 
  CacheRule, 
  CacheStatus
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
