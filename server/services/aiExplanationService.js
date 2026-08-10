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
    ? `Start with ${money(invest.topSuggestion?.allocationAmount)} in ${invest.topSuggestion?.name}.`
    : blockedAction?.reason || allowedAction?.reason || 'Add more income data and keep building your safety buffer.'
  const watchOut =
    snapshot.volatility.label === 'high'
      ? 'Your income is volatile, so keep money liquid and avoid locking away too much at once.'
      : direction === 'softening'
        ? 'The forecast looks softer than recent earnings, so avoid increasing fixed commitments right now.'
        : 'Keep tracking income daily so the guidance stays accurate.'

  return {
    overview: {
      headline: score >= 70 ? 'Your money plan is in a workable zone.' : 'Your next move should protect cash flow.',
      summary: `Score ${score} puts you in the ${snapshot.health.phase} phase. The main pressure point is ${factorLabel(weak?.key || 'dataConsistency')}, while income volatility is ${snapshot.volatility.label}.`,
      nextAction,
    },
    healthInsight: secondWeak
      ? `Your weakest areas are ${factorLabel(weak?.key)} and ${factorLabel(secondWeak.key)}. Improving these will help more than chasing higher returns.`
      : `Your score is ${score}. The biggest lever right now is ${factorLabel(weak?.key || 'dataConsistency')}.`,
    forecastInsight: snapshot.forecast.total
      ? `Your ${snapshot.forecast.horizon}-day forecast is ${money(snapshot.forecast.total)} and looks ${direction}. Use it to size commitments conservatively.`
      : 'Add more income entries so the forecast becomes useful.',
    decisionInsight: blockedAction
      ? `The router is limiting ${blockedAction.label.toLowerCase()} because: ${blockedAction.reason}`
      : snapshot.router.summary || 'The safety router will unlock actions as your profile improves.',
    investmentInsight: invest.eligible
      ? `${invest.topSuggestion?.name} is the top match: ${money(invest.topSuggestion?.allocationAmount)} monthly, ${invest.topSuggestion?.liquidity || 'matched'} liquidity, and ${(invest.topSuggestion?.reasonTags || []).slice(0, 2).join(', ') || 'safety-fit tags'}.`
      : invest.blockedReason || 'Investment suggestions will appear once investing is allowed.',
    reasons: [
      `${factorLabel(weak?.key || 'dataConsistency')} is the lowest health factor`,
      `Forecast is ${direction}`,
      invest.eligible ? 'A safe investment path is available' : 'Investing is still gated by safety rules',
    ],
    actionPlan: [
      {
        title: invest.eligible ? 'Invest small' : 'Fix the blocker',
        detail: nextAction,
      },
      {
        title: 'Protect cash flow',
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
      headline: String(value.overview.headline).slice(0, 120),
      summary: String(value.overview.summary).slice(0, 260),
      nextAction: String(value.overview.nextAction).slice(0, 180),
    },
    healthInsight: String(value.healthInsight).slice(0, 180),
    forecastInsight: String(value.forecastInsight).slice(0, 180),
    decisionInsight: String(value.decisionInsight).slice(0, 180),
    investmentInsight: String(value.investmentInsight).slice(0, 180),
    reasons: value.reasons.slice(0, 3).map((reason) => String(reason).slice(0, 140)),
    actionPlan: Array.isArray(value.actionPlan)
      ? value.actionPlan.slice(0, 2).map((item) => ({
          title: String(item?.title || 'Next step').slice(0, 50),
          detail: String(item?.detail || '').slice(0, 160),
        }))
      : [],
    watchOut: String(value.watchOut || '').slice(0, 160),
    tone: value.tone,
  }
}

const systemPrompt = [
  'You are a cautious financial advisor for Indian gig workers.',
  'Use only the JSON values provided. Do not calculate new numbers or invent products.',
  'Do not promise returns. Do not provide legal, tax, or guaranteed financial advice.',
  'Make the guidance specific: explain what the numbers mean, what tradeoff matters, and what to do next.',
  'Avoid generic encouragement. Prefer concrete actions around cash buffer, debt, volatility, and small safe investments.',
  'Return strict JSON with overview, healthInsight, forecastInsight, decisionInsight, investmentInsight, reasons, actionPlan, watchOut, tone.',
  'Keep every field concise. No field should be more than two short sentences.',
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
