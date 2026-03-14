const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const {
  createOrUpdateEntry,
  getUserEntries,
  exportCsv,
} = require('../controllers/dataController')

router.post('/entry', authMiddleware, createOrUpdateEntry)
router.get('/user', authMiddleware, getUserEntries)
router.get('/export', authMiddleware, exportCsv)

module.exports = router
