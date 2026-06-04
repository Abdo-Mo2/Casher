const BASE = `${window.location.origin}/api`

async function request(url, options = {}) {
  const res = await fetch(url, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || res.statusText)
  return data
}

export const imageUrl = (src) => {
  if (!src) return ''
  if (src.startsWith('data:') || src.startsWith('http')) return src
  return `${window.location.origin}${src}`
}

export const getProducts = () => request(`${BASE}/products`)
export const getCategories = () => request(`${BASE}/products/categories`)

export const saveProductForm = (formData, id = null) => {
  const url = id ? `${BASE}/products/${id}` : `${BASE}/products`
  const method = id ? 'PUT' : 'POST'
  return request(url, { method, body: formData })
}

export const saveProduct = (data, id = null) => {
  const url = id ? `${BASE}/products/${id}` : `${BASE}/products`
  const method = id ? 'PUT' : 'POST'
  return request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

export const deleteProduct = (id) =>
  request(`${BASE}/products/${id}`, { method: 'DELETE' })

export const createOrder = (data) =>
  request(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
export const getOrders = (limit = 20) => request(`${BASE}/orders?limit=${limit}`)
export const getStats = () => request(`${BASE}/orders/stats`)
