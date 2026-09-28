import { useEffect, useState } from 'react'
import SimpleBarChart from '../../components/charts/SimpleBarChart'
import SimpleLineChart from '../../components/charts/SimpleLineChart'
import { getChartData } from '../../services/analyticsApi'

const IncomeHistory = () => {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getChartData().then(setData).catch((err) => setError(err.message))
  }, [])

  const history = data?.history || []
  const recent = history.slice(-10).reverse()

  return (
    <div className='dashboard-stack'>
      <h3 className='page-title'>Income History</h3>
      <p style={{ color: 'var(--text-soft)', marginBottom: '1.5rem', fontSize: '1.05rem' }}>
        Here is a breakdown of how much you've been earning day by day. Tracking your income helps you spot trends, handle slow days, and see exactly when you make the most money!
      </p>
      {error && <p className='error'>{error}</p>}

      <div className='dashboard-panel'>
        <h4 style={{ marginBottom: '0.5rem' }}>Your Earnings Trend</h4>
        <p style={{ color: 'var(--text-soft)', marginBottom: '1rem', fontSize: '0.9rem' }}>This line chart shows the ups and downs in your daily income. Big spikes mean great earning days, while dips show when things slowed down.</p>
        <SimpleLineChart data={history} />
      </div>

      <div className='dashboard-panel'>
        <h4 style={{ marginBottom: '0.5rem' }}>Last 30 Days</h4>
        <p style={{ color: 'var(--text-soft)', marginBottom: '1rem', fontSize: '0.9rem' }}>A closer look at your earnings over the past month. The taller the bar, the more you earned that day!</p>
        <SimpleBarChart data={history.slice(-30)} />
      </div>

      <div className='dashboard-panel'>
        <h4 style={{ marginBottom: '0.5rem' }}>Recent Entries</h4>
        <p style={{ color: 'var(--text-soft)', marginBottom: '1rem', fontSize: '0.9rem' }}>Your 10 most recently logged work days and where the money came from.</p>
        <div className='table-shell'>
          <table className='data-table'>
            <tbody>
              {recent.map((entry) => (
                <tr key={entry.date}>
                  <td>{entry.date}</td>
                  <td>{entry.platform}</td>
                  <td>Rs {entry.income}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default IncomeHistory
