import { useEffect, useState } from 'react'
import AiInlineNote from '../../components/AiInlineNote'
import ScoreGauge from '../../components/charts/ScoreGauge'
import { getAiExplanation } from '../../services/aiApi'
import { getChartData } from '../../services/analyticsApi'

const Route3 = () => {
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

  const factors = data?.health?.factors || {}
  const actions = data?.router?.actions || []

  return (
    <div className='dashboard-stack'>
      <h3 className='page-title'>Health Score And Decisions</h3>
      {error && <p className='error'>{error}</p>}

      <div className='dashboard-panel'>
        <ScoreGauge score={data?.health?.score || 0} label={data?.health?.phase || 'crisis'} />
        <AiInlineNote label='Health read'>{explanation?.healthInsight}</AiInlineNote>
        <p className='muted-copy'>{data?.router?.summary || 'Run analytics to generate decisions.'}</p>
      </div>

      <div className='dashboard-panel'>
        <h4>Decision router</h4>
        <AiInlineNote label='Decision read'>{explanation?.decisionInsight}</AiInlineNote>
        <div className='decision-list'>
          {actions.map((action) => (
            <div key={action.key} className={`decision-item ${action.allowed ? 'allowed' : 'blocked'}`}>
              <strong>{action.allowed ? 'Allowed' : 'Blocked'}: {action.label}</strong>
              <p>{action.reason}</p>
            </div>
          ))}
        </div>
      </div>

      <div className='dashboard-panel'>
        <h4>Health factors</h4>
        {Object.entries(factors).map(([key, factor]) => {
          const friendlyKey = {
            liquidity: 'Liquidity (Cash Buffer)',
            debtSafety: 'Debt Safety',
            incomeStability: 'Income Stability',
            forecastTrend: 'Forecast Trend',
            dataConsistency: 'Data Consistency'
          }[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          
          return (
            <div key={key} className='factor-row'>
              <div className='split-row'>
                <strong>{friendlyKey}</strong>
                <span>{Math.round(factor.value || 0)}/100</span>
              </div>
              <div className='progress-track'>
                <div style={{ width: `${Math.max(0, Math.min(100, factor.value || 0))}%` }} />
              </div>
              <p>{factor.detail}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Route3
