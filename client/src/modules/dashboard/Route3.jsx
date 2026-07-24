import { useEffect, useState } from 'react'
import ScoreGauge from '../../components/charts/ScoreGauge'
import { getChartData } from '../../services/analyticsApi'

const Route3 = () => {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getChartData().then(setData).catch((err) => setError(err.message))
  }, [])

  const factors = data?.health?.factors || {}
  const actions = data?.router?.actions || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h3 style={{ margin: 0 }}>Health Score And Decisions</h3>
      {error && <p className='error'>{error}</p>}

      <div className='bento-item' style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.65)' }}>
        <ScoreGauge score={data?.health?.score || 0} label={data?.health?.phase || 'crisis'} />
        <p style={{ color: '#666' }}>{data?.router?.summary || 'Run analytics to generate decisions.'}</p>
      </div>

      <div className='bento-item' style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.65)' }}>
        <h4>Decision router</h4>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {actions.map((action) => (
            <div key={action.key} style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: 8 }}>
              <strong>{action.allowed ? 'Allowed' : 'Blocked'}: {action.label}</strong>
              <p style={{ margin: '0.4rem 0 0', color: '#666' }}>{action.reason}</p>
            </div>
          ))}
        </div>
      </div>

      <div className='bento-item' style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.65)' }}>
        <h4>Health factors</h4>
        {Object.entries(factors).map(([key, factor]) => (
          <div key={key} style={{ marginBottom: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{key}</strong>
              <span>{Math.round(factor.value || 0)}/100</span>
            </div>
            <div style={{ height: 8, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, factor.value || 0))}%`, background: '#111' }} />
            </div>
            <p style={{ margin: '0.25rem 0 0', color: '#666' }}>{factor.detail}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Route3
