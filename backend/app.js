const express = require('express')
const cors = require('cors')
const path = require('path')
const { connectDB } = require('./db')

const app = express()
app.use(cors())

app.use(async (req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (err) {
    res.status(500).json({ message: 'Database connection failed' })
  }
})

if (!process.env.VERCEL) {
  app.use(express.static(path.join(__dirname, '../frontend')))
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
}

app.use('/api/products', require('./routes/products'))
app.use('/api/orders', express.json(), require('./routes/orders'))

module.exports = app
