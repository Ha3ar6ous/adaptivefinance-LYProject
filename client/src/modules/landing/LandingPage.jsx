import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'

const LandingPage = () => {
  const navigate = useNavigate()
  return (
    <>
      <Navbar />
      <div className="landing-body">
        <section className="landing-content">
          <h1>Welcome to Adaptive Finance</h1>
          <p>
            Track your gig work activity, view earnings, and export your dataset
            for time-series modeling.
          </p>
          <div className="button-row">
            <button onClick={() => navigate('/login')}>Login</button>
            <button onClick={() => navigate('/signup')}>Signup</button>
          </div>
        </section>
      </div>
    </>
  )
}

export default LandingPage
