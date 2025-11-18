# 🌑 ShadowCache Demo Application

> A stunning, fully functional demonstration of the ShadowCache offline-first caching engine with predictive intelligence, delta synchronization, and beautiful Shadow Mode UI.

![ShadowCache Demo](https://img.shields.io/badge/status-live-success)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features Demonstrated

### 🌐 Connectivity Status
- **Real-time online/offline detection** with animated indicators
- **Manual offline mode toggle** for testing without disconnecting
- **Visual status badges** with pulse animations
- **Automatic sync trigger** on online transition

### 📊 Cache Status Dashboard
- **Storage usage visualization** with animated progress bar
- **Cached resource count** updated in real-time
- **Sync status monitoring** (Idle/Syncing/Complete)
- **Storage level indicator** (IndexedDB → LocalStorage → Memory)
- **Live metrics** updating every 2 seconds

### 🔄 Sync Controls
- **Manual sync trigger** with progress visualization
- **Clear cache functionality** with confirmation
- **Real-time sync progress** with animated progress bar
- **Delta statistics display**:
  - Synced items count
  - Conflict detection
  - Bytes transferred
  - Operation duration

### 📦 Cached Resources List
- **Visual resource cards** with metadata
- **Real-time age display** (updates automatically)
- **Priority-based color coding**:
  - 🔴 High priority (7-10)
  - 🟡 Medium priority (4-6)
  - 🔵 Low priority (1-3)
- **Filter by URL** with instant search
- **Sort options**: Priority, Age, Size, URL
- **Metadata display**: Size, Age, Access Count, Rule ID

### 🧪 Test API Endpoints
Mock API endpoints demonstrating different caching strategies:

| Endpoint | Strategy | Priority | Max Age | Icon |
|----------|----------|----------|---------|------|
| `/api/users` | network-first | 8 | 5 min | 👥 |
| `/api/posts` | cache-first | 7 | 10 min | 📝 |
| `/api/comments` | stale-while-revalidate | 6 | 5 min | 💬 |
| `/api/large-data` | cache-first | 5 | 15 min | 📦 |

### 🧠 Predictive Caching Engine
- **Pattern learning visualization** showing learned navigation patterns
- **Prediction statistics**:
  - Patterns learned from user behavior
  - Predictions made for prefetching
  - Current prefetch queue size
  - Confidence level percentage
- **Real-time updates** as you interact with the app

### ⚡ Performance Metrics
- **Cache hit rate** percentage
- **Average response time** in milliseconds
- **Data saved** from network requests
- **Sync operations** count
- **Beautiful metric cards** with icons and animations

## 🚀 Running the Demo

### Prerequisites
- Node.js 18+ installed
- ShadowCache packages built

### Quick Start

1. **Build all packages:**
```bash
npm run build
```

2. **Start a local server:**

Using npx (recommended):
```bash
cd demo
npx serve .
```

Using Python:
```bash
cd demo
python -m http.server 8000
```

Using Node.js http-server:
```bash
npm install -g http-server
cd demo
http-server
```

3. **Open your browser:**
```
http://localhost:8000
```

## 🎮 Interactive Testing Guide

### 1. Cache Resources
1. Click **"Fetch Users"** while online
2. Watch the cached resources list populate
3. Observe storage usage increase in the dashboard
4. Notice the performance metrics update

### 2. Test Offline Mode
1. Click **"Toggle Offline Mode"** button
2. Try fetching already-cached resources ✅ (should work)
3. Try fetching uncached resources ❌ (should show error)
4. Watch the connectivity status change

### 3. Observe Caching Strategies

**Network-First (Users):**
- Always tries network first
- Falls back to cache if offline
- Best for frequently changing data

**Cache-First (Posts):**
- Serves from cache immediately
- Only fetches if not cached
- Best for static content

**Stale-While-Revalidate (Comments):**
- Serves cache instantly
- Updates in background
- Best for semi-dynamic content

### 4. Test Synchronization
1. Toggle offline mode
2. Click **"Trigger Manual Sync"**
3. Watch the progress bar animate
4. View sync statistics (synced, conflicts, bytes, duration)
5. Toggle back online to see automatic sync

### 5. Explore Predictive Caching
1. Fetch different endpoints in sequence
2. Watch **"Patterns Learned"** increase
3. Observe **"Predictions Made"** grow
4. See **"Confidence"** percentage rise
5. Check the **"Prefetch Queue"** size

### 6. Monitor Performance
1. Make several requests
2. Watch **"Cache Hit Rate"** improve
3. Compare **"Avg Response Time"** (cache vs network)
4. See **"Data Saved"** accumulate
5. Track **"Sync Operations"** count

### 7. Test Storage Fallback
The demo automatically uses the storage fallback chain:
- **IndexedDB** (primary) - Best performance
- **LocalStorage** (secondary) - Fallback for older browsers
- **Memory** (tertiary) - Last resort, session-only

Storage level is displayed in the dashboard!

## 🎨 Design Features

### Visual Design
- **Animated background** with floating gradient circles
- **Glassmorphism effects** with backdrop blur
- **Gradient text** with animated color shifts
- **Smooth transitions** on all interactive elements
- **Pulse animations** for active status indicators
- **Toast notifications** for user feedback

### Color Scheme
- **Primary**: Indigo (#6366f1)
- **Secondary**: Purple (#8b5cf6)
- **Accent**: Pink (#ec4899)
- **Success**: Green (#10b981)
- **Warning**: Orange (#f59e0b)
- **Danger**: Red (#ef4444)

### Responsive Design
- **Mobile-first** approach
- **Breakpoints** for tablets and desktops
- **Touch-friendly** buttons and controls
- **Readable** typography at all sizes

## 🏗️ Architecture

```
demo/
├── index.html          # Main HTML structure
├── app.js              # Application logic
├── styles.css          # Enhanced styling
├── package.json        # Demo dependencies
└── README.md           # This file
```

### Technology Stack
- **Pure JavaScript** (ES modules)
- **No framework dependencies** (vanilla JS)
- **Modern CSS** (Grid, Flexbox, Custom Properties)
- **ShadowCache SDK** for caching
- **Storage Manager** for persistence
- **Delta Sync** for synchronization

### Cache Configuration

```javascript
const config = {
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
      maxAge: 300000 // 5 minutes
    },
    {
      id: 'api-large',
      pattern: '/api/large-data',
      strategy: 'cache-first',
      priority: 5,
      maxAge: 900000 // 15 minutes
    }
  ]
};
```

## 🌐 Browser Compatibility

### Supported Browsers
| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 14+ | Full support |
| Edge | 90+ | Full support |

### Required Features
- ✅ ES6 Modules
- ✅ Async/Await
- ✅ IndexedDB
- ✅ LocalStorage
- ✅ CSS Grid & Flexbox
- ✅ CSS Custom Properties
- ⚠️ Service Workers (optional, graceful degradation)

## 🐛 Troubleshooting

### Demo Won't Load
**Problem**: Blank page or errors in console

**Solutions**:
1. Ensure packages are built: `npm run build`
2. Check browser console for errors (F12)
3. Try a different static file server
4. Clear browser cache and reload

### Cache Not Working
**Problem**: Resources not being cached

**Solutions**:
1. Check if IndexedDB is available (browser settings)
2. Verify storage quota isn't exceeded
3. Clear browser data and try again
4. Check console for storage errors

### Offline Mode Not Working
**Problem**: Can't access cached resources offline

**Solutions**:
1. Ensure resources are cached before going offline
2. Use the manual toggle button in the demo
3. Check browser DevTools Network tab
4. Verify cached resources list shows items

### Performance Issues
**Problem**: Slow or laggy interface

**Solutions**:
1. Clear cache and reload
2. Close other browser tabs
3. Check system resources
4. Try a different browser

### Toast Notifications Not Showing
**Problem**: No feedback messages appear

**Solutions**:
1. Check browser console for JavaScript errors
2. Ensure CSS is loaded properly
3. Try refreshing the page
4. Check if notifications are blocked

## 📚 Learning Resources

### Next Steps
1. 📖 Read the [API Documentation](../docs/API.md)
2. ⚙️ Explore [Configuration Options](../docs/CONFIGURATION.md)
3. 💡 Check out [Usage Examples](../docs/EXAMPLES.md)
4. 🚀 Review [Performance Guide](../docs/PERFORMANCE.md)
5. 🔧 Study the [Source Code](../packages/)

### Key Concepts to Understand
- **Caching Strategies**: When to use each strategy
- **Priority System**: How rules are matched and applied
- **Storage Fallback**: How the chain works
- **Delta Sync**: Efficient data synchronization
- **Predictive Caching**: Pattern learning and prefetching

## 🤝 Contributing

Found a bug or want to improve the demo?

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT © ShadowCache Contributors

---

**Built with ❤️ for the offline-first web**

🌑 **ShadowCache** - Modern offline-first caching with predictive intelligence
