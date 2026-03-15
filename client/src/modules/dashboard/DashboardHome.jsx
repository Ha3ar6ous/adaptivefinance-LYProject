import { useOutletContext } from 'react-router-dom'

const DashboardHome = () => {
  const { user } = useOutletContext() || {}

  return (
    <div>
      <h3>Welcome{user ? `, ${user.name}` : ''}!</h3>
      <p>Select a dashboard option from the sidebar.</p>
    </div>
  )
}

export default DashboardHome
