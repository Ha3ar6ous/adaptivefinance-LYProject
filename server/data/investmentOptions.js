const fs = require('fs')
const path = require('path')

const CSV_PATH = path.join(__dirname, 'seed', 'investments-mod.csv')

const splitCsvLine = (line) => {
  const values = []
  let current = ''
  let quoted = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]
    if (char === '"' && next === '"') {
      current += '"'
      i += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }

  values.push(current)
  return values.map((value) => value.trim())
}

const parseNumber = (value) => {
  const match = String(value || '').replace(/,/g, '').match(/\d+(\.\d+)?/)
  return match ? Number(match[0]) : null
}

const parseReturnPct = (value) => {
  const text = String(value || '')
  if (!text.includes('%')) return null
  return parseNumber(text)
}

const normalizeRisk = (value) => {
  const text = String(value || '').toLowerCase()
  if (text.includes('high')) return 'high'
  if (text.includes('medium')) return 'medium'
  return 'low'
}

const parseBoolean = (value) => String(value || '').toLowerCase() === 'yes'

const buildTags = (row) => {
  const tags = []
  if (row.Safe_For_High_Volatility === 'Yes') tags.push('volatile-income-safe')
  if (String(row.Min_Investment_Rs || '').toLowerCase().includes('sip')) tags.push('sip')
  if (String(row.Min_Investment_Rs || '').toLowerCase().includes('month')) tags.push('monthly')
  if (!parseReturnPct(row.Expected_Return)) tags.push(row.Expected_Return)
  return tags.filter(Boolean)
}

const normalizeRow = (row, index) => ({
  id: `option_${index + 1}`,
  name: row.Investment_Name,
  type: row.Type,
  expectedReturnPct: parseReturnPct(row.Expected_Return),
  returnNote: row.Expected_Return,
  riskLevel: normalizeRisk(row.Risk_Level),
  rawRiskLevel: row.Risk_Level,
  liquidity: row.Liquidity,
  minMonthlyAmount: parseNumber(row.Min_Investment_Rs) || 0,
  lockInPeriod: row.Lock_in_Period,
  description: row.Description,
  suitability: row.Suitability_for_Gig_Workers,
  volatilitySafe: parseBoolean(row.Safe_For_High_Volatility),
  minMonthlyEarning: Number(row.Min_Monthly_Earning_Rs || 0),
  maxDebt: Number(row.Max_Debt_Rs || 0),
  minSavings: Number(row.Min_Savings_Rs || 0),
  gigPriority: Number(row.Gig_Priority || 1),
  tags: buildTags(row),
})

const loadInvestmentOptions = () => {
  const text = fs.readFileSync(CSV_PATH, 'utf8').trim()
  const [headerLine, ...lines] = text.split(/\r?\n/)
  const headers = splitCsvLine(headerLine)
  return lines
    .filter(Boolean)
    .map((line) => {
      const values = splitCsvLine(line)
      return headers.reduce((row, header, index) => {
        row[header] = values[index] || ''
        return row
      }, {})
    })
    .map(normalizeRow)
}

module.exports = {
  loadInvestmentOptions,
}

