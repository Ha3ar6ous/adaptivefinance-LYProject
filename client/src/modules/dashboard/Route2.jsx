import { useEffect, useMemo, useState } from 'react'
import SimpleBarChart from '../../components/charts/SimpleBarChart'
import SimpleLineChart from '../../components/charts/SimpleLineChart'
import { getChartData } from '../../services/analyticsApi'

const Route2 = () => {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getChartData().then(setData).catch((err) => setError(err.message))
  }, [])

  const comparison = useMemo(() => {
    const history = data?.history?.slice(-15) || []
    const forecast = data?.forecast || []
    return [
      ...history.map((point) => ({ ...point, type: 'actual' })),
      ...forecast.map((point) => ({ ...point, type: 'forecast' })),
    ]
  }, [data])

  const forecastTotal = (data?.forecast || []).reduce((sum, point) => sum + Number(point.income || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h3 style={{ margin: 0 }}>Forecast And Model Output</h3>
      {error && <p className='error'>{error}</p>}

      <div className='bento-item' style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.65)' }}>
        <h4>Forecast income</h4>
        <SimpleLineChart data={data?.forecast || []} color='#111' />
        <p style={{ color: '#666' }}>Forecast total: Rs {Math.round(forecastTotal).toLocaleString('en-IN')}</p>
      </div>

      <div className='bento-item' style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.65)' }}>
        <h4>Recent actual + forecast</h4>
        <SimpleBarChart data={comparison} color='#333' />
      </div>

      <div className='bento-item' style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.65)' }}>
        <h4>Volatility output</h4>
        <p style={{ textTransform: 'capitalize' }}>Label: {data?.volatility?.label || 'unknown'}</p>
        <p>Score: {data?.volatility?.score ?? 0}</p>
        <p>CV: {data?.volatility?.features?.coefficientOfVariation ?? 'N/A'}</p>
      </div>
    </div>
  )
}

export default Route2

