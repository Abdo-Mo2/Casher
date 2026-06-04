const Product = require('../models/Product')

function imageFromUpload(req) {
  if (!req.file) return null
  if (req.file.buffer) {
    return `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
  }
  if (req.file.filename) return `/uploads/${req.file.filename}`
  return null
}

function parseProductBody(req) {
  return {
    name: req.body.name?.trim(),
    price: parseFloat(req.body.price),
    category: req.body.category?.trim() || 'عام'
  }
}

exports.getAll = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 })
    res.json(products)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getCategories = (req, res) => {
  res.json(['برجر', 'مشروبات', 'كومبو', 'بطاطس', 'إضافات', 'حلويات', 'دجاج', 'عام'])
}

exports.create = async (req, res) => {
  try {
    const data = parseProductBody(req)
    if (!data.name) return res.status(400).json({ message: 'اسم المنتج مطلوب' })
    if (Number.isNaN(data.price)) return res.status(400).json({ message: 'السعر غير صالح' })
    const image = imageFromUpload(req)
    if (image) data.image = image
    const product = await Product.create(data)
    res.status(201).json(product)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.update = async (req, res) => {
  try {
    const data = parseProductBody(req)
    if (!data.name) return res.status(400).json({ message: 'اسم المنتج مطلوب' })
    if (Number.isNaN(data.price)) return res.status(400).json({ message: 'السعر غير صالح' })
    const update = { name: data.name, price: data.price, category: data.category }
    const image = imageFromUpload(req)
    if (image) update.image = image
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json(product)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.remove = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
