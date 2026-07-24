const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

const serializeEntry = (entry) => ({
  date: new Date(entry.date).toISOString().split('T')[0],
  platform: entry.platform,
  hours_worked: entry.hours_worked,
  orders_completed: entry.orders_completed,
  income: entry.income,
})

const analyzeIncome = async (userId, entries, horizon = 15) => {
  const response = await fetch(`${ML_SERVICE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: String(userId),
      horizon,
      entries: entries.map(serializeEntry),
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`ML service failed (${response.status}): ${text}`)
  }

  return response.json()
}

module.exports = {
  analyzeIncome,
}

