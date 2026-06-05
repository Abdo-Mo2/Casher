;(function () {
  const FP = window.FastPOS
  const CASHIER_KEY = 'fastpos_cashier_name'
  const LAST_ORDER_KEY = 'fastpos_last_order'
  const cart = []
  let products = []
  let activeCategory = 'الكل'
  let paymentType = 'cash'
  let orderType = 'dinein'

  const productGrid = document.getElementById('product-grid')
  const categoryFilters = document.getElementById('category-filters')
  const cartItemsEl = document.getElementById('cart-items')
  const cartTotalEl = document.getElementById('cart-total')
  const confirmBtn = document.getElementById('confirm-btn')
  const reprintBtn = document.getElementById('reprint-btn')
  const cashierInput = document.getElementById('cashier-name')
  const tableNumberInput = document.getElementById('table-number')
  const tableNumberWrap = document.getElementById('table-number-wrap')
  const modal = document.getElementById('receipt-modal')

  const savedCashier = localStorage.getItem(CASHIER_KEY)
  if (savedCashier) cashierInput.value = savedCashier

  cashierInput.addEventListener('input', () => {
    localStorage.setItem(CASHIER_KEY, cashierInput.value.trim())
  })

  function initOptionChips(containerId, onSelect) {
    const container = document.getElementById(containerId)
    if (!container) return
    container.querySelectorAll('.option-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.option-chip').forEach((b) => b.classList.remove('active'))
        btn.classList.add('active')
        onSelect(btn.dataset.value)
      })
    })
  }

  initOptionChips('order-type-chips', (val) => {
    orderType = val
    if (tableNumberWrap) {
      tableNumberWrap.style.display = val === 'dinein' ? 'block' : 'none'
    }
  })

  initOptionChips('payment-type-chips', (val) => {
    paymentType = val
  })

  if (tableNumberWrap) tableNumberWrap.style.display = 'block'

  function updateReprintButton() {
    if (!reprintBtn) return
    reprintBtn.disabled = !localStorage.getItem(LAST_ORDER_KEY)
  }

  updateReprintButton()

  function formatPrice(n) {
    return `${n} جنيه`
  }

  function productImageHtml(p) {
    if (p.image) {
      return `<img class="product-card-img" src="${FP.imageUrl(p.image)}" alt="${p.name}">`
    }
    return '<div class="product-card-img placeholder">🍔</div>'
  }

  function getFilteredProducts() {
    if (activeCategory === 'الكل') return products
    return products.filter((p) => (p.category || 'عام') === activeCategory)
  }

  function renderCategoryFilters() {
    const cats = [
      'الكل',
      ...new Set([...FP.CATEGORIES, ...products.map((p) => p.category).filter(Boolean)])
    ]
    categoryFilters.innerHTML = cats
      .map(
        (c) =>
          `<button type="button" class="filter-chip${c === activeCategory ? ' active' : ''}" data-cat="${c}">${c}</button>`
      )
      .join('')

    categoryFilters.querySelectorAll('.filter-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat
        renderCategoryFilters()
        renderProducts()
      })
    })
  }

  function renderProducts() {
    const filtered = getFilteredProducts()
    if (!filtered.length) {
      productGrid.innerHTML = '<p class="empty-grid">لا توجد منتجات — أضف من صفحة المنتجات</p>'
      return
    }

    productGrid.innerHTML = filtered
      .map(
        (p) => `
    <div class="product-card">
      ${productImageHtml(p)}
      <span class="product-category-tag">${p.category || 'عام'}</span>
      <h3>${p.name}</h3>
      <span class="product-price">${formatPrice(p.price)}</span>
      <button class="btn" data-id="${p._id}">إضافة</button>
    </div>`
      )
      .join('')

    productGrid.querySelectorAll('button[data-id]').forEach((btn) => {
      btn.addEventListener('click', () => addToCart(btn.dataset.id))
    })
  }

  function addToCart(productId) {
    const product = products.find((p) => p._id === productId)
    if (!product) return
    const existing = cart.find((c) => c.productId === productId)
    if (existing) existing.quantity += 1
    else {
      cart.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: 1
      })
    }
    renderCart()
  }

  function updateQty(productId, delta) {
    const item = cart.find((c) => c.productId === productId)
    if (!item) return
    item.quantity += delta
    if (item.quantity <= 0) cart.splice(cart.indexOf(item), 1)
    renderCart()
  }

  function removeFromCart(productId) {
    const idx = cart.findIndex((c) => c.productId === productId)
    if (idx !== -1) cart.splice(idx, 1)
    renderCart()
  }

  function getTotal() {
    return cart.reduce((sum, c) => sum + c.price * c.quantity, 0)
  }

  function renderCart() {
    if (cart.length === 0) {
      cartItemsEl.innerHTML = '<p class="cart-empty">السلة فارغة</p>'
      confirmBtn.disabled = true
    } else {
      cartItemsEl.innerHTML = cart
        .map(
          (c) => `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${c.name}</div>
          <div class="cart-item-total">${formatPrice(c.price * c.quantity)}</div>
        </div>
        <div class="qty-controls">
          <button class="qty-btn" data-action="dec" data-id="${c.productId}">−</button>
          <span>${c.quantity}</span>
          <button class="qty-btn" data-action="inc" data-id="${c.productId}">+</button>
        </div>
        <button class="remove-btn" data-id="${c.productId}">×</button>
      </div>`
        )
        .join('')

      cartItemsEl.querySelectorAll('[data-action]').forEach((btn) => {
        btn.addEventListener('click', () => {
          updateQty(btn.dataset.id, btn.dataset.action === 'inc' ? 1 : -1)
        })
      })
      cartItemsEl.querySelectorAll('.remove-btn').forEach((btn) => {
        btn.addEventListener('click', () => removeFromCart(btn.dataset.id))
      })
      confirmBtn.disabled = false
    }
    cartTotalEl.textContent = formatPrice(getTotal())
  }

  function qrPayload(order) {
    return `FastPOS|#${order.orderNumber}|${order.total}|${order.cashierName}`
  }

  function formatSerial(order) {
    return String(order.orderNumber).padStart(12, '0')
  }

  function renderReceiptQR(order) {
    const qrEl = document.getElementById('qrcode')
    const serialEl = document.getElementById('receipt-serial')
    const serial = formatSerial(order)
    qrEl.innerHTML = ''
    if (serialEl) serialEl.textContent = serial
    if (!window.QRCode) return
    try {
      new window.QRCode(qrEl, { text: qrPayload(order), width: 200, height: 200 })
    } catch {
      qrEl.innerHTML = '<p class="qr-fallback">رمز غير متاح</p>'
    }
  }

  function orderMetaLine(order) {
    const parts = [
      `النوع: ${FP.labelOrderType(order.orderType)}`,
      `الدفع: ${FP.labelPayment(order.paymentType)}`
    ]
    if (order.tableNumber) parts.push(`طاولة: ${order.tableNumber}`)
    return parts.join(' · ')
  }

  async function showReceipt(order) {
    const date = new Date(order.createdAt)
    const settings = await FP.getSettings()
    document.getElementById('receipt-shop-name').textContent = FP.getShopName()
    const phoneEl = document.getElementById('receipt-shop-phone')
    const addrEl = document.getElementById('receipt-shop-address')
    phoneEl.textContent = settings.shopPhone ? `هاتف: ${settings.shopPhone}` : ''
    addrEl.textContent = settings.shopAddress || ''
    phoneEl.style.display = settings.shopPhone ? 'block' : 'none'
    addrEl.style.display = settings.shopAddress ? 'block' : 'none'
    document.getElementById('receipt-cashier').textContent = `الكاشير: ${order.cashierName}`
    document.getElementById('receipt-order-meta').textContent = orderMetaLine(order)
    document.getElementById('receipt-order-num').textContent = `طلب رقم #${order.orderNumber}`
    document.getElementById('receipt-datetime').textContent = date.toLocaleString('ar-EG')
    document.getElementById('receipt-items').innerHTML = order.items
      .map(
        (i) =>
          `<li><span>${i.name} × ${i.quantity}</span><span>${formatPrice(i.price * i.quantity)}</span></li>`
      )
      .join('')
    document.getElementById('receipt-total').textContent = formatPrice(order.total)
    renderReceiptQR(order)
    modal.classList.add('open')
  }

  function saveLastOrder(order) {
    localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order))
    updateReprintButton()
  }

  async function confirmOrder() {
    if (cart.length === 0) return
    const cashierName = cashierInput.value.trim()
    if (!cashierName) {
      cashierInput.focus()
      await FP.showError('اسم الكاشير مطلوب', 'يرجى إدخال اسم الكاشير قبل تأكيد الطلب')
      return
    }

    try {
      const order = await FP.createOrder({
        cashierName,
        paymentType,
        orderType,
        tableNumber: orderType === 'dinein' ? tableNumberInput?.value : '',
        items: cart.map((c) => ({
          productId: c.productId,
          name: c.name,
          price: c.price,
          quantity: c.quantity
        })),
        total: getTotal()
      })
      localStorage.setItem(CASHIER_KEY, cashierName)
      saveLastOrder(order)
      cart.length = 0
      renderCart()
      await showReceipt(order)
    } catch (err) {
      await FP.showError('فشل تأكيد الطلب', err.message)
    }
  }

  async function reprintLastOrder() {
    const raw = localStorage.getItem(LAST_ORDER_KEY)
    if (!raw) {
      FP.toastError('لا توجد فاتورة سابقة')
      return
    }
    try {
      await showReceipt(JSON.parse(raw))
    } catch {
      FP.toastError('تعذر قراءة آخر فاتورة')
    }
  }

  document.getElementById('confirm-btn').addEventListener('click', confirmOrder)
  reprintBtn?.addEventListener('click', reprintLastOrder)
  document.getElementById('close-btn').addEventListener('click', () => modal.classList.remove('open'))
  document.getElementById('print-btn').addEventListener('click', () => window.print())
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open')
  })

  FP.getProducts()
    .then((list) => {
      products = list
      renderCategoryFilters()
      renderProducts()
    })
    .catch(() => {
      productGrid.innerHTML = '<p>تعذر تحميل المنتجات من التخزين المحلي.</p>'
    })
})()
