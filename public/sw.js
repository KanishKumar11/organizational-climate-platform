const CACHE_NAME = 'organizational-climate-v1';
const urlsToCache = [
  '/',
  '/survey',
  '/offline',
  '/manifest.json',
  // Add other static assets as needed
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // If both cache and network fail, show offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/offline');
          }
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline survey responses
self.addEventListener('sync', (event) => {
  if (event.tag === 'survey-response-sync') {
    event.waitUntil(syncSurveyResponses());
  }
});

async function syncSurveyResponses() {
  try {
    // Get pending survey responses from IndexedDB or localStorage
    const pendingResponses = JSON.parse(localStorage.getItem('offline_pending_data') || '[]');

    for (const response of pendingResponses) {
      try {
        const result = await fetch(response.url, {
          method: response.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(response.data),
        });

        if (result.ok) {
          // Remove successful response from pending list
          const remaining = pendingResponses.filter(r => r.id !== response.id);
          localStorage.setItem('offline_pending_data', JSON.stringify(remaining));
        }
      } catch (error) {
        console.error('Failed to sync survey response:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}