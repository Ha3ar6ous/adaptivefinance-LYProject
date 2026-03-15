const express = require('express')
const router = express.Router()
const { signup, login, getProfile, completeOnboarding } = require('../controllers/authController')
const authMiddleware = require('../middleware/authMiddleware')

router.post('/signup', signup)
router.post('/login', login)
router.get('/profile', authMiddleware, getProfile)
router.post('/onboarding', authMiddleware, completeOnboarding)

module.exports = router
