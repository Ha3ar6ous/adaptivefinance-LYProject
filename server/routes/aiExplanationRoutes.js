const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const {
  getMyExplanation,
  runMyExplanation,
} = require('../controllers/aiExplanationController')

router.get('/explanation/me', authMiddleware, getMyExplanation)
router.post('/explanation/run', authMiddleware, runMyExplanation)

module.exports = router

