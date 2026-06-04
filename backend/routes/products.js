const router = require('express').Router()
const express = require('express')
const upload = require('../middleware/upload')
const ctrl = require('../controllers/products.controller')

const jsonParser = express.json()

const parseBody = (req, res, next) => {
  const type = req.headers['content-type'] || ''
  if (type.includes('multipart/form-data')) {
    return upload.single('image')(req, res, next)
  }
  return jsonParser(req, res, next)
}

router.get('/categories', ctrl.getCategories)
router.get('/', ctrl.getAll)
router.post('/', parseBody, ctrl.create)
router.put('/:id', parseBody, ctrl.update)
router.delete('/:id', ctrl.remove)

module.exports = router
