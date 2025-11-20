# Button Testing Guide

## ✅ Both Demo Files Now Work with Mock Data!

### `demo/index.html` - Full Featured Demo
**Status:** ✅ Works standalone with mock data

**7 Buttons Available:**

1. **Toggle Offline Mode** 
   - Switches between online/offline
   - Shows status indicator change
   - Mock data: N/A (control button)

2. **Trigger Manual Sync**
   - Simulates delta synchronization
   - Shows progress bar animation
   - Mock data: Returns sync stats (5-15 items synced, 0-3 conflicts, 10-60KB transferred)
   - Sometimes triggers confetti celebration! 🎉

3. **Clear Cache**
   - Removes all cached data
   - Resets all metrics to zero
   - Mock data: N/A (control button)

4. **Fetch Users** 👥
   - Returns 5 user profiles
   - Mock data includes: names, emails, roles, avatars, stats, bios, locations
   - Example: Alice Johnson (Admin), Bob Smith (Developer), etc.

5. **Fetch Posts** 📝
   - Returns 6 blog posts
   - Mock data includes: titles, authors, categories, tags, likes, views, content
   - Example: "Getting Started with ShadowCache", "Offline-First Development", etc.

6. **Fetch Comments** 💬
   - Returns 10 comments
   - Mock data includes: authors, text, timestamps, likes
   - Comments are linked to posts

7. **Fetch Large Data** 📦
   - Returns 100 product items
   - Mock data includes: names, SKUs, categories, prices, ratings, reviews
   - Perfect for testing performance with larger datasets

### `demo/demo-simple.html` - Simple Demo
**Status:** ✅ Works standalone with mock data

**6 Buttons Available:**

1. **Toggle Offline Mode**
   - Same as full demo
   
2. **Clear Cache**
   - Same as full demo

3. **Fetch Users** 👥
   - Returns 5 user profiles (simplified)
   - Mock data: id, name, email, role, avatar

4. **Fetch Posts** 📝
   - Returns 5 blog posts (simplified)
   - Mock data: id, title, author, likes, views

5. **Fetch Comments** 💬
   - Returns 5 comments (simplified)
   - Mock data: id, postId, author, text, likes

6. **Fetch Products** 📦
   - Returns 20 products
   - Mock data: id, name, price, category, inStock, rating

## 🧪 Testing Checklist

### Test Scenario 1: Basic Fetch
- [ ] Open demo file in browser
- [ ] Click "Fetch Users"
- [ ] Verify JSON data appears in response area
- [ ] Check that data includes user names and emails

### Test Scenario 2: Cache Hit
- [ ] Click "Fetch Users" (first time)
- [ ] Click "Fetch Users" again (second time)
- [ ] Verify "Cache Hit" counter increases
- [ ] Verify response time is faster second time

### Test Scenario 3: Offline Mode
- [ ] Click "Fetch Posts" while online
- [ ] Click "Toggle Offline Mode"
- [ ] Click "Fetch Posts" again
- [ ] Verify data still loads from cache
- [ ] Verify notification says "from cache (offline mode)"

### Test Scenario 4: Cache Miss Offline
- [ ] Start fresh (or clear cache)
- [ ] Click "Toggle Offline Mode" (go offline first)
- [ ] Click "Fetch Users"
- [ ] Verify error message: "Resource not available offline"

### Test Scenario 5: All Data Types
- [ ] Click "Fetch Users" → See 5 users
- [ ] Click "Fetch Posts" → See 5-6 posts
- [ ] Click "Fetch Comments" → See 5-10 comments
- [ ] Click "Fetch Large Data/Products" → See 20-100 items
- [ ] Verify "Cached Items" counter shows 4

### Test Scenario 6: Clear Cache
- [ ] Fetch some data (any button)
- [ ] Verify "Cached Items" > 0
- [ ] Click "Clear Cache"
- [ ] Verify "Cached Items" = 0
- [ ] Verify "Cache Hits" = 0
- [ ] Verify response area cleared

### Test Scenario 7: Sync Operation (index.html only)
- [ ] Click "Trigger Manual Sync"
- [ ] Verify progress bar appears and animates
- [ ] Verify sync stats appear (synced, conflicts, bytes, duration)
- [ ] Watch for confetti animation (50% chance)

## 📊 Expected Mock Data Samples

### Users Data:
```json
{
  "id": 1,
  "name": "Alice Johnson",
  "email": "alice.johnson@shadowcache.dev",
  "role": "Admin",
  "avatar": "👩‍💼",
  "stats": { "posts": 42, "comments": 156, "likes": 892 }
}
```

### Posts Data:
```json
{
  "id": 1,
  "title": "🚀 Getting Started with ShadowCache",
  "author": "Alice Johnson",
  "likes": 234,
  "views": 1847
}
```

### Comments Data:
```json
{
  "id": 1,
  "postId": 1,
  "author": "Bob Smith",
  "text": "Excellent guide! 🚀",
  "likes": 12
}
```

### Products Data:
```json
{
  "id": 1,
  "name": "Product 1",
  "price": "245.67",
  "category": "Electronics",
  "inStock": true,
  "rating": "4.3"
}
```

## 🎯 Quick Verification

**To verify buttons work with mock data:**

1. Open either demo file
2. Open browser console (F12)
3. Click any fetch button
4. Look for: `✓ Data fetched and cached` message
5. Check response area for JSON data
6. Verify data matches expected format above

## ✅ Success Criteria

All buttons should:
- ✅ Respond when clicked
- ✅ Show loading state briefly
- ✅ Display mock data in response area
- ✅ Update metrics (cache hits, total requests)
- ✅ Show notification toast
- ✅ Work both online and offline (after caching)

## 🐛 If Buttons Don't Work

1. **Check browser console** (F12) for errors
2. **Verify file opened correctly** (should see full UI)
3. **Try different browser** (Chrome, Firefox, Edge)
4. **Check response area** (should show "Loading..." then data)
5. **Look for notifications** (top-right corner)

## 📝 Notes

- Mock data is **hardcoded** in the JavaScript
- No real API calls are made
- Network delays are **simulated** (500ms online, 100ms cache)
- All data is **realistic** and **diverse**
- Perfect for **demos** and **presentations**

---

**Both demo files are ready to use!** Just open in browser and click buttons to see mock data. 🚀
