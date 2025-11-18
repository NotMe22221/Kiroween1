// Offline Router Implementation
import type { RouterConfig, RouterMessage, RouterStatus, CacheRule } from './types';
import type { CacheEntry, CacheMetadata } from '@shadowcache/sdk';
import { StorageManager } from '@shadowcache/storage';

export class OfflineRouter {
  private config?: RouterConfig;
  private registration?: ServiceWorkerRegistration;
  private stateChangeHandlers: Array<(online: boolean) => void> = [];
  private online: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private storage: StorageManager;
  private cacheRules: CacheRule[] = [];

  constructor() {
    this.storage = new StorageManager();
    
    // Set up online/offline listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleStateChange(true));
      window.addEventListener('offline', () => this.handleStateChange(false));
    }
  }

  async register(config: RouterConfig): Promise<void> {
    this.config = config;

    // Check if Service Worker is supported
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Workers are not supported in this browser');
    }

    try {
      // Register the service worker
      this.registration = await navigator.serviceWorker.register(
        '/sw.js',
        { scope: config.scope }
      );

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;

      // Send initial configuration to service worker
      this.sendMessage({
        type: 'CONFIG_UPDATE',
        payload: config,
      });

      // Cache offline assets immediately
      await this.cacheOfflineAssets(config.offlineAssets);
    } catch (error) {
      throw new Error(`Service Worker registration failed: ${error}`);
    }
  }

  async unregister(): Promise<void> {
    if (this.registration) {
      await this.registration.unregister();
      this.registration = undefined;
    }
  }

  async applyStrategy(request: Request, rule: CacheRule): Promise<Response> {
    switch (rule.strategy) {
      case 'network-first':
        return this.networkFirst(request, rule);
      case 'cache-first':
        return this.cacheFirst(request, rule);
      case 'stale-while-revalidate':
        return this.staleWhileRevalidate(request, rule);
      case 'cache-only':
        return this.cacheOnly(request, rule);
      default:
        throw new Error(`Unknown strategy: ${rule.strategy}`);
    }
  }

  isOnline(): boolean {
    return this.online;
  }

  onStateChange(handler: (online: boolean) => void): void {
    this.stateChangeHandlers.push(handler);
  }

  setCacheRules(rules: CacheRule[]): void {
    this.cacheRules = rules;
  }

  // Strategy implementations
  private async networkFirst(request: Request, rule: CacheRule): Promise<Response> {
    const timeout = rule.networkTimeout || 5000;

    try {
      // Try network with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(request, { signal: controller.signal });
      clearTimeout(timeoutId);

      // Cache successful response
      if (response.ok) {
        await this.cacheResponse(request, response.clone(), rule);
      }

      return response;
    } catch (error) {
      // Network failed, try cache
      const cached = await this.getCachedResponse(request);
      if (cached) {
        return cached;
      }

      // No cache available, return offline error
      return this.createOfflineResponse(request);
    }
  }

  private async cacheFirst(request: Request, rule: CacheRule): Promise<Response> {
    // Try cache first
    const cached = await this.getCachedResponse(request);
    if (cached) {
      // Check if expired
      const cacheKey = this.getCacheKey(request);
      const entry = await this.storage.get(cacheKey);
      
      if (entry && entry.value) {
        const metadata = entry.value.metadata as CacheMetadata;
        if (metadata.expiresAt && Date.now() > metadata.expiresAt) {
          // Expired, try network
          try {
            const response = await fetch(request);
            if (response.ok) {
              await this.cacheResponse(request, response.clone(), rule);
            }
            return response;
          } catch {
            // Network failed, return stale cache
            return cached;
          }
        }
      }
      
      return cached;
    }

    // No cache, try network
    try {
      const response = await fetch(request);
      if (response.ok) {
        await this.cacheResponse(request, response.clone(), rule);
      }
      return response;
    } catch (error) {
      return this.createOfflineResponse(request);
    }
  }

  private async staleWhileRevalidate(request: Request, rule: CacheRule): Promise<Response> {
    // Return cached response immediately
    const cached = await this.getCachedResponse(request);

    // Revalidate in background
    fetch(request)
      .then(response => {
        if (response.ok) {
          this.cacheResponse(request, response.clone(), rule);
        }
      })
      .catch(() => {
        // Ignore network errors in background
      });

    if (cached) {
      return cached;
    }

    // No cache, wait for network
    try {
      const response = await fetch(request);
      if (response.ok) {
        await this.cacheResponse(request, response.clone(), rule);
      }
      return response;
    } catch (error) {
      return this.createOfflineResponse(request);
    }
  }

  private async cacheOnly(request: Request, _rule: CacheRule): Promise<Response> {
    const cached = await this.getCachedResponse(request);
    if (cached) {
      return cached;
    }

    return this.createOfflineResponse(request);
  }

  // Helper methods
  private async cacheResponse(request: Request, response: Response, rule: CacheRule): Promise<void> {
    const cacheKey = this.getCacheKey(request);
    
    // Serialize response
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const body = await response.arrayBuffer();

    const entry: CacheEntry = {
      key: cacheKey,
      url: request.url,
      response: {
        status: response.status,
        statusText: response.statusText,
        headers,
        body,
        type: response.type,
      },
      metadata: {
        cachedAt: Date.now(),
        expiresAt: rule.maxAge ? Date.now() + rule.maxAge * 1000 : undefined,
        priority: rule.priority,
        size: body.byteLength,
        accessCount: 0,
        lastAccessed: Date.now(),
        ruleId: rule.id,
      },
    };

    await this.storage.set(cacheKey, entry, entry.metadata);
  }

  private async getCachedResponse(request: Request): Promise<Response | null> {
    const cacheKey = this.getCacheKey(request);
    const result = await this.storage.get(cacheKey);

    if (!result) {
      return null;
    }

    const entry = result.value as CacheEntry;
    
    // Update access metadata
    entry.metadata.accessCount++;
    entry.metadata.lastAccessed = Date.now();
    await this.storage.set(cacheKey, entry, entry.metadata);

    // Reconstruct response
    const headers = new Headers(entry.response.headers);
    const response = new Response(entry.response.body, {
      status: entry.response.status,
      statusText: entry.response.statusText,
      headers,
    });

    return response;
  }

  private getCacheKey(request: Request): string {
    return `cache:${request.url}`;
  }

  private createOfflineResponse(request: Request): Response {
    const body = JSON.stringify({
      error: 'offline',
      message: `Resource not available offline: ${request.url}`,
      url: request.url,
    });

    return new Response(body, {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
        'X-Offline-Error': 'true',
      },
    });
  }

  private async cacheOfflineAssets(assets: string[]): Promise<void> {
    const cachePromises = assets.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const request = new Request(url);
          const rule: CacheRule = {
            id: 'offline-assets',
            pattern: url,
            strategy: 'cache-first',
            priority: 10,
          };
          await this.cacheResponse(request, response, rule);
        }
      } catch (error) {
        console.warn(`Failed to cache offline asset: ${url}`, error);
      }
    });

    await Promise.all(cachePromises);
  }

  private handleStateChange(online: boolean): void {
    this.online = online;
    this.stateChangeHandlers.forEach(handler => handler(online));
  }

  private sendMessage(message: RouterMessage): void {
    if (this.registration && this.registration.active) {
      this.registration.active.postMessage(message);
    }
  }

  async getStatus(): Promise<RouterStatus> {
    const usage = await this.storage.getUsage();
    
    return {
      isOnline: this.online,
      cacheCount: 0, // Would need to count keys
      serviceWorkerReady: !!this.registration?.active,
    };
  }
}
