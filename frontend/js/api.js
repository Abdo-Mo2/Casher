import * as db from './db.js'

export const imageUrl = (src) => {
  if (!src) return ''
  if (src.startsWith('data:') || src.startsWith('http')) return src
  return src
}

export const getProducts = () => db.getProducts()
export const getCategories = () => Promise.resolve(db.getCategoryList())

export const saveProduct = (data, id = null) => db.saveProduct(data, id)

export const saveProductForm = async (formData, id = null) => {
  const data = {
    name: formData.get('name')?.trim(),
    price: parseFloat(formData.get('price')),
    category: formData.get('category') || 'عام'
  }
  const file = formData.get('image')
  if (file && file.size > 0) {
    data.image = await db.fileToDataUrl(file)
  }
  return db.saveProduct(data, id || null)
}

export const deleteProduct = (id) => db.deleteProduct(id)
export const createOrder = (data) => db.createOrder(data)
export const getOrders = (limit = 20) => db.getOrders(limit)
export const getStats = () => db.getStats()
