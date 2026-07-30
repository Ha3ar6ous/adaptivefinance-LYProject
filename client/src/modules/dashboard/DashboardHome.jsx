import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { FiActivity, FiHome, FiRefreshCw, FiShield, FiTrendingUp } from 'react-icons/fi'
import InvestmentSuggestions from '../../components/InvestmentSuggestions'
import ScoreGauge from '../../components/charts/ScoreGauge'
import { getAnalytics, getInvestmentSuggestion, runAnalytics } from '../../services/analyticsApi'

const cardStyle = { padding: '1.5rem', background: 'rgba(255, 255, 255, 0.6)' }

const DashboardHome = () => {
  const { user } = useOutletContext() || {}
  const [analytics, setAnalytics] = useState(null)
  const [investment, setInvestment] = useState(null)
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
      setAnalytics(analyticsData)
      setInvestment(investmentData)
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
      const investmentData = await getInvestmentSuggestion()
      setAnalytics(analyticsData)
      setInvestment(investmentData)
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className='bento-item' style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.8)', border: '1.5px solid #d1d1d1', flexWrap: 'wrap' }}>
        <div style={{ padding: '1rem', background: '#f0f0f0', borderRadius: '12px', color: '#111' }}>
          <FiHome size={28} />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#111' }}>
            Welcome back{user ? `, ${user.name}` : ''}!
          </h2>
          <p style={{ margin: '0.5rem 0 0', opacity: 0.8, fontSize: '0.95rem', color: '#444' }}>{statusText}</p>
        </div>
        <button type='button' onClick={refreshAnalytics} disabled={refreshing} style={{ width: 'auto', padding: '0.75rem 1rem' }}>
          <FiRefreshCw /> {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && <p className='error'>{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
        <div className='bento-item' style={cardStyle}>
          <ScoreGauge score={analytics?.health?.score || 0} label={analytics?.health?.phase || 'crisis'} />
        </div>

        <div className='bento-item' style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Income Forecast</h3>
            <FiTrendingUp color='#666' size={20} />
          </div>
          <h4 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#222' }}>
            {forecastSummary.count ? formatMoney(forecastSummary.total) : 'Pending'}
          </h4>
          <p style={{ margin: '0.5rem 0 0', color: '#666', fontWeight: 500 }}>
            {forecastSummary.count ? `${forecastSummary.count}-day total, avg ${formatMoney(forecastSummary.average)}/day` : 'Awaiting data'}
          </p>
        </div>

        <div className='bento-item' style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Income Volatility</h3>
            <FiShield color='#666' size={20} />
          </div>
          <h4 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#222', textTransform: 'capitalize' }}>
            {analytics?.volatility?.label || 'Unknown'}
          </h4>
          <p style={{ margin: '0.5rem 0 0', color: '#666', fontWeight: 500 }}>
            CV {analytics?.volatility?.features?.coefficientOfVariation ?? 'N/A'}
          </p>
        </div>

        <div className='bento-item' style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Next Action</h3>
            <FiActivity color='#666' size={20} />
          </div>
          <h4 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#222' }}>
            {analytics?.router?.actions?.find((action) => action.allowed)?.label || 'Add data'}
          </h4>
          <p style={{ margin: '0.5rem 0 0', color: '#666', fontWeight: 500 }}>
            {analytics?.router?.summary || `${analytics?.entryCount || 0} entries analyzed`}
          </p>
        </div>

        <div className='bento-item' style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Investment Suggestion</h3>
          <InvestmentSuggestions investment={investment} compact />
        </div>
      </div>
    </div>
  )
}

export default DashboardHome
