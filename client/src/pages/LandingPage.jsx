import { useNavigate } from 'react-router-dom'
import heroArt from '../assets/hero-art.png'

const LandingPage = () => {
  const navigate = useNavigate()
  return (
    <div className='landing-body'>
      <div className='landing-hero-layout'>
        <div className='hero-left'>
          <p className='eyebrow'>Adaptive Finance</p>
          <h1>Smarter Decisions for Your Financial Future</h1>
          <p className='hero-subtitle'>
            Empower your financial journey with AI-driven forecasting, volatility modeling, and personalized investment suggestions.
          </p>
          <ul className='hero-list'>
            <li>✓ Real-time forecasting models</li>
            <li>✓ Advanced volatility tracking</li>
            <li>✓ Tailored investment strategies</li>
          </ul>
          <div className='hero-ctas'>
            <button className='accent-cta' onClick={() => navigate('/signup')}>Get Started Free</button>
            <button className='secondary-cta' onClick={() => navigate('/login')}>Sign In</button>
          </div>
          <div className='trust-logos' style={{ marginTop: '2rem' }}>
            <div className='trust-pill'>Secure</div>
            <div className='trust-pill'>Fast</div>
            <div className='trust-pill'>Reliable</div>
          </div>
        </div>
        <div className='hero-right hero-art'>
          <img src={heroArt} alt="Dashboard Preview" />
        </div>
      </div>

      <div className='feature-section'>
        <div className='feature-cards'>
          <div className='feature-card reveal in'>
            <div className='feature-icon'>📈</div>
            <h3>Forecasting</h3>
            <p>Predict market trends with high accuracy using advanced machine learning models.</p>
          </div>
          <div className='feature-card reveal in'>
            <div className='feature-icon'>⚡</div>
            <h3>Volatility Analysis</h3>
            <p>Understand risks and measure market volatility to protect your portfolio.</p>
          </div>
          <div className='feature-card reveal in'>
            <div className='feature-icon'>💡</div>
            <h3>Smart Investments</h3>
            <p>Get personalized investment suggestions tailored to your goals and risk appetite.</p>
          </div>
        </div>
      </div>

      <footer className='landing-footer'>
        <div>© 2026 Adaptive Finance. All rights reserved.</div>
        <div className='footer-links'>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
