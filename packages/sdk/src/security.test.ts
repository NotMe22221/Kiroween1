// Security Module Tests
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  isSensitiveData,
  hasCredentials,
  validateNoCredentials,
  isHttps,
  validateHttpsContext,
  encryptData,
  decryptData,
  initializeEncryption,
  storeToken,
  getToken,
  removeToken,
  clearExpiredTokens,
  clearAllTokens,
} from './security';
import { SecurityError } from './errors';
import type { CacheRule } from './types';

describe('Security Module', () => {
  describe('Sensitive Data Detection', () => {
    it('detects sensitive patterns in cache rules', () => {
      const sensitiveRule: CacheRule = {
        id: 'test',
        pattern: '/api/password',
        strategy: 'network-first',
        priority: 5,
      };
      expect(isSensitiveData(sensitiveRule)).toBe(true);
    });

    it('does not flag non-sensitive patterns', () => {
      const normalRule: CacheRule = {
        id: 'test',
        pattern: '/api/users',
        strategy: 'network-first',
        priority: 5,
      };
      expect(isSensitiveData(normalRule)).toBe(false);
    });
  });

  describe('Credential Detection', () => {
    it('detects authorization headers', () => {
      const headers = { Authorization: 'Bearer token123' };
      expect(hasCredentials(headers)).toBe(true);
    });

    it('detects cookie headers', () => {
      const headers = { Cookie: 'session=abc123' };
      expect(hasCredentials(headers)).toBe(true);
    });

    it('does not flag normal headers', () => {
      const headers = { 'Content-Type': 'application/json' };
      expect(hasCredentials(headers)).toBe(false);
    });

    it('throws error when validating headers with credentials', () => {
      const headers = { Authorization: 'Bearer token' };
      expect(() => validateNoCredentials(headers, 'https://api.example.com')).toThrow(SecurityError);
    });
  });

  describe('HTTPS Context Validation', () => {
    it('identifies HTTPS URLs', () => {
      expect(isHttps('https://example.com')).toBe(true);
      expect(isHttps('http://example.com')).toBe(false);
    });

    it('throws error for HTTPS in insecure context', () => {
      expect(() => 
        validateHttpsContext('https://example.com', 'insecure')
      ).toThrow(SecurityError);
    });

    it('allows HTTPS in secure context', () => {
      expect(() => 
        validateHttpsContext('https://example.com', 'secure')
      ).not.toThrow();
    });

    it('allows HTTP in insecure context', () => {
      expect(() => 
        validateHttpsContext('http://example.com', 'insecure')
      ).not.toThrow();
    });
  });

  describe('Property-Based Tests', () => {
    // Feature: shadow-cache, Property 31: Sensitive data is encrypted
    // Validates: Requirements 14.1
    it('Property 31: encrypts and decrypts data correctly for any input', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.string({ minLength: 1, maxLength: 1000 }),
            fc.uint8Array({ minLength: 1, maxLength: 1000 })
          ),
          async (data) => {
            // Initialize encryption
            await initializeEncryption();

            // Convert Uint8Array to ArrayBuffer if needed
            let inputData: string | ArrayBuffer;
            if (data instanceof Uint8Array) {
              const buffer = new ArrayBuffer(data.length);
              new Uint8Array(buffer).set(data);
              inputData = buffer;
            } else {
              inputData = data;
            }

            // Encrypt the data
            const encrypted = await encryptData(inputData);

            // Encrypted data should be different from original
            const encryptedArray = new Uint8Array(encrypted);
            const originalArray = typeof inputData === 'string' 
              ? new TextEncoder().encode(inputData)
              : new Uint8Array(inputData);
            
            // Encrypted should be longer (includes IV)
            expect(encryptedArray.length).toBeGreaterThan(originalArray.length);

            // Decrypt the data
            const decrypted = await decryptData(encrypted);

            // Decrypted should match original
            const decryptedArray = new Uint8Array(decrypted);
            expect(decryptedArray.length).toBe(originalArray.length);
            expect(Array.from(decryptedArray)).toEqual(Array.from(originalArray));
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: shadow-cache, Property 32: Authentication tokens expire automatically
    // Validates: Requirements 14.2
    it('Property 32: tokens expire automatically after specified time', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 10, max: 50 }), // Minimum 10ms to avoid race conditions
          async (key, value, expiresInMs) => {
            // Clear all tokens before test
            clearAllTokens();

            // Store token
            storeToken(key, value, expiresInMs);

            // Token should be retrievable immediately
            expect(getToken(key)).toBe(value);

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, expiresInMs + 10));

            // Token should be null after expiration
            expect(getToken(key)).toBe(null);
          }
        ),
        { numRuns: 50 }
      );
    }, 10000);

    // Feature: shadow-cache, Property 33: HTTPS resources maintain security context
    // Validates: Requirements 14.3
    it('Property 33: HTTPS URLs are correctly identified and validated', () => {
      fc.assert(
        fc.property(
          fc.webUrl({ validSchemes: ['https'] }),
          (httpsUrl) => {
            // HTTPS URLs should be identified correctly
            expect(isHttps(httpsUrl)).toBe(true);

            // Should not throw in secure context
            expect(() => validateHttpsContext(httpsUrl, 'secure')).not.toThrow();

            // Should throw in insecure context
            expect(() => validateHttpsContext(httpsUrl, 'insecure')).toThrow(SecurityError);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: shadow-cache, Property 34: Credential caching is rejected
    // Validates: Requirements 14.4
    it('Property 34: credential headers are always rejected', () => {
      const credentialHeaders = ['authorization', 'cookie', 'proxy-authorization', 'set-cookie'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...credentialHeaders),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.webUrl(),
          (headerName, headerValue, url) => {
            const headers = { [headerName]: headerValue };

            // Should detect credentials
            expect(hasCredentials(headers)).toBe(true);

            // Should throw SecurityError
            expect(() => validateNoCredentials(headers, url)).toThrow(SecurityError);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Token Storage', () => {
    beforeEach(() => {
      clearAllTokens();
    });

    it('stores and retrieves tokens', () => {
      storeToken('key1', 'value1', 10000);
      expect(getToken('key1')).toBe('value1');
    });

    it('returns null for non-existent tokens', () => {
      expect(getToken('nonexistent')).toBe(null);
    });

    it('removes tokens', () => {
      storeToken('key1', 'value1', 10000);
      removeToken('key1');
      expect(getToken('key1')).toBe(null);
    });

    it('clears expired tokens', async () => {
      storeToken('key1', 'value1', 50);
      storeToken('key2', 'value2', 10000);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      clearExpiredTokens();
      
      expect(getToken('key1')).toBe(null);
      expect(getToken('key2')).toBe('value2');
    });

    it('clears all tokens', () => {
      storeToken('key1', 'value1', 10000);
      storeToken('key2', 'value2', 10000);
      
      clearAllTokens();
      
      expect(getToken('key1')).toBe(null);
      expect(getToken('key2')).toBe(null);
    });
  });
});
