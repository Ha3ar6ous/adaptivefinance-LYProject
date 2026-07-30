const DailyIncomeEntry = require('../models/DailyIncomeEntry')
const IncomeAnalytics = require('../models/IncomeAnalytics')
const InvestmentSuggestion = require('../models/InvestmentSuggestion')
const User = require('../models/User')
const { loadInvestmentOptions } = require('../data/investmentOptions')

const average = (values) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0

const riskRank = { low: 1, medium: 2, high: 3 }
const liquidityRank = { Low: 1, Medium: 2, High: 3 }

const getInvestAction = (analytics = {}) =>
  (analytics.router?.actions || []).find((action) => action.key === 'conservative_investing')

const getMonthlyIncome = (entries) => {
  const recent = entries.slice(-30)
  if (!recent.length) return 0
  const income = recent.reduce((sum, entry) => sum + Number(entry.income || 0), 0)
  return recent.length >= 25 ? income : average(recent.map((entry) => Number(entry.income || 0))) * 30
}

const getForecastRatio = (entries, forecast = {}) => {
  const actualAvg = average(entries.slice(-14).map((entry) => Number(entry.income || 0)))
  const forecastAvg = average((forecast.points || []).map((point) => Number(point.income || 0)))
  if (!actualAvg) return 1
  return forecastAvg / actualAvg
}

const deriveInputs = ({ user, entries, analytics }) => {
  const monthlyIncome = getMonthlyIncome(entries)
  const monthlyExpenses = Number(user.monthlyExpenses || 0)
  const surplus = Math.max(monthlyIncome - monthlyExpenses, 0)
  const emergencyReserve = monthlyExpenses * 3
  const spareSavings = Math.max(Number(user.bankBalance || 0) - emergencyReserve, 0)
  const investableAmount = Math.floor(Math.max(0, Math.min(surplus * 0.25, spareSavings * 0.1)))
  return {
    monthlyIncome,
    monthlyExpenses,
    debt: Number(user.debts || 0),
    savings: Number(user.bankBalance || 0),
    investableAmount,
    riskProfile: user.riskPreference || 'low',
    volatility: analytics.volatility?.label || 'unknown',
    forecastRatio: getForecastRatio(entries, analytics.forecast),
  }
}

const riskMatchScore = (option, riskProfile) => {
  const diff = Math.abs((riskRank[option.riskLevel] || 1) - (riskRank[riskProfile] || 1))
  return Math.max(0, 100 - diff * 45)
}

const liquidityScore = (option, forecastRatio) => {
  const base = (liquidityRank[option.liquidity] || 1) * 30
  return Math.min(100, forecastRatio < 0.9 ? base + 20 : base)
}

const returnScore = (option) => {
  if (option.expectedReturnPct == null) return 45
  return Math.min(100, option.expectedReturnPct * 10)
}

const projectionFor = (amount, option) => {
  if (option.expectedReturnPct == null) {
    return {
      low: null,
      median: null,
      high: null,
      note: option.returnNote || 'Return depends on market price.',
    }
  }

  const riskBand = option.riskLevel === 'high' ? 7 : option.riskLevel === 'medium' ? 4 : 1.5
  const months = 12
  const futureValue = (annualPct) => {
    const monthlyRate = annualPct / 100 / 12
    let value = 0
    for (let i = 0; i < months; i += 1) {
      value = (value + amount) * (1 + monthlyRate)
    }
    return Math.round(value)
  }

  return {
    low: futureValue(Math.max(option.expectedReturnPct - riskBand, 0)),
    median: futureValue(option.expectedReturnPct),
    high: futureValue(option.expectedReturnPct + riskBand),
    note: '12-month monthly-investment range.',
  }
}

const hardFilter = (option, inputs) => {
  if (option.minMonthlyAmount > inputs.investableAmount) return false
  if (inputs.monthlyIncome < option.minMonthlyEarning) return false
  if (inputs.debt > option.maxDebt) return false
  if (inputs.savings < option.minSavings) return false
  if (inputs.riskProfile === 'low' && option.riskLevel === 'high') return false
  if (inputs.riskProfile === 'low' && inputs.volatility !== 'low' && option.riskLevel === 'medium') return false
  if (inputs.volatility === 'high' && !option.volatilitySafe) return false
  return true
}

const scoreOption = (option, inputs) => {
  const score =
    riskMatchScore(option, inputs.riskProfile) * 0.3 +
    liquidityScore(option, inputs.forecastRatio) * 0.25 +
    (option.volatilitySafe ? 100 : 45) * 0.2 +
    (option.gigPriority / 5) * 100 * 0.15 +
    returnScore(option) * 0.1

  const reasonTags = [
    option.volatilitySafe ? 'safe for volatile income' : null,
    option.riskLevel === inputs.riskProfile ? 'matches risk level' : null,
    option.liquidity === 'High' ? 'high liquidity' : null,
    option.gigPriority >= 4 ? 'gig-worker friendly' : null,
    inputs.forecastRatio < 0.9 ? 'liquidity prioritized due forecast' : null,
  ].filter(Boolean)

  return {
    optionId: option.id,
    name: option.name,
    type: option.type,
    score: Math.round(score),
    allocationAmount: 0,
    allocationPct: 0,
    expectedReturnPct: option.expectedReturnPct,
    returnNote: option.returnNote,
    riskLevel: option.riskLevel,
    liquidity: option.liquidity,
    lockInPeriod: option.lockInPeriod,
    projection: null,
    reasonTags,
  }
}

const buildBlockedSuggestion = ({ userId, investAction, investableAmount, riskProfile }) => ({
  userId,
  eligible: false,
  investableAmount,
  riskProfile,
  blockedReason: investAction?.reason || 'Stage 2 router has not allowed investing yet.',
  suggestions: [],
  generatedAt: new Date(),
})

const buildInvestmentSuggestion = ({ userId, user, entries, analytics }) => {
  const investAction = getInvestAction(analytics)
  const inputs = deriveInputs({ user, entries, analytics })

  if (!investAction?.allowed || inputs.investableAmount <= 0) {
    return buildBlockedSuggestion({
      userId,
      investAction,
      investableAmount: inputs.investableAmount,
      riskProfile: inputs.riskProfile,
    })
  }

  const scored = loadInvestmentOptions()
    .filter((option) => hardFilter(option, inputs))
    .map((option) => scoreOption(option, inputs))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  const totalScore = scored.reduce((sum, option) => sum + option.score, 0) || 1
  const suggestions = scored.map((option) => {
    const allocationPct = option.score / totalScore
    const allocationAmount = Math.max(Math.floor(inputs.investableAmount * allocationPct), 0)
    return {
      ...option,
      allocationPct: Math.round(allocationPct * 100),
      allocationAmount,
      projection: projectionFor(allocationAmount, option),
    }
  })

  return {
    userId,
    eligible: suggestions.length > 0,
    investableAmount: inputs.investableAmount,
    riskProfile: inputs.riskProfile,
    blockedReason: suggestions.length ? '' : 'No curated option matched the current amount and safety filters.',
    suggestions,
    generatedAt: new Date(),
  }
}

const refreshInvestmentSuggestionForUser = async (userId) => {
  const [user, entries, analytics] = await Promise.all([
    User.findById(userId).lean(),
    DailyIncomeEntry.find({ userId }).sort({ date: 1 }).lean(),
    IncomeAnalytics.findOne({ userId }).lean(),
  ])

  const payload = buildInvestmentSuggestion({
    userId,
    user: user || {},
    entries,
    analytics: analytics || {},
  })

  return InvestmentSuggestion.findOneAndUpdate({ userId }, payload, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  })
}

module.exports = {
  buildInvestmentSuggestion,
  refreshInvestmentSuggestionForUser,
}

