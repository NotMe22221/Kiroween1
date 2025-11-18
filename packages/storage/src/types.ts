// Storage Type Definitions
export interface StorageConfig {
  maxSize: number;
  evictionPolicy: 'lru' | 'lfu' | 'priority';
  encryption?: boolean;
}

export type StorageLevel = 'indexeddb' | 'localstorage' | 'memory';

export interface StorageUsage {
  total: number;
  used: number;
  available: number;
  byLevel: Record<StorageLevel, number>;
}

export interface StorageMetadata {
  size: number;
  timestamp: number;
  priority?: number;
  accessCount?: number;
  lastAccessed?: number;
}

export interface StorageProvider {
  readonly level: StorageLevel;
  set(key: string, value: any, metadata?: StorageMetadata): Promise<void>;
  get(key: string): Promise<{ value: any; metadata?: StorageMetadata } | null>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  getUsage(): Promise<number>;
  keys(): Promise<string[]>;
}
