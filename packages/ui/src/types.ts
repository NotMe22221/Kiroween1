// UI Type Definitions
export interface UIConfig {
  theme: 'dark' | 'light' | 'auto';
  position: 'top' | 'bottom' | 'corner';
  showDetails: boolean;
}

export interface CacheStatus {
  storageUsage: number;
  cachedResourceCount: number;
  syncStatus: string;
}

export interface CacheMetadata {
  cachedAt: number;
  expiresAt?: number;
  priority: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
  ruleId: string;
  etag?: string;
  version?: string;
}

export interface SyncStatus {
  syncing: boolean;
  lastSyncTime?: number;
  pendingChanges: number;
}

export interface ShadowUIProps {
  isOnline: boolean;
  cacheStatus: CacheStatus;
  syncStatus: SyncStatus;
  onSync?: () => void;
  config?: UIConfig;
  contentMetadata?: CacheMetadata;
  isContentCached?: boolean;
}
