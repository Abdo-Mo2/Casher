;(function () {
  const FP = window.FastPOS
  const APP_VERSION = '6'
  const VERSION_KEY = 'fastpos_app_version'

  FP.applyShopBranding = function () {
    const name = FP.getShopName()
    document.querySelectorAll('.logo').forEach((el) => {
      el.textContent = name === 'FastPOS' ? '🍔 FastPOS' : `🍔 ${name}`
    })
  }

  FP.applyShopBranding()

  const badge = document.getElementById('offline-badge')

  function setOnlineStatus() {
    if (!badge) return
    badge.textContent = navigator.onLine
      ? '● جاهز — يعمل محلياً'
      : '● بدون إنترنت — يعمل محلياً'
    badge.classList.toggle('offline', !navigator.onLine)
  }

  setOnlineStatus()
  window.addEventListener('online', setOnlineStatus)
  window.addEventListener('offline', setOnlineStatus)

  async function clearOldCaches() {
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
    const regs = await navigator.serviceWorker.getRegistrations()
    await Promise.all(regs.map((r) => r.unregister()))
  }

  async function initServiceWorker() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return

    const savedVersion = localStorage.getItem(VERSION_KEY)
    if (savedVersion !== APP_VERSION) {
      await clearOldCaches()
      localStorage.setItem(VERSION_KEY, APP_VERSION)
      location.reload()
      return
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      reg.update()
    } catch {
      /* offline or blocked */
    }
  }

  initServiceWorker()
})()
