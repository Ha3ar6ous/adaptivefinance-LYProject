import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { FiActivity, FiHome, FiRefreshCw, FiShield, FiTrendingUp } from 'react-icons/fi'

const cardStyle = {
  padding: '1.5rem',
  background: 'rgba(255, 255, 255, 0.6)',
}

const DashboardHome = () => {
  const { user } = useOutletContext() || {}
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const fetchAnalytics = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      setError('')
      const res = await fetch('http://localhost:5000/api/analytics/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Unable to load analytics')
      }
      setAnalytics(data.analytics)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const refreshAnalytics = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      return
    }

    try {
      setRefreshing(true)
      setError('')
      const res = await fetch('http://localhost:5000/api/analytics/run', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Unable to refresh analytics')
      }
      setAnalytics(data.analytics)
    } catch (err) {
      setError(err.message)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const forecastSummary = useMemo(() => {
    const points = analytics?.forecast?.points || []
    const total = points.reduce((sum, point) => sum + Number(point.income || 0), 0)
    return {
      count: points.length,
      total,
      average: points.length ? total / points.length : 0,
    }
  }, [analytics])

  const formatMoney = (value) =>
    `Rs ${Math.round(Number(value || 0)).toLocaleString('en-IN')}`

  const statusText = loading
    ? 'Loading analytics'
    : analytics?.status === 'error'
      ? 'ML service unavailable'
      : analytics?.status === 'insufficient_data'
        ? 'Add more income entries'
        : analytics
          ? analytics.forecast?.note || 'Latest model output'
          : 'Run analytics after adding entries'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        className='bento-item'
        style={{
          padding: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          background: 'rgba(255, 255, 255, 0.8)',
          border: '1.5px solid #d1d1d1',
        }}
      >
        <div style={{ padding: '1rem', background: '#f0f0f0', borderRadius: '12px', color: '#111' }}>
          <FiHome size={28} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#111' }}>
            Welcome back{user ? `, ${user.name}` : ''}!
          </h2>
          <p style={{ margin: '0.5rem 0 0', opacity: 0.8, fontSize: '0.95rem', color: '#444' }}>
            {statusText}
          </p>
        </div>
        <button
          type='button'
          onClick={refreshAnalytics}
          disabled={refreshing}
          style={{ marginLeft: 'auto', width: 'auto', padding: '0.75rem 1rem' }}
        >
          <FiRefreshCw /> {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && <p className='error'>{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <div className='bento-item' style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111' }}>Income Forecast</h3>
            <FiTrendingUp color='#666' size={20} />
          </div>
          <h4 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#222' }}>
            {forecastSummary.count ? formatMoney(forecastSummary.total) : 'Pending'}
          </h4>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#666', fontWeight: 500 }}>
            {forecastSummary.count
              ? `${forecastSummary.count}-day total, avg ${formatMoney(forecastSummary.average)}/day`
              : 'Awaiting enough data'}
          </p>
        </div>

        <div className='bento-item' style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111' }}>Income Volatility</h3>
            <FiShield color='#666' size={20} />
          </div>
          <h4 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#222', textTransform: 'capitalize' }}>
            {analytics?.volatility?.label || 'Unknown'}
          </h4>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#666', fontWeight: 500 }}>
            {analytics?.volatility?.features?.coefficientOfVariation != null
              ? `CV ${analytics.volatility.features.coefficientOfVariation}`
              : 'Needs at least 3 entries'}
          </p>
        </div>

        <div className='bento-item' style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111' }}>Data Readiness</h3>
            <FiActivity color='#666' size={20} />
          </div>
          <h4 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#222' }}>{analytics?.entryCount || 0}</h4>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#666', fontWeight: 500 }}>
            {analytics?.forecast?.method ? `Method: ${analytics.forecast.method}` : 'Income entries analyzed'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default DashboardHome
