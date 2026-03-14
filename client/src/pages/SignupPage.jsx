import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SignupPage = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.message || 'Signup failed')
        return
      }
      localStorage.setItem('token', body.token)
      navigate('/dashboard')
    } catch (err) {
      setError('Unable to sign up. Try later.')
    }
  }

  return (
    <div className='page-container'>
      <h1>Signup</h1>
      <form onSubmit={handleSubmit} className='form'>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='Name'
          required
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder='Email'
          required
        />
        <input
          type='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder='Password'
          required
        />
        <button type='submit'>Signup</button>
      </form>
      {error && <p className='error'>{error}</p>}
    </div>
  )
}

export default SignupPage
