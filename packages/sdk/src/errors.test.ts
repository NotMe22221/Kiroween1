import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  ShadowCacheError,
  ConfigurationError,
  StorageError,
  NetworkError,
  SyncError,
  SecurityError,
  ErrorCodes,
  type ErrorCode
} from './errors';

describe('Error Handling Framework', () => {
  // Feature: shadow-cache, Property 24: SDK errors have proper structure
  // Validates: Requirements 9.3
  describe('Property 24: SDK errors have proper structure', () => {
    it('should ensure all ShadowCacheError instances have code and message properties', () => {
      const messageArbitrary = fc.string({ minLength: 1, maxLength: 200 });
      const codeArbitrary = fc.constantFrom(...Object.values(ErrorCodes));
      const detailsArbitrary = fc.option(
        fc.dictionary(fc.string(), fc.anything()),
        { nil: undefined }
      );

      fc.assert(
        fc.property(
          messageArbitrary,
          codeArbitrary,
          detailsArbitrary,
          (message, code, details) => {
            const error = new ShadowCacheError(message, code, details);
            
            // Verify error has proper structure
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(ShadowCacheError);
            expect(error.message).toBe(message);
            expect(error.code).toBe(code);
            expect(error.name).toBe('ShadowCacheError');
            
            // Verify details property exists (even if undefined)
            expect('details' in error).toBe(true);
            if (details !== undefined) {
              expect(error.details).toEqual(details);
            }
            
            // Verify it has a stack trace
            expect(error.stack).toBeDefined();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ensure ConfigurationError has proper structure', () => {
      const messageArbitrary = fc.string({ minLength: 1, maxLength: 200 });
      const detailsArbitrary = fc.option(
        fc.dictionary(fc.string(), fc.anything()),
        { nil: undefined }
      );

      fc.assert(
        fc.property(
          messageArbitrary,
          detailsArbitrary,
          (message, details) => {
            const error = new ConfigurationError(message, details);
            
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(ShadowCacheError);
            expect(error).toBeInstanceOf(ConfigurationError);
            expect(error.message).toBe(message);
            expect(error.code).toBe(ErrorCodes.INVALID_CONFIG);
            expect(error.name).toBe('ConfigurationError');
            expect('details' in error).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ensure StorageError has proper structure', () => {
      const messageArbitrary = fc.string({ minLength: 1, maxLength: 200 });
      const codeArbitrary = fc.constantFrom(
        ErrorCodes.STORAGE_FULL,
        ErrorCodes.STORAGE_UNAVAILABLE
      );
      const detailsArbitrary = fc.option(
        fc.dictionary(fc.string(), fc.anything()),
        { nil: undefined }
      );

      fc.assert(
        fc.property(
          messageArbitrary,
          codeArbitrary,
          detailsArbitrary,
          (message, code, details) => {
            const error = new StorageError(message, code, details);
            
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(ShadowCacheError);
            expect(error).toBeInstanceOf(StorageError);
            expect(error.message).toBe(message);
            expect(error.code).toBe(code);
            expect(error.name).toBe('StorageError');
            expect('details' in error).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ensure NetworkError has proper structure', () => {
      const messageArbitrary = fc.string({ minLength: 1, maxLength: 200 });
      const codeArbitrary = fc.constantFrom(
        ErrorCodes.NETWORK_OFFLINE,
        ErrorCodes.RESOURCE_NOT_FOUND
      );
      const detailsArbitrary = fc.option(
        fc.dictionary(fc.string(), fc.anything()),
        { nil: undefined }
      );

      fc.assert(
        fc.property(
          messageArbitrary,
          codeArbitrary,
          detailsArbitrary,
          (message, code, details) => {
            const error = new NetworkError(message, code, details);
            
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(ShadowCacheError);
            expect(error).toBeInstanceOf(NetworkError);
            expect(error.message).toBe(message);
            expect(error.code).toBe(code);
            expect(error.name).toBe('NetworkError');
            expect('details' in error).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ensure SyncError has proper structure', () => {
      const messageArbitrary = fc.string({ minLength: 1, maxLength: 200 });
      const detailsArbitrary = fc.option(
        fc.dictionary(fc.string(), fc.anything()),
        { nil: undefined }
      );

      fc.assert(
        fc.property(
          messageArbitrary,
          detailsArbitrary,
          (message, details) => {
            const error = new SyncError(message, details);
            
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(ShadowCacheError);
            expect(error).toBeInstanceOf(SyncError);
            expect(error.message).toBe(message);
            expect(error.code).toBe(ErrorCodes.SYNC_CONFLICT);
            expect(error.name).toBe('SyncError');
            expect('details' in error).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ensure SecurityError has proper structure', () => {
      const messageArbitrary = fc.string({ minLength: 1, maxLength: 200 });
      const detailsArbitrary = fc.option(
        fc.dictionary(fc.string(), fc.anything()),
        { nil: undefined }
      );

      fc.assert(
        fc.property(
          messageArbitrary,
          detailsArbitrary,
          (message, details) => {
            const error = new SecurityError(message, details);
            
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(ShadowCacheError);
            expect(error).toBeInstanceOf(SecurityError);
            expect(error.message).toBe(message);
            expect(error.code).toBe(ErrorCodes.SECURITY_VIOLATION);
            expect(error.name).toBe('SecurityError');
            expect('details' in error).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ensure error codes are consistent strings', () => {
      // Verify all error codes are non-empty strings
      const errorCodeValues = Object.values(ErrorCodes);
      
      expect(errorCodeValues.length).toBeGreaterThan(0);
      errorCodeValues.forEach(code => {
        expect(typeof code).toBe('string');
        expect(code.length).toBeGreaterThan(0);
      });
    });

    it('should ensure errors can be thrown and caught', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.constantFrom(...Object.values(ErrorCodes)),
          (message, code) => {
            try {
              throw new ShadowCacheError(message, code);
            } catch (error) {
              expect(error).toBeInstanceOf(ShadowCacheError);
              expect((error as ShadowCacheError).code).toBe(code);
              expect((error as ShadowCacheError).message).toBe(message);
              return true;
            }
            return false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
