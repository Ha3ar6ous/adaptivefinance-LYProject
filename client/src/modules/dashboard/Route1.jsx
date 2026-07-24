import { useEffect, useState } from 'react'
import SimpleBarChart from '../../components/charts/SimpleBarChart'
import SimpleLineChart from '../../components/charts/SimpleLineChart'
import { getChartData } from '../../services/analyticsApi'

const Route1 = () => {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getChartData().then(setData).catch((err) => setError(err.message))
  }, [])

  const history = data?.history || []
  const recent = history.slice(-10).reverse()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h3 style={{ margin: 0 }}>Income History</h3>
      {error && <p className='error'>{error}</p>}

      <div className='bento-item' style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.65)' }}>
        <h4>Daily income line</h4>
        <SimpleLineChart data={history} color='#111' />
      </div>

      <div className='bento-item' style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.65)' }}>
        <h4>Daily income bars</h4>
        <SimpleBarChart data={history.slice(-30)} color='#444' />
      </div>

      <div className='bento-item' style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.65)' }}>
        <h4>Recent entries</h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {recent.map((entry) => (
                <tr key={entry.date}>
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #ddd' }}>{entry.date}</td>
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #ddd' }}>{entry.platform}</td>
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #ddd' }}>Rs {entry.income}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Route1

