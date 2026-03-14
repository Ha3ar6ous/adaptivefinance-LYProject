import { useState } from 'react'

const EnterData = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [platform, setPlatform] = useState('')
  const [hoursWorked, setHoursWorked] = useState('')
  const [ordersCompleted, setOrdersCompleted] = useState('')
  const [income, setIncome] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const today = new Date()
  const maxDate = today.toISOString().split('T')[0]
  const minDate = new Date(
    today.getFullYear(),
    today.getMonth() - 2,
    today.getDate(),
  )
    .toISOString()
    .split('T')[0]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')

    const token = localStorage.getItem('token')
    if (!token) {
      setError('Please login to save entries.')
      return
    }

    try {
      const response = await fetch('http://localhost:5000/api/data/entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date,
          platform,
          hours_worked: Number(hoursWorked),
          orders_completed: Number(ordersCompleted),
          income: Number(income),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.message || 'Unable to save entry')
        return
      }

      setMessage('Entry saved successfully.')
    } catch (err) {
      console.error(err)
      setError('Server error while saving entry.')
    }
  }

  return (
    <div>
      <h3>Enter Your Data</h3>
      <form className='form' onSubmit={handleSubmit}>
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
        <button type='submit'>Save Entry</button>
      </form>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

export default EnterData
