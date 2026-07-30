const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const {
  getMyInvestmentSuggestion,
  runMyInvestmentSuggestion,
} = require('../controllers/investmentController')

router.get('/me', authMiddleware, getMyInvestmentSuggestion)
router.post('/run', authMiddleware, runMyInvestmentSuggestion)

module.exports = router

