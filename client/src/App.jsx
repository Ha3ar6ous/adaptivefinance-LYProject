import { Navigate, Route, Routes, BrowserRouter } from 'react-router-dom'
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

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to='/login' replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/signup' element={<SignupPage />} />
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
    </BrowserRouter>
  )
}

export default App
