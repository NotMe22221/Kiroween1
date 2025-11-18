// Router Type Definitions
import type { CacheRule } from '@shadowcache/sdk';

export interface RouterConfig {
  scope: string;
  fallbackPage?: string;
  offlineAssets: string[];
}

export interface RouterMessage {
  type: 'CONFIG_UPDATE' | 'STATUS_REQUEST' | 'STATUS_RESPONSE' | 'CLEAR_CACHE';
  payload?: any;
}

export interface RouterStatus {
  isOnline: boolean;
  cacheCount: number;
  serviceWorkerReady: boolean;
}

export { CacheRule };
