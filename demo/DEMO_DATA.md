# ShadowCache Demo Data Guide

## Overview
The demo includes extensive mock data to showcase all features without requiring a backend server.

## Available Demo Data

### 1. **Users Data** (`/api/users`)
- **5 realistic user profiles** with:
  - Names, emails, roles, avatars
  - Join dates, last active times
  - Stats (posts, comments, likes)
  - Bios, locations, verification status
- Examples: Alice Johnson (Admin), Bob Smith (Developer), Carol White (Designer)

### 2. **Posts Data** (`/api/posts`)
- **6 featured blog posts** with:
  - Titles, authors, categories, tags
  - Publish dates, read times
  - Likes, views, content previews
  - Featured status
- Topics: Getting Started, Offline-First, Predictive Caching, Delta Sync, Storage, UI Design

### 3. **Comments Data** (`/api/comments`)
- **10 realistic comments** with:
  - Post associations
  - Authors with avatars
  - Comment text, timestamps
  - Like counts
- Distributed across multiple posts

### 4. **Large Data** (`/api/large-data`)
- **100 product items** with:
  - IDs, names, SKUs
  - Categories (Electronics, Clothing, Books, Home, Sports)
  - Prices, stock status, ratings
  - Reviews, descriptions, tags
  - Metadata (weight, dimensions, manufacturer)
- Perfect for testing performance with larger datasets

### 5. **Analytics Data** (`/api/analytics`)
- Dynamically generated on each fetch:
  - Page views, unique visitors
  - Session duration, bounce rate
  - Top pages with metrics
  - Device breakdown (mobile/desktop/tablet)
  - Browser statistics

### 6. **Notifications** (`/api/notifications`)
- **5 notification types**:
  - Success (cache updates, sync complete)
  - Info (pattern detection, offline mode)
  - Warning (storage alerts)
  - Read/unread status
  - Timestamps

### 7. **Settings** (`/api/settings`)
- Complete configuration object:
  - General (theme, language, timezone)
  - Cache (max size, eviction policy, auto-sync)
  - Predictive (learning rate, confidence thresholds)
  - Security (encryption, HTTPS, credential policies)

## Interactive Buttons

### Main Control Buttons
1. **Toggle Offline Mode** - Simulates network connectivity changes
2. **Trigger Manual Sync** - Initiates delta synchronization with progress tracking
3. **Clear Cache** - Removes all cached data and resets metrics

### Data Fetch Buttons (4 buttons)
4. **Fetch Users** - Loads user profiles
5. **Fetch Posts** - Loads blog posts
6. **Fetch Comments** - Loads comment threads
7. **Fetch Large Data** - Loads 100 product items

## How It Works

### Cache-First Strategy
1. Click any "Fetch" button while **online**
2. Data is fetched and cached
3. Click "Toggle Offline Mode"
4. Click the same "Fetch" button again
5. Data loads instantly from cache!

### Network-First Strategy
- Users endpoint uses network-first
- Always tries network, falls back to cache
- Shows different toast messages based on source

### Stale-While-Revalidate
- Comments endpoint uses this strategy
- Returns cached data immediately
- Updates cache in background

### Visual Feedback
- **Toast notifications** show every action
- **Activity feed** logs all operations
- **Sparkline charts** visualize metrics over time
- **Confetti animation** celebrates successful syncs
- **Particle effects** create ambient background

## Testing Scenarios

### Scenario 1: Basic Caching
1. Start demo (online mode)
2. Click "Fetch Users"
3. See data in response panel
4. Toggle offline
5. Click "Fetch Users" again
6. Data loads from cache instantly!

### Scenario 2: Performance Comparison
1. Fetch all 4 data types while online
2. Note response times (500ms simulated network delay)
3. Toggle offline
4. Fetch same data types
5. Note response times (100ms from cache)
6. See 5x performance improvement!

### Scenario 3: Sync Operations
1. Fetch some data
2. Toggle offline
3. Make changes (simulated)
4. Toggle back online
5. Click "Trigger Manual Sync"
6. Watch progress bar and confetti celebration!

### Scenario 4: Large Data Handling
1. Click "Fetch Large Data"
2. See 100 products loaded
3. Check "Data Saved" metric
4. See storage usage increase
5. Verify cache hit rate improves on subsequent fetches

## Real-Time Metrics

### Performance Metrics (with sparklines)
- **Cache Hit Rate**: Percentage of requests served from cache
- **Avg Response Time**: Average time to fulfill requests
- **Data Saved**: Total bytes cached
- **Sync Operations**: Number of sync events

### Prediction Stats
- **Patterns Learned**: Navigation patterns detected
- **Predictions Made**: Prefetch predictions generated
- **Prefetch Queue**: Items waiting to be prefetched
- **Confidence**: ML model confidence score

### Activity Feed
- Real-time log of all operations
- Color-coded by type (success/info/warning/error)
- Timestamps with "time ago" format
- Auto-updates every 5 seconds

## Demo Features Showcase

✅ **7 Working Buttons** - All functional with mock data
✅ **Rich Mock Data** - Realistic, diverse datasets
✅ **Visual Effects** - Animations, sparklines, confetti, particles
✅ **Real-Time Updates** - Live metrics and activity feed
✅ **Offline Simulation** - Toggle connectivity on demand
✅ **Cache Strategies** - Network-first, cache-first, stale-while-revalidate
✅ **Performance Tracking** - Hit rates, response times, data saved
✅ **Predictive Intelligence** - Pattern learning simulation
✅ **Delta Sync** - Progress tracking with conflict resolution
✅ **Toast Notifications** - Beautiful, animated feedback

## Quick Start

1. Open `demo/index.html` in your browser
2. Click "Fetch Users" to load first dataset
3. Click "Fetch Posts" to load second dataset
4. Toggle offline mode
5. Click the same buttons - see instant cache responses!
6. Click "Trigger Manual Sync" for confetti celebration 🎉

## Notes

- All data is **mock data** - no real API calls
- Network delays are **simulated** (500ms online, 100ms cache)
- Sync operations are **simulated** with realistic progress
- Predictive stats **auto-increment** to show learning
- Everything works **completely offline** after initial load

---

**Ready to present!** All 7 buttons work with rich, realistic demo data. 🚀
