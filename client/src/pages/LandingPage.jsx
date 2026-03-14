import { useNavigate } from 'react-router-dom'

const LandingPage = () => {
  const navigate = useNavigate()
  return (
    <div className='page-container'>
      <h1>Landing Page</h1>
      <div className='button-row'>
        <button onClick={() => navigate('/login')}>Login</button>
        <button onClick={() => navigate('/signup')}>Signup</button>
      </div>
    </div>
  )
}

export default LandingPage
