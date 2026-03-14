import { useState } from 'react'

const DownloadData = () => {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleDownload = async () => {
    setMessage('')
    setError('')
    const token = localStorage.getItem('token')
    if (!token) {
      setError('Please login first.')
      return
    }

    try {
      const res = await fetch('http://localhost:5000/api/data/export', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const text = await res.text()
        setError(text || 'Unable to download CSV')
        return
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'daily_income.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setMessage('CSV download started.')
    } catch (err) {
      setError('Error downloading CSV')
    }
  }

  return (
    <div>
      <h3>Download Your Data</h3>
      <button onClick={handleDownload} style={{ marginTop: '0.6rem' }}>
        Download CSV
      </button>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

export default DownloadData
