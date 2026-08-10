import { useEffect, useState } from 'react'
import { FiRefreshCw } from 'react-icons/fi'
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
    <div className='dashboard-stack'>
      <div className='page-head'>
        <h3 className='page-title'>Investment Suggestions</h3>
        <button type='button' className='icon-button' onClick={refresh} disabled={refreshing}>
          <FiRefreshCw /> {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      {error && <p className='error'>{error}</p>}
      <AiInlineNote label='Investment read'>{explanation?.investmentInsight}</AiInlineNote>
      <div className='dashboard-panel'>
        {loading ? <p className='muted-copy'>Loading...</p> : <InvestmentSuggestions investment={investment} />}
      </div>
    </div>
  )
}

export default InvestmentEngine
