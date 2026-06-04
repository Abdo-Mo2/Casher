window.FastPOS = window.FastPOS || {}

;(function () {
  const FP = window.FastPOS
  const DB_NAME = 'fastpos'
  const DB_VERSION = 1
  let mode = null
  let dbPromise = null

  const LS = {
    products: () => JSON.parse(localStorage.getItem('fp_products') || '[]'),
    orders: () => JSON.parse(localStorage.getItem('fp_orders') || '[]'),
    orderNum: () => parseInt(localStorage.getItem('fp_order_num') || '0', 10),
    setProducts: (v) => localStorage.setItem('fp_products', JSON.stringify(v)),
    setOrders: (v) => localStorage.setItem('fp_orders', JSON.stringify(v)),
    setOrderNum: (v) => localStorage.setItem('fp_order_num', String(v))
  }

  function uid() {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }

  function openDB() {
    if (mode === 'ls') return Promise.reject(new Error('using localStorage'))
    if (dbPromise) return dbPromise
    dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('no idb'))
        return
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = (e) => {
        const db = e.target.result
        if (!db.objectStoreNames.contains('products')) db.createObjectStore('products', { keyPath: '_id' })
        if (!db.objectStoreNames.contains('orders')) db.createObjectStore('orders', { keyPath: '_id' })
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' })
      }
      req.onsuccess = () => {
        mode = 'idb'
        resolve(req.result)
      }
      req.onerror = () => reject(req.error)
    })
    return dbPromise
  }

  try {
    openDB().catch(() => {
      mode = 'ls'
    })
  } catch {
    mode = 'ls'
  }

  function tx(store, m) {
    return openDB().then((db) => db.transaction(store, m).objectStore(store))
  }

  function idbGetAll(store) {
    return tx(store, 'readonly').then(
      (s) =>
        new Promise((res, rej) => {
          const r = s.getAll()
          r.onsuccess = () => res(r.result)
          r.onerror = () => rej(r.error)
        })
    )
  }

  function idbPut(store, item) {
    return tx(store, 'readwrite').then(
      (s) =>
        new Promise((res, rej) => {
          const r = s.put(item)
          r.onsuccess = () => res(item)
          r.onerror = () => rej(r.error)
        })
    )
  }

  function idbRemove(store, id) {
    return tx(store, 'readwrite').then(
      (s) =>
        new Promise((res, rej) => {
          const r = s.delete(id)
          r.onsuccess = () => res()
          r.onerror = () => rej(r.error)
        })
    )
  }

  async function ensureMode() {
    if (mode) return mode
    if (!window.indexedDB) {
      mode = 'ls'
      return mode
    }
    try {
      await Promise.race([
        openDB(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('idb timeout')), 2500))
      ])
      mode = 'idb'
    } catch {
      mode = 'ls'
      dbPromise = null
    }
    return mode
  }

  async function getAll(store) {
    await ensureMode()
    if (mode === 'ls') {
      return store === 'products' ? LS.products() : store === 'orders' ? LS.orders() : []
    }
    return idbGetAll(store)
  }

  async function put(store, item) {
    await ensureMode()
    if (mode === 'ls') {
      if (store === 'products') {
        const list = LS.products()
        const i = list.findIndex((x) => x._id === item._id)
        if (i >= 0) list[i] = item
        else list.push(item)
        LS.setProducts(list)
      } else if (store === 'orders') {
        const list = LS.orders()
        list.push(item)
        LS.setOrders(list)
      }
      return item
    }
    return idbPut(store, item)
  }

  async function remove(store, id) {
    await ensureMode()
    if (mode === 'ls') {
      if (store === 'products') {
        LS.setProducts(LS.products().filter((x) => x._id !== id))
      }
      return
    }
    return idbRemove(store, id)
  }

  async function getMeta(key) {
    await ensureMode()
    if (mode === 'ls') {
      return key === 'orderNumber' ? LS.orderNum() : null
    }
    return tx('meta', 'readonly').then(
      (s) =>
        new Promise((res, rej) => {
          const r = s.get(key)
          r.onsuccess = () => res(r.result?.value ?? null)
          r.onerror = () => rej(r.error)
        })
    )
  }

  async function setMeta(key, value) {
    await ensureMode()
    if (mode === 'ls') {
      if (key === 'orderNumber') LS.setOrderNum(value)
      return
    }
    return idbPut('meta', { key, value })
  }

  FP.getCategoryList = () => [...FP.CATEGORIES]

  FP.getProducts = async () => {
    const list = await getAll('products')
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  FP.saveProduct = async (data, id = null) => {
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

  FP.deleteProduct = async (id) => {
    await remove('products', id)
    return { message: 'Deleted' }
  }

  FP.getOrders = async (limit = 0) => {
    const list = await getAll('orders')
    const sorted = list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return limit > 0 ? sorted.slice(0, limit) : sorted
  }

  FP.createOrder = async (data) => {
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

  FP.getStats = async () => {
    const orders = await getAll('orders')
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    let todayCount = 0
    let todayRevenue = 0
    const totalCount = orders.length
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

  FP.fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
})()
