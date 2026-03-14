import { useState } from 'react'

const DownloadData = () => {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setMessage('')
    setError('')
    setLoading(true)
    const token = localStorage.getItem('token')
    if (!token) {
      setError('Please login first.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('http://localhost:5000/api/data/export', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const text = await res.text()
        setError(text || 'Unable to download CSV')
        setLoading(false)
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
      setMessage('CSV downloaded successfully!')
    } catch (err) {
      setError('Error downloading CSV')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h3>Download Your Data</h3>
      <button onClick={handleDownload} disabled={loading}>
        {loading ? 'Downloading...' : 'Download CSV'}
      </button>
      {message && <p className='success'>{message}</p>}
      {error && <p className='error'>{error}</p>}
    </div>
  )
}

export default DownloadData
