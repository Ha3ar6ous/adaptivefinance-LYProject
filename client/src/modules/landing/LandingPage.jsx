import { useNavigate } from 'react-router-dom'
import { FiActivity, FiShield, FiTrendingUp } from 'react-icons/fi'
import Navbar from '../../components/Navbar'

const LandingPage = () => {
  const navigate = useNavigate()
  return (
    <>
      <Navbar />
      <div className='landing-body'>
        <section className='landing-hero-layout'>
          <div className='hero-left'>
            <p className='eyebrow'>Adaptive Finance</p>
            <h1>
              AI-Driven Risk Aware Micro-Investing Framework for Gig Economy
            </h1>
            <p className='hero-subtitle'>
              Build resilience with AI-backed income forecasting, risk-aware
              health scoring, and practical micro-investing guidance for gig
              workers.
            </p>
            <ul className='hero-list'>
              <li>
                <FiActivity /> Track daily income and short-term forecasts
              </li>
              <li>
                <FiShield /> Understand your risk and financial health
              </li>
              <li>
                <FiTrendingUp /> Get recommended micro-investment actions
              </li>
            </ul>
          </div>
          <div className='hero-right'>
            <img
              src='/src/assets/hero.avif'
              alt='Gig economy financial management'
            />
          </div>
        </section>
      </div>
    </>
  )
}

export default LandingPage
