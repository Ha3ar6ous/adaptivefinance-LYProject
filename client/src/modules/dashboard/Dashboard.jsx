import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  FiBarChart2,
  FiBriefcase,
  FiEdit3,
  FiLogOut,
  FiMenu,
  FiPieChart,
  FiShield,
  FiTrendingUp,
  FiUser,
  FiX,
} from 'react-icons/fi'

const menuItems = [
  { to: 'enter-data', label: 'Enter Your Data', icon: FiEdit3 },
  { to: 'route1', label: 'Income History', icon: FiBarChart2 },
  { to: 'route2', label: 'Forecasts', icon: FiTrendingUp },
  { to: 'route3', label: 'Health & Decisions', icon: FiShield },
  { to: 'investments', label: 'Investment Suggestions', icon: FiPieChart },
]

const Dashboard = () => {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch('http://localhost:5000/api/auth/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      } catch (err) {
        console.error('Failed to fetch profile', err)
      }
    }
    fetchProfile()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/')
  }

  return (
    <div className='dashboard-layout-full'>
      <div className='mobile-sidebar-toggle'>
        <button
          className='hamburger-btn'
          onClick={() => setOpen((prev) => !prev)}
          aria-label='Toggle menu'
        >
          <FiMenu />
        </button>
      </div>
      <aside className={`sidebar-full ${open ? 'open' : ''}`}>
        <div className='sidebar-header'>
          <h2>Menu</h2>
          <button
            className='sidebar-close'
            onClick={() => setOpen(false)}
            aria-label='Close menu'
          >
            <FiX />
          </button>
        </div>

        {user && (
          <div className='sidebar-user'>
            <span className='sidebar-user-icon'>
              <FiBriefcase />
            </span>
            <div>
              <p>Welcome back</p>
              <strong>{user.name}</strong>
            </div>
          </div>
        )}

        <nav className='sidebar-nav'>
          {menuItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}>
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button className='logout' onClick={handleLogout}>
          <FiLogOut /> Logout
        </button>
      </aside>
      <main className='dashboard-content-full'>
        <header className='dashboard-topbar'>
          <div>
            <h2>Dashboard Overview</h2>
            <p>Insights and recommended actions for your gig finances.</p>
          </div>
          {user && (
            <div className='user-chip'>
              <span className='user-icon'>
                <FiUser />
              </span>
              <div>
                <p>Hello</p>
                <strong>{user.name}</strong>
              </div>
            </div>
          )}
        </header>
        <Outlet context={{ user }} />
      </main>
    </div>
  )
}

export default Dashboard
