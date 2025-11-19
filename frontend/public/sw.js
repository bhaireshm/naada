// Naada Service Worker
// Version 1.0.0

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `music-player-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `music-player-dynamic-${CACHE_VERSION}`;
const AUDIO_CACHE = `music-player-audio-${CACHE_VERSION}`;
const API_CACHE = `music-player-api-${CACHE_VERSION}`;

// Static assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/library',
  '/playlists',
  '/favorites',
  '/profile',
  '/offline',
  '/manifest.json',
];

// Maximum cache sizes
const MAX_AUDIO_CACHE_SIZE = 50; // Maximum number of audio files to cache
const MAX_API_CACHE_AGE = 5 * 60 * 1000; // 5 minutes

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete caches that don't match current version
            if (cacheName.startsWith('music-player-') && 
                cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== AUDIO_CACHE &&
                cacheName !== API_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - handle requests with appropriate caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome extensions and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Route to appropriate caching strategy
  if (isAudioRequest(url)) {
    event.respondWith(cacheFirstStrategy(request, AUDIO_CACHE));
  } else if (isAPIRequest(url)) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
  } else {
    event.respondWith(staleWhileRevalidateStrategy(request, DYNAMIC_CACHE));
  }
});

// Check if request is for audio file
function isAudioRequest(url) {
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a'];
  return audioExtensions.some(ext => url.pathname.includes(ext)) ||
         url.pathname.includes('/audio/') ||
         url.pathname.includes('/stream/');
}

// Check if request is for API
function isAPIRequest(url) {
  return url.pathname.startsWith('/api/') || 
         url.hostname.includes('localhost:3001') ||
         url.hostname.includes('api.');
}

// Check if request is for static asset
function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/') ||
         url.pathname.startsWith('/icons/') ||
         url.pathname.startsWith('/static/') ||
         url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/);
}

// Cache-first strategy: Try cache first, fall back to network
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Cache hit:', request.url);
      return cachedResponse;
    }
    
    console.log('[SW] Cache miss, fetching from network:', request.url);
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      
      // Manage cache size for audio files
      if (cacheName === AUDIO_CACHE) {
        await manageCacheSize(cacheName, MAX_AUDIO_CACHE_SIZE);
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first strategy failed:', error);
    
    // Return offline fallback for audio
    if (cacheName === AUDIO_CACHE) {
      return new Response('Audio unavailable offline', { 
        status: 503,
        statusText: 'Service Unavailable'
      });
    }
    
    throw error;
  }
}

// Network-first strategy: Try network first, fall back to cache
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful API responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      
      // Add timestamp to cached response
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.append('sw-cached-at', Date.now().toString());
      
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, cachedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Check if cached response is too old
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      if (cachedAt) {
        const age = Date.now() - parseInt(cachedAt);
        if (age > MAX_API_CACHE_AGE) {
          console.log('[SW] Cached response too old, returning error');
          return new Response(
            JSON.stringify({ error: 'Offline - cached data expired' }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }
      
      console.log('[SW] Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({ error: 'Offline - no cached data available' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Stale-while-revalidate strategy: Return cache immediately, update in background
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Fetch from network in background
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.error('[SW] Background fetch failed:', error);
      return null;
    });
  
  // Return cached response immediately if available
  if (cachedResponse) {
    console.log('[SW] Serving stale content:', request.url);
    return cachedResponse;
  }
  
  // Otherwise wait for network
  console.log('[SW] No cache, waiting for network:', request.url);
  return fetchPromise;
}

// Manage cache size by removing oldest entries
async function manageCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    console.log(`[SW] Cache size exceeded (${keys.length}/${maxSize}), removing oldest entries`);
    
    // Remove oldest entries (FIFO)
    const entriesToRemove = keys.length - maxSize;
    for (let i = 0; i < entriesToRemove; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  } else if (event.tag === 'sync-playlists') {
    event.waitUntil(syncPlaylists());
  } else if (event.tag === 'sync-all') {
    event.waitUntil(syncAll());
  }
});

// Sync favorites with server
async function syncFavorites() {
  try {
    console.log('[SW] Syncing favorites...');
    
    // Get pending favorite actions from IndexedDB
    const db = await openDatabase();
    const syncQueue = await getSyncQueue(db, 'favorite');
    
    for (const item of syncQueue) {
      try {
        // Attempt to sync with server
        const response = await fetch('/api/favorites', {
          method: item.type === 'favorite' ? 'POST' : 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
        
        if (response.ok) {
          // Remove from sync queue
          await removeSyncQueueItem(db, item.id);
          console.log('[SW] Synced favorite:', item.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync favorite:', error);
      }
    }
    
    console.log('[SW] Favorites sync complete');
  } catch (error) {
    console.error('[SW] Favorites sync failed:', error);
    throw error;
  }
}

// Sync playlists with server
async function syncPlaylists() {
  try {
    console.log('[SW] Syncing playlists...');
    
    const db = await openDatabase();
    const syncQueue = await getSyncQueue(db, 'playlist');
    
    for (const item of syncQueue) {
      try {
        let endpoint = '/api/playlists';
        let method = 'POST';
        
        if (item.type === 'playlist-update') {
          endpoint = `/api/playlists/${item.data.id}`;
          method = 'PUT';
        } else if (item.type === 'playlist-delete') {
          endpoint = `/api/playlists/${item.data.id}`;
          method = 'DELETE';
        }
        
        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
        
        if (response.ok) {
          await removeSyncQueueItem(db, item.id);
          console.log('[SW] Synced playlist:', item.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync playlist:', error);
      }
    }
    
    console.log('[SW] Playlists sync complete');
  } catch (error) {
    console.error('[SW] Playlists sync failed:', error);
    throw error;
  }
}

// Sync all pending actions
async function syncAll() {
  await Promise.all([
    syncFavorites(),
    syncPlaylists()
  ]);
}

// IndexedDB helpers for background sync
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MusicPlayerDB', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getSyncQueue(db, type) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    const index = store.index('type');
    const request = index.getAll(type);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function removeSyncQueueItem(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Message handler for communication with clients
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches());
  } else if (event.data.type === 'SYNC_NOW') {
    event.waitUntil(syncAll());
  }
});

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('[SW] All caches cleared');
}

console.log('[SW] Service worker loaded');
