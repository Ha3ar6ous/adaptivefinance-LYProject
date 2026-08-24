const { calculateHealthScore } = require('./server/services/healthScoreService')
const { buildDecisionRouter } = require('./server/services/decisionRouterService')
const { loadInvestmentOptions } = require('./server/data/investmentOptions')

// 4. Financial Health Score
const scenarios = [
  { name: 'Vulnerable', user: { bankBalance: 10000, monthlyExpenses: 20000, debts: 60000 }, analytics: { volatility: { label: 'high' }, forecast: { points: [] } }, entries: Array(30).fill({ income: 500 }) },
  { name: 'High Debt', user: { bankBalance: 60000, monthlyExpenses: 20000, debts: 100000 }, analytics: { volatility: { label: 'medium' }, forecast: { points: [] } }, entries: Array(30).fill({ income: 1000 }) },
  { name: 'Stable', user: { bankBalance: 100000, monthlyExpenses: 20000, debts: 5000 }, analytics: { volatility: { label: 'low' }, forecast: { points: Array(15).fill({ income: 1200 }) } }, entries: Array(30).fill({ income: 1000 }) }
]

console.log('=== FINANCIAL HEALTH SCORE ===')
scenarios.forEach(s => {
  const result = calculateHealthScore(s)
  console.log(`${s.name} - Score: ${result.score}, Phase: ${result.phase}`)
})

// 5. Decision Router
console.log('\n=== DECISION ROUTER ===')
const routerScenarios = [
  { desc: 'Low liquidity blocks invest', health: { score: 80 }, user: { bankBalance: 100, monthlyExpenses: 1000, debts: 0 }, analytics: { volatility: { label: 'low' } } },
  { desc: 'High debt blocks invest', health: { score: 80 }, user: { bankBalance: 5000, monthlyExpenses: 1000, debts: 3000 }, analytics: { volatility: { label: 'low' } } },
  { desc: 'High volatility blocks invest', health: { score: 80 }, user: { bankBalance: 5000, monthlyExpenses: 1000, debts: 0 }, analytics: { volatility: { label: 'high' } } },
  { desc: 'Ideal passes invest', health: { score: 80 }, user: { bankBalance: 5000, monthlyExpenses: 1000, debts: 0 }, analytics: { volatility: { label: 'low' } } },
]
routerScenarios.forEach(s => {
  const router = buildDecisionRouter(s)
  const invest = router.actions.find(a => a.key === 'conservative_investing')
  console.log(`${s.desc}: Invest Allowed=${invest.allowed}`)
})

// 6. Investment Engine
console.log('\n=== INVESTMENT ENGINE ===')
const options = loadInvestmentOptions()
console.log(`Total Options: ${options.length}`)
const safeCount = options.filter(o => o.volatilitySafe).length
console.log(`Volatility Safe Options: ${safeCount}`)
const highRiskCount = options.filter(o => o.riskLevel === 'high').length
console.log(`High Risk Options: ${highRiskCount}`)

