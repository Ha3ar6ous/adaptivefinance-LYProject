import { useEffect, useState } from 'react'
import AiInlineNote from '../../components/AiInlineNote'
import InvestmentSuggestions from '../../components/InvestmentSuggestions'
import { getAiExplanation } from '../../services/aiApi'
import { getInvestmentSuggestion, runInvestmentSuggestion } from '../../services/analyticsApi'

const InvestmentEngine = () => {
  const [investment, setInvestment] = useState(null)
  const [explanation, setExplanation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setError('')
      const [investmentData, aiData] = await Promise.all([
        getInvestmentSuggestion(),
        getAiExplanation().catch(() => null),
      ])
      setInvestment(investmentData)
      setExplanation(aiData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const refresh = async () => {
    try {
      setRefreshing(true)
      setError('')
      const investmentData = await runInvestmentSuggestion()
      const aiData = await getAiExplanation().catch(() => null)
      setInvestment(investmentData)
      setExplanation(aiData)
    } catch (err) {
      setError(err.message)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Investment Suggestions</h3>
        <button type='button' onClick={refresh} disabled={refreshing} style={{ width: 'auto', padding: '0.55rem 0.8rem' }}>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      {error && <p className='error'>{error}</p>}
      <AiInlineNote label='Investment read'>{explanation?.investmentInsight}</AiInlineNote>
      {loading ? <p>Loading...</p> : <InvestmentSuggestions investment={investment} />}
    </div>
  )
}

export default InvestmentEngine
