import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

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
    <div className='page-container'>
      <h1>Signup</h1>
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
        <button type='submit' disabled={loading}>
          {loading ? 'Creating account...' : 'Signup'}
        </button>
      </form>
      {error && <p className='error'>{error}</p>}
    </div>
  )
}

export default SignupPage
