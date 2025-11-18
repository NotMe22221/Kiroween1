import type { StorageProvider, StorageMetadata, StorageLevel } from '../types';

const STORAGE_PREFIX = 'shadowcache:';
const METADATA_SUFFIX = ':meta';

export class LocalStorageProvider implements StorageProvider {
  readonly level: StorageLevel = 'localstorage';

  private getStorageKey(key: string): string {
    return `${STORAGE_PREFIX}${key}`;
  }

  private getMetadataKey(key: string): string {
    return `${STORAGE_PREFIX}${key}${METADATA_SUFFIX}`;
  }

  private isBinaryData(value: any): boolean {
    return value instanceof ArrayBuffer || 
           ArrayBuffer.isView(value) ||
           (value && value.constructor && value.constructor.name === 'ArrayBuffer');
  }

  private serializeValue(value: any): string {
    // Check if it's binary data
    if (this.isBinaryData(value)) {
      // Convert to Uint8Array if it's an ArrayBuffer
      const uint8Array = value instanceof ArrayBuffer 
        ? new Uint8Array(value)
        : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      
      // Convert to regular array for JSON serialization
      const byteArray = Array.from(uint8Array);
      return JSON.stringify({ isBinary: true, data: byteArray });
    }
    
    return JSON.stringify({ isBinary: false, data: value });
  }

  private deserializeValue(serialized: string): any {
    const parsed = JSON.parse(serialized);
    
    if (parsed.isBinary) {
      // Convert back to ArrayBuffer
      const uint8Array = new Uint8Array(parsed.data);
      return uint8Array.buffer;
    }
    
    return parsed.data;
  }

  async set(key: string, value: any, metadata?: StorageMetadata): Promise<void> {
    const storageKey = this.getStorageKey(key);
    const metadataKey = this.getMetadataKey(key);

    try {
      // Serialize the value (handling binary data specially)
      const serialized = this.serializeValue(value);
      localStorage.setItem(storageKey, serialized);
      
      // Store metadata separately if provided
      if (metadata) {
        localStorage.setItem(metadataKey, JSON.stringify(metadata));
      }
    } catch (error) {
      // Check if it's a quota exceeded error
      if (error instanceof DOMException && 
          (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        throw new Error('LocalStorage quota exceeded');
      }
      throw error;
    }
  }

  async get(key: string): Promise<{ value: any; metadata?: StorageMetadata } | null> {
    const storageKey = this.getStorageKey(key);
    const metadataKey = this.getMetadataKey(key);

    const valueStr = localStorage.getItem(storageKey);
    if (valueStr === null) {
      return null;
    }

    const value = this.deserializeValue(valueStr);
    
    // Try to get metadata
    const metadataStr = localStorage.getItem(metadataKey);
    const metadata = metadataStr ? JSON.parse(metadataStr) : undefined;

    return { value, metadata };
  }

  async delete(key: string): Promise<void> {
    const storageKey = this.getStorageKey(key);
    const metadataKey = this.getMetadataKey(key);

    localStorage.removeItem(storageKey);
    localStorage.removeItem(metadataKey);
  }

  async clear(): Promise<void> {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  async getUsage(): Promise<number> {
    let totalSize = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX) && !key.endsWith(METADATA_SUFFIX)) {
        const metadataKey = `${key}${METADATA_SUFFIX}`;
        const metadataStr = localStorage.getItem(metadataKey);
        
        if (metadataStr) {
          const metadata = JSON.parse(metadataStr) as StorageMetadata;
          totalSize += metadata.size || 0;
        }
      }
    }

    return totalSize;
  }

  async keys(): Promise<string[]> {
    const keys: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX) && !key.endsWith(METADATA_SUFFIX)) {
        // Remove the prefix to get the original key
        keys.push(key.substring(STORAGE_PREFIX.length));
      }
    }

    return keys;
  }
}
