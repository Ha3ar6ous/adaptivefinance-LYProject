const buildDecisionRouter = ({ user, health, analytics }) => {
  const expenses = Math.max(Number(user.monthlyExpenses || 0), 1)
  const liquidityMonths = Number(user.bankBalance || 0) / expenses
  const debtRatio = Number(user.debts || 0) / expenses
  const volatility = analytics.volatility?.label || 'unknown'
  const blockers = []

  if (liquidityMonths < 1) {
    blockers.push('emergency fund below 1 month')
  }
  if (debtRatio > 2) {
    blockers.push('debt above 2 months of expenses')
  }
  if (volatility === 'high') {
    blockers.push('high income volatility')
  }

  const canInvest = health.score >= 70 && blockers.length === 0

  const actions = [
    {
      key: 'build_emergency_fund',
      label: 'Build emergency fund',
      allowed: liquidityMonths < 3,
      reason:
        liquidityMonths < 3
          ? `Keep saving until you cover 3 months of expenses. Current cover is ${liquidityMonths.toFixed(1)} months.`
          : 'Emergency fund is in a workable range.',
    },
    {
      key: 'pay_down_debt',
      label: 'Pay down debt',
      allowed: debtRatio > 0.5,
      reason:
        debtRatio > 0.5
          ? `Debt is ${debtRatio.toFixed(1)}x monthly expenses, so reduce it before taking risk.`
          : 'Debt load is manageable.',
    },
    {
      key: 'conservative_investing',
      label: 'Start conservative investing',
      allowed: canInvest,
      reason: canInvest
        ? 'Score, liquidity, debt, and volatility allow low-risk investing.'
        : `Blocked by ${blockers.length ? blockers.join(', ') : 'health score below 70'}.`,
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
}

