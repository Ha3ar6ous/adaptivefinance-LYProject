const formatDateToDDMMYYYY = (date) => {
  const d = new Date(date)
  const day = String(d.getUTCDate()).padStart(2, '0')
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const year = d.getUTCFullYear()
  return `${day}-${month}-${year}`
}

const dayOfWeek = (date) => {
  const d = new Date(date)
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]
  return days[d.getUTCDay()]
}

const createCsvFromEntries = (entries) => {
  const rows = [
    'date,day_of_week,platform,hours_worked,orders_completed,income',
  ]

  entries.forEach((entry) => {
    const date = formatDateToDDMMYYYY(entry.date)
    rows.push(
      `${date},${dayOfWeek(entry.date)},${entry.platform},${entry.hours_worked},${entry.orders_completed},${entry.income}`,
    )
  })

  return rows.join('\n')
}

module.exports = {
  createCsvFromEntries,
}
