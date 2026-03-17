import { useState } from 'react'
import { FiDownload } from 'react-icons/fi'

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
      
      const csvText = await res.text()
      
      // Basic check: if only header is present, rows will be 1
      const rows = csvText.trim().split('\n')
      if (rows.length <= 1) {
        setError('No data found to export. Please add some entries first.')
        setLoading(false)
        return
      }

      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'daily_income.csv')
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 100)

      setMessage('CSV downloaded successfully!')
    } catch (err) {
      console.error(err)
      setError('Error downloading CSV')
    } finally {
      setLoading(false)
    }
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
        <FiDownload />
        <h3 style={{ margin: 0 }}>Download Your Data</h3>
      </div>
      <button onClick={handleDownload} disabled={loading}>
        {loading ? 'Downloading...' : 'Download CSV'}
      </button>
      {message && <p className='success'>{message}</p>}
      {error && <p className='error'>{error}</p>}
    </div>
  )
}

export default DownloadData
