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
    <div className='page-container' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f4f5f7' }}>
      <div style={{ maxWidth: '400px', width: '100%', padding: '2rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>Welcome! Let's get started.</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>Step {step} of 4</p>
        
        {error && <p className='error' style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        
        <form className='form' onSubmit={step === 4 ? handleSubmit : handleNext} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {step === 1 && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Current Bank Balance (₹)</label>
              <input
                type='number'
                name='bankBalance'
                value={formData.bankBalance}
                onChange={handleChange}
                placeholder='e.g. 50000'
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
          )}

          {step === 2 && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Estimated Monthly Expenses (₹)</label>
              <input
                type='number'
                name='monthlyExpenses'
                value={formData.monthlyExpenses}
                onChange={handleChange}
                placeholder='e.g. 20000'
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
          )}

          {step === 3 && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Total Debts (₹)</label>
              <input
                type='number'
                name='debts'
                value={formData.debts}
                onChange={handleChange}
                placeholder='e.g. 10000'
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
          )}

          {step === 4 && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Total Investments (₹)</label>
              <input
                type='number'
                name='investments'
                value={formData.investments}
                onChange={handleChange}
                placeholder='e.g. 150000'
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            {step > 1 ? (
              <button type='button' onClick={handlePrev} style={{ padding: '0.75rem 1.5rem', border: 'none', backgroundColor: '#e2e8f0', color: '#333', borderRadius: '4px', cursor: 'pointer' }}>
                Back
              </button>
            ) : (
              <div></div>
            )}
            
            <button type='submit' disabled={loading} style={{ padding: '0.75rem 1.5rem', border: 'none', backgroundColor: '#007bff', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>
              {step === 4 ? (loading ? 'Saving...' : 'Finish') : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default OnboardingPage
