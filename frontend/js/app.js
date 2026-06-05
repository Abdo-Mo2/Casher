;(function () {
  const FP = window.FastPOS

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

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    const SW_KEY = 'fastpos_sw_v4'
    if (!localStorage.getItem(SW_KEY)) {
      navigator.serviceWorker.getRegistrations().then((regs) =>
        Promise.all(regs.map((r) => r.unregister())).then(() =>
          caches.keys().then((keys) =>
            Promise.all(keys.map((k) => caches.delete(k))).then(() => {
              localStorage.setItem(SW_KEY, '1')
              location.reload()
            })
          )
        )
      )
    } else {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }
})()
