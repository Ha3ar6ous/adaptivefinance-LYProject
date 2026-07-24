const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const {
  getMyAnalytics,
  runMyAnalytics,
} = require('../controllers/analyticsController')

router.get('/me', authMiddleware, getMyAnalytics)
router.post('/run', authMiddleware, runMyAnalytics)

module.exports = router

