// Engineering policy thresholds; not outcome-validated financial cutoffs.
const CONSERVATIVE_POLICY = Object.freeze({ minimumLiquidityMonths: 3, maximumDebtExpenseRatio: 0.5,
  minimumHealthScore: 70, minimumIncomeEntries: 3 })
const finiteNumber = (v) => typeof v === 'number' && Number.isFinite(v)
const object = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const dateOnly = (v) => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null
  const day = Date.parse(`${v}T00:00:00.000Z`)
  return Number.isFinite(day) && new Date(day).toISOString().slice(0, 10) === v ? day : null
}
const validAnalytics = (analytics) => {
  if (!object(analytics)) return false
  // Fresh /analyze responses omit status; cached results must explicitly be ready.
  if (analytics.status !== undefined && analytics.status !== 'ready') return false
  if (analytics.error !== undefined && analytics.error !== '') return false
  const { forecast, volatility } = analytics
  if (!object(forecast) || !object(volatility) || !['low', 'medium'].includes(volatility.label)) return false
  const f = volatility.features
  if (!object(f) || !Number.isInteger(f.entryCount) || f.entryCount < CONSERVATIVE_POLICY.minimumIncomeEntries
      || !finiteNumber(f.recentAverageIncome) || f.recentAverageIncome <= 0
      || !finiteNumber(f.recentStdIncome) || f.recentStdIncome < 0
      || !finiteNumber(f.coefficientOfVariation) || f.coefficientOfVariation < 0) return false
  // Independently rounded Python features may differ by rounding error.
  if (Math.abs(f.recentStdIncome / f.recentAverageIncome - f.coefficientOfVariation) > 0.005) return false
  if (!Number.isInteger(forecast.horizon) || forecast.horizon < 1 || forecast.horizon > 30
      || !['trend_weekday', 'cold_start_rolling_weekday', 'validated_statistical'].includes(forecast.method)
      || !Array.isArray(forecast.points) || forecast.points.length !== forecast.horizon) return false
  let previous = null
  let positive = false
  let total = 0
  for (const point of forecast.points) {
    if (!object(point) || !finiteNumber(point.income) || point.income < 0) return false
    const day = dateOnly(point.date)
    if (day === null || (previous !== null && day - previous !== 86400000)) return false
    previous = day
    positive ||= point.income > 0
    total += point.income
    if (!Number.isFinite(total)) return false
  }
  return positive
}

const buildDecisionRouter = (payload = {}) => {
  const { user, health, analytics } = object(payload) ? payload : {}
  const validUser = object(user) && finiteNumber(user.monthlyExpenses) && user.monthlyExpenses > 0
    && finiteNumber(user.bankBalance) && user.bankBalance >= 0 && finiteNumber(user.debts) && user.debts >= 0
  const validHealth = object(health) && finiteNumber(health.score) && health.score >= 0 && health.score <= 100
    && health.phase === (health.score < 40 ? 'crisis' : health.score < 60 ? 'survival' : health.score < 80 ? 'stability' : 'growth')
  const liquidityMonths = validUser ? user.bankBalance / user.monthlyExpenses : null
  const debtRatio = validUser ? user.debts / user.monthlyExpenses : null
  const blockers = []
  if (!validUser) blockers.push('missing or invalid financial inputs')
  if (!validHealth) blockers.push('missing or invalid health score/phase')
  if (!validAnalytics(analytics)) blockers.push('missing, invalid, or unacceptable analytics/volatility')
  const needsFund = validUser && user.bankBalance / CONSERVATIVE_POLICY.minimumLiquidityMonths < user.monthlyExpenses
  const needsDebtPayment = validUser && user.debts > user.monthlyExpenses * CONSERVATIVE_POLICY.maximumDebtExpenseRatio
  if (needsFund) blockers.push('emergency fund below 3 months')
  if (needsDebtPayment) blockers.push('debt above 0.5 months of expenses')
  if (validHealth && health.score < CONSERVATIVE_POLICY.minimumHealthScore) blockers.push('health score below 70')
  const canInvest = blockers.length === 0

  const actions = [
    {
      key: 'build_emergency_fund',
      label: 'Build emergency fund',
      allowed: needsFund,
      reason:
        !validUser ? 'Provide valid financial inputs first.' : needsFund
          ? `Keep saving until you cover 3 months of expenses. Current cover is ${liquidityMonths.toFixed(1)} months.`
          : 'Emergency fund is in a workable range.',
    },
    {
      key: 'pay_down_debt',
      label: 'Pay down debt',
      allowed: needsDebtPayment,
      reason:
        !validUser ? 'Provide valid financial inputs first.' : needsDebtPayment
          ? `Debt is ${debtRatio.toFixed(1)}x monthly expenses, so reduce it before taking risk.`
          : 'Debt load is manageable.',
    },
    {
      key: 'conservative_investing',
      label: 'Start conservative investing',
      allowed: canInvest,
      reason: canInvest
        ? 'All conservative readiness checks passed.'
        : `Blocked by ${blockers.join(', ')}.`,
    },
  ]

  return {
    summary: canInvest
      ? 'Investing can begin conservatively.'
      : 'Focus on safety actions before investing.',
    actions,
  }
}

module.exports = {
  buildDecisionRouter,
  CONSERVATIVE_POLICY,
}

