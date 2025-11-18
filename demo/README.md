# ShadowCache Demo Application

This demo application showcases all the core features of ShadowCache, including offline caching, predictive intelligence, delta synchronization, and the Shadow Mode UI.

## Features Demonstrated

### 1. **Connectivity Status**
- Real-time online/offline detection
- Manual offline mode toggle for testing
- Visual indicators with animated status badges

### 2. **Cache Status Dashboard**
- Storage usage visualization with progress bar
- Cached resource count
- Sync status monitoring
- Storage level indicator (IndexedDB/LocalStorage/Memory)

### 3. **Sync Controls**
- Manual sync trigger button
- Clear cache functionality
- Real-time sync progress display
- Delta statistics (synced items, conflicts, bytes transferred, duration)

### 4. **Cached Resources List**
- Visual list of all cached resources
- Metadata display (size, age, access count, priority, rule ID)
- Filter resources by URL
- Sort by priority, age, size, or URL
- Priority-based color coding (high/medium/low)

### 5. **Test API Endpoints**
- Mock API endpoints for testing:
  - `/api/users` - User data (network-first strategy, priority 8)
  - `/api/posts` - Blog posts (cache-first strategy, priority 7)
  - `/api/comments` - Comments (stale-while-revalidate strategy, priority 6)
  - `/api/large-data` - Large dataset (cache-first strategy, priority 5)
- JSON response display
- Automatic caching with configured strategies

## Running the Demo

### Prerequisites
- Node.js 18+ installed
- ShadowCache packages built

### Setup

1. Build all packages:
```bash
npm run build
```

2. Start a local development server in the demo directory:
```bash
cd demo
npx serve .
```

Or use any other static file server:
```bash
python -m http.server 8000
```

3. Open your browser to `http://localhost:8000` (or the appropriate port)

## Testing Offline Functionality

### Method 1: Manual Toggle
1. Click the "Toggle Offline Mode" button in the demo
2. Try fetching data - it will serve from cache
3. Toggle back online to restore network access

### Method 2: Browser DevTools
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Check "Offline" checkbox
4. Test the application behavior

### Method 3: System Network
1. Disconnect your network/WiFi
2. The demo will automatically detect offline state
3. Reconnect to restore online functionality

## What to Try

1. **Cache Resources**
   - Click "Fetch Users", "Fetch Posts", etc. while online
   - Watch the cached resources list populate
   - Observe storage usage increase

2. **Test Offline Mode**
   - Toggle offline mode
   - Try fetching already-cached resources (should work)
   - Try fetching uncached resources (should show error)

3. **Observe Caching Strategies**
   - Fetch users (network-first): Always tries network first
   - Fetch posts (cache-first): Serves from cache immediately
   - Fetch comments (stale-while-revalidate): Serves cache, updates in background

4. **Test Synchronization**
   - Go offline and make changes (simulated)
   - Go back online
   - Click "Trigger Manual Sync"
   - Watch sync progress and statistics

5. **Explore Resource Metadata**
   - View resource age (updates in real-time)
   - See priority levels (color-coded)
   - Check access counts
   - Filter and sort resources

6. **Test Storage Fallback**
   - The demo automatically uses IndexedDB → LocalStorage → Memory
   - Storage level is displayed in the dashboard
   - Try clearing cache and re-fetching

## Architecture

The demo uses:
- **Pure JavaScript** (ES modules) for simplicity
- **Mock API** endpoints (no backend required)
- **ShadowCache SDK** for caching and offline functionality
- **Storage Manager** for data persistence
- **Delta Sync** for synchronization simulation
- **Modern CSS** with CSS Grid and Flexbox
- **Responsive Design** for mobile and desktop

## Cache Rules Configuration

The demo is configured with the following cache rules:

```javascript
{
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
}
```

## Design

The demo features a modern, clean design with:
- **Dark theme** with gradient backgrounds
- **Shadow Mode aesthetic** (dark blues and purples)
- **Smooth animations** and transitions
- **Responsive layout** for all screen sizes
- **Accessible** color contrasts and interactive elements
- **Professional** typography and spacing

## Browser Compatibility

The demo works in all modern browsers that support:
- ES6 modules
- Async/await
- IndexedDB
- LocalStorage
- Service Workers (optional, graceful degradation)

Tested in:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Demo won't load
- Ensure you've built all packages with `npm run build`
- Check browser console for errors
- Try a different static file server

### Cache not working
- Check if IndexedDB is available in your browser
- Try clearing browser data and reloading
- Check browser console for storage errors

### Offline mode not working
- Ensure you're using the manual toggle in the demo
- Check browser DevTools Network tab
- Verify cached resources exist before going offline

## Next Steps

After exploring the demo:
1. Review the [API Documentation](../README.md)
2. Check out the [Configuration Guide](../docs/configuration.md)
3. Explore the [Source Code](../packages/)
4. Build your own application with ShadowCache!
