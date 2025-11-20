// ShadowCache Demo Application
// Use global implementations (either real packages or mocks)
const ShadowCache = window.ShadowCache;
const StorageManager = window.StorageManager;
const DeltaSync = window.DeltaSync;

// Mock data store for demo - RICH, REALISTIC DATA!
const mockDataStore = {
  users: [
    { 
      id: 1, 
      name: 'Alice Johnson', 
      email: 'alice.johnson@shadowcache.dev', 
      role: 'Admin',
      avatar: '👩‍💼',
      joinDate: '2024-01-15',
      lastActive: '2 hours ago',
      stats: { posts: 42, comments: 156, likes: 892 },
      bio: 'Lead developer passionate about offline-first architecture',
      location: 'San Francisco, CA',
      verified: true
    },
    { 
      id: 2, 
      name: 'Bob Smith', 
      email: 'bob.smith@shadowcache.dev', 
      role: 'Developer',
      avatar: '👨‍💻',
      joinDate: '2024-02-20',
      lastActive: '5 minutes ago',
      stats: { posts: 28, comments: 94, likes: 567 },
      bio: 'Full-stack engineer exploring PWA technologies',
      location: 'Austin, TX',
      verified: true
    },
    { 
      id: 3, 
      name: 'Carol White', 
      email: 'carol.white@shadowcache.dev', 
      role: 'Designer',
      avatar: '👩‍🎨',
      joinDate: '2024-03-10',
      lastActive: '1 hour ago',
      stats: { posts: 35, comments: 128, likes: 743 },
      bio: 'UX designer crafting beautiful offline experiences',
      location: 'New York, NY',
      verified: true
    },
    { 
      id: 4, 
      name: 'David Chen', 
      email: 'david.chen@shadowcache.dev', 
      role: 'DevOps',
      avatar: '👨‍🔧',
      joinDate: '2024-04-05',
      lastActive: '30 minutes ago',
      stats: { posts: 19, comments: 67, likes: 421 },
      bio: 'Infrastructure engineer optimizing edge caching',
      location: 'Seattle, WA',
      verified: false
    },
    { 
      id: 5, 
      name: 'Emma Davis', 
      email: 'emma.davis@shadowcache.dev', 
      role: 'Product Manager',
      avatar: '👩‍💼',
      joinDate: '2024-05-12',
      lastActive: '3 hours ago',
      stats: { posts: 31, comments: 102, likes: 654 },
      bio: 'PM driving offline-first product strategy',
      location: 'Boston, MA',
      verified: true
    }
  ],
  posts: [
    { 
      id: 1, 
      title: '🚀 Getting Started with ShadowCache: A Complete Guide', 
      author: 'Alice Johnson',
      authorAvatar: '👩‍💼',
      category: 'Tutorial',
      tags: ['beginner', 'setup', 'guide'],
      publishDate: '2024-10-15',
      readTime: '8 min read',
      likes: 234,
      views: 1847,
      content: 'ShadowCache is revolutionizing offline-first development. In this comprehensive guide, we\'ll walk through everything you need to know to get started. From installation to your first cached resource, we\'ve got you covered. Learn about cache strategies, predictive intelligence, and delta synchronization...',
      featured: true
    },
    { 
      id: 2, 
      title: '🎯 Offline-First Development: Best Practices for 2024', 
      author: 'Bob Smith',
      authorAvatar: '👨‍💻',
      category: 'Best Practices',
      tags: ['offline', 'pwa', 'architecture'],
      publishDate: '2024-10-18',
      readTime: '12 min read',
      likes: 189,
      views: 1523,
      content: 'Building offline-first applications requires a shift in mindset. Instead of treating offline as an error state, we embrace it as a first-class experience. This article explores proven patterns, common pitfalls, and how ShadowCache makes offline-first development accessible to everyone...',
      featured: true
    },
    { 
      id: 3, 
      title: '🧠 Predictive Caching Explained: How AI Learns Your Patterns', 
      author: 'Carol White',
      authorAvatar: '👩‍🎨',
      category: 'Deep Dive',
      tags: ['ai', 'ml', 'predictive', 'advanced'],
      publishDate: '2024-10-20',
      readTime: '15 min read',
      likes: 312,
      views: 2156,
      content: 'Predictive caching uses machine learning to anticipate what resources users will need next. By analyzing navigation patterns and building a Markov chain model, ShadowCache can prefetch resources before they\'re requested. This deep dive explores the algorithms, confidence scoring, and real-world performance gains...',
      featured: true
    },
    { 
      id: 4, 
      title: '🔄 Delta Synchronization: Syncing Smarter, Not Harder', 
      author: 'David Chen',
      authorAvatar: '👨‍🔧',
      category: 'Technical',
      tags: ['sync', 'optimization', 'bandwidth'],
      publishDate: '2024-10-22',
      readTime: '10 min read',
      likes: 156,
      views: 1234,
      content: 'Traditional sync sends entire objects back and forth. Delta sync only transmits what changed. Using JSON Patch (RFC 6902), ShadowCache reduces bandwidth by up to 95% in typical scenarios. Learn how conflict resolution works and why delta sync is crucial for mobile users...',
      featured: false
    },
    { 
      id: 5, 
      title: '💾 Storage Fallback Chains: Never Lose Your Data', 
      author: 'Emma Davis',
      authorAvatar: '👩‍💼',
      category: 'Architecture',
      tags: ['storage', 'reliability', 'fallback'],
      publishDate: '2024-10-25',
      readTime: '7 min read',
      likes: 198,
      views: 1456,
      content: 'What happens when IndexedDB fails? ShadowCache automatically falls back to LocalStorage, then memory. This resilient architecture ensures your app works across all browsers and scenarios. We\'ll explore the fallback chain, quota management, and eviction policies...',
      featured: false
    },
    { 
      id: 6, 
      title: '🎨 Building Beautiful Offline UIs with Shadow Mode', 
      author: 'Carol White',
      authorAvatar: '👩‍🎨',
      category: 'Design',
      tags: ['ui', 'ux', 'design', 'offline'],
      publishDate: '2024-10-28',
      readTime: '9 min read',
      likes: 267,
      views: 1789,
      content: 'Offline doesn\'t mean ugly. Shadow Mode provides beautiful, themed UI components that make offline states feel intentional and polished. From status indicators to cache metadata displays, learn how to create offline experiences users will love...',
      featured: false
    }
  ],
  comments: [
    { id: 1, postId: 1, author: 'Bob Smith', avatar: '👨‍💻', text: 'Excellent guide! The step-by-step approach made it so easy to get started. Already using it in production! 🚀', timestamp: '2 hours ago', likes: 12 },
    { id: 2, postId: 1, author: 'Carol White', avatar: '👩‍🎨', text: 'Very helpful, thanks! The examples were clear and the code snippets worked perfectly.', timestamp: '5 hours ago', likes: 8 },
    { id: 3, postId: 1, author: 'David Chen', avatar: '👨‍🔧', text: 'Love how you explained the cache strategies. Network-first vs cache-first finally makes sense!', timestamp: '1 day ago', likes: 15 },
    { id: 4, postId: 2, author: 'Alice Johnson', avatar: '👩‍💼', text: 'Excellent points! The offline-first mindset shift is crucial. Too many devs still treat it as an afterthought.', timestamp: '3 hours ago', likes: 23 },
    { id: 5, postId: 2, author: 'Emma Davis', avatar: '👩‍💼', text: 'This should be required reading for all web developers. Offline-first is the future! 💯', timestamp: '6 hours ago', likes: 19 },
    { id: 6, postId: 3, author: 'Bob Smith', avatar: '👨‍💻', text: 'Mind blown 🤯 I had no idea predictive caching could be this smart. The Markov chain explanation was perfect.', timestamp: '4 hours ago', likes: 31 },
    { id: 7, postId: 3, author: 'David Chen', avatar: '👨‍🔧', text: 'The confidence scoring algorithm is genius. Seeing 20-30% bandwidth savings in our tests!', timestamp: '8 hours ago', likes: 27 },
    { id: 8, postId: 4, author: 'Alice Johnson', avatar: '👩‍💼', text: 'Delta sync is a game-changer for mobile users. 95% bandwidth reduction is incredible!', timestamp: '1 hour ago', likes: 18 },
    { id: 9, postId: 4, author: 'Carol White', avatar: '👩‍🎨', text: 'The conflict resolution strategies are well thought out. Server-wins vs client-wins makes sense now.', timestamp: '5 hours ago', likes: 14 },
    { id: 10, postId: 5, author: 'Emma Davis', avatar: '👩‍💼', text: 'The fallback chain saved us when Safari had IndexedDB issues. Brilliant architecture! 🎯', timestamp: '2 hours ago', likes: 22 }
  ],
  largeData: Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    type: 'product',
    name: `Product ${i + 1}`,
    sku: `SKU-${String(i + 1).padStart(5, '0')}`,
    category: ['Electronics', 'Clothing', 'Books', 'Home', 'Sports'][i % 5],
    price: (Math.random() * 500 + 10).toFixed(2),
    inStock: Math.random() > 0.3,
    rating: (Math.random() * 2 + 3).toFixed(1),
    reviews: Math.floor(Math.random() * 1000),
    description: `High-quality product with excellent features. Perfect for ${['professionals', 'enthusiasts', 'beginners', 'experts', 'everyone'][i % 5]}. Fast shipping available.`,
    tags: ['popular', 'trending', 'new', 'sale', 'featured'].slice(0, Math.floor(Math.random() * 3) + 1),
    timestamp: Date.now() - Math.floor(Math.random() * 86400000),
    metadata: {
      weight: `${(Math.random() * 5 + 0.5).toFixed(2)} lbs`,
      dimensions: `${Math.floor(Math.random() * 20 + 5)}" x ${Math.floor(Math.random() * 15 + 3)}" x ${Math.floor(Math.random() * 10 + 2)}"`,
      manufacturer: ['TechCorp', 'GlobalBrand', 'QualityMakers', 'InnovateCo', 'PremiumGoods'][i % 5]
    }
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

// Generate additional demo data on demand
function generateAnalyticsData() {
  return {
    pageViews: Math.floor(Math.random() * 10000) + 5000,
    uniqueVisitors: Math.floor(Math.random() * 5000) + 2000,
    avgSessionDuration: `${Math.floor(Math.random() * 10) + 3}m ${Math.floor(Math.random() * 60)}s`,
    bounceRate: `${(Math.random() * 30 + 20).toFixed(1)}%`,
    topPages: [
      { page: '/home', views: 3421, avgTime: '2m 34s' },
      { page: '/products', views: 2876, avgTime: '4m 12s' },
      { page: '/about', views: 1543, avgTime: '1m 45s' },
      { page: '/contact', views: 987, avgTime: '1m 23s' },
      { page: '/blog', views: 2134, avgTime: '5m 47s' }
    ],
    devices: {
      mobile: '52%',
      desktop: '38%',
      tablet: '10%'
    },
    browsers: {
      chrome: '64%',
      safari: '21%',
      firefox: '10%',
      edge: '5%'
    }
  };
}

function generateNotifications() {
  return [
    { id: 1, type: 'success', title: 'Cache Updated', message: 'Your data has been synchronized', time: '2m ago', read: false },
    { id: 2, type: 'info', title: 'New Pattern Detected', message: 'Predictive engine learned a new navigation pattern', time: '15m ago', read: false },
    { id: 3, type: 'warning', title: 'Storage at 75%', message: 'Consider clearing old cache entries', time: '1h ago', read: true },
    { id: 4, type: 'success', title: 'Sync Complete', message: '42 items synchronized successfully', time: '2h ago', read: true },
    { id: 5, type: 'info', title: 'Offline Mode', message: 'Application is now running offline', time: '3h ago', read: true }
  ];
}

function generateSettings() {
  return {
    general: {
      theme: 'dark',
      language: 'en',
      timezone: 'America/Los_Angeles',
      notifications: true
    },
    cache: {
      maxSize: '50 MB',
      evictionPolicy: 'priority',
      autoSync: true,
      syncInterval: '5 minutes'
    },
    predictive: {
      enabled: true,
      learningRate: 0.8,
      minConfidence: 0.6,
      maxPrefetchSize: '5 MB'
    },
    security: {
      encryption: true,
      httpsOnly: true,
      credentialCaching: false
    }
  };
}

// Mock fetch function
async function mockFetch(endpoint) {
  const path = endpoint.replace('/api/', '');
  
  if (path === 'users') return mockDataStore.users;
  if (path === 'posts') return mockDataStore.posts;
  if (path === 'comments') return mockDataStore.comments;
  if (path === 'large-data') return mockDataStore.largeData;
  if (path === 'analytics') return generateAnalyticsData();
  if (path === 'notifications') return generateNotifications();
  if (path === 'settings') return generateSettings();
  
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

// Activity Feed System
const activityFeed = [];
const MAX_ACTIVITIES = 10;

function addActivity(icon, title, type = 'info') {
  const activity = {
    icon,
    title,
    time: new Date(),
    type
  };
  
  activityFeed.unshift(activity);
  if (activityFeed.length > MAX_ACTIVITIES) {
    activityFeed.pop();
  }
  
  renderActivityFeed();
}

function renderActivityFeed() {
  const container = document.getElementById('activity-feed');
  if (!container) return;
  
  container.innerHTML = activityFeed.map(activity => {
    const timeAgo = getTimeAgo(activity.time);
    const typeClass = `activity-${activity.type}`;
    
    return `
      <div class="activity-item ${typeClass}">
        <div class="activity-icon">${activity.icon}</div>
        <div class="activity-content">
          <div class="activity-title">${activity.title}</div>
          <div class="activity-time">${timeAgo}</div>
        </div>
      </div>
    `;
  }).join('');
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

// Update activity feed times
setInterval(() => {
  if (activityFeed.length > 0) {
    renderActivityFeed();
  }
}, 5000);

// Sparkline Charts
const sparklineData = {
  hitRate: [],
  responseTime: [],
  dataSaved: [],
  syncOps: []
};

function updateSparklines() {
  const hitRate = performanceMetrics.totalRequests > 0 
    ? ((performanceMetrics.cacheHits / performanceMetrics.totalRequests) * 100)
    : 0;
  
  const avgResponseTime = performanceMetrics.responseTimes.length > 0
    ? (performanceMetrics.responseTimes.reduce((a, b) => a + b, 0) / performanceMetrics.responseTimes.length)
    : 0;
  
  sparklineData.hitRate.push(hitRate);
  sparklineData.responseTime.push(avgResponseTime);
  sparklineData.dataSaved.push(performanceMetrics.dataSaved / 1024); // KB
  sparklineData.syncOps.push(performanceMetrics.syncOperations);
  
  // Keep only last 20 data points
  Object.keys(sparklineData).forEach(key => {
    if (sparklineData[key].length > 20) {
      sparklineData[key].shift();
    }
  });
  
  renderSparklines();
}

function renderSparklines() {
  renderSparkline('hit-rate-sparkline', sparklineData.hitRate, '#10b981');
  renderSparkline('response-time-sparkline', sparklineData.responseTime, '#6366f1');
  renderSparkline('data-saved-sparkline', sparklineData.dataSaved, '#8b5cf6');
  renderSparkline('sync-ops-sparkline', sparklineData.syncOps, '#ec4899');
}

function renderSparkline(elementId, data, color) {
  const element = document.getElementById(elementId);
  if (!element || data.length < 2) return;
  
  const width = element.offsetWidth || 200;
  const height = 30;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  element.innerHTML = `
    <svg width="${width}" height="${height}" style="display: block;">
      <polyline
        points="${points}"
        fill="none"
        stroke="${color}"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `;
}

// Confetti celebration
function triggerConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  
  canvas.style.display = 'block';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const ctx = canvas.getContext('2d');
  const confetti = [];
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
  
  for (let i = 0; i < 100; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 5 + 5,
      speedY: Math.random() * 3 + 2,
      speedX: Math.random() * 2 - 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 10 - 5
    });
  }
  
  function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    confetti.forEach((piece, index) => {
      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate(piece.rotation * Math.PI / 180);
      ctx.fillStyle = piece.color;
      ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
      ctx.restore();
      
      piece.y += piece.speedY;
      piece.x += piece.speedX;
      piece.rotation += piece.rotationSpeed;
      
      if (piece.y > canvas.height) {
        confetti.splice(index, 1);
      }
    });
    
    if (confetti.length > 0) {
      requestAnimationFrame(animateConfetti);
    } else {
      canvas.style.display = 'none';
    }
  }
  
  animateConfetti();
}

// Particle background effect
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '0';
  
  const ctx = canvas.getContext('2d');
  const particles = [];
  const particleCount = 50;
  
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speedX: Math.random() * 0.5 - 0.25,
      speedY: Math.random() * 0.5 - 0.25,
      opacity: Math.random() * 0.5 + 0.2
    });
  }
  
  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(particle => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(99, 102, 241, ${particle.opacity})`;
      ctx.fill();
      
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      
      if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
      if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
    });
    
    requestAnimationFrame(animateParticles);
  }
  
  animateParticles();
  
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// Enhanced fetch with activity logging
const originalFetchData = window.fetchData;
window.fetchData = async function(endpoint) {
  addActivity('🔄', `Fetching ${endpoint}`, 'info');
  await originalFetchData(endpoint);
};

// Enhanced sync with confetti
const originalPerformSync = performSync;
performSync = async function() {
  await originalPerformSync();
  if (Math.random() > 0.5) {
    triggerConfetti();
    addActivity('🎉', 'Sync completed with celebration!', 'success');
  }
};

// Enhanced clear cache
const originalClearCache = clearCache;
clearCache = async function() {
  await originalClearCache();
  addActivity('🗑️', 'Cache cleared successfully', 'warning');
};

// Update sparklines periodically
setInterval(updateSparklines, 2000);

// Initialize particles on load
setTimeout(initParticles, 1000);

// Add initial activities
setTimeout(() => {
  addActivity('🚀', 'ShadowCache initialized', 'success');
  addActivity('💾', 'Storage fallback chain ready', 'info');
  addActivity('🧠', 'Predictive engine started', 'info');
}, 2000);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDemo);
} else {
  initDemo();
}
