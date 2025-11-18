import type { StorageProvider, StorageMetadata, StorageLevel } from '../types';

interface StoredEntry {
  value: any;
  metadata?: StorageMetadata;
}

export class MemoryProvider implements StorageProvider {
  readonly level: StorageLevel = 'memory';
  private storage: Map<string, StoredEntry> = new Map();

  async set(key: string, value: any, metadata?: StorageMetadata): Promise<void> {
    this.storage.set(key, { value, metadata });
  }

  async get(key: string): Promise<{ value: any; metadata?: StorageMetadata } | null> {
    const entry = this.storage.get(key);
    if (!entry) {
      return null;
    }
    return { value: entry.value, metadata: entry.metadata };
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  async getUsage(): Promise<number> {
    let totalSize = 0;
    for (const entry of this.storage.values()) {
      totalSize += entry.metadata?.size || 0;
    }
    return totalSize;
  }

  async keys(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }
}
