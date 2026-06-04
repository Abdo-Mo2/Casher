const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
  orderNumber: { type: Number },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number
  }],
  total: { type: Number, required: true },
  cashierName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
})

orderSchema.pre('save', async function () {
  if (!this.isNew) return
  const last = await mongoose.model('Order').findOne().sort({ orderNumber: -1 }).select('orderNumber')
  this.orderNumber = last ? last.orderNumber + 1 : 1
})

module.exports = mongoose.model('Order', orderSchema)
