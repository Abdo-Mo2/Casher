const badge = document.getElementById('offline-badge')

function setOnlineStatus() {
  if (!badge) return
  const online = navigator.onLine
  badge.textContent = online ? '● متصل' : '● بدون إنترنت — يعمل محلياً'
  badge.classList.toggle('offline', !online)
}

setOnlineStatus()
window.addEventListener('online', setOnlineStatus)
window.addEventListener('offline', setOnlineStatus)

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {})
}
