import { CATEGORIES } from './categories.js'

const DB_NAME = 'fastpos'
const DB_VERSION = 1

let dbPromise = null

function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('المتصفح لا يدعم التخزين المحلي'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: '_id' })
      }
      if (!db.objectStoreNames.contains('orders')) {
        db.createObjectStore('orders', { keyPath: '_id' })
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx(store, mode) {
  return openDB().then((db) => db.transaction(store, mode).objectStore(store))
}

function getAll(store) {
  return tx(store, 'readonly').then(
    (s) =>
      new Promise((resolve, reject) => {
        const req = s.getAll()
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
  )
}

function put(store, item) {
  return tx(store, 'readwrite').then(
    (s) =>
      new Promise((resolve, reject) => {
        const req = s.put(item)
        req.onsuccess = () => resolve(item)
        req.onerror = () => reject(req.error)
      })
  )
}

function remove(store, id) {
  return tx(store, 'readwrite').then(
    (s) =>
      new Promise((resolve, reject) => {
        const req = s.delete(id)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
  )
}

function getMeta(key) {
  return tx('meta', 'readonly').then(
    (s) =>
      new Promise((resolve, reject) => {
        const req = s.get(key)
        req.onsuccess = () => resolve(req.result?.value ?? null)
        req.onerror = () => reject(req.error)
      })
  )
}

function setMeta(key, value) {
  return put('meta', { key, value })
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function getCategoryList() {
  return [...CATEGORIES]
}

export async function getProducts() {
  const list = await getAll('products')
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function saveProduct(data, id = null) {
  const products = await getAll('products')
  const existing = id ? products.find((p) => p._id === id) : null
  const product = {
    _id: id || uid(),
    name: data.name,
    price: Number(data.price),
    category: data.category || 'عام',
    image: data.image ?? existing?.image ?? '',
    createdAt: existing?.createdAt || new Date().toISOString()
  }
  if (!product.name?.trim()) throw new Error('اسم المنتج مطلوب')
  if (Number.isNaN(product.price)) throw new Error('السعر غير صالح')
  await put('products', product)
  return product
}

export async function deleteProduct(id) {
  await remove('products', id)
  return { message: 'Deleted' }
}

export async function getOrders(limit = 0) {
  const list = await getAll('orders')
  const sorted = list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return limit > 0 ? sorted.slice(0, limit) : sorted
}

export async function createOrder(data) {
  const cashierName = data.cashierName?.trim()
  if (!cashierName) throw new Error('اسم الكاشير مطلوب')
  if (!data.items?.length) throw new Error('السلة فارغة')

  let orderNumber = await getMeta('orderNumber')
  orderNumber = (orderNumber || 0) + 1
  await setMeta('orderNumber', orderNumber)

  const order = {
    _id: uid(),
    orderNumber,
    cashierName,
    items: data.items,
    total: data.total,
    createdAt: new Date().toISOString()
  }
  await put('orders', order)
  return order
}

export async function getStats() {
  const orders = await getAll('orders')
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  let todayCount = 0
  let todayRevenue = 0
  let totalCount = orders.length
  let totalRevenue = 0

  const dailyMap = {}

  orders.forEach((o) => {
    const d = new Date(o.createdAt)
    totalRevenue += o.total
    if (d >= startOfToday) {
      todayCount += 1
      todayRevenue += o.total
    }
    const key = d.toISOString().slice(0, 10)
    if (d >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)) {
      if (!dailyMap[key]) dailyMap[key] = { count: 0, revenue: 0 }
      dailyMap[key].count += 1
      dailyMap[key].revenue += o.total
    }
  })

  const daily = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    daily.push({
      date: key,
      count: dailyMap[key]?.count || 0,
      revenue: dailyMap[key]?.revenue || 0
    })
  }

  return { todayCount, todayRevenue, totalCount, totalRevenue, daily }
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
