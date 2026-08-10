const AiExplanation = require('../models/AiExplanation')
const { generateAiExplanationForUser } = require('../services/aiExplanationService')

exports.getMyExplanation = async (req, res) => {
  try {
    const explanation = await AiExplanation.findOne({ userId: req.user.id })
    return res.json({ explanation })
  } catch (err) {
    console.error('getMyExplanation', err)
    return res.status(500).json({ message: 'Server error' })
  }
}

exports.runMyExplanation = async (req, res) => {
  try {
    const explanation = await generateAiExplanationForUser(req.user.id, {
      forceFallback: req.query.fallback === '1',
    })
    return res.json({ explanation })
  } catch (err) {
    console.error('runMyExplanation', err)
    return res.status(500).json({ message: 'Server error' })
  }
}

