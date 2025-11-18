// Configuration Validation Module
import { ConfigurationError, ErrorCodes } from './errors';
import type { ShadowCacheConfig, CacheRule } from './types';

interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates a complete ShadowCache configuration
 * @throws {ConfigurationError} if validation fails
 */
export function validateConfig(config: unknown): asserts config is ShadowCacheConfig {
  const errors: ValidationError[] = [];

  // Check if config is an object
  if (!config || typeof config !== 'object') {
    throw new ConfigurationError(
      'Configuration must be an object',
      { received: typeof config }
    );
  }

  const cfg = config as Record<string, unknown>;

  // Validate cacheRules (required)
  if (!('cacheRules' in cfg)) {
    errors.push({
      field: 'cacheRules',
      message: 'cacheRules is required'
    });
  } else if (!Array.isArray(cfg.cacheRules)) {
    errors.push({
      field: 'cacheRules',
      message: 'cacheRules must be an array'
    });
  } else {
    // Validate each cache rule
    cfg.cacheRules.forEach((rule, index) => {
      try {
        validateCacheRule(rule);
      } catch (error) {
        if (error instanceof ConfigurationError) {
          errors.push({
            field: `cacheRules[${index}]`,
            message: error.message
          });
        }
      }
    });
  }

  // Validate optional fields have correct types
  if ('predictive' in cfg && cfg.predictive !== undefined && typeof cfg.predictive !== 'object') {
    errors.push({
      field: 'predictive',
      message: 'predictive must be an object if provided'
    });
  }

  if ('sync' in cfg && cfg.sync !== undefined && typeof cfg.sync !== 'object') {
    errors.push({
      field: 'sync',
      message: 'sync must be an object if provided'
    });
  }

  if ('storage' in cfg && cfg.storage !== undefined && typeof cfg.storage !== 'object') {
    errors.push({
      field: 'storage',
      message: 'storage must be an object if provided'
    });
  }

  if ('analytics' in cfg && cfg.analytics !== undefined && typeof cfg.analytics !== 'object') {
    errors.push({
      field: 'analytics',
      message: 'analytics must be an object if provided'
    });
  }

  if ('ui' in cfg && cfg.ui !== undefined && typeof cfg.ui !== 'object') {
    errors.push({
      field: 'ui',
      message: 'ui must be an object if provided'
    });
  }

  if (errors.length > 0) {
    throw new ConfigurationError(
      'Configuration validation failed',
      { errors }
    );
  }
}

/**
 * Validates a cache rule
 * @throws {ConfigurationError} if validation fails
 */
export function validateCacheRule(rule: unknown): asserts rule is CacheRule {
  const errors: ValidationError[] = [];

  // Check if rule is an object
  if (!rule || typeof rule !== 'object') {
    throw new ConfigurationError(
      'Cache rule must be an object',
      { received: typeof rule }
    );
  }

  const r = rule as Record<string, unknown>;

  // Validate id (required)
  if (!('id' in r)) {
    errors.push({
      field: 'id',
      message: 'id is required'
    });
  } else if (typeof r.id !== 'string') {
    errors.push({
      field: 'id',
      message: 'id must be a string'
    });
  } else if (r.id.trim() === '') {
    errors.push({
      field: 'id',
      message: 'id cannot be empty'
    });
  }

  // Validate pattern (required)
  if (!('pattern' in r)) {
    errors.push({
      field: 'pattern',
      message: 'pattern is required'
    });
  } else {
    const patternError = validatePattern(r.pattern);
    if (patternError) {
      errors.push({
        field: 'pattern',
        message: patternError
      });
    }
  }

  // Validate strategy (required)
  if (!('strategy' in r)) {
    errors.push({
      field: 'strategy',
      message: 'strategy is required'
    });
  } else {
    const strategyError = validateStrategy(r.strategy);
    if (strategyError) {
      errors.push({
        field: 'strategy',
        message: strategyError
      });
    }
  }

  // Validate priority (required)
  if (!('priority' in r)) {
    errors.push({
      field: 'priority',
      message: 'priority is required'
    });
  } else {
    const priorityError = validatePriority(r.priority);
    if (priorityError) {
      errors.push({
        field: 'priority',
        message: priorityError
      });
    }
  }

  // Validate optional fields
  if ('maxAge' in r && r.maxAge !== undefined) {
    if (typeof r.maxAge !== 'number') {
      errors.push({
        field: 'maxAge',
        message: 'maxAge must be a number'
      });
    } else if (r.maxAge < 0) {
      errors.push({
        field: 'maxAge',
        message: 'maxAge must be non-negative'
      });
    }
  }

  if ('maxEntries' in r && r.maxEntries !== undefined) {
    if (typeof r.maxEntries !== 'number') {
      errors.push({
        field: 'maxEntries',
        message: 'maxEntries must be a number'
      });
    } else if (r.maxEntries < 1 || !Number.isInteger(r.maxEntries)) {
      errors.push({
        field: 'maxEntries',
        message: 'maxEntries must be a positive integer'
      });
    }
  }

  if ('networkTimeout' in r && r.networkTimeout !== undefined) {
    if (typeof r.networkTimeout !== 'number') {
      errors.push({
        field: 'networkTimeout',
        message: 'networkTimeout must be a number'
      });
    } else if (r.networkTimeout < 0) {
      errors.push({
        field: 'networkTimeout',
        message: 'networkTimeout must be non-negative'
      });
    }
  }

  if (errors.length > 0) {
    throw new ConfigurationError(
      'Cache rule validation failed',
      { errors }
    );
  }
}

/**
 * Validates a URL pattern (string or RegExp)
 * @returns error message if invalid, null if valid
 */
function validatePattern(pattern: unknown): string | null {
  if (typeof pattern === 'string') {
    if (pattern.trim() === '') {
      return 'pattern cannot be empty';
    }
    // Validate glob pattern syntax (basic check)
    try {
      // Check for balanced brackets in glob patterns
      const openBrackets = (pattern.match(/\[/g) || []).length;
      const closeBrackets = (pattern.match(/\]/g) || []).length;
      if (openBrackets !== closeBrackets) {
        return 'pattern has unbalanced brackets';
      }
    } catch {
      return 'pattern is invalid';
    }
    return null;
  } else if (pattern instanceof RegExp) {
    return null;
  } else {
    return 'pattern must be a string or RegExp';
  }
}

/**
 * Validates a cache strategy
 * @returns error message if invalid, null if valid
 */
function validateStrategy(strategy: unknown): string | null {
  const validStrategies = ['network-first', 'cache-first', 'stale-while-revalidate', 'cache-only'];
  
  if (typeof strategy !== 'string') {
    return 'strategy must be a string';
  }
  
  if (!validStrategies.includes(strategy)) {
    return `strategy must be one of: ${validStrategies.join(', ')}`;
  }
  
  return null;
}

/**
 * Validates a priority value
 * @returns error message if invalid, null if valid
 */
function validatePriority(priority: unknown): string | null {
  if (typeof priority !== 'number') {
    return 'priority must be a number';
  }
  
  if (!Number.isInteger(priority)) {
    return 'priority must be an integer';
  }
  
  if (priority < 1 || priority > 10) {
    return 'priority must be between 1 and 10 (inclusive)';
  }
  
  return null;
}
