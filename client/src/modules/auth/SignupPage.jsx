import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiTrendingUp } from 'react-icons/fi'

const SignupPage = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Signup failed')
        setLoading(false)
        return
      }
      localStorage.setItem('token', data.token)
      if (data.user.hasCompletedOnboarding) {
        navigate('/dashboard')
      } else {
        navigate('/onboarding')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className='landing-body' style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className='bento-item' style={{ width: '100%', maxWidth: '420px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <span className='badge badge-dark'><FiTrendingUp /> Start Hustling</span>
        </div>
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.8rem' }}>Create Account</h1>
        <form className='form' onSubmit={handleSubmit}>
        <label>
          Full Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='John Doe'
            required
          />
        </label>
        <label>
          Email
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='your@email.com'
            required
          />
        </label>
        <label>
          Password
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder='••••••••'
            required
          />
        </label>
        <button type='submit' className='accent-cta' disabled={loading} style={{ marginTop: '0.5rem', padding: '0.75rem', width: '100%' }}>
          {loading ? 'Creating account...' : 'Signup'}
        </button>
      </form>
      {error && <p className='error'>{error}</p>}
      <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#555' }}>
        Already have an account? <span style={{ color: '#111', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => navigate('/login')}>Log in</span>
      </p>
      </div>
    </div>
  )
}

export default SignupPage
