const CACHE = 'fastpos-v1'
const ASSETS = [
  './',
  './index.html',
  './products.html',
  './dashboard.html',
  './css/style.css',
  './js/app.js',
  './js/api.js',
  './js/db.js',
  './js/categories.js',
  './js/alerts.js',
  './js/cashier.js',
  './js/products.js',
  './js/dashboard.js',
  './manifest.json'
]

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetched = fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then((cache) => cache.put(e.request, clone))
          }
          return res
        })
        .catch(() => cached)
      return cached || fetched
    })
  )
})
