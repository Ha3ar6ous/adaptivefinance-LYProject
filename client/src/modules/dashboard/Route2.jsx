import { useEffect, useMemo, useState } from 'react'
import AiInlineNote from '../../components/AiInlineNote'
import SimpleBarChart from '../../components/charts/SimpleBarChart'
import SimpleLineChart from '../../components/charts/SimpleLineChart'
import { getAiExplanation } from '../../services/aiApi'
import { getChartData } from '../../services/analyticsApi'

const Route2 = () => {
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
      <h3 className='page-title'>Forecast And Model Output</h3>
      {error && <p className='error'>{error}</p>}

      <div className='dashboard-panel'>
        <h4>Forecast income</h4>
        <AiInlineNote label='Forecast read'>{explanation?.forecastInsight}</AiInlineNote>
        <SimpleLineChart data={data?.forecast || []} />
        <p className='muted-copy'>Forecast total: Rs {Math.round(forecastTotal).toLocaleString('en-IN')}</p>
      </div>

      <div className='dashboard-panel'>
        <h4>Recent actual + forecast</h4>
        <SimpleBarChart data={comparison} />
      </div>

      <div className='dashboard-panel'>
        <h4>Volatility output</h4>
        <AiInlineNote label='Risk read'>{explanation?.decisionInsight}</AiInlineNote>
        <div className='stats-grid'>
          <div><span>Label</span><strong className='capitalize'>{data?.volatility?.label || 'unknown'}</strong></div>
          <div><span>Score</span><strong>{data?.volatility?.score ?? 0}</strong></div>
          <div><span>CV</span><strong>{data?.volatility?.features?.coefficientOfVariation ?? 'N/A'}</strong></div>
        </div>
      </div>
    </div>
  )
}

export default Route2
