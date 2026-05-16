import { Navigate, Route, Routes, BrowserRouter, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import { FiTrendingUp, FiActivity, FiZap } from 'react-icons/fi'
import LandingPage from './modules/landing/LandingPage'
import LoginPage from './modules/auth/LoginPage'
import SignupPage from './modules/auth/SignupPage'
import Dashboard from './modules/dashboard/Dashboard'
import DashboardHome from './modules/dashboard/DashboardHome'
import EnterData from './modules/data/EnterData'
import DownloadData from './modules/data/DownloadData'
import Route1 from './modules/dashboard/Route1'
import Route2 from './modules/dashboard/Route2'
import Route3 from './modules/dashboard/Route3'
import OnboardingPage from './modules/onboarding/OnboardingPage'

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to='/login' replace />
}

const GlobalHeader = () => {
  const location = useLocation()
  const isAuthOrDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/onboarding')
  return (
    <>
      <Navbar />
      {!isAuthOrDashboard && (
        <div className='marquee-container'>
          <div className='marquee-content'>
            <span className='marquee-item'><FiZap /> India Gig Trends</span>
            <span className='marquee-item'>•</span>
            <span className='marquee-item'><FiTrendingUp /> Ola/Uber Earnings +4.2%</span>
            <span className='marquee-item'>•</span>
            <span className='marquee-item'><FiActivity /> Swiggy/Zomato Demand Surge in Tier 1 Cities</span>
            <span className='marquee-item'>•</span>
            <span className='marquee-item'><FiZap /> Freelance Tech Rates Stable</span>
            <span className='marquee-item'>•</span>
            <span className='marquee-item'><FiTrendingUp /> Micro-Investing Alpha Detected</span>
            
            <span className='marquee-item' style={{marginLeft: '2rem'}}><FiZap /> India Gig Trends</span>
            <span className='marquee-item'>•</span>
            <span className='marquee-item'><FiTrendingUp /> Ola/Uber Earnings +4.2%</span>
            <span className='marquee-item'>•</span>
            <span className='marquee-item'><FiActivity /> Swiggy/Zomato Demand Surge in Tier 1 Cities</span>
            <span className='marquee-item'>•</span>
            <span className='marquee-item'><FiZap /> Freelance Tech Rates Stable</span>
            <span className='marquee-item'>•</span>
            <span className='marquee-item'><FiTrendingUp /> Micro-Investing Alpha Detected</span>
          </div>
        </div>
      )}
    </>
  )
}

const GlobalBackground = () => {
  const location = useLocation()
  const shouldAnimate = location.pathname !== '/'
  
  return (
    <div
      className={shouldAnimate ? 'animate-bg' : ''}
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(45deg, transparent 49%, #e5e7eb 49%, #e5e7eb 51%, transparent 51%),
          linear-gradient(-45deg, transparent 49%, #e5e7eb 49%, #e5e7eb 51%, transparent 51%)
        `,
        backgroundSize: '40px 40px',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, #000 50%, transparent 100%)',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, #000 50%, transparent 100%)',
        zIndex: 0,
        pointerEvents: 'none',
        height: '100vh'
      }}
    />
  )
}

function App() {
  return (
    <BrowserRouter>
      <div style={{ position: 'relative', width: '100%', minHeight: '100vh', backgroundColor: '#ffffff' }}>
        <GlobalBackground />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <GlobalHeader />
          <Routes>
            <Route path='/' element={<LandingPage />} />
            <Route path='/login' element={<LoginPage />} />
            <Route path='/signup' element={<SignupPage />} />
            <Route path='/onboarding' element={<PrivateRoute><OnboardingPage /></PrivateRoute>} />
            <Route
              path='/dashboard'
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route path='enter-data' element={<EnterData />} />
              <Route path='download-data' element={<DownloadData />} />
              <Route path='route1' element={<Route1 />} />
              <Route path='route2' element={<Route2 />} />
              <Route path='route3' element={<Route3 />} />
            </Route>
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
