const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') })

module.exports = require('../backend/app')
