import { useState } from 'react'
import { FiEdit3 } from 'react-icons/fi'

const EnterData = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [platform, setPlatform] = useState('')
  const [hoursWorked, setHoursWorked] = useState('')
  const [ordersCompleted, setOrdersCompleted] = useState('')
  const [income, setIncome] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [existingEntry, setExistingEntry] = useState(null)
  const [pendingData, setPendingData] = useState(null)

  const today = new Date()
  const maxDate = today.toISOString().split('T')[0]
  const minDate = new Date(
    today.getFullYear(),
    today.getMonth() - 2,
    today.getDate(),
  )
    .toISOString()
    .split('T')[0]

  const checkAndSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setLoading(true)

    const token = localStorage.getItem('token')
    if (!token) {
      setError('Please login to save entries.')
      setLoading(false)
      return
    }

    try {
      const userRes = await fetch('http://localhost:5000/api/data/user', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await userRes.json()
      const entries = data.entries || []

      const existing = entries.find((e) => e.date === date)

      if (existing) {
        setExistingEntry(existing)
        setPendingData({
          date,
          platform,
          hours_worked: Number(hoursWorked),
          orders_completed: Number(ordersCompleted),
          income: Number(income),
        })
        setShowConfirm(true)
        setLoading(false)
      } else {
        submitEntry({
          date,
          platform,
          hours_worked: Number(hoursWorked),
          orders_completed: Number(ordersCompleted),
          income: Number(income),
        })
      }
    } catch (err) {
      console.error(err)
      setError('Error checking existing entries.')
      setLoading(false)
    }
  }

  const submitEntry = async (data) => {
    setLoading(true)
    const token = localStorage.getItem('token')

    try {
      const response = await fetch('http://localhost:5000/api/data/entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      if (!response.ok) {
        setError(result.message || 'Unable to save entry')
        setLoading(false)
        return
      }
      setMessage('Entry saved successfully!')
      setDate(new Date().toISOString().split('T')[0])
      setPlatform('')
      setHoursWorked('')
      setOrdersCompleted('')
      setIncome('')
      setShowConfirm(false)
      setExistingEntry(null)
      setPendingData(null)
    } catch (err) {
      console.error(err)
      setError('Server error while saving entry.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmUpdate = () => {
    if (pendingData) {
      submitEntry(pendingData)
    }
  }

  const handleCancelUpdate = () => {
    setShowConfirm(false)
    setExistingEntry(null)
    setPendingData(null)
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          marginBottom: '0.5rem',
        }}
      >
        <FiEdit3 />
        <h3 style={{ margin: 0 }}>Enter Your Data</h3>
      </div>
      {showConfirm && existingEntry && (
        <div className='confirmation-dialog'>
          <div className='dialog-content'>
            <h4>Entry Already Exists</h4>
            <p>
              You already have an entry for{' '}
              <strong>{existingEntry.date}</strong>:
            </p>
            <div className='dialog-info'>
              <p>Platform: {existingEntry.platform}</p>
              <p>Hours: {existingEntry.hours_worked}h</p>
              <p>Orders: {existingEntry.orders_completed}</p>
              <p>Income: ₹{existingEntry.income}</p>
            </div>
            <p>Do you want to update this entry with the new data?</p>
            <div className='dialog-buttons'>
              <button
                className='danger-btn'
                onClick={handleConfirmUpdate}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Yes, Update'}
              </button>
              <button
                className='secondary-btn'
                onClick={handleCancelUpdate}
                disabled={loading}
              >
                No, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <form className='form' onSubmit={checkAndSubmit}>
        <label>
          Date
          <input
            type='date'
            value={date}
            min={minDate}
            max={maxDate}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
        <label>
          Platform
          <input
            type='text'
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            required
          />
        </label>
        <label>
          Hours Worked
          <input
            type='number'
            min='0'
            step='0.1'
            value={hoursWorked}
            onChange={(e) => setHoursWorked(e.target.value)}
            required
          />
        </label>
        <label>
          Orders Completed
          <input
            type='number'
            min='0'
            value={ordersCompleted}
            onChange={(e) => setOrdersCompleted(e.target.value)}
            required
          />
        </label>
        <label>
          Income
          <input
            type='number'
            min='0'
            step='0.01'
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            required
          />
        </label>
        <button type='submit' disabled={loading || showConfirm}>
          {loading ? 'Saving...' : 'Save Entry'}
        </button>
      </form>
      {message && <p className='success'>{message}</p>}
      {error && <p className='error'>{error}</p>}
    </div>
  )
}

export default EnterData
