const API_BASE = 'http://localhost:5000/api'

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
})

export const getAiExplanation = async () => {
  const res = await fetch(`${API_BASE}/ai/explanation/me`, {
    headers: authHeaders(),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Unable to load AI insight')
  return data.explanation
}

export const runAiExplanation = async () => {
  const res = await fetch(`${API_BASE}/ai/explanation/run`, {
    method: 'POST',
    headers: authHeaders(),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Unable to refresh AI insight')
  return data.explanation
}

