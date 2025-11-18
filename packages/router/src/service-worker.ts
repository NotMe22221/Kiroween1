// Service Worker for Offline Router
/// <reference lib="webworker" />

import type { RouterConfig, RouterMessage, CacheRule } from './types';

declare const self: ServiceWorkerGlobalScope;

let config: RouterConfig | null = null;
let cacheRules: CacheRule[] = [];

// Install event - cache offline assets
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    self.skipWaiting()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    self.clients.claim()
  );
});

// Fetch event - intercept network requests
self.addEventListener('fetch', (event: FetchEvent) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(handleFetch(event.request));
});

// Message event - receive configuration updates
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const message = event.data as RouterMessage;

  switch (message.type) {
    case 'CONFIG_UPDATE':
      config = message.payload as RouterConfig;
      break;
    
    case 'CLEAR_CACHE':
      event.waitUntil(clearAllCaches());
      break;
    
    case 'STATUS_REQUEST':
      event.ports[0]?.postMessage({
        type: 'STATUS_RESPONSE',
        payload: {
          isOnline: self.navigator.onLine,
          serviceWorkerReady: true,
        },
      });
      break;
  }
});

async function handleFetch(request: Request): Promise<Response> {
  // If no config, just fetch normally
  if (!config) {
    return fetch(request);
  }

  try {
    // For now, use network-first strategy as default
    return await fetch(request);
  } catch (error) {
    // Network failed, try cache
    const cache = await caches.open('shadowcache-v1');
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }

    // Return offline error
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: `Resource not available offline: ${request.url}`,
        url: request.url,
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
          'X-Offline-Error': 'true',
        },
      }
    );
  }
}

async function clearAllCaches(): Promise<void> {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}
