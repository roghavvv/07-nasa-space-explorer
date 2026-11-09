
'use strict';

// NASA Space Explorer — PWA Service Worker

// Update this version whenever app shell files change.
const CACHE_VERSION = 'v3';

const SHELL_CACHE = `nasa-shell-${CACHE_VERSION}`;
const API_CACHE = `nasa-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `nasa-images-${CACHE_VERSION}`;

// Works in both GitHub Pages and Codespaces previews.
const APP_BASE = new URL('./', self.location.href);

// Files required for offline app functionality.
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './js/dateRange.js',
  './js/script.js',
  './js/pwa.js',
  './manifest.json',
  './img/nasa-worm-logo.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
].map(path => new URL(path, APP_BASE).href);

// INSTALL: Pre-cache the application shell.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE: Remove outdated app caches.
self.addEventListener('activate', event => {
  const currentCaches = [
    SHELL_CACHE,
    API_CACHE,
    IMAGE_CACHE
  ];

  event.waitUntil(
    Promise.all([
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(key =>
              (
                key.startsWith('nasa-shell-') ||
                key.startsWith('nasa-api-') ||
                key.startsWith('nasa-images-')
              ) &&
              !currentCaches.includes(key)
            )
            .map(key => caches.delete(key))
        )
      ),
      self.clients.claim()
    ])
  );
});

// CACHE-FIRST: Serve saved files before fetching.
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    // Cache successful normal responses and opaque images.
    if (
      networkResponse.ok ||
      (
        cacheName === IMAGE_CACHE &&
        networkResponse.type === 'opaque'
      )
    ) {
      try {
        await cache.put(request, networkResponse.clone());
      } catch (error) {
        console.warn('Unable to cache resource:', error);
      }
    }

    return networkResponse;
  } catch (error) {
    // Provide a valid response when an uncached resource
    // cannot be loaded offline.
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match(
        new URL('./index.html', APP_BASE).href
      );

      if (offlinePage) {
        return offlinePage;
      }
    }

    return Response.error();
  }
}

// NETWORK-FIRST: Use fresh NASA data when available.
async function networkFirst(request) {
  const cache = await caches.open(API_CACHE);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      try {
        await cache.put(
          request,
          networkResponse.clone()
        );
      } catch (error) {
        console.warn('Unable to cache NASA API data:', error);
      }

      return networkResponse;
    }

    // If NASA returns an error, try previously saved data.
    const cachedResponse = await cache.match(request);

    return cachedResponse || networkResponse;

  } catch (error) {
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Inform the app that saved NASA data is being used.
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });

      for (const client of clients) {
        client.postMessage({
          type: 'NASA_OFFLINE_DATA',
          message:
            'You are offline. Showing previously saved NASA data.'
        });
      }

      return cachedResponse;
    }

    // No cached response exists for this date range.
    return new Response(
      JSON.stringify({
        error:
          'You are offline and this NASA date range has not been saved yet.'
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// FETCH: Apply the correct caching strategy.
self.addEventListener('fetch', event => {
  const request = event.request;

  // Only cache GET requests.
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // NASA Science APOD API: network-first.
  if (
    url.hostname === 'science.nasa.gov' &&
    url.pathname.startsWith(
      '/wp-json/wp/v2/apod-basic'
    )
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  // NASA public APOD API: network-first.
  if (
    url.hostname === 'api.nasa.gov' &&
    url.pathname.startsWith('/planetary/apod')
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Local HTML, CSS, JavaScript, icons: cache-first.
  if (
    url.origin === self.location.origin &&
    url.pathname.startsWith(APP_BASE.pathname)
  ) {
    event.respondWith(
      cacheFirst(request, SHELL_CACHE)
    );
    return;
  }

  // NASA-hosted image assets: cache-first.
  if (
    url.hostname === 'assets.science.nasa.gov' &&
    request.destination === 'image'
  ) {
    event.respondWith(
      cacheFirst(request, IMAGE_CACHE)
    );
  }
});
