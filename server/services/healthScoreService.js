const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value))

const average = (values) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0

const getPhase = (score) => {
  if (score < 40) return 'crisis'
  if (score < 60) return 'survival'
  if (score < 80) return 'stability'
  return 'growth'
}

const scoreLiquidity = (user) => {
  const expenses = Math.max(Number(user.monthlyExpenses || 0), 1)
  const ratio = Number(user.bankBalance || 0) / expenses
  return {
    value: clamp((ratio / 3) * 100),
    detail: `${ratio.toFixed(1)} months expense cover`,
  }
}

const scoreDebtSafety = (user) => {
  const expenses = Math.max(Number(user.monthlyExpenses || 0), 1)
  const ratio = Number(user.debts || 0) / expenses
  return {
    value: clamp(100 - ratio * 35),
    detail: `${ratio.toFixed(1)}x monthly expenses in debt`,
  }
}

const scoreStability = (volatility = {}) => {
  const label = volatility.label || 'unknown'
  const byLabel = { low: 90, medium: 60, high: 30, unknown: 45 }
  return {
    value: byLabel[label] || 45,
    detail: `${label} volatility`,
  }
}

const scoreForecastTrend = (entries, forecast = {}) => {
  const recentActual = entries.slice(-14).map((entry) => Number(entry.income || 0))
  const forecastValues = (forecast.points || []).map((point) => Number(point.income || 0))
  const actualAvg = average(recentActual)
  const forecastAvg = average(forecastValues)
  const ratio = actualAvg > 0 ? forecastAvg / actualAvg : forecastAvg > 0 ? 1 : 0
  return {
    value: clamp(50 + (ratio - 1) * 100),
    detail: `${Math.round((ratio || 0) * 100)}% of recent average`,
  }
}

const scoreConsistency = (entries) => {
  const recent = entries.slice(-30)
  const activeDays = recent.filter((entry) => Number(entry.income || 0) > 0).length
  const historyScore = clamp((entries.length / 30) * 100)
  const activeScore = recent.length ? (activeDays / recent.length) * 100 : 0
  return {
    value: clamp(historyScore * 0.6 + activeScore * 0.4),
    detail: `${entries.length} entries, ${activeDays} active recent days`,
  }
}

const calculateHealthScore = ({ user, entries, analytics }) => {
  const factors = {
    liquidity: scoreLiquidity(user),
    debtSafety: scoreDebtSafety(user),
    incomeStability: scoreStability(analytics.volatility),
    forecastTrend: scoreForecastTrend(entries, analytics.forecast),
    dataConsistency: scoreConsistency(entries),
  }

  const weighted =
    factors.liquidity.value * 0.3 +
    factors.debtSafety.value * 0.25 +
    factors.incomeStability.value * 0.2 +
    factors.forecastTrend.value * 0.15 +
    factors.dataConsistency.value * 0.1

  const isInsufficient = !entries || entries.length < 3
  const score = isInsufficient ? 0 : Math.round(clamp(weighted))
  
  return {
    score,
    phase: isInsufficient ? 'insufficient_data' : getPhase(score),
    factors,
  }
}

module.exports = {
  calculateHealthScore,
}

