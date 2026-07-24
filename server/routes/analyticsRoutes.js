const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const {
  getChartData,
  getMyAnalytics,
  runMyAnalytics,
} = require('../controllers/analyticsController')

router.get('/me', authMiddleware, getMyAnalytics)
router.get('/charts', authMiddleware, getChartData)
router.post('/run', authMiddleware, runMyAnalytics)

module.exports = router
