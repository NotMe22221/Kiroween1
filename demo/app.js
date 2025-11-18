// ShadowCache Demo Application
import { ShadowCache } from '../packages/sdk/src/index.js';
import { StorageManager } from '../packages/storage/src/index.js';
import { DeltaSync } from '../packages/sync/src/index.js';

// Mock data store for demo
const mockDataStore = {
  users: [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'User' },
    { id: 3, name: 'Carol White', email: 'carol@example.com', role: 'User' }
  ],
  posts: [
    { id: 1, title: 'Getting Started with ShadowCache', author: 'Alice Johnson', content: 'Learn how to use ShadowCache...' },
    { id: 2, title: 'Offline-First Development', author: 'Bob Smith', content: 'Best practices for offline apps...' },
    { id: 3, title: 'Predictive Caching Explained', author: 'Carol White', content: 'How predictive caching works...' }
  ],
  comments: [
    { id: 1, postId: 1, author: 'Bob', text: 'Great article!' },
    { id: 2, postId: 1, author: 'Carol', text: 'Very helpful, thanks!' },
    { id: 3, postId: 2, author: 'Alice', text: 'Excellent points!' }
  ],
  largeData: Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    data: `Item ${i + 1}`,
    timestamp: Date.now(),
    payload: 'x'.repeat(1000)
  }))
};

// Global state
let isOnline = navigator.onLine;
let shadowCache = null;
let storageManager = null;
let deltaSync = null;
let cachedResources = [];
let performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  totalRequests: 0,
  responseTimes: [],
  dataSaved: 0,
  syncOperations: 0
};
let predictionStats = {
  patternsLearned: 0,
  predictionsMade: 0,
  prefetchQueue: 0,
  confidence: 0
};

// Initialize the demo
async function initDemo() {
  try {
    console.log('Initializing ShadowCache demo...');
    
    // Initialize storage manager
    storageManager = new StorageManager({
      maxSize: 50 * 1024 * 1024, // 50MB
      evictionPolicy: 'priority'
    });

    // Initialize delta sync
    deltaSync = new DeltaSync({
      endpoint: '/api/sync',
      batchSize: 10,
      retryAttempts: 3,
      conflictResolution: 'server-wins'
    });

    // Initialize ShadowCache
    shadowCache = await ShadowCache.init({
      cacheRules: [
        {
          id: 'api-users',
          pattern: '/api/users',
          strategy: 'network-first',
          priority: 8,
          maxAge: 300000 // 5 minutes
        },
        {
          id: 'api-posts',
          pattern: '/api/posts',
          strategy: 'cache-first',
          priority: 7,
          maxAge: 600000 // 10 minutes
        },
        {
          id: 'api-comments',
          pattern: '/api/comments',
          strategy: 'stale-while-revalidate',
          priority: 6,
          maxAge: 300000
        },
        {
          id: 'api-large',
          pattern: '/api/large-data',
          strategy: 'cache-first',
          priority: 5,
          maxAge: 900000 // 15 minutes
        }
      ]
    });

    console.log('ShadowCache initialized successfully');
    
    // Set up event listeners
    setupEventListeners();
    
    // Update UI
    updateConnectivityStatus();
    await updateCacheStatus();
    
    // Start periodic updates
    setInterval(updateCacheStatus, 2000);
    setInterval(updatePerformanceMetrics, 1000);
    setInterval(updatePredictionStats, 1000);
    
    // Simulate some prediction learning
    simulatePredictionLearning();
    
    showSuccess('ShadowCache initialized successfully! Try fetching some data.');
    
  } catch (error) {
    console.error('Failed to initialize demo:', error);
    showError('Initialization failed: ' + error.message);
  }
}

// Simulate prediction learning for demo purposes
function simulatePredictionLearning() {
  setInterval(() => {
    if (cachedResources.length > 0) {
      predictionStats.patternsLearned = Math.min(predictionStats.patternsLearned + 1, cachedResources.length * 2);
      predictionStats.predictionsMade = Math.min(predictionStats.predictionsMade + Math.floor(Math.random() * 3), 50);
      predictionStats.prefetchQueue = Math.floor(Math.random() * 5);
      predictionStats.confidence = Math.min(30 + (predictionStats.patternsLearned * 5), 95);
    }
  }, 5000);
}

// Setup event listeners
function setupEventListeners() {
  // Online/offline events
  window.addEventListener('online', () => {
    isOnline = true;
    updateConnectivityStatus();
    handleOnlineTransition();
  });

  window.addEventListener('offline', () => {
    isOnline = false;
    updateConnectivityStatus();
  });

  // Toggle offline mode button
  document.getElementById('toggle-offline').addEventListener('click', () => {
    isOnline = !isOnline;
    updateConnectivityStatus();
    if (isOnline) {
      handleOnlineTransition();
    }
  });

  // Manual sync button
  document.getElementById('manual-sync').addEventListener('click', async () => {
    await performSync();
  });

  // Clear cache button
  document.getElementById('clear-cache').addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all cached data?')) {
      await clearCache();
    }
  });

  // Resource filter
  document.getElementById('resource-filter').addEventListener('input', (e) => {
    filterResources(e.target.value);
  });

  // Sort selector
  document.getElementById('sort-by').addEventListener('change', (e) => {
    sortResources(e.target.value);
  });
}

// Update connectivity status UI
function updateConnectivityStatus() {
  const statusBadge = document.getElementById('connectivity-status');
  const statusText = document.getElementById('connectivity-text');
  
  if (isOnline) {
    statusBadge.classList.remove('offline');
    statusBadge.classList.add('online');
    statusText.textContent = 'Online';
  } else {
    statusBadge.classList.remove('online');
    statusBadge.classList.add('offline');
    statusText.textContent = 'Offline';
  }
}

// Update cache status dashboard
async function updateCacheStatus() {
  try {
    if (!shadowCache || !storageManager) return;

    const status = await shadowCache.getStatus();
    const usage = await storageManager.getUsage();
    
    // Update storage stats
    document.getElementById('storage-used').textContent = formatBytes(usage.used);
    document.getElementById('cached-count').textContent = status.cachedResourceCount;
    document.getElementById('sync-status').textContent = status.syncStatus;
    
    // Determine storage level
    const level = usage.byLevel.indexeddb > 0 ? 'IndexedDB' : 
                  usage.byLevel.localstorage > 0 ? 'LocalStorage' : 'Memory';
    document.getElementById('storage-level').textContent = level;
    
    // Update storage bar
    const percentage = usage.total > 0 ? (usage.used / usage.total) * 100 : 0;
    document.getElementById('storage-progress').style.width = `${percentage}%`;
    document.getElementById('storage-percentage').textContent = `${percentage.toFixed(1)}%`;
    
  } catch (error) {
    console.error('Failed to update cache status:', error);
  }
}

// Handle online transition
async function handleOnlineTransition() {
  console.log('Transitioning to online mode...');
  await performSync();
}

// Perform synchronization
async function performSync() {
  const progressContainer = document.getElementById('sync-progress-container');
  const progressBar = document.getElementById('sync-progress-bar');
  
  try {
    showInfo('Starting synchronization...');
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    
    // Simulate sync progress
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      progressBar.style.width = `${Math.min(progress, 90)}%`;
    }, 100);
    
    // Perform actual sync
    const result = await deltaSync.sync();
    
    clearInterval(progressInterval);
    progressBar.style.width = '100%';
    
    performanceMetrics.syncOperations++;
    
    // Update sync stats
    document.getElementById('sync-synced').textContent = result.synced;
    document.getElementById('sync-conflicts').textContent = result.conflicts;
    document.getElementById('sync-bytes').textContent = formatBytes(result.bytesTransferred);
    document.getElementById('sync-duration').textContent = `${result.duration}ms`;
    
    showSuccess(`Sync complete! ${result.synced} items synced, ${formatBytes(result.bytesTransferred)} transferred`);
    
    // Hide progress after 3 seconds
    setTimeout(() => {
      progressContainer.style.display = 'none';
    }, 3000);
    
    await updateCacheStatus();
    
  } catch (error) {
    console.error('Sync failed:', error);
    showError('Sync failed: ' + error.message);
    progressContainer.style.display = 'none';
  }
}

// Clear cache
async function clearCache() {
  try {
    showInfo('Clearing cache...');
    
    if (shadowCache) {
      await shadowCache.clearCache();
    }
    if (storageManager) {
      await storageManager.clear();
    }
    
    cachedResources = [];
    performanceMetrics = {
      cacheHits: 0,
      cacheMisses: 0,
      totalRequests: 0,
      responseTimes: [],
      dataSaved: 0,
      syncOperations: 0
    };
    predictionStats = {
      patternsLearned: 0,
      predictionsMade: 0,
      prefetchQueue: 0,
      confidence: 0
    };
    
    await updateCacheStatus();
    renderResourceList();
    updatePerformanceMetrics();
    updatePredictionStats();
    
    showSuccess('Cache cleared successfully! All metrics reset.');
  } catch (error) {
    console.error('Failed to clear cache:', error);
    showError('Failed to clear cache: ' + error.message);
  }
}

// Fetch data from mock API
window.fetchData = async function(endpoint) {
  const responseDiv = document.getElementById('api-response');
  const startTime = performance.now();
  
  try {
    responseDiv.textContent = 'Loading...';
    performanceMetrics.totalRequests++;
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, isOnline ? 500 : 100));
    
    if (!isOnline) {
      // Try to get from cache
      const cached = await getCachedData(endpoint);
      if (cached) {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        performanceMetrics.responseTimes.push(responseTime);
        performanceMetrics.cacheHits++;
        
        responseDiv.textContent = JSON.stringify(cached, null, 2);
        showSuccess(`Loaded from cache in ${responseTime.toFixed(0)}ms (offline mode)`);
        return;
      } else {
        performanceMetrics.cacheMisses++;
        throw new Error('Resource not available offline');
      }
    }
    
    // Check if we have cached data first
    const cached = await getCachedData(endpoint);
    if (cached) {
      performanceMetrics.cacheHits++;
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      performanceMetrics.responseTimes.push(responseTime);
      
      responseDiv.textContent = JSON.stringify(cached, null, 2);
      showInfo(`Loaded from cache in ${responseTime.toFixed(0)}ms (cache-first strategy)`);
      
      // Revalidate in background
      setTimeout(async () => {
        try {
          const freshData = await mockFetch(endpoint);
          await cacheData(endpoint, freshData);
          showInfo('Cache updated with fresh data');
        } catch (e) {
          console.error('Background revalidation failed:', e);
        }
      }, 100);
      
      return;
    }
    
    // Fetch from mock API
    performanceMetrics.cacheMisses++;
    const data = await mockFetch(endpoint);
    
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    performanceMetrics.responseTimes.push(responseTime);
    
    // Cache the data
    const dataSize = JSON.stringify(data).length;
    performanceMetrics.dataSaved += dataSize;
    await cacheData(endpoint, data);
    
    // Display response
    responseDiv.textContent = JSON.stringify(data, null, 2);
    showSuccess(`Data fetched and cached in ${responseTime.toFixed(0)}ms (${formatBytes(dataSize)})`);
    
    // Update resource list
    await updateResourceList();
    
  } catch (error) {
    console.error('Fetch failed:', error);
    responseDiv.textContent = `Error: ${error.message}`;
    showError(error.message);
    performanceMetrics.cacheMisses++;
  }
};

// Mock fetch function
async function mockFetch(endpoint) {
  const path = endpoint.replace('/api/', '');
  
  if (path === 'users') return mockDataStore.users;
  if (path === 'posts') return mockDataStore.posts;
  if (path === 'comments') return mockDataStore.comments;
  if (path === 'large-data') return mockDataStore.largeData;
  
  throw new Error('Unknown endpoint');
}

// Cache data
async function cacheData(url, data) {
  if (!storageManager) return;
  
  const metadata = {
    cachedAt: Date.now(),
    priority: getPriorityForUrl(url),
    size: JSON.stringify(data).length,
    accessCount: 1,
    lastAccessed: Date.now(),
    ruleId: getRuleIdForUrl(url)
  };
  
  await storageManager.set(url, data, metadata);
}

// Get cached data
async function getCachedData(url) {
  if (!storageManager) return null;
  
  const result = await storageManager.get(url);
  return result ? result.value : null;
}

// Get priority for URL
function getPriorityForUrl(url) {
  if (url.includes('users')) return 8;
  if (url.includes('posts')) return 7;
  if (url.includes('comments')) return 6;
  if (url.includes('large-data')) return 5;
  return 5;
}

// Get rule ID for URL
function getRuleIdForUrl(url) {
  if (url.includes('users')) return 'api-users';
  if (url.includes('posts')) return 'api-posts';
  if (url.includes('comments')) return 'api-comments';
  if (url.includes('large-data')) return 'api-large';
  return 'default';
}

// Update resource list
async function updateResourceList() {
  if (!storageManager) return;
  
  // Get all cached items (mock implementation)
  cachedResources = [];
  
  for (const endpoint of ['/api/users', '/api/posts', '/api/comments', '/api/large-data']) {
    const result = await storageManager.get(endpoint);
    if (result) {
      cachedResources.push({
        url: endpoint,
        metadata: result.metadata || {
          cachedAt: Date.now(),
          priority: getPriorityForUrl(endpoint),
          size: JSON.stringify(result.value).length,
          accessCount: 1,
          lastAccessed: Date.now(),
          ruleId: getRuleIdForUrl(endpoint)
        }
      });
    }
  }
  
  renderResourceList();
}

// Render resource list
function renderResourceList() {
  const listContainer = document.getElementById('resource-list');
  
  if (cachedResources.length === 0) {
    listContainer.innerHTML = '<div class="empty-state">No cached resources yet. Try fetching some data!</div>';
    return;
  }
  
  listContainer.innerHTML = cachedResources.map(resource => {
    const age = Date.now() - resource.metadata.cachedAt;
    const priorityClass = resource.metadata.priority >= 7 ? 'priority-high' : 
                          resource.metadata.priority >= 5 ? 'priority-medium' : 'priority-low';
    
    return `
      <div class="resource-item">
        <div class="resource-header">
          <div class="resource-url">${resource.url}</div>
          <div class="resource-priority ${priorityClass}">
            Priority ${resource.metadata.priority}
          </div>
        </div>
        <div class="resource-metadata">
          <div class="metadata-item">
            <div class="metadata-label">Size</div>
            <div class="metadata-value">${formatBytes(resource.metadata.size)}</div>
          </div>
          <div class="metadata-item">
            <div class="metadata-label">Age</div>
            <div class="metadata-value">${formatAge(age)}</div>
          </div>
          <div class="metadata-item">
            <div class="metadata-label">Access Count</div>
            <div class="metadata-value">${resource.metadata.accessCount}</div>
          </div>
          <div class="metadata-item">
            <div class="metadata-label">Rule ID</div>
            <div class="metadata-value">${resource.metadata.ruleId}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Filter resources
function filterResources(query) {
  const filtered = cachedResources.filter(resource => 
    resource.url.toLowerCase().includes(query.toLowerCase())
  );
  
  const listContainer = document.getElementById('resource-list');
  if (filtered.length === 0) {
    listContainer.innerHTML = '<div class="empty-state">No resources match your filter</div>';
    return;
  }
  
  // Re-render with filtered resources
  const temp = cachedResources;
  cachedResources = filtered;
  renderResourceList();
  cachedResources = temp;
}

// Sort resources
function sortResources(sortBy) {
  switch (sortBy) {
    case 'priority':
      cachedResources.sort((a, b) => b.metadata.priority - a.metadata.priority);
      break;
    case 'age':
      cachedResources.sort((a, b) => b.metadata.cachedAt - a.metadata.cachedAt);
      break;
    case 'size':
      cachedResources.sort((a, b) => b.metadata.size - a.metadata.size);
      break;
    case 'url':
      cachedResources.sort((a, b) => a.url.localeCompare(b.url));
      break;
  }
  renderResourceList();
}

// Utility functions
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatAge(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

function showSuccess(message) {
  console.log('✓', message);
  showToast('Success', message, 'success');
}

function showError(message) {
  console.error('✗', message);
  showToast('Error', message, 'error');
}

function showWarning(message) {
  console.warn('⚠', message);
  showToast('Warning', message, 'warning');
}

function showInfo(message) {
  console.info('ℹ', message);
  showToast('Info', message, 'info');
}

// Toast notification system
function showToast(title, message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };
  
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  container.appendChild(toast);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease-out reverse';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// Update performance metrics display
function updatePerformanceMetrics() {
  const hitRate = performanceMetrics.totalRequests > 0 
    ? ((performanceMetrics.cacheHits / performanceMetrics.totalRequests) * 100).toFixed(1)
    : 0;
  
  const avgResponseTime = performanceMetrics.responseTimes.length > 0
    ? (performanceMetrics.responseTimes.reduce((a, b) => a + b, 0) / performanceMetrics.responseTimes.length).toFixed(0)
    : 0;
  
  document.getElementById('cache-hit-rate').textContent = `${hitRate}%`;
  document.getElementById('avg-response-time').textContent = `${avgResponseTime}ms`;
  document.getElementById('data-saved').textContent = formatBytes(performanceMetrics.dataSaved);
  document.getElementById('sync-operations').textContent = performanceMetrics.syncOperations;
}

// Update prediction stats display
function updatePredictionStats() {
  document.getElementById('patterns-learned').textContent = predictionStats.patternsLearned;
  document.getElementById('predictions-made').textContent = predictionStats.predictionsMade;
  document.getElementById('prefetch-queue').textContent = predictionStats.prefetchQueue;
  document.getElementById('prediction-confidence').textContent = `${predictionStats.confidence}%`;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDemo);
} else {
  initDemo();
}
