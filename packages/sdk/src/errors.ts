// Error handling framework for ShadowCache

/**
 * Error codes used throughout the ShadowCache system
 */
export const ErrorCodes = {
  // Initialization errors
  INIT_FAILED: 'INIT_FAILED',
  INVALID_CONFIG: 'INVALID_CONFIG',
  
  // Storage errors
  STORAGE_FULL: 'STORAGE_FULL',
  STORAGE_UNAVAILABLE: 'STORAGE_UNAVAILABLE',
  
  // Network errors
  NETWORK_OFFLINE: 'NETWORK_OFFLINE',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  
  // Sync errors
  SYNC_CONFLICT: 'SYNC_CONFLICT',
  
  // Security errors
  SECURITY_VIOLATION: 'SECURITY_VIOLATION',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Base error class for all ShadowCache errors
 */
export class ShadowCacheError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, any>;

  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message);
    this.name = 'ShadowCacheError';
    this.code = code;
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Configuration validation error
 */
export class ConfigurationError extends ShadowCacheError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorCodes.INVALID_CONFIG, details);
    this.name = 'ConfigurationError';
  }
}

/**
 * Storage operation error
 */
export class StorageError extends ShadowCacheError {
  constructor(message: string, code: ErrorCode, details?: Record<string, any>) {
    super(message, code, details);
    this.name = 'StorageError';
  }
}

/**
 * Network operation error
 */
export class NetworkError extends ShadowCacheError {
  constructor(message: string, code: ErrorCode, details?: Record<string, any>) {
    super(message, code, details);
    this.name = 'NetworkError';
  }
}

/**
 * Synchronization error
 */
export class SyncError extends ShadowCacheError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorCodes.SYNC_CONFLICT, details);
    this.name = 'SyncError';
  }
}

/**
 * Security policy violation error
 */
export class SecurityError extends ShadowCacheError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorCodes.SECURITY_VIOLATION, details);
    this.name = 'SecurityError';
  }
}
