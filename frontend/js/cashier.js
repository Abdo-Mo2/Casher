import { getProducts, createOrder, imageUrl } from './api.js'
import { CATEGORIES } from './categories.js'
import { showError } from './alerts.js'

const CASHIER_KEY = 'fastpos_cashier_name'
const cart = []
let products = []
let activeCategory = 'الكل'

const productGrid = document.getElementById('product-grid')
const categoryFilters = document.getElementById('category-filters')
const cartItemsEl = document.getElementById('cart-items')
const cartTotalEl = document.getElementById('cart-total')
const confirmBtn = document.getElementById('confirm-btn')
const cashierInput = document.getElementById('cashier-name')
const modal = document.getElementById('receipt-modal')

const savedCashier = localStorage.getItem(CASHIER_KEY)
if (savedCashier) cashierInput.value = savedCashier

cashierInput.addEventListener('input', () => {
  localStorage.setItem(CASHIER_KEY, cashierInput.value.trim())
})

function formatPrice(n) {
  return `${n} جنيه`
}

function productImageHtml(p) {
  if (p.image) {
    return `<img class="product-card-img" src="${imageUrl(p.image)}" alt="${p.name}">`
  }
  return '<div class="product-card-img placeholder">🍔</div>'
}

function getFilteredProducts() {
  if (activeCategory === 'الكل') return products
  return products.filter((p) => (p.category || 'عام') === activeCategory)
}

function renderCategoryFilters() {
  const cats = ['الكل', ...new Set([...CATEGORIES, ...products.map((p) => p.category).filter(Boolean)])]
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
    productGrid.innerHTML = '<p class="empty-grid">لا توجد منتجات في هذه الفئة</p>'
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
  if (existing) {
    existing.quantity += 1
  } else {
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
  if (item.quantity <= 0) {
    const idx = cart.indexOf(item)
    cart.splice(idx, 1)
  }
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

function getCashierName() {
  return cashierInput.value.trim()
}

async function confirmOrder() {
  if (cart.length === 0) return

  const cashierName = getCashierName()
  if (!cashierName) {
    cashierInput.focus()
    await showError('اسم الكاشير مطلوب', 'يرجى إدخال اسم الكاشير قبل تأكيد الطلب')
    return
  }

  const orderData = {
    cashierName,
    items: cart.map((c) => ({
      productId: c.productId,
      name: c.name,
      price: c.price,
      quantity: c.quantity
    })),
    total: getTotal()
  }

  try {
    const order = await createOrder(orderData)
    localStorage.setItem(CASHIER_KEY, cashierName)
    cart.length = 0
    renderCart()
    await showReceipt(order)
  } catch (err) {
    const hint =
      window.location.protocol === 'file:'
        ? 'افتح الموقع من: http://localhost:5000'
        : ''
    await showError('فشل تأكيد الطلب', `${err.message}${hint ? '\n' + hint : ''}`)
  }
}

let QRCodeLib = null

async function loadQRCode() {
  if (!QRCodeLib) {
    QRCodeLib = (await import('https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm')).default
  }
  return QRCodeLib
}

async function showReceipt(order) {
  const date = new Date(order.createdAt)
  document.getElementById('receipt-cashier').textContent = `الكاشير: ${order.cashierName}`
  document.getElementById('receipt-order-num').textContent = `طلب رقم #${order.orderNumber}`
  document.getElementById('receipt-datetime').textContent = date.toLocaleString('ar-EG')
  document.getElementById('receipt-items').innerHTML = order.items
    .map(
      (i) =>
        `<li><span>${i.name} × ${i.quantity}</span><span>${formatPrice(i.price * i.quantity)}</span></li>`
    )
    .join('')
  document.getElementById('receipt-total').textContent = formatPrice(order.total)

  const qrEl = document.getElementById('qrcode')
  qrEl.innerHTML = ''
  try {
    const QRCode = await loadQRCode()
    const canvas = document.createElement('canvas')
    qrEl.appendChild(canvas)
    await QRCode.toCanvas(canvas, JSON.stringify(order), { width: 150 })
  } catch {
    qrEl.innerHTML = '<p style="font-size:0.85rem;color:#999;text-align:center">تعذر إنشاء QR</p>'
  }

  modal.classList.add('open')
}

document.getElementById('confirm-btn').addEventListener('click', confirmOrder)
document.getElementById('close-btn').addEventListener('click', () => modal.classList.remove('open'))
document.getElementById('print-btn').addEventListener('click', () => window.print())
modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.classList.remove('open')
})

async function init() {
  try {
    products = await getProducts()
    renderCategoryFilters()
    renderProducts()
  } catch {
    productGrid.innerHTML = '<p>تعذر تحميل المنتجات. تأكد من تشغيل السيرفر.</p>'
  }
}

init()
