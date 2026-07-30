import { useEffect, useState } from 'react'
import InvestmentSuggestions from '../../components/InvestmentSuggestions'
import { getInvestmentSuggestion, runInvestmentSuggestion } from '../../services/analyticsApi'

const InvestmentEngine = () => {
  const [investment, setInvestment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setError('')
      setInvestment(await getInvestmentSuggestion())
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
      setInvestment(await runInvestmentSuggestion())
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
      {loading ? <p>Loading...</p> : <InvestmentSuggestions investment={investment} />}
    </div>
  )
}

export default InvestmentEngine

