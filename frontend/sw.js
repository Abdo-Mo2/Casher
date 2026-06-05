const CACHE = 'fastpos-v6'
const APP_VERSION = '6'

const PRECACHE = [
  '/css/style.css',
  '/manifest.json',
  '/js/categories.js',
  '/js/labels.js',
  '/js/db.js',
  '/js/alerts.js',
  '/js/api.js',
  '/js/reports.js',
  '/js/app.js',
  '/js/cashier.js',
  '/js/products.js',
  '/js/dashboard.js',
  '/js/vendor/qrcode.min.js',
  '/js/vendor/chart.umd.min.js'
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => {}))
  )
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

  const url = new URL(e.request.url)
  if (url.origin !== self.location.origin) return

  const isStatic =
    /\.(js|css|json|html)$/i.test(url.pathname) || url.pathname.includes('/vendor/')

  if (!isStatic) return

  // Network first — always get latest when online; cache only for offline
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then((cache) => cache.put(e.request, clone))
        }
        return res
      })
      .catch(() => caches.match(e.request))
  )
})

self.APP_VERSION = APP_VERSION
