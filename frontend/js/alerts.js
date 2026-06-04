window.FastPOS = window.FastPOS || {}

;(function () {
  const FP = window.FastPOS

  function ensureUI() {
    if (document.getElementById('fp-toast-wrap')) return
    document.body.insertAdjacentHTML(
      'beforeend',
      `
      <div id="fp-toast-wrap" class="fp-toast-wrap"></div>
      <div id="fp-modal" class="fp-modal-overlay hidden">
        <div class="fp-modal-card">
          <h3 id="fp-modal-title"></h3>
          <p id="fp-modal-text"></p>
          <div id="fp-modal-actions" class="fp-modal-actions"></div>
        </div>
      </div>`
    )
  }

  function toast(icon, title, ms) {
    ensureUI()
    const wrap = document.getElementById('fp-toast-wrap')
    const el = document.createElement('div')
    el.className = `fp-toast fp-toast-${icon}`
    el.textContent = title
    wrap.appendChild(el)
    setTimeout(() => el.remove(), ms)
  }

  function modal({ title, text, confirmText, cancelText }) {
    ensureUI()
    return new Promise((resolve) => {
      const overlay = document.getElementById('fp-modal')
      document.getElementById('fp-modal-title').textContent = title
      document.getElementById('fp-modal-text').textContent = text || ''
      const actions = document.getElementById('fp-modal-actions')
      actions.innerHTML = ''

      const close = (value) => {
        overlay.classList.add('hidden')
        resolve(value)
      }

      if (cancelText) {
        const cancel = document.createElement('button')
        cancel.type = 'button'
        cancel.className = 'btn btn-secondary'
        cancel.textContent = cancelText
        cancel.onclick = () => close(false)
        actions.appendChild(cancel)
      }

      const ok = document.createElement('button')
      ok.type = 'button'
      ok.className = 'btn'
      ok.textContent = confirmText || 'حسناً'
      ok.onclick = () => close(cancelText ? true : undefined)
      actions.appendChild(ok)

      overlay.classList.remove('hidden')
      overlay.onclick = (e) => {
        if (e.target === overlay) close(false)
      }
    })
  }

  FP.toastSuccess = (title) => toast('success', title, 2500)
  FP.toastError = (title) => toast('error', title, 3000)
  FP.showError = (title, text) => modal({ title, text, confirmText: 'حسناً' })
  FP.showSuccess = (title, text) => modal({ title, text, confirmText: 'حسناً' })
  FP.confirmDelete = (title) =>
    modal({ title, text: '', confirmText: 'نعم، احذف', cancelText: 'إلغاء' })
})()
