// ShadowCache SDK Main Class
import type { ShadowCacheConfig, CacheStatus } from './types';
import { validateConfig } from './validation';
import { StorageManager } from '@shadowcache/storage';
import { OfflineRouter } from '@shadowcache/router';
import { PredictiveEngine } from '@shadowcache/predictor';
import { DeltaSync } from '@shadowcache/sync';
import { AnalyticsHooks } from '@shadowcache/analytics';
import { matchPattern } from './matcher';
import type { SyncResult } from '@shadowcache/sync';

type EventHandler = (...args: any[]) => void;

export class ShadowCache {
  private config: ShadowCacheConfig;
  private storage: StorageManager;
  private router: OfflineRouter;
  private predictor?: PredictiveEngine;
  private deltaSync?: DeltaSync;
  private analytics?: AnalyticsHooks;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();

  private constructor(config: ShadowCacheConfig) {
    this.config = config;
    this.storage = new StorageManager(config.storage);
    this.router = new OfflineRouter();
    
    // Initialize optional modules
    if (config.predictive) {
      this.predictor = new PredictiveEngine(config.predictive);
    }
    
    if (config.sync) {
      this.deltaSync = new DeltaSync(config.sync);
    }
    
    if (config.analytics) {
      this.analytics = new AnalyticsHooks(config.analytics.sampleRate);
      
      // Register analytics providers
      if (config.analytics.providers) {
        for (const provider of config.analytics.providers) {
          this.analytics.registerProvider(provider);
        }
      }
    }
  }

  static async init(config: ShadowCacheConfig): Promise<ShadowCache> {
    // Validate configuration before initialization
    validateConfig(config);
    
    // Create instance with validated config
    const instance = new ShadowCache(config);
    
    // Setup storage (already initialized in constructor)
    
    // Register service worker if in browser environment
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        await instance.router.register({
          scope: '/',
          offlineAssets: [],
        });
        
        // Pass cache rules to router
        instance.router.setCacheRules(config.cacheRules);
      } catch (error) {
        // Service worker registration is optional - continue without it
        console.warn('Service Worker registration failed:', error);
      }
    }
    
    // Setup online/offline state change handlers
    instance.router.onStateChange((online) => {
      instance.emit('state-change', { online });
      
      // Track analytics event
      if (instance.analytics) {
        instance.analytics.track({
          type: online ? 'online' : 'offline',
          timestamp: Date.now(),
          data: {},
        });
      }
      
      // Trigger sync on online transition if sync is enabled
      if (online && instance.deltaSync && instance.deltaSync.getPendingChanges().length > 0) {
        instance.deltaSync.sync().catch((error) => {
          console.error('Auto-sync failed:', error);
        });
      }
    });
    
    // Start predictive prefetching if enabled
    if (instance.predictor) {
      instance.predictor.startPrefetching();
    }
    
    // Emit ready event
    instance.emit('ready', {
      status: await instance.getStatus(),
      timestamp: Date.now(),
    });
    
    return instance;
  }

  async getStatus(): Promise<CacheStatus> {
    const storageUsage = await this.storage.getUsage();
    
    // Count cached resources by checking storage
    // This is a simplified implementation - in production, we'd maintain a count
    let cachedResourceCount = 0;
    try {
      // Get usage from all storage levels as a proxy for resource count
      cachedResourceCount = Object.values(storageUsage.byLevel).filter(v => v > 0).length;
    } catch {
      cachedResourceCount = 0;
    }
    
    // Get sync status
    let syncStatus = 'idle';
    if (this.deltaSync) {
      const pendingChanges = this.deltaSync.getPendingChanges();
      const conflicts = this.deltaSync.getConflicts();
      
      if (conflicts.length > 0) {
        syncStatus = 'conflict';
      } else if (pendingChanges.length > 0) {
        syncStatus = 'pending';
      } else {
        syncStatus = 'synced';
      }
    }
    
    return {
      storageUsage: storageUsage.used,
      cachedResourceCount,
      syncStatus,
    };
  }

  async clearCache(pattern?: string): Promise<void> {
    if (!pattern) {
      // Clear all cache
      await this.storage.clear();
      
      // Track analytics event
      if (this.analytics) {
        this.analytics.track({
          type: 'cache-miss', // Using cache-miss as a proxy for cache clear
          timestamp: Date.now(),
          data: { action: 'clear-all' },
        });
      }
      
      return;
    }
    
    // Clear cache entries matching the pattern
    // This is a simplified implementation
    // In production, we'd need to iterate through all keys and match against pattern
    
    // For now, we'll just clear all if a pattern is provided
    // A full implementation would require the storage manager to support key listing
    await this.storage.clear();
    
    // Track analytics event
    if (this.analytics) {
      this.analytics.track({
        type: 'cache-miss',
        timestamp: Date.now(),
        data: { action: 'clear-pattern', pattern },
      });
    }
  }

  async prefetch(urls: string[]): Promise<void> {
    if (!urls || urls.length === 0) {
      return;
    }
    
    // Prefetch each URL
    const prefetchPromises = urls.map(async (url) => {
      try {
        // Find matching cache rule
        let matchingRule = null;
        for (const rule of this.config.cacheRules) {
          if (matchPattern(url, rule.pattern)) {
            matchingRule = rule;
            break;
          }
        }
        
        if (!matchingRule) {
          // Use default rule
          matchingRule = {
            id: 'prefetch-default',
            pattern: url,
            strategy: 'cache-first' as const,
            priority: 5 as const,
          };
        }
        
        // Fetch and cache the resource
        const request = new Request(url);
        await this.router.applyStrategy(request, matchingRule);
        
        // Track analytics event
        if (this.analytics) {
          this.analytics.track({
            type: 'cache-hit',
            timestamp: Date.now(),
            data: { url, action: 'prefetch' },
          });
        }
      } catch (error) {
        console.error(`Failed to prefetch ${url}:`, error);
        
        // Track analytics event
        if (this.analytics) {
          this.analytics.track({
            type: 'cache-miss',
            timestamp: Date.now(),
            data: { url, action: 'prefetch-failed', error: String(error) },
          });
        }
      }
    });
    
    await Promise.all(prefetchPromises);
  }

  async sync(): Promise<SyncResult> {
    if (!this.deltaSync) {
      throw new Error('Sync is not configured');
    }
    
    const result = await this.deltaSync.sync();
    
    // Track analytics event
    if (this.analytics) {
      this.analytics.track({
        type: 'sync-complete',
        timestamp: Date.now(),
        data: result,
      });
    }
    
    return result;
  }

  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Event handler error for ${event}:`, error);
        }
      });
    }
  }
}
