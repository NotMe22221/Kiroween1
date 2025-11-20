# Which Demo Should I Use?

## 🎯 Quick Answer

**For the competition presentation, use:** `demo-simple.html`

## Demo Files Comparison

### 1. **demo-simple.html** ⭐ RECOMMENDED
- **Status:** ✅ 100% Working
- **Dependencies:** None - completely standalone
- **Mock Data:** Built-in, guaranteed to work
- **Buttons:** 4 data fetch buttons + 2 control buttons
- **Features:**
  - Real-time cache statistics
  - Online/offline toggle
  - Visual notifications
  - Cache hit rate tracking
  - Beautiful gradient UI
- **Best for:** Competition demo, presentations, quick testing
- **Just open in browser and click buttons!**

### 2. **index.html** (Full Demo)
- **Status:** ⚠️ Requires package imports
- **Dependencies:** Needs ShadowCache SDK packages
- **Mock Data:** Yes, but requires initialization
- **Buttons:** 7 buttons with advanced features
- **Features:**
  - All features from simple demo
  - Sparkline charts
  - Confetti animations
  - Particle effects
  - Activity feed
  - Predictive caching visualization
- **Best for:** Full feature showcase (after build)
- **Requires:** `npm install` and `npm run build`

### 3. **demo-standalone.html**
- **Status:** ✅ Working
- **Dependencies:** None
- **Mock Data:** Basic mock data
- **Features:** Minimal demo
- **Best for:** Quick testing

## 🚀 Quick Start Guide

### For Competition (EASIEST):

1. Open `demo/demo-simple.html` in your browser
2. Click any button:
   - 👥 Fetch Users
   - 📝 Fetch Posts
   - 💬 Fetch Comments
   - 📦 Fetch Products
3. See mock data appear instantly!
4. Click "Toggle Offline Mode"
5. Click the same buttons again
6. Data loads from cache!

### Demo Flow:

```
1. Click "Fetch Users" → See 5 user profiles
2. Click "Fetch Posts" → See 5 blog posts  
3. Click "Toggle Offline Mode" → Status turns red
4. Click "Fetch Users" again → Loads from cache instantly!
5. Click "Clear Cache" → Reset everything
```

## 📊 What Each Button Does

### demo-simple.html Buttons:

| Button | Mock Data Returned | Count |
|--------|-------------------|-------|
| 👥 Fetch Users | User profiles with names, emails, roles | 5 users |
| 📝 Fetch Posts | Blog posts with titles, authors, stats | 5 posts |
| 💬 Fetch Comments | Comments with authors and likes | 5 comments |
| 📦 Fetch Products | Products with prices and categories | 20 products |
| Toggle Offline | Switches between online/offline mode | - |
| Clear Cache | Removes all cached data | - |

## ✅ Verification Checklist

Before your presentation, verify:

- [ ] Open `demo-simple.html` in browser
- [ ] Click "Fetch Users" - see JSON data
- [ ] Click "Fetch Posts" - see JSON data
- [ ] Click "Toggle Offline Mode" - status turns red
- [ ] Click "Fetch Users" again - loads from cache
- [ ] See "Cache Hits" counter increase
- [ ] See "Hit Rate" percentage update
- [ ] Notifications appear in top-right corner

## 🎬 Presentation Script

**Opening:**
"Let me show you ShadowCache in action. I'll fetch some data, then go offline, and you'll see it still works perfectly."

**Demo Steps:**
1. "First, I'll fetch user data while online" → Click Fetch Users
2. "Now I'll fetch blog posts" → Click Fetch Posts
3. "Watch what happens when I go offline" → Toggle Offline
4. "The data still loads instantly from cache!" → Click Fetch Users
5. "See the cache hit rate? 100% efficiency!" → Point to stats

**Closing:**
"That's ShadowCache - making offline-first development simple and powerful."

## 🐛 Troubleshooting

### If buttons don't work:
1. Make sure you're using `demo-simple.html`
2. Open browser console (F12) to check for errors
3. Try a different browser (Chrome, Firefox, Edge)

### If no data appears:
1. Check that you clicked a data button (not just toggle/clear)
2. Look at the "Response:" section below the buttons
3. Refresh the page and try again

## 📁 File Locations

```
demo/
├── demo-simple.html      ⭐ USE THIS ONE
├── index.html            (Full version - needs build)
├── demo-standalone.html  (Basic version)
├── app.js               (Full demo logic)
├── styles.css           (Full demo styles)
└── WHICH_DEMO.md        (This file)
```

## 🎯 Bottom Line

**Use `demo-simple.html` for your competition demo.**

It's guaranteed to work, has all the mock data built-in, and demonstrates the core caching concepts perfectly. No build required, no dependencies, just open and click!

---

**Ready to present!** 🚀
