const DailyIncomeEntry = require('../models/DailyIncomeEntry')
const { createCsvFromEntries } = require('../services/csvService')

const normalizeToDateOnlyUTC = (value) => {
  if (!value) {
    throw new Error('Invalid date')
  }

  let date
  if (typeof value === 'string') {
    const isoMatch = value.match(/^\d{4}-\d{2}-\d{2}$/)
    const ddmmyyyyMatch = value.match(/^(\d{2})-(\d{2})-(\d{4})$/)
    if (isoMatch) {
      date = new Date(value)
    } else if (ddmmyyyyMatch) {
      const [, dd, mm, yyyy] = ddmmyyyyMatch
      date = new Date(`${yyyy}-${mm}-${dd}`)
    } else {
      date = new Date(value)
    }
  } else {
    date = new Date(value)
  }

  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date')
  }

  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  )
}

exports.createOrUpdateEntry = async (req, res) => {
  try {
    const userId = req.user.id
    const { date, platform, hours_worked, orders_completed, income } = req.body
    if (
      !date ||
      !platform ||
      hours_worked == null ||
      orders_completed == null ||
      income == null
    ) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    let normalizedDate
    try {
      normalizedDate = normalizeToDateOnlyUTC(date)
    } catch (err) {
      return res
        .status(400)
        .json({ message: 'Invalid date: expected YYYY-MM-DD or DD-MM-YYYY' })
    }

    const payload = {
      userId,
      date: normalizedDate,
      platform,
      hours_worked: Number(hours_worked),
      orders_completed: Number(orders_completed),
      income: Number(income),
    }

    const entry = await DailyIncomeEntry.findOneAndUpdate(
      { userId, date: normalizedDate },
      payload,
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )

    return res.status(200).json({ entry })
  } catch (err) {
    console.error('createOrUpdateEntry', err)
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Duplicate entry for this date' })
    }
    return res.status(500).json({ message: 'Server error' })
  }
}

exports.getUserEntries = async (req, res) => {
  try {
    const userId = req.user.id
    const entries = await DailyIncomeEntry.find({ userId }).sort({ date: 1 })
    return res.json({ entries })
  } catch (err) {
    console.error('getUserEntries', err)
    return res.status(500).json({ message: 'Server error' })
  }
}

exports.exportCsv = async (req, res) => {
  try {
    const userId = req.user.id
    const entries = await DailyIncomeEntry.find({ userId }).sort({ date: 1 })
    const csvText = createCsvFromEntries(entries)
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="daily_income.csv"',
    )
    return res.send(csvText)
  } catch (err) {
    console.error('exportCsv', err)
    return res.status(500).json({ message: 'Server error' })
  }
}
