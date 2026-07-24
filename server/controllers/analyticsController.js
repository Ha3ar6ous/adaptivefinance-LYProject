const DailyIncomeEntry = require('../models/DailyIncomeEntry')
const IncomeAnalytics = require('../models/IncomeAnalytics')
const { analyzeIncome } = require('../services/mlService')

const buildStatus = (entries, result) => {
  if (entries.length < 3) {
    return 'insufficient_data'
  }
  if (!result?.forecast?.points?.length) {
    return 'insufficient_data'
  }
  return 'ready'
}

const runAnalyticsForUser = async (userId) => {
  const entries = await DailyIncomeEntry.find({ userId }).sort({ date: 1 })

  if (entries.length < 3) {
    return IncomeAnalytics.findOneAndUpdate(
      { userId },
      {
        userId,
        entryCount: entries.length,
        status: 'insufficient_data',
        error: '',
        forecast: {
          horizon: 15,
          points: [],
          method: 'insufficient_data',
          note: 'Add at least 3 income entries to generate analytics.',
          generatedAt: new Date(),
        },
        volatility: {
          label: 'unknown',
          score: 0,
          features: { entryCount: entries.length },
          note: 'At least 3 income entries are needed for volatility.',
          generatedAt: new Date(),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )
  }

  try {
    const result = await analyzeIncome(userId, entries)
    const now = new Date()
    return IncomeAnalytics.findOneAndUpdate(
      { userId },
      {
        userId,
        entryCount: entries.length,
        status: buildStatus(entries, result),
        error: '',
        forecast: {
          ...(result.forecast || {}),
          generatedAt: now,
        },
        volatility: {
          ...(result.volatility || {}),
          generatedAt: now,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )
  } catch (err) {
    return IncomeAnalytics.findOneAndUpdate(
      { userId },
      {
        userId,
        entryCount: entries.length,
        status: 'error',
        error: err.message,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )
  }
}

exports.runAnalyticsForUser = runAnalyticsForUser

exports.runMyAnalytics = async (req, res) => {
  try {
    const analytics = await runAnalyticsForUser(req.user.id)
    return res.json({ analytics })
  } catch (err) {
    console.error('runMyAnalytics', err)
    return res.status(500).json({ message: 'Server error' })
  }
}

exports.getMyAnalytics = async (req, res) => {
  try {
    const analytics = await IncomeAnalytics.findOne({ userId: req.user.id })
    return res.json({ analytics })
  } catch (err) {
    console.error('getMyAnalytics', err)
    return res.status(500).json({ message: 'Server error' })
  }
}

