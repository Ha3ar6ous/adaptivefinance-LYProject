import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const OnboardingPage = () => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    bankBalance: '',
    monthlyExpenses: '',
    debts: '',
    investments: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleNext = (e) => {
    e.preventDefault()
    setStep(step + 1)
  }

  const handlePrev = () => {
    setStep(step - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    const token = localStorage.getItem('token')

    try {
      const res = await fetch('http://localhost:5000/api/auth/onboarding', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.message || 'Failed to save onboarding data')
        setLoading(false)
        return
      }
      
      // Successfully onboarded, go to dashboard
      navigate('/dashboard')
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className='landing-body' style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className='bento-item' style={{ width: '100%', maxWidth: '420px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem', textAlign: 'center', fontSize: '1.8rem' }}>Welcome! Let's get started.</h1>
        <p style={{ textAlign: 'center', color: '#555', marginBottom: '1.5rem', fontWeight: '600', fontSize: '0.95rem' }}>Step {step} of 4</p>
        
        {error && <p className='error' style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}
        
        <form className='form' onSubmit={step === 4 ? handleSubmit : handleNext}>
          {step === 1 && (
            <label>
              Current Bank Balance (₹)
              <input
                type='number'
                name='bankBalance'
                value={formData.bankBalance}
                onChange={handleChange}
                placeholder='e.g. 50000'
                required
              />
            </label>
          )}

          {step === 2 && (
            <label>
              Estimated Monthly Expenses (₹)
              <input
                type='number'
                name='monthlyExpenses'
                value={formData.monthlyExpenses}
                onChange={handleChange}
                placeholder='e.g. 20000'
                required
              />
            </label>
          )}

          {step === 3 && (
            <label>
              Total Debts (₹)
              <input
                type='number'
                name='debts'
                value={formData.debts}
                onChange={handleChange}
                placeholder='e.g. 10000'
                required
              />
            </label>
          )}

          {step === 4 && (
            <label>
              Total Investments (₹)
              <input
                type='number'
                name='investments'
                value={formData.investments}
                onChange={handleChange}
                placeholder='e.g. 150000'
                required
              />
            </label>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', gap: '1rem' }}>
            {step > 1 ? (
              <button type='button' className='secondary-cta' onClick={handlePrev} style={{ flex: 1, padding: '0.75rem', cursor: 'pointer' }}>
                Back
              </button>
            ) : (
              <div style={{ flex: 1 }}></div>
            )}
            
            <button type='submit' className='accent-cta' disabled={loading} style={{ flex: 1, padding: '0.75rem', cursor: 'pointer' }}>
              {step === 4 ? (loading ? 'Saving...' : 'Finish') : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default OnboardingPage
