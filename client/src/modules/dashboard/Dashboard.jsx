import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

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

        {user && (
          <div
            style={{
              padding: '1rem',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              marginBottom: '1rem',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#ccc' }}>
              Welcome back,
            </p>
            <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>
              {user.name}
            </p>
          </div>
        )}

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
        <header className='dashboard-topbar'>
          <div>
            <h2>Dashboard Overview</h2>
            <p>Insights and recommended actions for your gig finances.</p>
          </div>
          {user && (
            <div className='user-chip'>
              <span className='user-icon'>👤</span>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#555' }}>
                  Hello,
                </p>
                <p style={{ margin: 0, fontWeight: '700' }}>{user.name}</p>
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
