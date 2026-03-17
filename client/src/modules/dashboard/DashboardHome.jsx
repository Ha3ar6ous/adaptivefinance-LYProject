import { useOutletContext } from 'react-router-dom'
import { FiHome } from 'react-icons/fi'

const DashboardHome = () => {
  const { user } = useOutletContext() || {}

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          marginBottom: '0.4rem',
        }}
      >
        <FiHome />
        <h3 style={{ margin: 0 }}>Welcome{user ? `, ${user.name}` : ''}!</h3>
      </div>
      <p>Select a dashboard option from the sidebar.</p>
    </div>
  )
}

export default DashboardHome
