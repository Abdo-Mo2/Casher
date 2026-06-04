const multer = require('multer')
const path = require('path')
const fs = require('fs')

const isServerless = process.env.VERCEL === '1'

const fileFilter = (req, file, cb) => {
  const allowed = /\.(jpe?g|png|webp|gif)$/i
  cb(null, allowed.test(path.extname(file.originalname)))
}

let storage
if (isServerless) {
  storage = multer.memoryStorage()
} else {
  const uploadDir = path.join(__dirname, '../uploads')
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
  storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase()
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`)
    }
  })
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
})

module.exports = upload
