require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const app = require('./app')
const { connectDB } = require('./db')

connectDB()
  .then(() => app.listen(process.env.PORT || 5000, () => console.log('Server running')))
  .catch((err) => console.error('MongoDB connection error:', err))
