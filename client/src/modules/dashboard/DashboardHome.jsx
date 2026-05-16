import { useOutletContext } from 'react-router-dom'
import { FiHome, FiTrendingUp, FiActivity, FiShield } from 'react-icons/fi'

const DashboardHome = () => {
  const { user } = useOutletContext() || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className='bento-item' style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255, 255, 255, 0.8)', border: '1.5px solid #d1d1d1' }}>
        <div style={{ padding: '1rem', background: '#f0f0f0', borderRadius: '12px', color: '#111' }}>
          <FiHome size={28} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#111' }}>Welcome back{user ? `, ${user.name}` : ''}!</h2>
          <p style={{ margin: '0.5rem 0 0', opacity: 0.8, fontSize: '0.95rem', color: '#444' }}>Here's your financial overview.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <div className='bento-item' style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111' }}>Income Forecast</h3>
            <FiTrendingUp color='#666' size={20} />
          </div>
          <h4 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#222' }}>Pending</h4>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#666', fontWeight: 500 }}>Awaiting enough data</p>
        </div>

        <div className='bento-item' style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111' }}>Financial Health</h3>
            <FiShield color='#666' size={20} />
          </div>
          <h4 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#222' }}>N/A</h4>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#666', fontWeight: 500 }}>Connect accounts to analyze</p>
        </div>

        <div className='bento-item' style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111' }}>Micro-Investments</h3>
            <FiActivity color='#666' size={20} />
          </div>
          <h4 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#222' }}>₹0</h4>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#666', fontWeight: 500 }}>Suggested investments: None</p>
        </div>
      </div>
    </div>
  )
}

export default DashboardHome
