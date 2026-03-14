import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

const Dashboard = () => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
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
          <span></span>
          <span></span>
          <span></span>
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
            ✕
          </button>
        </div>
        <nav className='sidebar-nav'>
          <NavLink to='enter-data' onClick={() => setOpen(false)}>
            Enter Your Data
          </NavLink>
          <NavLink to='download-data' onClick={() => setOpen(false)}>
            Download Your Data
          </NavLink>
          <NavLink to='route1' onClick={() => setOpen(false)}>
            Route 1
          </NavLink>
          <NavLink to='route2' onClick={() => setOpen(false)}>
            Route 2
          </NavLink>
          <NavLink to='route3' onClick={() => setOpen(false)}>
            Route 3
          </NavLink>
        </nav>
        <button className='logout' onClick={handleLogout}>
          Logout
        </button>
      </aside>
      <main className='dashboard-content-full'>
        <Outlet />
      </main>
    </div>
  )
}

export default Dashboard
