import { useEffect, useState } from 'react'
import { FiCheckCircle, FiXCircle } from 'react-icons/fi'
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
      <h3 className='page-title'>Health Score & Decisions</h3>
      <p style={{ color: 'var(--text-soft)', marginBottom: '1.5rem', fontSize: '1.05rem' }}>
        This page gives you a bird's-eye view of your overall financial health. We calculate this by looking at your cash buffer, debt, and income stability to help you make safe money choices.
      </p>
      {error && <p className='error'>{error}</p>}

      <div className='dashboard-panel'>
        <ScoreGauge score={data?.health?.score || 0} label={data?.health?.phase || 'crisis'} />
        <AiInlineNote label='Health read'>{explanation?.healthInsight}</AiInlineNote>
        <p className='muted-copy' style={{ marginTop: '1rem' }}>{data?.router?.summary || 'Run analytics to generate decisions.'}</p>
      </div>

      <div className='dashboard-panel'>
        <h4 style={{ marginBottom: '0.5rem' }}>Action Router</h4>
        <p style={{ color: 'var(--text-soft)', marginBottom: '1rem', fontSize: '0.9rem' }}>We check your financial health to see if it's safe to take certain actions (like investing) or if you should hold off and build safety first.</p>
        <AiInlineNote label='Decision read'>{explanation?.decisionInsight}</AiInlineNote>
        <div className='decision-list'>
          {actions.map((action) => (
            <div key={action.key} className={`decision-item ${action.allowed ? 'allowed' : 'blocked'}`}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {action.allowed ? <FiCheckCircle color="var(--success)" /> : <FiXCircle color="var(--error)" />} 
                {action.allowed ? 'Safe to proceed' : 'Not recommended yet'}: {action.label}
              </strong>
              <p>{action.reason}</p>
            </div>
          ))}
        </div>
      </div>

      <div className='dashboard-panel'>
        <h4 style={{ marginBottom: '0.5rem' }}>Your Health Factors Breakdown</h4>
        <p style={{ color: 'var(--text-soft)', marginBottom: '1rem', fontSize: '0.9rem' }}>Here are the 5 specific factors that make up your total Health Score.</p>
        {Object.entries(factors).map(([key, factor]) => {
          const friendlyKey = {
            liquidity: 'Liquidity (Cash Buffer)',
            debtSafety: 'Debt Safety',
            incomeStability: 'Income Stability',
            forecastTrend: 'Forecast Trend',
            dataConsistency: 'Data Consistency'
          }[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          
          return (
            <div key={key} className='factor-row' style={{ paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-soft)' }}>
              <div className='split-row'>
                <strong style={{ fontSize: '1rem' }}>{friendlyKey}</strong>
                <span style={{ fontWeight: 'bold', color: 'var(--text)' }}>{Math.round(factor.value || 0)}/100</span>
              </div>
              <div className='progress-track' style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ width: `${Math.max(0, Math.min(100, factor.value || 0))}%` }} />
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-soft)' }}>{factor.detail}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Route3
