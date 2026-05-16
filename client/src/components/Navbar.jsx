import { useNavigate, useLocation } from 'react-router-dom'

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')

  // Don't render the global navbar inside dashboard if it has its own, or maybe we want a unified navbar!
  // The user wants to standardize the frontend, so keeping Navbar everywhere is good.

  return (
    <header className='navbar'>
      <div className='logo' onClick={() => navigate('/')}>
        Adaptive Finance
      </div>
      <nav className='nav-actions'>
        {token ? (
          <>
            <button className='secondary-cta' onClick={() => {
              localStorage.removeItem('token')
              navigate('/')
            }}>Logout</button>
            {location.pathname !== '/dashboard' && (
              <button className='accent-cta' onClick={() => navigate('/dashboard')}>Dashboard</button>
            )}
          </>
        ) : (
          <>
            <button className='secondary-cta' onClick={() => navigate('/login')}>Login</button>
            <button className='accent-cta' onClick={() => navigate('/signup')}>Signup</button>
          </>
        )}
      </nav>
    </header>
  )
}

export default Navbar
