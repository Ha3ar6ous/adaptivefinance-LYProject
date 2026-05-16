import { useNavigate } from 'react-router-dom'
import {
  FiActivity,
  FiShield,
  FiTrendingUp,
  FiClock,
  FiPieChart,
  FiZap,
  FiUsers,
  FiStar,
} from 'react-icons/fi'
import Navbar from '../../components/Navbar'
import { useEffect } from 'react'

const LandingPage = () => {
  const navigate = useNavigate()
  useEffect(() => {
    const ob = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) e.target.classList.add('in')
        })
      },
      { threshold: 0.12 }
    )
    document.querySelectorAll('.reveal').forEach(el => ob.observe(el))
    return () => ob.disconnect()
  }, [])

  return (
    <div className='landing-body'>
      <section className='landing-hero-layout'>
          <div className='hero-left'>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span className='badge badge-dark'><FiZap /> Gig Economy</span>
              <span className='badge'><FiTrendingUp /> Real-time Analytics</span>
            </div>
            <h1 className='reveal'>
              AI-Driven Risk Aware Micro-Investing Framework for Gig Economy
            </h1>
            <p className='hero-subtitle'>
              Missing shifts, variable pay, surprise expenses — gig work is
              flexible but fragile. Adaptive Finance blends short-term
              forecasting, risk-aware scoring and bite-sized investment
              guidance so you can stabilize income and grow financial
              resilience without changing your job.
            </p>

            <div className='hero-ctas reveal'>
              <button className='accent-cta' onClick={() => navigate('/signup')}>
                Get started — it's free
              </button>
              <button className='secondary-cta' onClick={() => navigate('/login')}>
                Explore demo
              </button>
            </div>

            <ul className='hero-list reveal'>
              <li><FiClock /> Weekly Forecasts</li>
              <li><FiShield /> Health Scores</li>
              <li><FiTrendingUp /> Micro-Investments</li>
            </ul>
          </div>
          <div className='hero-right'>
            <div className='hero-art reveal floating-element'>
              <img
                src='/src/assets/hero.avif'
                alt='Gig economy financial management'
              />
            </div>
          </div>
        </section>

        <section className='bento-grid reveal'>
          <div className='bento-item bento-wide bento-tall'>
            <div className='feature-icon floating-element-fast'><FiActivity /></div>
            <h2>The problem</h2>
            <p style={{ marginTop: '1rem' }}>
              Gig workers face income variability, little visibility into
              future earnings and limited options for building reliable
              savings. Traditional finance tools assume steady paychecks — that
              doesn't fit on-demand work.
            </p>
          </div>

          <div className='bento-item bento-wide'>
            <div className='feature-icon'><FiPieChart /></div>
            <h2>Our idea</h2>
            <p style={{ marginTop: '0.5rem' }}>
              Combine lightweight daily tracking with AI short-term forecasts
              and a volatility-aware health score to recommend focused micro-
              investments.
            </p>
          </div>

          <div className='bento-item'>
            <div className='feature-icon floating-element-delay'><FiClock /></div>
            <h3>Income Forecast</h3>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#555' }}>Short-horizon forecasts that highlight coming low-income days.</p>
          </div>

          <div className='bento-item'>
            <div className='feature-icon floating-element-delay'><FiShield /></div>
            <h3>Risk Scoring</h3>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#555' }}>Explainable volatility metrics and a health score that surface fragility.</p>
          </div>

          <div className='bento-item bento-wide bento-tall'>
            <h2>Ready to try?</h2>
            <p style={{ marginTop: '0.5rem' }}>Sign up, enter a few days of data, and let the app show a 7‑day outlook and one clear micro-action to try today.</p>
            <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
              <button className='accent-cta' onClick={() => navigate('/signup')}>Start protecting income</button>
            </div>
          </div>

          <div className='bento-item bento-wide'>
            <h2>Why it feels smart</h2>
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li>Actionable recommendations — not just numbers.</li>
              <li>Fast, local forecasts you can verify with your daily logs.</li>
              <li>Focus on protecting income first, growing later.</li>
            </ul>
          </div>

          <div className='bento-item bento-full trust-section' style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ marginBottom: '0.5rem' }}>Trusted by</h2>
              <div className='trust-logos'>
                <div className='trust-pill'><FiUsers /> Community pilots</div>
                <div className='trust-pill'><FiStar /> Early adopters</div>
                <div className='trust-pill'>Research-backed</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <button className='secondary-cta' onClick={() => navigate('/login')}>View walkthrough</button>
            </div>
          </div>
        </section>

        <footer className='landing-footer'>
          <div>© {new Date().getFullYear()} Adaptive Finance — Built for gig workers</div>
          <div className='footer-links'>
            <a href='#'>Privacy</a>
            <a href='#'>Terms</a>
            <a href='#'>Contact</a>
          </div>
        </footer>
    </div>
  )
}

export default LandingPage
