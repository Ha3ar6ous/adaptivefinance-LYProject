const API_BASE = 'http://localhost:5000/api'

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
})

export const getAnalytics = async () => {
  const res = await fetch(`${API_BASE}/analytics/me`, {
    headers: authHeaders(),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Unable to load analytics')
  return data.analytics
}

export const runAnalytics = async () => {
  const res = await fetch(`${API_BASE}/analytics/run`, {
    method: 'POST',
    headers: authHeaders(),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Unable to refresh analytics')
  return data.analytics
}

export const getChartData = async () => {
  const res = await fetch(`${API_BASE}/analytics/charts`, {
    headers: authHeaders(),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Unable to load chart data')
  return data
}

