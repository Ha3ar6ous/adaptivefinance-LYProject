import { useNavigate } from 'react-router-dom'

const Navbar = () => {
  const navigate = useNavigate()
  return (
    <header className='navbar'>
      <div className='logo' onClick={() => navigate('/')}>
        Finance Kit
      </div>
      <nav className='nav-actions'>
        <button onClick={() => navigate('/login')}>Login</button>
        <button onClick={() => navigate('/signup')}>Signup</button>
      </nav>
    </header>
  )
}

export default Navbar
