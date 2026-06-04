const router = require('express').Router()
const ctrl = require('../controllers/orders.controller')

router.get('/stats', ctrl.getStats)
router.get('/', ctrl.getAll)
router.post('/', ctrl.create)

module.exports = router
