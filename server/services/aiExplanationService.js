const AiExplanation = require('../models/AiExplanation')
const IncomeAnalytics = require('../models/IncomeAnalytics')
const InvestmentSuggestion = require('../models/InvestmentSuggestion')
const User = require('../models/User')
const { callGroqJson } = require('./groqService')

const money = (value) => `Rs ${Math.round(Number(value || 0)).toLocaleString('en-IN')}`

const balanceBucket = (user = {}) => {
  const expenses = Math.max(Number(user.monthlyExpenses || 0), 1)
  const months = Number(user.bankBalance || 0) / expenses
  if (months < 1) return 'below 1 month of expenses'
  if (months < 3) return '1-3 months of expenses'
  return '3+ months of expenses'
}

const weakestFactors = (factors = {}) =>
  Object.entries(factors)
    .map(([key, value]) => ({
      key,
      score: Math.round(Number(value?.value || 0)),
      detail: value?.detail || '',
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)

const factorLabel = (key = '') =>
  ({
    liquidity: 'cash buffer',
    debtSafety: 'debt pressure',
    incomeStability: 'income stability',
    forecastTrend: 'forecast trend',
    dataConsistency: 'tracking consistency',
  })[key] || key

const forecastDirection = (snapshot) => {
  const horizon = Math.max(Number(snapshot.forecast.horizon || 1), 1)
  const forecastDaily = Number(snapshot.forecast.total || 0) / horizon
  const forecastAverage = Number(snapshot.forecast.average || 0)
  if (!forecastDaily || !forecastAverage) return 'unknown'
  if (forecastDaily > forecastAverage * 1.08) return 'improving'
  if (forecastDaily < forecastAverage * 0.92) return 'softening'
  return 'steady'
}

const buildSnapshot = async (userId) => {
  const [user, analytics, investment] = await Promise.all([
    User.findById(userId).select('bankBalance monthlyExpenses debts investments riskPreference').lean(),
    IncomeAnalytics.findOne({ userId }).lean(),
    InvestmentSuggestion.findOne({ userId }).lean(),
  ])

  const forecastPoints = analytics?.forecast?.points || []
  const forecastTotal = forecastPoints.reduce((sum, point) => sum + Number(point.income || 0), 0)
  const forecastAverage = forecastPoints.length ? forecastTotal / forecastPoints.length : 0
  const topSuggestion = investment?.suggestions?.[0]

  return {
    health: {
      score: analytics?.health?.score || 0,
      phase: analytics?.health?.phase || 'crisis',
      weakFactors: weakestFactors(analytics?.health?.factors),
    },
    router: {
      summary: analytics?.router?.summary || '',
      actions: (analytics?.router?.actions || []).map((action) => ({
        label: action.label,
        allowed: Boolean(action.allowed),
        reason: action.reason,
      })),
    },
    forecast: {
      horizon: analytics?.forecast?.horizon || forecastPoints.length || 0,
      total: Math.round(forecastTotal),
      average: Math.round(forecastAverage),
      method: analytics?.forecast?.method || 'unknown',
      note: analytics?.forecast?.note || '',
    },
    volatility: {
      label: analytics?.volatility?.label || 'unknown',
      cv: analytics?.volatility?.features?.coefficientOfVariation ?? null,
    },
    investment: {
      eligible: Boolean(investment?.eligible),
      investableAmount: investment?.investableAmount || 0,
      blockedReason: investment?.blockedReason || '',
      topSuggestion: topSuggestion
        ? {
            name: topSuggestion.name,
            allocationAmount: topSuggestion.allocationAmount,
            riskLevel: topSuggestion.riskLevel,
            liquidity: topSuggestion.liquidity,
            projection: topSuggestion.projection,
            reasonTags: topSuggestion.reasonTags || [],
          }
        : null,
    },
    userContext: {
      balanceBucket: balanceBucket(user),
      monthlyExpenses: Number(user?.monthlyExpenses || 0),
      debt: Number(user?.debts || 0),
      riskPreference: user?.riskPreference || 'low',
    },
  }
}

const fallbackFromSnapshot = (snapshot, error = '') => {
  const score = snapshot.health.score
  const invest = snapshot.investment
  const blockedAction = snapshot.router.actions.find((action) => !action.allowed)
  const allowedAction = snapshot.router.actions.find((action) => action.allowed)
  const weak = snapshot.health.weakFactors[0]
  const secondWeak = snapshot.health.weakFactors[1]
  const direction = forecastDirection(snapshot)
  const tone = score >= 80 ? 'growth' : score >= 60 ? 'safe' : 'caution'
  const nextAction = invest.eligible
    ? `Since things are looking stable, a great first step is putting ${money(invest.topSuggestion?.allocationAmount)} into ${invest.topSuggestion?.name}.`
    : blockedAction?.reason || allowedAction?.reason || 'Let\'s keep tracking your income and focus on building up that safety buffer first!'
  
  const watchOut =
    snapshot.volatility.label === 'high'
      ? 'Your income has been bouncing up and down lately. It\'s best to keep your money easily accessible (liquid) and avoid locking too much away at once.'
      : direction === 'softening'
        ? 'It looks like your earnings might dip a bit soon. Let\'s hold off on any new fixed expenses for now to stay safe.'
        : 'Keep logging your daily income! The more you track, the better guidance I can give you.'

  return {
    overview: {
      headline: score >= 70 ? 'You are doing great! Your money plan is looking solid.' : 'Let\'s focus on protecting your cash flow right now.',
      summary: `With a score of ${score}, you're currently in the ${snapshot.health.phase} phase. Your main focus area should be ${factorLabel(weak?.key || 'dataConsistency')}, especially since your income volatility is ${snapshot.volatility.label}. Don't worry, we'll take it one step at a time!`,
      nextAction,
    },
    healthInsight: secondWeak
      ? `If we can improve your ${factorLabel(weak?.key)} and ${factorLabel(secondWeak.key)}, it will give you a lot more breathing room. Focusing here will help much more than chasing high returns right now.`
      : `Your overall health score is ${score}. The biggest thing holding you back is ${factorLabel(weak?.key || 'dataConsistency')}, so let's work on that first.`,
    forecastInsight: snapshot.forecast.total
      ? `Based on recent trends, your ${snapshot.forecast.horizon}-day forecast looks to be around ${money(snapshot.forecast.total)}, which is ${direction}. It's a good idea to use this projection to plan your upcoming expenses safely.`
      : 'Once you add a few more days of income, I\'ll be able to forecast your upcoming earnings!',
    decisionInsight: blockedAction
      ? `Right now, it's safer to pause on ${blockedAction.label.toLowerCase()} because ${blockedAction.reason.toLowerCase()}.`
      : snapshot.router.summary || 'As your profile improves, more financial actions will safely unlock for you.',
    investmentInsight: invest.eligible
      ? `Good news! ${invest.topSuggestion?.name} is a great match for you right now: ${money(invest.topSuggestion?.allocationAmount)} monthly, with ${invest.topSuggestion?.liquidity || 'matched'} liquidity.`
      : invest.blockedReason || 'I\'ll suggest some safe investments once we get your emergency buffer built up.',
    reasons: [
      `${factorLabel(weak?.key || 'dataConsistency')} needs some attention`,
      `Your earnings trend is currently ${direction}`,
      invest.eligible ? 'You are in a safe position to start investing' : 'We need to focus on safety before investing',
    ],
    actionPlan: [
      {
        title: invest.eligible ? 'Start small with investing' : 'Focus on the basics',
        detail: nextAction,
      },
      {
        title: 'Protect your cash flow',
        detail: watchOut,
      },
    ],
    watchOut,
    tone,
    status: error ? 'fallback' : 'ready',
    error,
  }
}

const validateExplanation = (value) => {
  const required = ['healthInsight', 'forecastInsight', 'decisionInsight', 'investmentInsight']
  if (!value?.overview?.headline || !value?.overview?.summary || !value?.overview?.nextAction) {
    throw new Error('Missing overview fields')
  }
  required.forEach((field) => {
    if (!value[field] || typeof value[field] !== 'string') {
      throw new Error(`Missing ${field}`)
    }
  })
  if (!Array.isArray(value.reasons)) {
    throw new Error('Missing reasons')
  }
  if (!['safe', 'caution', 'growth'].includes(value.tone)) {
    value.tone = 'caution'
  }
  return {
    overview: {
      headline: String(value.overview.headline).slice(0, 150),
      summary: String(value.overview.summary).slice(0, 300),
      nextAction: String(value.overview.nextAction).slice(0, 200),
    },
    healthInsight: String(value.healthInsight).slice(0, 250),
    forecastInsight: String(value.forecastInsight).slice(0, 250),
    decisionInsight: String(value.decisionInsight).slice(0, 250),
    investmentInsight: String(value.investmentInsight).slice(0, 250),
    reasons: value.reasons.slice(0, 3).map((reason) => String(reason).slice(0, 160)),
    actionPlan: Array.isArray(value.actionPlan)
      ? value.actionPlan.slice(0, 2).map((item) => ({
          title: String(item?.title || 'Next step').slice(0, 80),
          detail: String(item?.detail || '').slice(0, 200),
        }))
      : [],
    watchOut: String(value.watchOut || '').slice(0, 200),
    tone: value.tone,
  }
}

const systemPrompt = [
  'You are a friendly, empathetic, and encouraging financial assistant for Indian gig workers.',
  'Use only the JSON values provided. Do not calculate new numbers or invent products.',
  'Do not promise returns. Do not provide legal, tax, or guaranteed financial advice.',
  'Speak directly to the user in a warm, conversational, and supportive tone ("you", "we").',
  'Instead of just stating numbers, explain what they mean for the user\'s daily life in a very simple and insightful way.',
  'For example, instead of saying "Debt: 800,000 | Phase: Crisis", say something like: "Your debt is taking up a large chunk of your income, making it hard to save. Let\'s focus on building a small safety net first so you aren\'t forced to take on more debt during slow weeks."',
  'Provide actionable, bite-sized steps without sounding like a strict accountant. Be encouraging!',
  'Return strict JSON with overview, healthInsight, forecastInsight, decisionInsight, investmentInsight, reasons, actionPlan, watchOut, tone.',
  'Keep every field concise. No field should be more than two to three short sentences.',
].join(' ')

const generateAiExplanationForUser = async (userId, options = {}) => {
  const sourceSnapshot = await buildSnapshot(userId)
  let payload

  if (options.forceFallback) {
    payload = fallbackFromSnapshot(sourceSnapshot, 'Forced fallback')
  } else {
    try {
      const groqOutput = await callGroqJson({
        systemPrompt,
        userPayload: sourceSnapshot,
      })
      payload = {
        ...validateExplanation(groqOutput),
        status: 'ready',
        error: '',
      }
    } catch (err) {
      payload = fallbackFromSnapshot(sourceSnapshot, err.message)
    }
  }

  return AiExplanation.findOneAndUpdate(
    { userId },
    {
      userId,
      ...payload,
      sourceSnapshot,
      generatedAt: new Date(),
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  )
}

module.exports = {
  generateAiExplanationForUser,
}
