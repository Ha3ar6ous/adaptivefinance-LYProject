const DailyIncomeEntry = require('../models/DailyIncomeEntry')
const IncomeAnalytics = require('../models/IncomeAnalytics')
const User = require('../models/User')
const { generateAiExplanationForUser } = require('../services/aiExplanationService')
const { buildDecisionRouter } = require('../services/decisionRouterService')
const { calculateHealthScore } = require('../services/healthScoreService')
const { refreshInvestmentSuggestionForUser } = require('../services/investmentEngineService')
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

const refreshAiSafely = async (userId) => {
  try {
    await generateAiExplanationForUser(userId)
  } catch (err) {
    console.error('AI explanation refresh failed', err.message)
  }
}

const runAnalyticsForUser = async (userId) => {
  const entries = await DailyIncomeEntry.find({ userId }).sort({ date: 1 })
  const user = await User.findById(userId).lean()
  const now = new Date()

  if (entries.length < 3) {
    const baseAnalytics = {
      forecast: {
        horizon: 15,
        points: [],
        method: 'insufficient_data',
        note: 'Add at least 3 income entries to generate analytics.',
      },
      volatility: {
        label: 'unknown',
        score: 0,
        features: { entryCount: entries.length },
        note: 'At least 3 income entries are needed for volatility.',
      },
    }
    const health = calculateHealthScore({
      user: user || {},
      entries,
      analytics: baseAnalytics,
    })
    const router = buildDecisionRouter({
      user: user || {},
      health,
      analytics: baseAnalytics,
    })

    const analytics = await IncomeAnalytics.findOneAndUpdate(
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
          generatedAt: now,
        },
        volatility: {
          label: 'unknown',
          score: 0,
          features: { entryCount: entries.length },
          note: 'At least 3 income entries are needed for volatility.',
          generatedAt: now,
        },
        health: {
          ...health,
          generatedAt: now,
        },
        router: {
          ...router,
          generatedAt: now,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )
    await refreshInvestmentSuggestionForUser(userId)
    await refreshAiSafely(userId)
    return analytics
  }

  try {
    const result = await analyzeIncome(userId, entries)
    const health = calculateHealthScore({
      user: user || {},
      entries,
      analytics: result,
    })
    const router = buildDecisionRouter({
      user: user || {},
      health,
      analytics: result,
    })

    const analytics = await IncomeAnalytics.findOneAndUpdate(
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
        health: {
          ...health,
          generatedAt: now,
        },
        router: {
          ...router,
          generatedAt: now,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )
    await refreshInvestmentSuggestionForUser(userId)
    await refreshAiSafely(userId)
    return analytics
  } catch (err) {
    const baseAnalytics = {
      forecast: {
        horizon: 15,
        points: [],
        method: 'error',
        note: 'ML service unavailable.',
      },
      volatility: {
        label: 'unknown',
        score: 0,
        features: { entryCount: entries.length },
        note: 'ML service unavailable.',
      },
    }
    const health = calculateHealthScore({
      user: user || {},
      entries,
      analytics: baseAnalytics,
    })
    const router = buildDecisionRouter({
      user: user || {},
      health,
      analytics: baseAnalytics,
    })

    const analytics = await IncomeAnalytics.findOneAndUpdate(
      { userId },
      {
        userId,
        entryCount: entries.length,
        status: 'error',
        error: err.message,
        forecast: {
          ...(baseAnalytics.forecast || {}),
          generatedAt: now,
        },
        volatility: {
          ...(baseAnalytics.volatility || {}),
          generatedAt: now,
        },
        health: {
          ...health,
          generatedAt: now,
        },
        router: {
          ...router,
          generatedAt: now,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )
    await refreshInvestmentSuggestionForUser(userId)
    await refreshAiSafely(userId)
    return analytics
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

exports.getChartData = async (req, res) => {
  try {
    const [entries, analytics] = await Promise.all([
      DailyIncomeEntry.find({ userId: req.user.id }).sort({ date: 1 }).lean(),
      IncomeAnalytics.findOne({ userId: req.user.id }).lean(),
    ])

    const history = entries.map((entry) => ({
      date: new Date(entry.date).toISOString().split('T')[0],
      income: entry.income,
      hours_worked: entry.hours_worked,
      orders_completed: entry.orders_completed,
      platform: entry.platform,
    }))

    return res.json({
      history,
      forecast: analytics?.forecast?.points || [],
      volatility: {
        label: analytics?.volatility?.label || 'unknown',
        score: analytics?.volatility?.score || 0,
        features: analytics?.volatility?.features || {},
      },
      health: {
        score: analytics?.health?.score || 0,
        phase: analytics?.health?.phase || 'crisis',
        factors: analytics?.health?.factors || {},
      },
      router: analytics?.router || { summary: '', actions: [] },
    })
  } catch (err) {
    console.error('getChartData', err)
    return res.status(500).json({ message: 'Server error' })
  }
}
