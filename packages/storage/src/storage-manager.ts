// Storage Manager Implementation
import type { StorageLevel, StorageUsage, StorageProvider, StorageMetadata, StorageConfig } from './types';
import { IndexedDBProvider } from './providers/indexeddb-provider';
import { LocalStorageProvider } from './providers/localstorage-provider';
import { MemoryProvider } from './providers/memory-provider';
// Local error handling to avoid circular dependency
class StorageError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'StorageError';
  }
}

const ErrorCodes = {
  STORAGE_UNAVAILABLE: 'STORAGE_UNAVAILABLE',
  STORAGE_FULL: 'STORAGE_FULL',
};

export class StorageManager {
  private providers: StorageProvider[];
  private config: StorageConfig;
  private storageMap: Map<string, StorageLevel> = new Map();
  private readonly CAPACITY_THRESHOLD = 0.8; // 80% threshold

  constructor(config?: Partial<StorageConfig>) {
    this.config = {
      maxSize: config?.maxSize || 100 * 1024 * 1024, // 100MB default
      evictionPolicy: config?.evictionPolicy || 'lru',
      encryption: config?.encryption || false,
    };

    // Initialize providers in fallback order
    this.providers = [
      new IndexedDBProvider(),
      new LocalStorageProvider(),
      new MemoryProvider(),
    ];
  }

  /**
   * Check if storage capacity has reached the 80% threshold
   */
  async isCapacityThresholdReached(): Promise<boolean> {
    const usage = await this.getUsage();
    return usage.used >= usage.total * this.CAPACITY_THRESHOLD;
  }

  /**
   * Calculate how much space needs to be freed to store new data
   */
  private async calculateEvictionNeeded(newDataSize: number): Promise<number> {
    const usage = await this.getUsage();
    const spaceAfterAdd = usage.used + newDataSize;
    const threshold = usage.total * this.CAPACITY_THRESHOLD;
    
    if (spaceAfterAdd > threshold) {
      // Need to free enough space to get back under threshold
      return spaceAfterAdd - threshold;
    }
    
    return 0;
  }

  async set(key: string, value: any, metadata?: StorageMetadata): Promise<StorageLevel> {
    // Check if we need to evict before adding new data
    const dataSize = metadata?.size || 0;
    const evictionNeeded = await this.calculateEvictionNeeded(dataSize);
    
    if (evictionNeeded > 0) {
      await this.evict(evictionNeeded);
    }

    const errors: Array<{ level: StorageLevel; error: any }> = [];

    // Try each provider in order
    for (const provider of this.providers) {
      try {
        await provider.set(key, value, metadata);
        this.storageMap.set(key, provider.level);
        return provider.level;
      } catch (error) {
        errors.push({ level: provider.level, error });
      }
    }

    // All providers failed
    throw new StorageError(
      'All storage mechanisms failed',
      ErrorCodes.STORAGE_UNAVAILABLE,
      { errors: errors.map(e => ({ level: e.level, message: String(e.error) })) }
    );
  }

  async get(key: string): Promise<{ value: any; level: StorageLevel } | null> {
    // Check if we know which level this key is stored at
    const knownLevel = this.storageMap.get(key);
    
    if (knownLevel) {
      const provider = this.providers.find(p => p.level === knownLevel);
      if (provider) {
        const result = await provider.get(key);
        if (result) {
          // Update access tracking for LRU/LFU
          await this.updateAccessMetadata(key, result.metadata, provider);
          return { value: result.value, level: provider.level };
        }
      }
    }

    // Try all providers
    for (const provider of this.providers) {
      try {
        const result = await provider.get(key);
        if (result) {
          this.storageMap.set(key, provider.level);
          // Update access tracking for LRU/LFU
          await this.updateAccessMetadata(key, result.metadata, provider);
          return { value: result.value, level: provider.level };
        }
      } catch (error) {
        // Continue to next provider
      }
    }

    return null;
  }

  /**
   * Update access metadata for LRU/LFU tracking
   */
  private async updateAccessMetadata(
    key: string, 
    metadata: StorageMetadata | undefined, 
    provider: StorageProvider
  ): Promise<void> {
    if (!metadata) return;

    const updatedMetadata: StorageMetadata = {
      ...metadata,
      lastAccessed: Date.now(),
      accessCount: (metadata.accessCount || 0) + 1,
    };

    try {
      const result = await provider.get(key);
      if (result) {
        await provider.set(key, result.value, updatedMetadata);
      }
    } catch (error) {
      // Ignore errors in metadata updates
    }
  }

  async delete(key: string): Promise<void> {
    this.storageMap.delete(key);
    
    // Try to delete from all providers
    const promises = this.providers.map(provider => 
      provider.delete(key).catch(() => {
        // Ignore errors during deletion
      })
    );
    
    await Promise.all(promises);
  }

  async clear(): Promise<void> {
    this.storageMap.clear();
    
    const promises = this.providers.map(provider => 
      provider.clear().catch(() => {
        // Ignore errors during clear
      })
    );
    
    await Promise.all(promises);
  }

  async getUsage(): Promise<StorageUsage> {
    const usageByLevel: Record<StorageLevel, number> = {
      indexeddb: 0,
      localstorage: 0,
      memory: 0,
    };

    for (const provider of this.providers) {
      try {
        usageByLevel[provider.level] = await provider.getUsage();
      } catch (error) {
        // If we can't get usage, assume 0
        usageByLevel[provider.level] = 0;
      }
    }

    const used = Object.values(usageByLevel).reduce((sum, val) => sum + val, 0);
    const total = this.config.maxSize;
    const available = Math.max(0, total - used);

    return {
      total,
      used,
      available,
      byLevel: usageByLevel,
    };
  }

  async evict(bytesNeeded: number): Promise<void> {
    // Get all keys with metadata from all providers
    const allEntries: Array<{ key: string; metadata?: StorageMetadata; level: StorageLevel }> = [];

    for (const provider of this.providers) {
      try {
        const keys = await provider.keys();
        for (const key of keys) {
          const result = await provider.get(key);
          if (result) {
            allEntries.push({
              key,
              metadata: result.metadata,
              level: provider.level,
            });
          }
        }
      } catch (error) {
        // Continue with other providers
      }
    }

    // Sort based on eviction policy
    let sortedEntries = [...allEntries];
    
    switch (this.config.evictionPolicy) {
      case 'lru':
        sortedEntries.sort((a, b) => {
          const aTime = a.metadata?.lastAccessed || a.metadata?.timestamp || 0;
          const bTime = b.metadata?.lastAccessed || b.metadata?.timestamp || 0;
          return aTime - bTime; // Oldest first
        });
        break;
      
      case 'lfu':
        sortedEntries.sort((a, b) => {
          const aCount = a.metadata?.accessCount || 0;
          const bCount = b.metadata?.accessCount || 0;
          return aCount - bCount; // Least frequently used first
        });
        break;
      
      case 'priority':
        sortedEntries.sort((a, b) => {
          const aPriority = a.metadata?.priority || 0;
          const bPriority = b.metadata?.priority || 0;
          return aPriority - bPriority; // Lowest priority first
        });
        break;
    }

    // Evict entries until we have enough space
    let freedBytes = 0;
    for (const entry of sortedEntries) {
      if (freedBytes >= bytesNeeded) {
        break;
      }

      await this.delete(entry.key);
      freedBytes += entry.metadata?.size || 0;
    }
  }
}
