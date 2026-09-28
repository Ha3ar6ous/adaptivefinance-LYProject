import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FiGlobe } from 'react-icons/fi'

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')
  const [lang, setLang] = useState('en')

  useEffect(() => {
    if (window.googleTranslateElementInit) {
      window.googleTranslateElementInit()
    }
  }, [])

  const handleLanguageChange = (e) => {
    const selectedLang = e.target.value
    setLang(selectedLang)
    
    const gtCombo = document.querySelector('.goog-te-combo')
    if (gtCombo) {
      // Google translate removes the default language from its combo box. 
      // Setting it to empty string or triggering the translation clears it.
      gtCombo.value = selectedLang === 'en' ? '' : selectedLang
      gtCombo.dispatchEvent(new Event('change', { bubbles: true }))
      
      // If returning to English, sometimes we have to clear the cookie and reload
      // to completely remove Google's DOM modifications if the empty string trick fails
      if (selectedLang === 'en') {
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=' + window.location.hostname + '; path=/;';
        window.location.reload();
      }
    }
  }

  return (
    <header className='navbar'>
      <div className='logo' onClick={() => navigate('/')}>
        Adaptive Finance
      </div>
      <nav className='nav-actions' style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        
        {/* Custom Native Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '2px solid var(--border)', borderRadius: '6px', padding: '2px 8px', boxShadow: '2px 2px 0px var(--border)' }}>
          <FiGlobe style={{ marginRight: '6px', color: 'var(--text)' }} />
          <select 
            value={lang} 
            onChange={handleLanguageChange}
            style={{ border: 'none', background: 'transparent', fontWeight: '600', color: 'var(--text)', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="bn">বাংলা (Bengali)</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="mr">मराठी (Marathi)</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="gu">ગુજરાતી (Gujarati)</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
            <option value="ml">മലയാളം (Malayalam)</option>
            <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
          </select>
        </div>

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
