import { useEffect, useMemo, useState } from 'react'
import AiInlineNote from '../../components/AiInlineNote'
import SimpleBarChart from '../../components/charts/SimpleBarChart'
import SimpleLineChart from '../../components/charts/SimpleLineChart'
import { getAiExplanation } from '../../services/aiApi'
import { getChartData } from '../../services/analyticsApi'

const Forecasts = () => {
  const [data, setData] = useState(null)
  const [explanation, setExplanation] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getChartData(), getAiExplanation().catch(() => null)])
      .then(([chartData, aiData]) => {
        setData(chartData)
        setExplanation(aiData)
      })
      .catch((err) => setError(err.message))
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
    <div className='dashboard-stack'>
      <h3 className='page-title'>Forecasts & Future Trends</h3>
      <p style={{ color: 'var(--text-soft)', marginBottom: '1.5rem', fontSize: '1.05rem' }}>
        We use machine learning to predict what your earnings might look like over the next few days. This helps you plan your spending and saving ahead of time!
      </p>
      {error && <p className='error'>{error}</p>}

      <div className='dashboard-panel'>
        <h4 style={{ marginBottom: '0.5rem' }}>Predicted Income</h4>
        <p style={{ color: 'var(--text-soft)', marginBottom: '1rem', fontSize: '0.9rem' }}>Here is what our model expects you to earn in the coming days based on your recent activity.</p>
        <AiInlineNote label='Forecast read'>{explanation?.forecastInsight}</AiInlineNote>
        <SimpleLineChart data={data?.forecast || []} />
        <p className='muted-copy' style={{ marginTop: '1rem' }}><strong>Total Expected:</strong> Rs {Math.round(forecastTotal).toLocaleString('en-IN')}</p>
      </div>

      <div className='dashboard-panel'>
        <h4 style={{ marginBottom: '0.5rem' }}>Past vs. Future</h4>
        <p style={{ color: 'var(--text-soft)', marginBottom: '1rem', fontSize: '0.9rem' }}>Compare your last 15 days of actual earnings side-by-side with your upcoming predicted earnings.</p>
        <SimpleBarChart data={comparison} />
      </div>

      <div className='dashboard-panel'>
        <h4 style={{ marginBottom: '0.5rem' }}>Income Stability</h4>
        <p style={{ color: 'var(--text-soft)', marginBottom: '1rem', fontSize: '0.9rem' }}>This shows how predictable your income is. The more consistent your daily earnings are, the safer it is to take on larger financial commitments.</p>
        <AiInlineNote label='Risk read'>{explanation?.decisionInsight}</AiInlineNote>
        <div className='stats-grid' style={{ marginTop: '1rem' }}>
          <div><span>Consistency Level</span><strong className='capitalize'>{data?.volatility?.label || 'unknown'}</strong></div>
          <div><span>Risk Score</span><strong>{data?.volatility?.score ?? 0}</strong></div>
          <div><span>Variation (CV)</span><strong>{data?.volatility?.features?.coefficientOfVariation ?? 'N/A'}</strong></div>
        </div>
      </div>
    </div>
  )
}

export default Forecasts
