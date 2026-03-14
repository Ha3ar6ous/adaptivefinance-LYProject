import { NavLink, Outlet, useNavigate } from 'react-router-dom'

const Dashboard = () => {
  const navigate = useNavigate()
  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/')
  }

  return (
    <div className="dashboard-layout-full">
      <aside className="sidebar-full">
        <div className="sidebar-header">
          <h2>Dashboard</h2>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="enter-data">Enter Your Data</NavLink>
          <NavLink to="download-data">Download Your Data</NavLink>
          <NavLink to="route1">Route 1</NavLink>
          <NavLink to="route2">Route 2</NavLink>
          <NavLink to="route3">Route 3</NavLink>
        </nav>
        <button className="logout" onClick={handleLogout}>
          Logout
        </button>
      </aside>
      <main className="dashboard-content-full">
        <Outlet />
      </main>
    </div>
  )
}

export default Dashboard
