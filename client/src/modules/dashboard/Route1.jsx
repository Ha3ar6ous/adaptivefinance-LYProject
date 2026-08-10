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
    <div className='dashboard-stack'>
      <h3 className='page-title'>Income History</h3>
      {error && <p className='error'>{error}</p>}

      <div className='dashboard-panel'>
        <h4>Daily income line</h4>
        <SimpleLineChart data={history} />
      </div>

      <div className='dashboard-panel'>
        <h4>Daily income bars</h4>
        <SimpleBarChart data={history.slice(-30)} />
      </div>

      <div className='dashboard-panel'>
        <h4>Recent entries</h4>
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

export default Route1
