import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { FiActivity, FiHome, FiRefreshCw, FiShield, FiTrendingUp } from 'react-icons/fi'
import AiInsightStrip from '../../components/AiInsightStrip'
import InvestmentSuggestions from '../../components/InvestmentSuggestions'
import ScoreGauge from '../../components/charts/ScoreGauge'
import { getAiExplanation } from '../../services/aiApi'
import { getAnalytics, getInvestmentSuggestion, runAnalytics } from '../../services/analyticsApi'

const DashboardHome = () => {
  const { user } = useOutletContext() || {}
  const [analytics, setAnalytics] = useState(null)
  const [investment, setInvestment] = useState(null)
  const [explanation, setExplanation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadAnalytics = async () => {
    try {
      setError('')
      const [analyticsData, investmentData] = await Promise.all([
        getAnalytics(),
        getInvestmentSuggestion(),
      ])
      const explanationData = await getAiExplanation().catch(() => null)
      setAnalytics(analyticsData)
      setInvestment(investmentData)
      setExplanation(explanationData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const refreshAnalytics = async () => {
    try {
      setRefreshing(true)
      setError('')
      const analyticsData = await runAnalytics()
      const [investmentData, explanationData] = await Promise.all([
        getInvestmentSuggestion(),
        getAiExplanation().catch(() => null),
      ])
      setAnalytics(analyticsData)
      setInvestment(investmentData)
      setExplanation(explanationData)
    } catch (err) {
      setError(err.message)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  const forecastSummary = useMemo(() => {
    const points = analytics?.forecast?.points || []
    const total = points.reduce((sum, point) => sum + Number(point.income || 0), 0)
    return { count: points.length, total, average: points.length ? total / points.length : 0 }
  }, [analytics])

  const formatMoney = (value) => `Rs ${Math.round(Number(value || 0)).toLocaleString('en-IN')}`

  const statusText = loading
    ? 'Loading analytics'
    : analytics?.status === 'error'
      ? 'ML service unavailable'
      : analytics?.health
        ? analytics.router?.summary || 'Latest financial health output'
        : 'Run analytics after adding entries'

  return (
    <div className='dashboard-stack'>
      <div className='dashboard-panel welcome-panel'>
        <div className='panel-icon'>
          <FiHome size={28} />
        </div>
        <div className='welcome-copy'>
          <h2>Welcome back{user ? `, ${user.name}` : ''}!</h2>
          <p>{statusText}</p>
        </div>
        <button type='button' className='icon-button' onClick={refreshAnalytics} disabled={refreshing}>
          <FiRefreshCw /> {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && <p className='error'>{error}</p>}

      <AiInsightStrip explanation={explanation} />

      <div className='dashboard-grid'>
        <div className='dashboard-panel'>
          <ScoreGauge score={analytics?.health?.score || 0} label={analytics?.health?.phase || 'crisis'} />
        </div>

        <div className='dashboard-panel metric-card'>
          <div className='panel-header'>
            <h3>Income Forecast</h3>
            <FiTrendingUp />
          </div>
          <h4>{forecastSummary.count ? formatMoney(forecastSummary.total) : 'Pending'}</h4>
          <p>{forecastSummary.count ? `${forecastSummary.count}-day total, avg ${formatMoney(forecastSummary.average)}/day` : 'Awaiting data'}</p>
        </div>

        <div className='dashboard-panel metric-card'>
          <div className='panel-header'>
            <h3>Income Volatility</h3>
            <FiShield />
          </div>
          <h4 className='capitalize'>{analytics?.volatility?.label || 'Unknown'}</h4>
          <p>CV {analytics?.volatility?.features?.coefficientOfVariation ?? 'N/A'}</p>
        </div>

        <div className='dashboard-panel metric-card'>
          <div className='panel-header'>
            <h3>Next Action</h3>
            <FiActivity />
          </div>
          <h4 className='metric-title'>{analytics?.router?.actions?.find((action) => action.allowed)?.label || 'Add data'}</h4>
          <p>{analytics?.router?.summary || `${analytics?.entryCount || 0} entries analyzed`}</p>
        </div>

        <div className='dashboard-panel'>
          <h3>Investment Suggestion</h3>
          <InvestmentSuggestions investment={investment} compact />
        </div>
      </div>
    </div>
  )
}

export default DashboardHome
