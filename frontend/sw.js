const CACHE = 'fastpos-v3'
const ASSETS = [
  './',
  './index.html',
  './products.html',
  './dashboard.html',
  './css/style.css',
  './manifest.json',
  './js/categories.js',
  './js/db.js',
  './js/alerts.js',
  './js/api.js',
  './js/app.js',
  './js/cashier.js',
  './js/products.js',
  './js/dashboard.js',
  './js/vendor/qrcode.min.js',
  './js/vendor/chart.umd.min.js'
]

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)))
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
    caches.match(e.request).then(
      (cached) =>
        cached ||
        fetch(e.request)
          .then((res) => {
            if (res.ok) {
              const clone = res.clone()
              caches.open(CACHE).then((c) => c.put(e.request, clone))
            }
            return res
          })
          .catch(() => cached)
    )
  )
})
