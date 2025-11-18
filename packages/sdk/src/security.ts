// Security Module for ShadowCache
import { SecurityError } from './errors';
import type { CacheRule } from './types';

/**
 * Patterns for detecting sensitive data in cache rules
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /auth/i,
  /credential/i,
  /private/i,
];

/**
 * Headers that indicate credentials
 */
const CREDENTIAL_HEADERS = [
  'authorization',
  'proxy-authorization',
  'cookie',
  'set-cookie',
];

/**
 * Detects if a cache rule targets sensitive data
 */
export function isSensitiveData(rule: CacheRule): boolean {
  const pattern = typeof rule.pattern === 'string' ? rule.pattern : rule.pattern.source;
  return SENSITIVE_PATTERNS.some(p => p.test(pattern));
}

/**
 * Detects if headers contain credentials
 */
export function hasCredentials(headers: Record<string, string>): boolean {
  const headerKeys = Object.keys(headers).map(k => k.toLowerCase());
  return CREDENTIAL_HEADERS.some(credHeader => headerKeys.includes(credHeader));
}

/**
 * Validates that a cache rule doesn't attempt to cache credentials
 * @throws {SecurityError} if credentials are detected
 */
export function validateNoCredentials(headers: Record<string, string>, url: string): void {
  if (hasCredentials(headers)) {
    throw new SecurityError(
      'Credential caching is not allowed',
      {
        url,
        detectedHeaders: Object.keys(headers).filter(k => 
          CREDENTIAL_HEADERS.includes(k.toLowerCase())
        )
      }
    );
  }
}

/**
 * Checks if a URL is HTTPS
 */
export function isHttps(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates HTTPS context for secure resources
 * @throws {SecurityError} if HTTPS resource is accessed in insecure context
 */
export function validateHttpsContext(url: string, currentContext: 'secure' | 'insecure'): void {
  if (isHttps(url) && currentContext === 'insecure') {
    throw new SecurityError(
      'HTTPS resources cannot be cached in insecure context',
      { url, context: currentContext }
    );
  }
}

/**
 * Encryption key for AES-GCM
 */
let encryptionKey: CryptoKey | null = null;

/**
 * Initializes encryption key using Web Crypto API
 */
export async function initializeEncryption(): Promise<void> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new SecurityError('Web Crypto API not available');
  }

  encryptionKey = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts data using AES-GCM
 */
export async function encryptData(data: string | ArrayBuffer): Promise<ArrayBuffer> {
  if (!encryptionKey) {
    await initializeEncryption();
  }

  if (!encryptionKey) {
    throw new SecurityError('Encryption key not initialized');
  }

  // Convert string to ArrayBuffer if needed
  const dataBuffer = typeof data === 'string' 
    ? new TextEncoder().encode(data)
    : data;

  // Generate random IV (12 bytes for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt the data
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    encryptionKey,
    dataBuffer
  );

  // Combine IV and encrypted data
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), iv.length);

  return result.buffer;
}

/**
 * Decrypts data using AES-GCM
 */
export async function decryptData(encryptedData: ArrayBuffer): Promise<ArrayBuffer> {
  if (!encryptionKey) {
    throw new SecurityError('Encryption key not initialized');
  }

  // Extract IV and encrypted data
  const data = new Uint8Array(encryptedData);
  const iv = data.slice(0, 12);
  const encrypted = data.slice(12);

  // Decrypt the data
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    encryptionKey,
    encrypted
  );

  return decrypted;
}

/**
 * Token storage with expiration
 */
interface StoredToken {
  value: string;
  expiresAt: number;
}

const tokenStorage = new Map<string, StoredToken>();

/**
 * Stores a token with automatic expiration
 */
export function storeToken(key: string, value: string, expiresInMs: number): void {
  const expiresAt = Date.now() + expiresInMs;
  tokenStorage.set(key, { value, expiresAt });
}

/**
 * Retrieves a token if not expired
 * @returns token value or null if expired/not found
 */
export function getToken(key: string): string | null {
  const stored = tokenStorage.get(key);
  
  if (!stored) {
    return null;
  }

  // Check if expired
  if (Date.now() >= stored.expiresAt) {
    tokenStorage.delete(key);
    return null;
  }

  return stored.value;
}

/**
 * Removes a token from storage
 */
export function removeToken(key: string): void {
  tokenStorage.delete(key);
}

/**
 * Clears all expired tokens
 */
export function clearExpiredTokens(): void {
  const now = Date.now();
  for (const [key, token] of tokenStorage.entries()) {
    if (now >= token.expiresAt) {
      tokenStorage.delete(key);
    }
  }
}

/**
 * Clears all tokens
 */
export function clearAllTokens(): void {
  tokenStorage.clear();
}
