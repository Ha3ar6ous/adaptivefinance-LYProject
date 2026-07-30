const InvestmentSuggestion = require('../models/InvestmentSuggestion')
const { refreshInvestmentSuggestionForUser } = require('../services/investmentEngineService')

exports.getMyInvestmentSuggestion = async (req, res) => {
  try {
    const investment = await InvestmentSuggestion.findOne({ userId: req.user.id })
    return res.json({
      investment: investment || {
        eligible: false,
        investableAmount: 0,
        riskProfile: 'low',
        blockedReason: 'Run analytics to generate investment suggestions.',
        suggestions: [],
      },
    })
  } catch (err) {
    console.error('getMyInvestmentSuggestion', err)
    return res.status(500).json({ message: 'Server error' })
  }
}

exports.runMyInvestmentSuggestion = async (req, res) => {
  try {
    const investment = await refreshInvestmentSuggestionForUser(req.user.id)
    return res.json({ investment })
  } catch (err) {
    console.error('runMyInvestmentSuggestion', err)
    return res.status(500).json({ message: 'Server error' })
  }
}

